from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)
model = joblib.load(BASE_DIR / "Mental_Health_Model.pkl")

TOP_COUNTRIES = ["Other", "India", "USA", "Canada", "Australia", "UK",
                 "Germany", "Mexico", "Turkey", "France"]

CHOICES = {
    "gender": ["Male", "Female"],
    "academic_level": ["High School", "Undergraduate", "Graduate"],
    "most_used_platform": ["Facebook", "LinkedIn", "Instagram", "Snapchat", "Twitter",
                           "YouTube", "TikTok", "LINE", "KakaoTalk", "VKontakte",
                           "WhatsApp", "WeChat"],
    "purpose_of_use": ["Networking", "Education", "Entertainment", "News"],
    "stress_level": ["Low", "Medium", "High", "Very High"],
}

# field: (type, min, max)
NUMBERS = {
    "age": (int, 10, 100),
    "avg_daily_usage_hours": (float, 0, 24),
    "daily_unlocks": (int, 0, None),
    "study_hours": (float, 0, 24),
    "physical_activity_hours": (float, 0, 24),
    "sleep_hours_per_night": (float, 0, 24),
}


def validate(payload):
    """Return (clean_data, errors). Mirrors the old Pydantic StudentData model."""
    clean, errors = {}, {}

    for field, (kind, lo, hi) in NUMBERS.items():
        raw = payload.get(field)
        try:
            if isinstance(raw, bool) or raw in (None, ""):
                raise ValueError
            value = kind(raw)
        except (TypeError, ValueError):
            errors[field] = "Enter a valid number."
            continue
        if value < lo or (hi is not None and value > hi):
            errors[field] = f"Must be between {lo} and {hi}." if hi is not None else f"Must be {lo} or more."
            continue
        clean[field] = value

    for field, options in CHOICES.items():
        value = payload.get(field)
        if value not in options:
            errors[field] = "Choose one of the listed options."
        else:
            clean[field] = value

    country = str(payload.get("country") or "").strip()
    if not country:
        errors["country"] = "Enter a country."
    else:
        clean["country"] = country

    return clean, errors


@app.get("/")
def home():
    return render_template("index.html", choices=CHOICES, countries=TOP_COUNTRIES[1:])


@app.get("/health")
def health():
    return jsonify(status="ok")


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="Send a JSON body."), 400

    data, errors = validate(payload)
    if errors:
        return jsonify(error="Some fields need attention.", errors=errors), 422

    country_group = data["country"] if data["country"] in TOP_COUNTRIES else "Other"

    row = pd.DataFrame([{
        "Age": data["age"],
        "Gender": data["gender"],
        "Country": data["country"],
        "Academic_Level": data["academic_level"],
        "Most_Used_Platform": data["most_used_platform"],
        "Purpose_Of_Use": data["purpose_of_use"],
        "Avg_Daily_Usage_Hours": data["avg_daily_usage_hours"],
        "Daily_Unlocks": data["daily_unlocks"],
        "Study_Hours": data["study_hours"],
        "Physical_Activity_Hours": data["physical_activity_hours"],
        "Sleep_Hours_Per_Night": data["sleep_hours_per_night"],
        "Stress_Level": data["stress_level"],
        "Grouped_country": country_group,
    }])

    try:
        score = float(model.predict(row)[0])
    except Exception as exc:  # model/column mismatch etc.
        app.logger.exception("Prediction failed")
        return jsonify(error=f"Prediction failed: {exc}"), 500

    return jsonify(predicted_mental_health_score=round(score, 2))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
