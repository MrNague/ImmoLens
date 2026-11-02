# ImmoLens

ImmoLens is a machine-learning project for estimating residential property prices in Germany.

It combines a reproducible ML pipeline, a FastAPI backend, model tracking with MLflow, and a modern React/Vite frontend.

## Current status

ImmoLens currently runs on **synthetic training data** and is intended as a technical demonstration of the complete ML workflow.

The current version includes:

- Random Forest regression with a shared preprocessing pipeline
- Reproducible training and model artifacts
- FastAPI prediction API
- Model metadata and MLflow tracking
- React + Vite + TypeScript frontend
- Property estimation workflow
- Estimate history
- Methodology and model transparency views
- Automated tests for training and API consistency

The next major step is replacing the synthetic dataset with **real German real-estate data**.

## Tech stack

**Machine Learning**
- Python
- scikit-learn
- MLflow
- pandas

**Backend**
- FastAPI
- Pydantic

**Frontend**
- React
- TypeScript
- Vite

## Run locally

### Backend

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe train.py
.\.venv\Scripts\python.exe api.py
