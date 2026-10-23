"""Shared preprocessing for ImmoLens training and prediction."""

import numpy as np
import pandas as pd

REFERENCE_YEAR = 2026

CITIES = (
    "Berlin", "Hamburg", "München",
    "Köln", "Frankfurt", "Stuttgart",
)

RAW_COLUMNS = (
    "flaeche", "zimmer", "schlafzimmer", "etage",
    "stadt", "baujahr", "entfernung_bahn", "garten", "balkon",
)

NUMERIC_COLUMNS = tuple(
    column for column in RAW_COLUMNS if column != "stadt"
)

FEATURE_COLUMNS = (
    list(NUMERIC_COLUMNS)
    + ["alter", "zimmer_pro_m2", "komfort_score"]
    + [f"stadt_{city}" for city in CITIES]
)


def erstelle_features(df, reference_year=REFERENCE_YEAR):
    """Convert raw property inputs into consistently ordered features."""
    missing = set(RAW_COLUMNS) - set(df.columns)

    if missing:
        raise ValueError(f"Missing required inputs: {sorted(missing)}")

    if not df["stadt"].isin(CITIES).all():
        raise ValueError("Unsupported city")

    numbers = df.loc[:, NUMERIC_COLUMNS].astype(float)

    if not np.isfinite(numbers.to_numpy()).all():
        raise ValueError("Inputs must be finite")

    if (numbers["flaeche"] <= 0).any():
        raise ValueError("Area must be positive")

    invalid_bedrooms = (
        (numbers["schlafzimmer"] < 0)
        | (numbers["schlafzimmer"] > numbers["zimmer"])
    )

    if invalid_bedrooms.any():
        raise ValueError("Bedrooms must be between zero and rooms")

    if (numbers["baujahr"] > reference_year).any():
        raise ValueError("Construction year exceeds reference year")

    result = numbers.copy()
    result["alter"] = reference_year - numbers["baujahr"]
    result["zimmer_pro_m2"] = (
        numbers["zimmer"] / numbers["flaeche"] * 100
    )
    result["komfort_score"] = (
        numbers["garten"]
        + numbers["balkon"]
        + (numbers["etage"] > 0).astype(int)
    )

    for city in CITIES:
        result[f"stadt_{city}"] = (df["stadt"] == city).astype(int)

    return result.loc[:, FEATURE_COLUMNS]
