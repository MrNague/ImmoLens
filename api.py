"""ImmoLens API using the fitted training pipeline."""

from contextlib import asynccontextmanager
import hashlib
import io
import json
import logging
import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
import joblib
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, model_validator
import sklearn
import uvicorn

from features import CITIES, FEATURE_COLUMNS


logger = logging.getLogger(__name__)

MODEL_DIR = Path(
    os.environ.get(
        "IMMOLENS_MODEL_DIR",
        Path(__file__).parent / "modelle",
    )
)


def load_bundle(directory):
    """Load a complete, compatible, locally generated model bundle."""
    directory = Path(directory)

    metadata = json.loads(
        (directory / "metadata.json").read_text(encoding="utf-8")
    )
    payload = (directory / "pipeline.joblib").read_bytes()

    if (
        metadata.get("schema_version") != 1
        or metadata.get("feature_columns") != FEATURE_COLUMNS
    ):
        raise ValueError("Incompatible feature schema; retrain the model")

    if metadata.get("sklearn_version") != sklearn.__version__:
        raise ValueError("Incompatible sklearn version; retrain the model")

    if (
        metadata.get("data_mode") != "synthetic"
        or metadata.get("target") != "synthetic_total_price_eur"
    ):
        raise ValueError("This API requires a synthetic demo bundle")

    checksum = hashlib.sha256(payload).hexdigest()

    if checksum != metadata.get("pipeline_sha256"):
        raise ValueError("Model checksum mismatch; retrain the model")

    # Load only trusted artifacts generated locally by this project.
    pipeline = joblib.load(io.BytesIO(payload))

    fitted_year = pipeline.named_steps["features"].kw_args[
        "reference_year"
    ]

    if fitted_year != metadata["reference_year"]:
        raise ValueError("Inconsistent reference year")

    fitted_columns = list(
        pipeline.named_steps["scaler"].feature_names_in_
    )

    if fitted_columns != FEATURE_COLUMNS:
        raise ValueError("Inconsistent fitted feature columns")

    return pipeline, metadata


@asynccontextmanager
async def lifespan(app):
    app.state.pipeline = None
    app.state.metadata = None

    try:
        pipeline, metadata = load_bundle(MODEL_DIR)
        app.state.pipeline = pipeline
        app.state.metadata = metadata
    except Exception:
        logger.exception(
            "Model unavailable. Run python train.py, then restart the API."
        )

    yield

    app.state.pipeline = None
    app.state.metadata = None


app = FastAPI(
    title="ImmoLens synthetic demo API",
    version="0.2.0",
    lifespan=lifespan,
)


class ImmobilieInput(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        allow_inf_nan=False,
    )

    flaeche: float = Field(gt=0)
    zimmer: int = Field(ge=1, le=8)
    schlafzimmer: int = Field(ge=0, le=5)
    etage: int = Field(ge=0, le=9)

    stadt: Literal[
        "Berlin", "Hamburg", "München",
        "Köln", "Frankfurt", "Stuttgart",
    ]

    baujahr: int = Field(ge=1950)
    entfernung_bahn: float = Field(ge=0, le=5)
    garten: int = Field(ge=0, le=1)
    balkon: int = Field(ge=0, le=1)

    # Optional compatibility field; excluded from model features.
    plz: str | int | None = None

    @model_validator(mode="after")
    def validate_rooms(self):
        if self.schlafzimmer > self.zimmer:
            raise ValueError("Bedrooms cannot exceed total rooms")
        return self


class VorhersageResponse(BaseModel):
    preis_estimate: float
    preis_formatiert: str
    preis_pro_m2: float

    interval_min: float | None = None
    interval_max: float | None = None

    modell: str
    model_id: str
    reference_year: int

    data_mode: Literal["synthetic"] = "synthetic"
    target: str = "synthetic_total_price_eur"
    currency: Literal["EUR"] = "EUR"

    warnings: list[str]
    features: dict


@app.get("/")
def root():
    loaded = getattr(app.state, "pipeline", None) is not None

    return {
        "name": "ImmoLens",
        "version": app.version,
        "model_loaded": loaded,
        "data_mode": "synthetic",
    }


@app.get("/health")
def health():
    if getattr(app.state, "pipeline", None) is None:
        raise HTTPException(
            status_code=503,
            detail="Model unavailable. Train the model and restart the API.",
        )

    return {
        "status": "ok",
        "data_mode": "synthetic",
        "model_id": app.state.metadata["model_id"],
    }


@app.post("/predict", response_model=VorhersageResponse)
def predict(immobilie: ImmobilieInput):
    pipeline = getattr(app.state, "pipeline", None)

    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Model unavailable. Train the model and restart the API.",
        )

    if not 30 <= immobilie.flaeche <= 250:
        raise HTTPException(
            status_code=422,
            detail="Supported synthetic area range: 30-250 square metres.",
        )

    if not 1950 <= immobilie.baujahr <= 2022:
        raise HTTPException(
            status_code=422,
            detail="Supported synthetic construction years: 1950-2022.",
        )

    values = immobilie.model_dump()
    inputs = pd.DataFrame([values])

    # This pipeline applies the saved preprocessing automatically.
    price = float(pipeline.predict(inputs)[0])

    return VorhersageResponse(
        preis_estimate=round(price, 2),
        preis_formatiert=f"{price:,.0f} EUR",
        preis_pro_m2=round(price / immobilie.flaeche, 2),
        modell="Random Forest - synthetic demo",
        model_id=app.state.metadata["model_id"],
        reference_year=app.state.metadata["reference_year"],
        warnings=[
            "SYNTHETIC_DATA",
            "NO_CALIBRATED_INTERVAL",
        ],
        features=values,
    )


@app.get("/features")
def get_features():
    return {
        "features": FEATURE_COLUMNS,
        "anzahl": len(FEATURE_COLUMNS),
        "cities": CITIES,
    }



@app.get("/model")
def get_model_info():
    """Expose model metadata used by the frontend."""
    metadata = getattr(app.state, "metadata", None)
    pipeline = getattr(app.state, "pipeline", None)

    if pipeline is None or metadata is None:
        raise HTTPException(
            status_code=503,
            detail="Model unavailable. Train the model and restart the API.",
        )

    return {
        "model_id": metadata["model_id"],
        "data_mode": metadata["data_mode"],
        "reference_year": metadata["reference_year"],
        "coverage": metadata["coverage"],
        "metrics": metadata["metrics"],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
