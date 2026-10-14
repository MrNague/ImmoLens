"""Existing API routes, now using the same fitted pipeline as training."""
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

from features import CITIES, FEATURE_COLUMNS, erstelle_features

logger = logging.getLogger(__name__)
MODEL_DIR = Path(os.environ.get("IMMOLENS_MODEL_DIR", Path(__file__).parent / "modelle"))


def load_bundle(directory):
    directory = Path(directory)
    metadata = json.loads((directory / "metadata.json").read_text(encoding="utf-8"))
    payload = (directory / "pipeline.joblib").read_bytes()
    if metadata.get("schema_version") != 1 or metadata.get("feature_columns") != FEATURE_COLUMNS:
        raise ValueError("Incompatible feature schema; retrain the model")
    if metadata.get("sklearn_version") != sklearn.__version__:
        raise ValueError("Incompatible scikit-learn version; retrain the model")
    if metadata.get("data_mode") != "synthetic" or metadata.get("target") != "synthetic_total_price_eur":
        raise ValueError("This demo API requires a synthetic model bundle")
    if hashlib.sha256(payload).hexdigest() != metadata.get("pipeline_sha256"):
        raise ValueError("Incomplete or mismatched bundle; retrain the model")
    # Deserialize the exact bytes verified above, from a trusted local artifact only.
    pipeline = joblib.load(io.BytesIO(payload))
    if pipeline.named_steps["features"].kw_args["reference_year"] != metadata["reference_year"]:
        raise ValueError("Inconsistent reference year")
    if list(pipeline.named_steps["scaler"].feature_names_in_) != FEATURE_COLUMNS:
        raise ValueError("Inconsistent fitted feature columns")
    return pipeline, metadata


@asynccontextmanager
async def lifespan(app):
    app.state.pipeline = None
    app.state.metadata = None
    try:
        pipeline, metadata = load_bundle(MODEL_DIR)
        app.state.pipeline, app.state.metadata = pipeline, metadata
    except Exception:
        logger.exception("Model bundle unavailable; run python train.py")
    yield
    app.state.pipeline = None
    app.state.metadata = None


app = FastAPI(title="ImmoLens synthetic demo API", version="0.2.0", lifespan=lifespan)


class ImmobilieInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    flaeche: float = Field(gt=0)
    zimmer: int = Field(ge=1, le=8)
    schlafzimmer: int = Field(ge=0, le=5)
    etage: int = Field(ge=0, le=9)
    stadt: Literal["Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart"]
    # Accepted for compatibility but deliberately excluded from the model.
    plz: str | int | None = None
    baujahr: int = Field(ge=1950)
    entfernung_bahn: float = Field(ge=0, le=5)
    garten: int = Field(ge=0, le=1)
    balkon: int = Field(ge=0, le=1)

    @model_validator(mode="after")
    def check_rooms(self):
        if self.schlafzimmer > self.zimmer:
            raise ValueError("Schlafzimmer dürfen die Zimmeranzahl nicht überschreiten")
        return self


class VorhersageResponse(BaseModel):
    preis_estimate: float
    preis_formatiert: str
    preis_pro_m2: float
    interval_min: float | None = None
    interval_max: float | None = None
    modell: str
    model_id: str
    data_mode: Literal["synthetic"] = "synthetic"
    target: str = "synthetic_total_price_eur"
    currency: Literal["EUR"] = "EUR"
    reference_year: int
    warnings: list[str]
    features: dict


@app.get("/")
def root():
    loaded = getattr(app.state, "pipeline", None) is not None
    return dict(status="online", modell_geladen=loaded, scaler_geladen=loaded,
                features_geladen=loaded, anzahl_features=len(FEATURE_COLUMNS) if loaded else 0, version=app.version)


@app.get("/health")
def health():
    if getattr(app.state, "pipeline", None) is None:
        raise HTTPException(503, "Modell nicht verfügbar. Zuerst python train.py ausführen.")
    return {"status": "ok", "data_mode": "synthetic"}


@app.post("/predict", response_model=VorhersageResponse)
def predict(immobilie: ImmobilieInput):
    pipeline = getattr(app.state, "pipeline", None)
    if pipeline is None:
        raise HTTPException(503, "Modell nicht verfügbar. Zuerst python train.py ausführen.")
    metadata = app.state.metadata
    if not 30 <= immobilie.flaeche <= 250 or not 1950 <= immobilie.baujahr <= 2022:
        raise HTTPException(422, "Außerhalb der synthetischen Trainingsabdeckung (30–250 m²; Baujahr 1950–2022).")
    values = immobilie.model_dump()
    price = float(pipeline.predict(pd.DataFrame([values]))[0])
    return VorhersageResponse(
        preis_estimate=round(price, 2), preis_formatiert=f"{price:,.0f} €".replace(",", "."),
        preis_pro_m2=round(price / immobilie.flaeche, 2), modell="Random Forest (synthetische Demo)",
        model_id=metadata["model_id"], reference_year=metadata["reference_year"],
        warnings=["SYNTHETIC_DATA", "NO_CALIBRATED_INTERVAL"], features=values)


@app.get("/features")
def get_features():
    return {"features": FEATURE_COLUMNS, "anzahl": len(FEATURE_COLUMNS), "cities": CITIES}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
