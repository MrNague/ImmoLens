"""Reproducible synthetic training for ImmoLens."""

import argparse
import hashlib
import json
import os
from pathlib import Path

import joblib
import mlflow
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler

from features import (
    CITIES,
    FEATURE_COLUMNS,
    RAW_COLUMNS,
    REFERENCE_YEAR,
    erstelle_features,
)


def generiere_daten(anzahl=1000, seed=42):
    """Generate demonstration data, not observed market prices."""
    if anzahl < 10:
        raise ValueError("At least 10 synthetic rows are required")

    rng = np.random.default_rng(seed)

    area = rng.normal(80, 30, anzahl).clip(30, 250).astype(int)
    rooms = (
        area / 25 + rng.normal(0, 1, anzahl)
    ).clip(1, 8).astype(int)

    bedrooms = np.minimum(
        (rooms * 0.5 + rng.normal(0, 1, anzahl)).clip(0, 5).astype(int),
        rooms,
    )

    floor = rng.integers(0, 10, anzahl)
    city = rng.choice(CITIES, anzahl)
    year = rng.integers(1950, 2023, anzahl)
    distance = rng.uniform(0, 5, anzahl).round(1)
    garden = rng.choice([0, 1], anzahl, p=[0.4, 0.6])
    balcony = rng.choice([0, 1], anzahl, p=[0.3, 0.7])

    # Arbitrary demonstration coefficients, not current city prices.
    per_m2 = (
        3000
        + (city == "München") * 4000
        + (city == "Berlin") * 2000
        + (city == "Hamburg") * 1500
        + (city == "Frankfurt") * 1800
    )

    # Float conversion fixes the original integer multiplication crash.
    price = (area * per_m2).astype(float)

    price *= (
        (1 + 0.02 * floor)
        * (1 + 0.1 * garden)
        * (1 + 0.05 * balcony)
        * (1 - 0.03 * distance)
    )

    price += rng.normal(0, price * 0.1, anzahl)

    return pd.DataFrame({
        "flaeche": area,
        "zimmer": rooms,
        "schlafzimmer": bedrooms,
        "etage": floor,
        "stadt": city,
        "baujahr": year,
        "entfernung_bahn": distance,
        "garten": garden,
        "balkon": balcony,
        "preis": price.clip(50000, 2000000).astype(int),
    })


def trainiere_modell(
    anzahl=2000,
    seed=42,
    output_dir="modelle",
    reference_year=REFERENCE_YEAR,
):
    if reference_year < 2022:
        raise ValueError("Reference year must be at least 2022")

    data = generiere_daten(anzahl, seed)

    X_train, X_test, y_train, y_test = train_test_split(
        data.loc[:, RAW_COLUMNS],
        data["preis"],
        test_size=0.2,
        random_state=seed,
    )

    pipeline = Pipeline([
        (
            "features",
            FunctionTransformer(
                erstelle_features,
                kw_args={"reference_year": reference_year},
            ),
        ),
        ("scaler", StandardScaler()),
        (
            "model",
            RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=seed,
                n_jobs=1,
            ),
        ),
    ])

    output = Path(output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)

    tracking_uri = os.environ.get(
        "MLFLOW_TRACKING_URI",
        (Path.cwd() / "mlruns").resolve().as_uri(),
    )

    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment("immolens_synthetic_demo")

    with mlflow.start_run(run_name=f"synthetic-seed-{seed}"):
        # Fit preprocessing and model on training rows only.
        pipeline.fit(X_train, y_train)
        prediction = pipeline.predict(X_test)

        metrics = {
            "test_mae_eur": float(
                mean_absolute_error(y_test, prediction)
            ),
            "test_rmse_eur": float(
                np.sqrt(mean_squared_error(y_test, prediction))
            ),
            "test_r2": float(r2_score(y_test, prediction)),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
        }

        mlflow.log_params({
            "seed": seed,
            "reference_year": reference_year,
            "n_estimators": 100,
            "max_depth": 10,
            "data_mode": "synthetic",
        })
        mlflow.log_metrics(metrics)

        temporary = output / "pipeline.joblib.tmp"
        joblib.dump(pipeline, temporary)

        checksum = hashlib.sha256(
            temporary.read_bytes()
        ).hexdigest()

        metadata = {
            "schema_version": 1,
            "model_id": f"synthetic-rf-{checksum[:12]}",
            "pipeline_sha256": checksum,
            "sklearn_version": sklearn.__version__,
            "reference_year": reference_year,
            "seed": seed,
            "data_mode": "synthetic",
            "target": "synthetic_total_price_eur",
            "currency": "EUR",
            "data_period": None,
            "interval": None,
            "feature_columns": FEATURE_COLUMNS,
            "coverage": {
                "cities": list(CITIES),
                "year_built": [1950, 2022],
                "area_m2": [30, 250],
            },
            "metrics": metrics,
            "limitations": [
                "Generated data only; not suitable for property valuation.",
                "Random synthetic holdout; no real-market validation.",
                "No calibrated prediction interval.",
            ],
        }

        temporary.replace(output / "pipeline.joblib")

        metadata_tmp = output / "metadata.json.tmp"
        metadata_tmp.write_text(
            json.dumps(metadata, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        metadata_tmp.replace(output / "metadata.json")

        mlflow.log_artifact(str(output / "metadata.json"))
        mlflow.log_artifact(str(output / "pipeline.joblib"))

    print("Synthetic training complete.")
    print(json.dumps(metrics, indent=2))
    print(f"Bundle saved in: {output}")

    return pipeline, metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--samples", type=int, default=2000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output-dir", default="modelle")
    parser.add_argument(
        "--reference-year",
        type=int,
        default=REFERENCE_YEAR,
    )
    args = parser.parse_args()

    trainiere_modell(
        anzahl=args.samples,
        seed=args.seed,
        output_dir=args.output_dir,
        reference_year=args.reference_year,
    )
