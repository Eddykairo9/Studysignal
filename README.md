# Student Performance Classification

A machine learning project that uses student learning and behavioural factors to classify academic performance into three categories: **Low, Medium, and High**.

## Project Overview

The project investigates whether measurable student learning and behavioural factors can be used to classify academic performance using supervised machine learning.

The classification system explores relationships between student characteristics and academic performance rather than attempting to establish causal relationships.

### Project Objectives

- Investigate factors associated with student academic performance.
- Prepare and explore student academic and behavioural data.
- Develop supervised machine learning classification models.
- Compare model performance using appropriate evaluation metrics.
- Identify important features influencing model predictions.
- Persist trained models for use in a backend prediction system.

### Input Features

The project considers student-related factors such as:

- Study hours
- Attendance
- Assignment completion
- Sleep duration
- Internet availability
- Study location
- Number of courses
- Social media usage
- Previous academic performance

### Classification Target

The target variable is academic performance, divided into three categories:

- Low
- Medium
- High

The classification boundaries are defined using an appropriate academic grading scheme before model training.

## Machine Learning Approach

This project uses supervised multiclass classification.

Two classification approaches are investigated:

1. **Logistic Regression** – A baseline classification model that estimates the probability of an observation belonging to each performance category.
2. **Random Forest** – An ensemble model that combines predictions from multiple decision trees.

The models are evaluated and compared to determine how effectively they classify student academic performance.

## Project Structure

The notebook workflow is implemented once in `notebook_stages.py` and exposed through `student_performance_classification.py`.

The workflow is divided into ten Jupyter notebooks, each representing a stage of the machine learning process.

Each notebook invokes the shared workflow through its corresponding stage and automatically executes any prerequisite stages in order. This allows individual notebooks to be executed independently without manually running every preceding notebook.

### Notebook Stages

1. **[Data Loading and Inspection](notebooks/01_data-loading-inspection.ipynb)**  
   Load the dataset and inspect its structure, variables, and initial characteristics.

2. **[Data Cleaning and Feature Selection](notebooks/02_data-cleaning-feature-selection.ipynb)**  
   Prepare the dataset by addressing data quality issues and selecting relevant features.

3. **[Exploratory Data Analysis](notebooks/03_exploratory-data-analysis.ipynb)**  
   Explore distributions, relationships, and patterns within the student performance data.

4. **[Outlier Investigation](notebooks/04_outlier-investigation.ipynb)**  
   Investigate potential outliers and their implications for the analysis.

5. **[Preprocessing and Train-Test Split](notebooks/05_preprocessing-train-test-split.ipynb)**  
   Prepare features for model training and separate the dataset into training and testing sets.

6. **[Baseline Model Training](notebooks/06_baseline-model-training.ipynb)**  
   Train the baseline Logistic Regression classifier.

7. **[Hyperparameter Tuning](notebooks/07_hyperparameter-tuning.ipynb)**  
   Investigate model configurations and tune hyperparameters to improve classification performance.

8. **[Model Evaluation and Overfitting Assessment](notebooks/08_model-evaluation-overfitting-assessment.ipynb)**  
   Evaluate model performance, compare predictions, and assess potential overfitting.

9. **[Feature Importance and Model Interpretation](notebooks/09_feature-importance-model-interpretation.ipynb)**  
   Investigate feature importance and interpret the factors associated with model predictions.

10. **[Model Persistence and Inference](notebooks/10_model-persistence-inference.ipynb)**  
    Export trained model pipelines and prepare them for inference.

## Model Evaluation

The classification models are evaluated using:

- **Accuracy:** Proportion of correctly classified observations.
- **Precision:** Proportion of correct predictions among observations predicted to belong to a particular class.
- **Recall:** Proportion of actual observations in a class correctly identified.
- **F1-score:** Harmonic mean of precision and recall.
- **Confusion Matrix:** Comparison of actual and predicted performance categories.

These metrics provide a basis for comparing Logistic Regression and Random Forest.

## Backend

The backend uses Python's standard library HTTP server to expose predictions from the trained model pipelines.

It loads the model pipelines exported during notebook stage 10. The backend does not perform model training or write model files; training and model persistence are handled by the notebook workflow.

### Model Artifacts

The model persistence stage exports the following files to the workspace root:

- Two trained model pickle files.
- `student_performance_model_metadata.json`

These artifacts are used by the backend for prediction and model-related metadata.

### Running the Backend

Before starting the backend, the trained model artifacts must be generated.

#### 1. Generate the model artifacts

Open the project using the workspace `.venv` Python environment and select its Jupyter kernel.

Execute:

`notebooks/10_model-persistence-inference.ipynb`

This notebook automatically runs all required preceding stages and generates the model artifacts in the workspace root.

#### 2. Start the backend

Once the model artifacts have been generated, start the backend using the project's backend entry point.

The backend loads the exported pipelines and uses them to classify new student data into Low, Medium, or High academic performance categories.

## Workflow Execution

The complete machine learning workflow can be accessed through:

- `notebook_stages.py` – Contains the shared implementation of the notebook stages.
- `student_performance_classification.py` – Exposes the classification workflow.

Individual notebooks can also be executed independently because prerequisite stages are automatically handled by the shared workflow.

## Responsible Use and Limitations

The system is intended to identify patterns in student academic and behavioural data and use them to classify observed academic performance.

Predictions should be interpreted as model estimates rather than definitive judgments about individual students.

The project investigates associations between measured variables and academic performance. It does not establish that any particular factor causes a student to perform poorly or well.
