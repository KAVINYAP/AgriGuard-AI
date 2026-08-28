# AgriGuard AI 🌱

## Intelligent Crop Disease Detection & Management System

AgriGuard AI is a smart agriculture web application designed to help farmers monitor crop health, identify potential diseases, assess environmental risk, and receive actionable disease-management guidance.

The system combines **AI-assisted crop diagnosis, disease-risk analysis, weather conditions, soil health, field monitoring, analytics, and early warnings** into a single dashboard.

---

## 🌾 Key Features

### 1. AI Crop Disease Diagnosis

Upload a crop image and provide field context to receive an AI-assisted disease assessment.

The diagnosis workflow considers:

* Crop type
* Selected field
* Growth stage
* Soil condition
* Crop image
* Disease indicators
* AI confidence
* Disease severity
* Disease risk
* Affected crop area

Supported example crops include:

* Rice
* Cotton
* Chilli
* Tomato

---

### 2. Disease Risk Prediction

AgriGuard AI continuously evaluates disease risk using available crop and environmental information.

Risk analysis can incorporate:

* Current disease indicators
* Temperature
* Humidity
* Rainfall probability
* Soil moisture
* Crop growth stage
* Field conditions
* Historical risk trends

The dashboard displays disease risk as a percentage and visual trend.

---

### 3. Weather Intelligence

The weather module provides environmental information relevant to crop disease development.

The system can monitor:

* Temperature
* Humidity
* Rain probability
* Rainfall
* Weather trends
* Short-term forecasts

Weather information can be used by the risk engine to identify conditions favorable for disease development.

---

### 4. Soil Health Monitoring

Soil information is incorporated into crop-health assessment.

The system tracks parameters such as:

* Nitrogen
* Phosphorus
* Potassium
* Soil moisture
* Organic matter

Soil-health information can be visualized through the dashboard and used as supporting information for crop management.

---

### 5. Field Management

Farmers can monitor multiple agricultural fields from one interface.

Field information includes:

* Field name
* Crop
* Area
* Growth stage
* Crop health
* Disease risk
* Soil moisture
* Field status

The application provides field comparison and selected-field details.

---

### 6. Early Warning System

The Early Warning Center identifies potentially dangerous crop conditions before they develop into severe problems.

Warnings can consider combinations of:

* High humidity
* Rain probability
* Soil moisture
* Crop stage
* Disease risk
* Existing disease indicators

Alerts are presented with severity and recommended actions.

---

### 7. Integrated Recommendations

AgriGuard AI provides structured disease-management guidance divided into:

* Immediate Actions
* Preventive Measures
* Treatment Guidance

Recommendations are intended as decision-support information.

Users should follow applicable agricultural authority guidance and product-label instructions before applying treatments.

---

### 8. Analytics Dashboard

The analytics section provides a broader view of farm health and disease activity.

It includes:

* Field health distribution
* Weather trends
* Disease distribution
* Disease-risk trends
* Diagnosis history
* Field comparisons
* Vegetation-health trends
* Rainfall information

---

## 📊 Dashboard

The main dashboard provides a quick overview of the farm.

It includes:

* Overall crop health
* Current disease risk
* Temperature
* Humidity
* Rain probability
* Soil moisture
* Disease-risk trend
* Early warnings
* Field status
* Weather forecast

The dashboard is designed to provide important information at a glance.

---

## 🧠 System Architecture

The application follows a modular JavaScript architecture.

```text
                    ┌─────────────────────┐
                    │      index.html     │
                    │    Application UI   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       app.js        │
                    │ Application Control │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │ AI Diagnosis│   │ Risk Engine │   │ Field Engine│
      └─────────────┘   └─────────────┘   └─────────────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │Weather      │   │ Soil Engine │   │Alert Engine │
      │Engine       │   │             │   │             │
      └─────────────┘   └─────────────┘   └─────────────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Recommendation      │
                    │ Engine              │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    charts.js        │
                    │ Data Visualization  │
                    └─────────────────────┘
```

---

## 📁 Project Structure

```text
AgriGuard-AI/
│
├── index.html
├── styles.css
│
├── js/
│   ├── app.js
│   ├── data.js
│   ├── charts.js
│   │
│   └── modules/
│       ├── diseaseDetection.js
│       ├── riskEngine.js
│       ├── weatherEngine.js
│       ├── soilEngine.js
│       ├── recommendationEngine.js
│       ├── alertEngine.js
│       └── fieldEngine.js
│
├── data/
│   ├── cropData.json
│   ├── diseaseData.json
│   ├── weatherData.json
│   ├── soilData.json
│   ├── fieldData.json
│   └── diagnosisHistory.json
│
├── assets/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-farm.svg
│   │   ├── crop-placeholder.svg
│   │   └── empty-state.svg
│   │
│   └── icons/
│       ├── leaf.svg
│       ├── disease.svg
│       ├── weather.svg
│       ├── soil.svg
│       ├── field.svg
│       ├── alert.svg
│       └── dashboard.svg
│
├── vercel.json
└── README.md
```

---

## 📦 Core JavaScript Modules

### `app.js`

Main application controller.

Responsible for:

* Navigation
* UI state
* User interactions
* Image upload handling
* Diagnosis workflow
* Field display
* Alert display
* Weather display
* Diagnosis history
* Toast notifications
* Modal handling
* Connecting application modules

---

### `data.js`

Provides the application's core data and configuration.

It acts as the central data layer used by the application.

---

### `charts.js`

Handles dashboard visualization using Chart.js.

Available visualizations include:

* Disease risk trend
* Weather trend
* Soil health
* Disease distribution
* Field risk comparison
* Field health comparison
* NDVI / vegetation health
* Rainfall

The module also provides safe chart creation, updating, resizing, and destruction.

---

### `diseaseDetection.js`

Handles crop-image diagnosis logic.

The module processes the selected crop context and image information and returns a structured diagnosis result.

---

### `riskEngine.js`

Calculates crop disease-risk information using available environmental and crop parameters.

---

### `weatherEngine.js`

Handles weather-related information and weather-derived conditions.

---

### `soilEngine.js`

Handles soil-health information and soil-condition analysis.

---

### `recommendationEngine.js`

Generates structured recommendations based on diagnosis and risk information.

---

### `alertEngine.js`

Generates and manages early-warning conditions.

---

### `fieldEngine.js`

Handles field-related information and field comparisons.

---

## 📂 Data Files

The `data/` directory contains structured JSON datasets used by the application.

### `cropData.json`

Contains crop-related information.

### `diseaseData.json`

Contains disease information and associated disease-management information.

### `weatherData.json`

Contains weather and forecast information.

### `soilData.json`

Contains soil-health parameters.

### `fieldData.json`

Contains monitored field information.

### `diagnosisHistory.json`

Contains historical crop-diagnosis records used by the analytics section.

---

## 🎨 Assets

### Images

The application uses custom agricultural illustrations for:

* Application branding
* Farm hero sections
* Crop-image placeholders
* Empty states

### Icons

The application contains dedicated agricultural icons for:

* Leaf
* Disease
* Weather
* Soil
* Field
* Alerts
* Dashboard

---

## 📈 Risk Interpretation

Disease risk is represented as a percentage.

A general interpretation used by the interface is:

```text
0–30%       Low
31–60%      Moderate
61–80%      High
81–100%     Critical
```

Risk values should be interpreted together with crop conditions, environmental conditions, field observations, and diagnosis information rather than as a standalone guarantee of disease presence.

---

## 🔬 Diagnosis Workflow

```text
Crop Image
    │
    ▼
Crop Selection
    │
    ▼
Field Context
    │
    ├── Growth Stage
    ├── Soil Condition
    └── Field Information
    │
    ▼
AI-Assisted Diagnosis
    │
    ├── Disease
    ├── Confidence
    ├── Severity
    ├── Risk
    └── Affected Area
    │
    ▼
Risk Assessment
    │
    ▼
Early Warning
    │
    ▼
Recommended Action Plan
```

---

## 🛡️ Decision-Support Disclaimer

AgriGuard AI is designed as an agricultural decision-support and monitoring prototype.

Diagnosis and recommendations should not be treated as a definitive laboratory diagnosis or a substitute for professional agricultural advice.

Before applying any crop-treatment product:

1. Confirm the suspected disease.
2. Follow local agricultural authority recommendations.
3. Use only locally approved products where applicable.
4. Follow the product label.
5. Follow required safety and application instructions.

---

## 🚀 Running Locally

Because the project is a static web application, it can be run using a local development server.

For example, with VS Code and a suitable local server:

```text
Open:
http://localhost:PORT/
```

The application entry point is:

```text
index.html
```

For best results, serve the project through a local HTTP server instead of opening `index.html` directly with `file://`.

---

## ☁️ Deployment

The project is configured for deployment on Vercel through:

```text
vercel.json
```

The application does not require a frontend build process in its current static configuration.

The project root should be deployed as:

```text
AgriGuard-AI/
```

with `index.html` at the root.

---

## 🔧 Technologies

AgriGuard AI uses:

* HTML5
* CSS3
* JavaScript
* JSON
* Chart.js
* SVG
* Vercel

---

## 🌱 Future Enhancements

Potential future production enhancements include:

* Real machine-learning disease classification
* TensorFlow / PyTorch inference
* Plant-image segmentation
* Satellite imagery integration
* Real-time IoT soil sensors
* GPS-based field mapping
* Live weather APIs
* Pest detection
* Multilingual farmer interface
* Voice-based interaction
* Regional disease models
* Historical disease forecasting
* Cloud database integration
* User authentication
* Farm-level multi-user management
* Mobile/PWA support
* Offline diagnosis support
* Agricultural expert verification

---

## 🎯 Project Goal

The goal of AgriGuard AI is to move crop disease management from **reactive treatment** toward **early detection and proactive prevention**.

By combining:

```text
Crop Images
     +
Crop Information
     +
Weather
     +
Soil
     +
Field Conditions
     +
Disease History
     ↓
AgriGuard AI
     ↓
Risk Assessment
     ↓
Early Warning
     ↓
Actionable Recommendations
```

the system provides farmers with a unified view of crop health and potential disease threats.

---

## 📌 Project Status

**AgriGuard AI — Prototype**

Core frontend structure, dashboard interface, data layer, visualization layer, analysis engines, recommendation system, alert system, field management, JSON datasets, assets, and Vercel configuration are included in the project structure.
