"""One feature contract for training and serving. No target-derived features."""
import numpy as np
import pandas as pd

REFERENCE_YEAR = 2026
CITIES = ("Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart")
RAW_COLUMNS = ("flaeche", "zimmer", "schlafzimmer", "etage", "stadt", "baujahr",
               "entfernung_bahn", "garten", "balkon")
NUMERIC_COLUMNS = tuple(c for c in RAW_COLUMNS if c != "stadt")
FEATURE_COLUMNS = list(NUMERIC_COLUMNS) + ["alter", "zimmer_pro_m2", "komfort_score"] + [f"stadt_{c}" for c in CITIES]


def erstelle_features(df, reference_year=REFERENCE_YEAR):
    """Stable column order even for a single city; reject incomplete inputs."""
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
    if ((numbers["schlafzimmer"] < 0) | (numbers["schlafzimmer"] > numbers["zimmer"])).any():
        raise ValueError("Bedrooms must be between zero and rooms")
    if (numbers["baujahr"] > reference_year).any():
        raise ValueError("Construction year exceeds reference year")
    result = numbers.copy()
    result["alter"] = reference_year - numbers["baujahr"]
    result["zimmer_pro_m2"] = numbers["zimmer"] / numbers["flaeche"] * 100
    result["komfort_score"] = numbers["garten"] + numbers["balkon"] + (numbers["etage"] > 0).astype(int)
    for city in CITIES:
        result[f"stadt_{city}"] = (df["stadt"] == city).astype(int)
    return result.loc[:, FEATURE_COLUMNS]
