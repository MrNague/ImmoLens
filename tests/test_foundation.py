import json
import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

import api
import train
from features import FEATURE_COLUMNS, RAW_COLUMNS, erstelle_features

SAMPLE = dict(flaeche=85, zimmer=4, schlafzimmer=2, etage=2, stadt="Berlin",
              plz="10115", baujahr=2010, entfernung_bahn=.5, garten=1, balkon=1)


@pytest.fixture(scope="module")
def bundle(tmp_path_factory):
    root = tmp_path_factory.mktemp("training")
    with pytest.MonkeyPatch.context() as patch:
        patch.setenv("MLFLOW_TRACKING_URI", (root / "tracking").as_uri())
        first, meta_first = train.trainiere_modell(300, output_dir=root / "first")
        second, meta_second = train.trainiere_modell(300, output_dir=root / "second")
    return root / "first", first, second, meta_first, meta_second


def test_generator_is_reproducible_and_valid():
    a = train.generiere_daten(2000)
    pd.testing.assert_frame_equal(a, train.generiere_daten(2000))
    assert not a.equals(train.generiere_daten(2000, seed=9))
    assert (a.schlafzimmer <= a.zimmer).all()
    assert np.isfinite(a.preis).all() and (a.preis > 0).all()
    assert "plz" not in a.columns


def test_training_and_serving_use_identical_features():
    row = pd.DataFrame([SAMPLE])
    assert train.erstelle_features is api.erstelle_features
    features = erstelle_features(row, reference_year=2026)
    assert list(features.columns) == FEATURE_COLUMNS
    assert features.alter.iloc[0] == 16
    assert features.stadt_Berlin.iloc[0] == 1
    assert features.filter(like="stadt_").sum(axis=1).iloc[0] == 1
    assert "preis" not in features and "preis_pro_m2" not in features and "plz" not in features
    features_without_target = erstelle_features(row.assign(preis=1, preis_pro_m2=999))
    pd.testing.assert_frame_equal(features, features_without_target)


@pytest.mark.parametrize("change", [{"stadt":"Kaiserslautern"}, {"flaeche":0}, {"flaeche":float("nan")}, {"baujahr":2027}, {"schlafzimmer":5}])
def test_features_reject_invalid_inputs(change):
    with pytest.raises(ValueError):
        erstelle_features(pd.DataFrame([{**SAMPLE, **change}]))


def test_missing_required_feature_is_not_zero_filled():
    with pytest.raises(ValueError, match="Missing required"):
        erstelle_features(pd.DataFrame([SAMPLE]).drop(columns="garten"))


def test_repeated_training_and_saved_pipeline_match(bundle):
    directory, first, second, meta_first, meta_second = bundle
    inputs = pd.DataFrame([SAMPLE])
    np.testing.assert_array_equal(first.predict(inputs), second.predict(inputs))
    assert meta_first["metrics"] == meta_second["metrics"]
    loaded, metadata = api.load_bundle(directory)
    np.testing.assert_array_equal(loaded.predict(inputs), first.predict(inputs))
    assert metadata["data_mode"] == "synthetic"
    assert metadata["interval"] is None
    assert metadata["reference_year"] == 2026


def test_api_uses_saved_pipeline_and_has_no_fake_interval(bundle, monkeypatch):
    directory, pipeline, _, _, _ = bundle
    monkeypatch.setattr(api, "MODEL_DIR", directory)
    with TestClient(api.app) as client:
        assert client.get("/health").status_code == 200
        response = client.post("/predict", json=SAMPLE)
        assert response.status_code == 200, response.text
        result = response.json()
        expected = float(pipeline.predict(pd.DataFrame([SAMPLE]))[0])
        assert result["preis_estimate"] == round(expected, 2)
        assert result["preis_pro_m2"] == round(expected / SAMPLE["flaeche"], 2)
        assert result["interval_min"] is result["interval_max"] is None
        assert result["data_mode"] == "synthetic"
        assert result["reference_year"] == 2026
        assert "SYNTHETIC_DATA" in result["warnings"]
        # Postal codes never affect the synthetic prediction.
        assert client.post("/predict", json={**SAMPLE, "plz":99999}).json()["preis_estimate"] == result["preis_estimate"]


@pytest.mark.parametrize("change", [{"stadt":"Paris"}, {"flaeche":400}, {"flaeche":0}, {"baujahr":2023}, {"schlafzimmer":5}, {"entfernung_bahn":6}, {"zimmer":9}])
def test_api_rejects_out_of_scope_inputs(bundle, monkeypatch, change):
    monkeypatch.setattr(api, "MODEL_DIR", bundle[0])
    with TestClient(api.app) as client:
        assert client.post("/predict", json={**SAMPLE, **change}).status_code == 422


def test_missing_bundle_is_not_ready_and_does_not_reuse_old_model(bundle, tmp_path, monkeypatch):
    monkeypatch.setattr(api, "MODEL_DIR", bundle[0])
    with TestClient(api.app) as client:
        assert client.get("/health").status_code == 200
    monkeypatch.setattr(api, "MODEL_DIR", tmp_path)
    with TestClient(api.app) as client:
        assert client.get("/").json()["modell_geladen"] is False
        assert client.get("/health").status_code == 503
        assert client.post("/predict", json=SAMPLE).status_code == 503


@pytest.mark.parametrize("damage", ["checksum", "schema", "sklearn", "reference_year"])
def test_inconsistent_artifact_fails_closed(bundle, tmp_path, monkeypatch, damage):
    source = bundle[0]
    metadata = json.loads((source / "metadata.json").read_text())
    (tmp_path / "pipeline.joblib").write_bytes((source / "pipeline.joblib").read_bytes())
    key, value = {"checksum":("pipeline_sha256", "wrong"), "schema":("feature_columns", []),
                  "sklearn":("sklearn_version", "0.0"), "reference_year":("reference_year", 2024)}[damage]
    metadata[key] = value
    (tmp_path / "metadata.json").write_text(json.dumps(metadata))
    monkeypatch.setattr(api, "MODEL_DIR", tmp_path)
    with TestClient(api.app) as client:
        assert client.get("/health").status_code == 503
