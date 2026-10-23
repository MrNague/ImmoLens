import pandas as pd
import pytest

from features import FEATURE_COLUMNS, erstelle_features


SAMPLE = {
    "flaeche": 80,
    "zimmer": 3,
    "schlafzimmer": 2,
    "etage": 2,
    "stadt": "Berlin",
    "baujahr": 2010,
    "entfernung_bahn": 0.5,
    "garten": 0,
    "balkon": 1,
}


def test_age_uses_explicit_reference_year():
    data = pd.DataFrame([SAMPLE])

    result = erstelle_features(data, reference_year=2026)

    assert result["alter"].iloc[0] == 16
    assert list(result.columns) == FEATURE_COLUMNS
    assert result["stadt_Berlin"].iloc[0] == 1
    assert result.filter(like="stadt_").sum(axis=1).iloc[0] == 1


def test_price_information_cannot_leak_into_features():
    data = pd.DataFrame([SAMPLE])
    with_target = data.assign(
        preis=384000,
        preis_pro_m2=4800,
        plz="10115",
    )

    pd.testing.assert_frame_equal(
        erstelle_features(data),
        erstelle_features(with_target),
    )


def test_unknown_city_is_rejected():
    data = pd.DataFrame([{**SAMPLE, "stadt": "Paris"}])

    with pytest.raises(ValueError, match="Unsupported city"):
        erstelle_features(data)


def test_missing_input_is_rejected():
    data = pd.DataFrame([SAMPLE]).drop(columns="garten")

    with pytest.raises(ValueError, match="Missing required"):
        erstelle_features(data)
