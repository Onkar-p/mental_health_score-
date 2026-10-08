# Mansik Santulan Score (Flask)

Predicts a student's mental health score (0–10) from habits and screen time.

## Run locally
```bash
pip install -r requirements.txt
python app.py          # http://localhost:5000
```
Keep `Mental_Health_Model.pkl` next to `app.py`.
Use the same scikit-learn version you trained with, or the model may fail to load.

## Deploy (Render etc.)
Start command: `gunicorn app:app`

## Structure
```
app.py                 Flask backend (/ , /predict, /health)
templates/index.html   Page
static/style.css       Styles
static/script.js       Form + API calls
```
