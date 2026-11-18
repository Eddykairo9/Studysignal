"""Reusable implementations for the student performance notebook stages."""

import json
import os
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


WORKSPACE = Path(__file__).resolve().parent
DATA_PATH = WORKSPACE / "student_academic_performance_synthetic_1000.csv"
FIGURES_PATH = WORKSPACE / "figures"
MODEL_FILES = {
    "Tuned Logistic Regression": "student_performance_logistic_regression.pkl",
    "Tuned Random Forest": "student_performance_random_forest.pkl",
}
MODEL_METADATA_FILE = WORKSPACE / "student_performance_model_metadata.json"


class StudentPerformanceWorkflow:
    """Run the notebook stages in order while passing state between them."""

    def __init__(self):
        os.chdir(WORKSPACE)
        os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
        sns.set_theme(style="whitegrid", font_scale=1.0)
        plt.rcParams["font.sans-serif"] = "DejaVu Sans"
        FIGURES_PATH.mkdir(exist_ok=True)

        self.num_features = [
            "study_hours_weekly",
            "attendance_percentage",
            "assignment_completion_percentage",
            "sleep_hours",
            "number_of_courses",
            "social_media_hours_daily",
            "previous_performance",
        ]
        self.cat_features = ["internet_access", "study_location"]
        self.target_col = "performance_category"
        self.selected_features = self.num_features + self.cat_features
        self.order = ["Low", "Medium", "High"]
        self.palette = {"Low": "#e74c3c", "Medium": "#f39c12", "High": "#2ecc71"}
        self.df = None

    def stage_1(self):
        print("=" * 80)
        print("SECTION 1: LOADING DATASET")
        print("=" * 80)
        self.df = pd.read_csv(DATA_PATH)
        print(f"Dataset Shape: {self.df.shape[0]} rows, {self.df.shape[1]} columns\n")
        print("First 5 records:")
        print(self.df.head())
        print("\nDataset Information (Data Types & Non-Null Counts):")
        self.df.info()
        print("\nSummary Statistics for Numerical Attributes:")
        print(self.df.describe().T)
        print("\nMissing Values per Attribute:")
        print(self.df.isnull().sum())
        print(f"\nTotal Confirmed Duplicate Rows: {self.df.duplicated().sum()}")
        counts = self.df[self.target_col].value_counts()
        percentages = self.df[self.target_col].value_counts(normalize=True) * 100
        print("\nTarget Variable Distribution ('performance_category'):")
        print(
            pd.DataFrame(
                {"Count": counts, "Percentage (%)": percentages.round(2)}
            )
        )

    def stage_2(self):
        print("\nSECTION 2: DATA CLEANING & FEATURE SELECTION")
        irrelevant = [
            "student_id",
            "timestamp",
            "data_source",
            "current_performance",
        ]
        print(f"Dropping administrative and target-leakage columns: {irrelevant}")
        print("\nChecking numerical feature boundaries:")
        for column in self.num_features:
            print(
                f"  {column}: min = {self.df[column].min()}, "
                f"max = {self.df[column].max()}"
            )
        print("\nCategorical feature values:")
        for column in self.cat_features:
            print(f"  {column}: {self.df[column].unique().tolist()}")

    def stage_3(self):
        print("\nSECTION 3: EXPLORATORY DATA ANALYSIS")
        df = self.df
        target = self.target_col

        plt.figure(figsize=(7, 4.5))
        ax = sns.countplot(
            data=df, x=target, order=self.order, hue=target,
            palette=self.palette, legend=False,
        )
        plt.title("Distribution of Academic Performance Categories", fontweight="bold")
        plt.xlabel("Academic Performance Category")
        plt.ylabel("Number of Students")
        for patch in ax.patches:
            height = patch.get_height()
            ax.annotate(
                f"{int(height)} ({height / len(df) * 100:.1f}%)",
                (patch.get_x() + patch.get_width() / 2, height / 2),
                ha="center",
                va="center",
                color="white",
                fontweight="bold",
            )
        self._save_figure("01_target_distribution.png")

        fig, axes = plt.subplots(3, 3, figsize=(14, 10))
        axes = axes.flatten()
        for index, column in enumerate(self.num_features):
            sns.histplot(df[column].dropna(), kde=True, ax=axes[index], color="#3498db")
            axes[index].set_title(f"Distribution of {column}", fontweight="bold")
        axes[7].set_visible(False)
        axes[8].set_visible(False)
        self._save_figure("02_numerical_histograms.png")

        fig, axes = plt.subplots(3, 3, figsize=(14, 10))
        axes = axes.flatten()
        for index, column in enumerate(self.num_features):
            sns.boxplot(y=df[column], ax=axes[index], color="#9b59b6")
            axes[index].set_title(f"Box Plot of {column}", fontweight="bold")
        axes[7].set_visible(False)
        axes[8].set_visible(False)
        self._save_figure("03_numerical_boxplots.png")

        plt.figure(figsize=(9, 7))
        sns.heatmap(
            df[self.num_features].corr(),
            annot=True,
            fmt=".2f",
            cmap="coolwarm",
            vmin=-1,
            vmax=1,
            square=True,
        )
        plt.title("Correlation Heatmap of Student Numerical Features", fontweight="bold")
        self._save_figure("04_correlation_heatmap.png")

        fig, axes = plt.subplots(1, 2, figsize=(13, 4))
        sns.countplot(
            data=df, x="internet_access", ax=axes[0],
            hue="internet_access", palette="Blues_r", legend=False,
        )
        axes[0].set_title("Internet Access Availability", fontweight="bold")
        sns.countplot(
            data=df, x="study_location", ax=axes[1],
            hue="study_location", palette="Purples_r", legend=False,
        )
        axes[1].set_title("Preferred Study Location", fontweight="bold")
        self._save_figure("05_categorical_distribution.png")

        comparisons = [
            "study_hours_weekly",
            "attendance_percentage",
            "social_media_hours_daily",
            "previous_performance",
        ]
        fig, axes = plt.subplots(2, 2, figsize=(13, 9))
        for axis, column in zip(axes.flatten(), comparisons):
            sns.boxplot(
                data=df,
                x=target,
                y=column,
                order=self.order,
                hue=target,
                palette=self.palette,
                ax=axis,
                legend=False,
            )
            axis.set_title(f"{column.replace('_', ' ').title()} by Performance")
        self._save_figure("06_features_by_target.png")

    def stage_4(self):
        print("\nSECTION 4: OUTLIER INVESTIGATION VIA IQR")
        for column in self.num_features:
            values = self.df[column].dropna()
            q1, q3 = values.quantile([0.25, 0.75])
            iqr = q3 - q1
            lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
            outliers = values[(values < lower) | (values > upper)]
            print(
                f"{column}: normal range [{lower:.2f}, {upper:.2f}], "
                f"{len(outliers)} outliers ({len(outliers) / len(values) * 100:.2f}%). "
                "Retained as plausible student behaviour."
            )

    def stage_5(self):
        print("\nSECTION 5: DATA SPLITTING & LEAKAGE-FREE PREPROCESSING")
        x = self.df[self.selected_features].copy()
        y = self.df[self.target_col].copy()
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            x, y, test_size=0.20, random_state=42, stratify=y
        )
        print(f"Training set: {len(self.X_train)} samples")
        print(f"Testing set: {len(self.X_test)} samples")
        print("\nTraining class distribution:")
        print(self.y_train.value_counts(normalize=True).round(3))
        print("\nTesting class distribution:")
        print(self.y_test.value_counts(normalize=True).round(3))

        self.preprocessor_lr = ColumnTransformer(
            transformers=[
                (
                    "num",
                    Pipeline(
                        [
                            ("imputer", SimpleImputer(strategy="median")),
                            ("scaler", StandardScaler()),
                        ]
                    ),
                    self.num_features,
                ),
                (
                    "cat",
                    Pipeline(
                        [
                            ("imputer", SimpleImputer(strategy="most_frequent")),
                            ("encoder", OneHotEncoder(drop="first", handle_unknown="ignore")),
                        ]
                    ),
                    self.cat_features,
                ),
            ]
        )
        self.preprocessor_rf = ColumnTransformer(
            transformers=[
                ("num", SimpleImputer(strategy="median"), self.num_features),
                (
                    "cat",
                    Pipeline(
                        [
                            ("imputer", SimpleImputer(strategy="most_frequent")),
                            ("encoder", OneHotEncoder(drop="first", handle_unknown="ignore")),
                        ]
                    ),
                    self.cat_features,
                ),
            ]
        )

    def stage_6(self):
        print("\nSECTION 6: BASELINE MODEL TRAINING")
        self.pipe_lr = Pipeline(
            [
                ("preprocessor", self.preprocessor_lr),
                ("classifier", LogisticRegression(random_state=42, max_iter=1000)),
            ]
        )
        self.pipe_rf = Pipeline(
            [
                ("preprocessor", self.preprocessor_rf),
                ("classifier", RandomForestClassifier(random_state=42)),
            ]
        )
        self.pipe_lr.fit(self.X_train, self.y_train)
        self.pipe_rf.fit(self.X_train, self.y_train)
        print("Trained baseline Logistic Regression and Random Forest pipelines.")

    def stage_7(self):
        print("\nSECTION 7: HYPERPARAMETER TUNING")
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        self.grid_lr = GridSearchCV(
            self.pipe_lr,
            {"classifier__C": [0.01, 0.1, 1.0, 10.0]},
            cv=cv,
            scoring="f1_macro",
            n_jobs=1,
        )
        self.grid_rf = GridSearchCV(
            self.pipe_rf,
            {
                "classifier__n_estimators": [50, 100],
                "classifier__max_depth": [4, 6, 8],
                "classifier__min_samples_split": [5, 10],
                "classifier__min_samples_leaf": [2, 4],
            },
            cv=cv,
            scoring="f1_macro",
            n_jobs=1,
        )
        self.grid_lr.fit(self.X_train, self.y_train)
        self.grid_rf.fit(self.X_train, self.y_train)
        self.best_lr = self.grid_lr.best_estimator_
        self.best_rf = self.grid_rf.best_estimator_
        print(f"Logistic Regression: {self.grid_lr.best_params_}")
        print(f"  CV Macro F1: {self.grid_lr.best_score_:.4f}")
        print(f"Random Forest: {self.grid_rf.best_params_}")
        print(f"  CV Macro F1: {self.grid_rf.best_score_:.4f}")

    def stage_8(self):
        print("\nSECTION 8: MODEL EVALUATION & OVERFITTING ASSESSMENT")
        self.models = {
            "Logistic Regression": self.pipe_lr,
            "Tuned Logistic Regression": self.best_lr,
            "Random Forest": self.pipe_rf,
            "Tuned Random Forest": self.best_rf,
        }
        rows = []
        for name, model in self.models.items():
            train_accuracy = accuracy_score(
                self.y_train, model.predict(self.X_train)
            )
            prediction = model.predict(self.X_test)
            rows.append(
                {
                    "Model": name,
                    "Train Acc": round(train_accuracy, 4),
                    "Test Acc": round(accuracy_score(self.y_test, prediction), 4),
                    "Overfit Gap": round(
                        train_accuracy - accuracy_score(self.y_test, prediction), 4
                    ),
                    "Precision (Macro)": round(
                        precision_score(self.y_test, prediction, average="macro"), 4
                    ),
                    "Recall (Macro)": round(
                        recall_score(self.y_test, prediction, average="macro"), 4
                    ),
                    "F1-score (Macro)": round(
                        f1_score(self.y_test, prediction, average="macro"), 4
                    ),
                }
            )
            print(f"\n--- {name} ---")
            print(classification_report(self.y_test, prediction))
        self.comparison_df = pd.DataFrame(rows)
        print(self.comparison_df.to_string(index=False))

        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        for axis, (name, model) in zip(axes.flatten(), self.models.items()):
            matrix = confusion_matrix(
                self.y_test, model.predict(self.X_test), labels=self.order
            )
            sns.heatmap(
                matrix,
                annot=True,
                fmt="d",
                cmap="Blues",
                ax=axis,
                xticklabels=self.order,
                yticklabels=self.order,
            )
            axis.set_title(f"Confusion Matrix: {name}")
            axis.set_xlabel("Predicted Performance")
            axis.set_ylabel("True Performance")
        self._save_figure("07_confusion_matrices.png")

    def stage_9(self):
        print("\nSECTION 9: FEATURE IMPORTANCE & MODEL INTERPRETATION")
        encoder = (
            self.best_lr.named_steps["preprocessor"]
            .named_transformers_["cat"]
            .named_steps["encoder"]
        )
        self.all_features = self.num_features + encoder.get_feature_names_out(
            self.cat_features
        ).tolist()
        importance = self.best_rf.named_steps["classifier"].feature_importances_
        importance_df = pd.DataFrame(
            {"Feature": self.all_features, "Importance": importance}
        ).sort_values("Importance", ascending=True)

        plt.figure(figsize=(9, 6))
        plt.barh(importance_df["Feature"], importance_df["Importance"], color="#2980b9")
        plt.title("Feature Importances (Tuned Random Forest)", fontweight="bold")
        plt.xlabel("Mean Decrease in Impurity (Gini Importance)")
        self._save_figure("08_feature_importance_rf.png")

        coefficients = self.best_lr.named_steps["classifier"].coef_
        classes = self.best_lr.named_steps["classifier"].classes_
        coefficient_df = pd.DataFrame(
            coefficients, columns=self.all_features, index=classes
        )
        fig, axes = plt.subplots(1, len(classes), figsize=(16, 6), sharey=True)
        for axis, class_name in zip(axes, classes):
            values = coefficient_df.loc[class_name].sort_values()
            colors = ["#e74c3c" if value < 0 else "#2ecc71" for value in values]
            axis.barh(values.index, values.values, color=colors)
            axis.set_title(f"Coefficients for Class: {class_name}")
            axis.set_xlabel("Coefficient Weight (Log-Odds Impact)")
            axis.axvline(0, color="black", linestyle="--", linewidth=0.8)
        plt.suptitle("Logistic Regression Feature Coefficients by Class")
        self._save_figure("09_feature_coefficients_lr.png")
        print("\nLogistic Regression Coefficients:")
        print(coefficient_df.T.round(4))

    def stage_10(self):
        print("\nSECTION 10: MODEL PERSISTENCE & INFERENCE")
        joblib.dump(self.best_lr, WORKSPACE / MODEL_FILES["Tuned Logistic Regression"])
        joblib.dump(self.best_rf, WORKSPACE / MODEL_FILES["Tuned Random Forest"])
        cv_scores = {
            "Tuned Logistic Regression": float(self.grid_lr.best_score_),
            "Tuned Random Forest": float(self.grid_rf.best_score_),
        }
        metadata = {
            "selected_model": max(cv_scores, key=cv_scores.get),
            "cv_macro_f1": cv_scores,
            "models": MODEL_FILES,
            "data_provenance": "synthetic_demo",
            "results_status": "complete",
        }
        MODEL_METADATA_FILE.write_text(json.dumps(metadata, indent=2) + "\n")
        print(f"Exported models: {MODEL_FILES}")
        print(f"Selected model by CV Macro F1: {metadata['selected_model']}")

        new_students = pd.DataFrame(
            [
                {
                    "study_hours_weekly": 22.0,
                    "attendance_percentage": 92.0,
                    "assignment_completion_percentage": 95.0,
                    "sleep_hours": 7.5,
                    "internet_access": "Yes",
                    "study_location": "Library",
                    "number_of_courses": 6,
                    "social_media_hours_daily": 1.5,
                    "previous_performance": 75.0,
                },
                {
                    "study_hours_weekly": 4.0,
                    "attendance_percentage": 45.0,
                    "assignment_completion_percentage": 35.0,
                    "sleep_hours": 5.0,
                    "internet_access": "No",
                    "study_location": "Hostel",
                    "number_of_courses": 8,
                    "social_media_hours_daily": 6.5,
                    "previous_performance": 38.0,
                },
            ]
        )
        selected_pipeline = joblib.load(
            WORKSPACE / MODEL_FILES[metadata["selected_model"]]
        )
        predictions = selected_pipeline.predict(new_students)
        probabilities = selected_pipeline.predict_proba(new_students)
        for index, (prediction, row_probabilities) in enumerate(
            zip(predictions, probabilities), start=1
        ):
            print(f"\nStudent #{index}: predicted category = {prediction}")
            for label, probability in zip(
                selected_pipeline.classes_, row_probabilities
            ):
                print(f"  {label}: {probability * 100:.2f}%")
        print("\nPROJECT PIPELINE COMPLETED SUCCESSFULLY")

    @staticmethod
    def _save_figure(filename):
        plt.tight_layout()
        destination = FIGURES_PATH / filename
        plt.savefig(destination, dpi=150)
        plt.close()
        print(f"Saved: {destination.relative_to(WORKSPACE)}")


def run_stage(stage_number):
    """Run stages 1 through ``stage_number`` in order and return their state."""
    if not isinstance(stage_number, int) or not 1 <= stage_number <= 10:
        raise ValueError("stage_number must be an integer from 1 through 10")

    workflow = StudentPerformanceWorkflow()
    for number in range(1, stage_number + 1):
        getattr(workflow, f"stage_{number}")()
    return workflow
