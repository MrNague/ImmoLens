# ImmoLens

ImmoLens is a machine-learning project for estimating residential property prices in Germany.

It combines a reproducible ML pipeline, a FastAPI backend, model tracking with MLflow, and a modern React/Vite frontend.

## Current status

ImmoLens currently runs on **synthetic training data** and serves as a technical demonstration of the complete ML workflow.

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

### Machine Learning

- Python
- pandas
- scikit-learn
- MLflow

### Backend

- FastAPI
- Pydantic

### Frontend

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
```

API documentation:

```text
http://localhost:8000/docs
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## API example

`POST /predict`

```json
{
  "flaeche": 85,
  "zimmer": 4,
  "schlafzimmer": 2,
  "etage": 2,
  "stadt": "Berlin",
  "baujahr": 2010,
  "entfernung_bahn": 0.5,
  "garten": 1,
  "balkon": 1
}
```

## Important

The current model is trained on synthetic data.

Its predictions are therefore **not validated real-market property valuations**.

The project is currently being prepared for migration to a real German real-estate dataset.

## Author

**Pascal Nague**  
Computer Science student at RPTU Kaiserslautern-Landau.

GitHub: https://github.com/MrNague  
Portfolio: https://portfolio.naguepc.de
