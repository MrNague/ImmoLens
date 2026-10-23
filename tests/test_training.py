import joblib
import numpy as np
import pandas as pd

from features import RAW_COLUMNS
from train import generiere_daten, trainiere_modell


def test_generator_is_reproducible_and_valid():
    first = generiere_daten(200, seed=42)
    second = generiere_daten(200, seed=42)

    pd.testing.assert_frame_equal(first, second)

    assert np.isfinite(first["preis"]).all()
    assert (first["preis"] > 0).all()
    assert (first["schlafzimmer"] <= first["zimmer"]).all()


def test_saved_pipeline_preserves_predictions(tmp_path, monkeypatch):
    monkeypatch.setenv(
        "MLFLOW_TRACKING_URI",
        (tmp_path / "tracking").as_uri(),
    )

    output = tmp_path / "modelle"

    pipeline, metadata = trainiere_modell(
        anzahl=100,
        output_dir=output,
    )

    inputs = generiere_daten(10).loc[:, RAW_COLUMNS]
    restored = joblib.load(output / "pipeline.joblib")

    np.testing.assert_array_equal(
        pipeline.predict(inputs),
        restored.predict(inputs),
    )

    assert (output / "metadata.json").is_file()
    assert metadata["data_mode"] == "synthetic"
    assert metadata["reference_year"] == 2026
    assert metadata["interval"] is None
