import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split


WORKSPACE = Path(__file__).resolve().parent.parent
DATA_PATH = WORKSPACE / "student_academic_performance_synthetic_1000.csv"
METADATA_PATH = WORKSPACE / "student_performance_model_metadata.json"

NUMERIC_FEATURES = [
    "study_hours_weekly",
    "attendance_percentage",
    "assignment_completion_percentage",
    "sleep_hours",
    "number_of_courses",
    "social_media_hours_daily",
    "previous_performance",
]
CATEGORICAL_FEATURES = ["internet_access", "study_location"]
TARGET = "performance_category"
SELECTED_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
CLASSES = ["Low", "Medium", "High"]


class StudentPerformanceService:
    def __init__(self):
        self.data = pd.read_csv(DATA_PATH)
        self.data.columns = [column.strip() for column in self.data.columns]
        if not METADATA_PATH.is_file():
            raise FileNotFoundError(
                f"Model metadata not found at {METADATA_PATH}. "
                "Run notebook 10 to train and export the model artifacts."
            )

        self.metadata = json.loads(METADATA_PATH.read_text())
        self.models = {
            name: joblib.load(WORKSPACE / filename)
            for name, filename in self.metadata["models"].items()
        }
        self.selected_model = self.metadata["selected_model"]
        if not self.models:
            raise ValueError("No model artifacts are configured.")
        if self.selected_model not in self.models:
            raise ValueError(f"Selected model is not available: {self.selected_model}")

        self._evaluate_loaded_models()

    def _evaluate_loaded_models(self):
        x = self.data[SELECTED_FEATURES].copy()
        y = self.data[TARGET].copy()
        _, x_test, _, y_test = train_test_split(
            x,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y,
        )

        self.train_results = {}
        for name, model in self.models.items():
            prediction = model.predict(x_test)
            test_accuracy = accuracy_score(y_test, prediction)
            self.train_results[name] = {
                "cv_macro_f1": float(self.metadata["cv_macro_f1"][name]),
                "train_accuracy": None,
                "test_accuracy": float(test_accuracy),
                "test": {
                    "accuracy": float(test_accuracy),
                    "macro_precision": float(
                        precision_score(y_test, prediction, average="macro")
                    ),
                    "macro_recall": float(
                        recall_score(y_test, prediction, average="macro")
                    ),
                    "macro_f1": float(
                        f1_score(y_test, prediction, average="macro")
                    ),
                    "weighted_f1": float(
                        f1_score(y_test, prediction, average="weighted")
                    ),
                    "confusion_matrix": confusion_matrix(
                        y_test, prediction, labels=CLASSES
                    ).tolist(),
                },
            }

    def health(self):
        return {
            "status": "ok",
            "data_provenance": "synthetic_demo",
            "results_status": "complete",
            "model_count": len(self.models),
        }

    def model_options(self):
        return {
            "available_models": list(self.models),
            "selected_model": self.selected_model,
            "categorical_options": {
                "internet_access": sorted(
                    self.data["internet_access"].dropna().unique().tolist()
                ),
                "study_location": sorted(
                    self.data["study_location"].dropna().unique().tolist()
                ),
                "university": sorted(
                    self.data["university"].dropna().unique().tolist()
                ),
                "programme": sorted(
                    self.data["programme"].dropna().unique().tolist()
                ),
            },
            "data_provenance": "synthetic_demo",
            "results_status": "complete",
        }

    def predict(self, payload):
        payload = dict(payload)
        model_name = payload.pop("model_name", self.selected_model)
        if model_name not in self.models:
            raise ValueError("Unknown model name.")

        missing = [field for field in SELECTED_FEATURES if field not in payload]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        frame = pd.DataFrame(
            [{field: payload[field] for field in SELECTED_FEATURES}]
        )
        model = self.models[model_name]
        predicted = model.predict(frame)[0]
        probabilities = model.predict_proba(frame)[0]
        probability_map = {
            str(label): float(probability)
            for label, probability in zip(model.classes_, probabilities)
        }
        for label in CLASSES:
            probability_map.setdefault(label, 0.0)

        return {
            "predicted_category": str(predicted),
            "probabilities": probability_map,
            "model_used": model_name,
            "data_provenance": "synthetic_demo",
            "disclaimer": (
                "This estimate is based on synthetic data and is for educational "
                "exploration, not an individual academic decision."
            ),
        }

    def overview(self):
        averages = self.data[
            [
                "attendance_percentage",
                "study_hours_weekly",
                "assignment_completion_percentage",
                "sleep_hours",
            ]
        ].mean()
        return {
            "total_observations": int(len(self.data)),
            "averages": {
                "attendance_percentage": float(averages["attendance_percentage"]),
                "study_hours_weekly": float(averages["study_hours_weekly"]),
                "assignment_completion_percentage": float(
                    averages["assignment_completion_percentage"]
                ),
                "sleep_hours": float(averages["sleep_hours"]),
            },
            "data_provenance": "synthetic_demo",
            "results_status": "complete",
        }

    def distribution(self):
        counts = self.data[TARGET].value_counts()
        return {
            "distribution": {
                category: int(counts.get(category, 0)) for category in CLASSES
            },
            "data_provenance": "synthetic_demo",
            "results_status": "complete",
        }

    def feature_analysis(self):
        means = {}
        for category in CLASSES:
            subset = self.data[self.data[TARGET] == category]
            means[category] = {
                feature: float(subset[feature].mean())
                for feature in [
                    "study_hours_weekly",
                    "attendance_percentage",
                    "sleep_hours",
                    "assignment_completion_percentage",
                ]
            }

        forest = self.models["Tuned Random Forest"]
        feature_names = forest.named_steps["preprocessor"].get_feature_names_out()
        importances = forest.named_steps["classifier"].feature_importances_
        importance_rows = [
            {"feature": str(name), "importance": float(importance)}
            for name, importance in zip(feature_names, importances)
        ]
        importance_rows.sort(key=lambda row: row["importance"], reverse=True)

        return {
            "means_by_performance_category": means,
            "random_forest_feature_importance": importance_rows,
            "data_provenance": "synthetic_demo",
            "results_status": "complete",
        }

    def model_comparison(self):
        return {
            "selected_model": self.selected_model,
            "models": self.train_results,
            "data_provenance": "synthetic_demo",
            "results_status": "complete",
        }
