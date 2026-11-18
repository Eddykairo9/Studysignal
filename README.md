# Student Performance Classification - Jupyter Notebooks

The workflow is implemented once in [`notebook_stages.py`](notebook_stages.py).
Each notebook calls the shared workflow through its stage, running any
prerequisite stages in order so it can also be executed independently.

The workflow is exposed by [`student_performance_classification.py`](student_performance_classification.py)
and divided into these 10 stage notebooks:

1. [Data Loading and Inspection](notebooks/01_data-loading-inspection.ipynb)
2. [Data Cleaning and Feature Selection](notebooks/02_data-cleaning-feature-selection.ipynb)
3. [Exploratory Data Analysis](notebooks/03_exploratory-data-analysis.ipynb)
4. [Outlier Investigation](notebooks/04_outlier-investigation.ipynb)
5. [Preprocessing and Train-Test Split](notebooks/05_preprocessing-train-test-split.ipynb)
6. [Baseline Model Training](notebooks/06_baseline-model-training.ipynb)
7. [Hyperparameter Tuning](notebooks/07_hyperparameter-tuning.ipynb)
8. [Model Evaluation and Overfitting Assessment](notebooks/08_model-evaluation-overfitting-assessment.ipynb)
9. [Feature Importance and Model Interpretation](notebooks/09_feature-importance-model-interpretation.ipynb)
10. [Model Persistence and Inference](notebooks/10_model-persistence-inference.ipynb)



# Backend

The backend uses Python's standard library HTTP server and loads the trained
model pipelines exported by notebook 10. It does not train or write models.

## Run

The notebook stages are implemented in `notebook_stages.py`. First execute
`notebooks/10_model-persistence-inference.ipynb` using the workspace `.venv`
kernel. It runs the required preceding stages and writes the two model pickle
files and `student_performance_model_metadata.json` to the workspace root.
