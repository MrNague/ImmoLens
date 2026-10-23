"""Regression tests for the model-backed API."""

import shutil

import pandas as pd
import pytest
from fastapi.testclient import TestClient

import api
from train import trainiere_modell


SAMPLE = {
    "flaeche": 85,
    "zimmer": 4,
    "schlafzimmer": 2,
    "etage": 2,
    "stadt": "Berlin",
    "baujahr": 2010,
    "entfernung_bahn": 0.5,
    "garten": 1,
    "balkon": 1,
}


@pytest.fixture(scope="module")
def bundle(tmp_path_factory):
    """Train one small temporary model for these tests."""
    root = tmp_path_factory.mktemp("api-tests")
    output = root / "modelle"

    with pytest.MonkeyPatch.context() as patch:
        patch.setenv(
            "MLFLOW_TRACKING_URI",
            (root / "tracking").as_uri(),
        )

        pipeline, metadata = trainiere_modell(
            anzahl=100,
            output_dir=output,
        )

    return output, pipeline, metadata


@pytest.fixture
def client(bundle, monkeypatch):
    monkeypatch.setattr(api, "MODEL_DIR", bundle[0])

    with TestClient(api.app) as test_client:
        yield test_client


def test_health_identifies_loaded_model(client, bundle):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["data_mode"] == "synthetic"
    assert response.json()["model_id"] == bundle[2]["model_id"]


def test_prediction_matches_saved_pipeline(client, bundle):
    response = client.post("/predict", json=SAMPLE)

    assert response.status_code == 200
    result = response.json()

    expected = float(
        bundle[1].predict(pd.DataFrame([SAMPLE]))[0]
    )

    assert result["preis_estimate"] == round(expected, 2)
    assert result["preis_pro_m2"] == round(
        expected / SAMPLE["flaeche"], 2
    )
    assert result["model_id"] == bundle[2]["model_id"]
    assert result["reference_year"] == 2026
    assert result["currency"] == "EUR"
    assert result["data_mode"] == "synthetic"
    assert result["interval_min"] is None
    assert result["interval_max"] is None
    assert "SYNTHETIC_DATA" in result["warnings"]
    assert "NO_CALIBRATED_INTERVAL" in result["warnings"]


@pytest.mark.parametrize(
    "change",
    [
        {"flaeche": 0},
        {"flaeche": 400},
        {"stadt": "Paris"},
        {"schlafzimmer": 5},
        {"baujahr": 2023},
    ],
)
def test_invalid_or_unsupported_inputs_are_rejected(client, change):
    response = client.post(
        "/predict",
        json={**SAMPLE, **change},
    )

    assert response.status_code == 422
    assert "preis_estimate" not in response.json()


def test_missing_model_returns_503(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "MODEL_DIR", tmp_path)

    with TestClient(api.app) as client:
        assert client.get("/").json()["model_loaded"] is False
        assert client.get("/health").status_code == 503
        assert client.post(
            "/predict", json=SAMPLE
        ).status_code == 503


def test_corrupted_model_returns_503(bundle, tmp_path, monkeypatch):
    damaged = tmp_path / "damaged-model"
    shutil.copytree(bundle[0], damaged)

    with (damaged / "pipeline.joblib").open("ab") as file:
        file.write(b"corrupted-artifact")

    monkeypatch.setattr(api, "MODEL_DIR", damaged)

    with TestClient(api.app) as client:
        assert client.get("/health").status_code == 503
        assert client.post(
            "/predict", json=SAMPLE
        ).status_code == 503
