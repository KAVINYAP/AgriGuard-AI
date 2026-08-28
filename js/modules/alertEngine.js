/* =========================================================
   AgriGuard AI - Alert Engine
   File: js/modules/alertEngine.js

   Purpose:
   - Generate proactive crop-health alerts
   - Combine disease, weather and soil risk signals
   - Classify alert severity
   - Provide recommended actions
   - Manage active/dismissed alerts
   - Provide safe integration with app.js
   ========================================================= */

"use strict";


/* =========================================================
   ALERT ENGINE
   ========================================================= */

const AgriGuardAlertEngine = {

    /* -----------------------------------------------------
       Configuration
    ----------------------------------------------------- */

    thresholds: {

        diseaseRisk: {
            low: 30,
            moderate: 50,
            high: 70
        },

        humidity: {
            moderate: 75,
            high: 85
        },

        rainfallProbability: {
            moderate: 50,
            high: 70
        },

        soilMoisture: {
            low: 30,
            high: 80
        },

        temperature: {
            low: 10,
            high: 35
        },

        cropHealth: {
            warning: 70,
            critical: 50
        }

    },


    alerts: [],


    /* =====================================================
       UTILITY FUNCTIONS
       ===================================================== */

    toNumber(value, fallback = 0) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    },


    clamp(value, min = 0, max = 100) {

        return Math.max(
            min,
            Math.min(max, this.toNumber(value))
        );
    },


    generateId(prefix = "alert") {

        return (
            `${prefix}-` +
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
        );
    },


    getSeverity(score) {

        score = this.clamp(score);

        if (
            score >=
            this.thresholds.diseaseRisk.high
        ) {
            return "high";
        }

        if (
            score >=
            this.thresholds.diseaseRisk.moderate
        ) {
            return "moderate";
        }

        return "low";
    },


    getSeverityLabel(severity) {

        const labels = {
            low: "LOW RISK",
            moderate: "MODERATE RISK",
            high: "HIGH RISK",
            critical: "CRITICAL"
        };

        return labels[severity] || "LOW RISK";
    },


    getSeverityScore(severity) {

        const scores = {
            low: 25,
            moderate: 55,
            high: 80,
            critical: 95
        };

        return scores[severity] ?? 25;
    },


    /* =====================================================
       ALERT CREATION
       ===================================================== */

    createAlert({

        type = "general",

        title = "Crop Health Alert",

        message = "",

        field = null,

        crop = null,

        severity = "moderate",

        score = null,

        reasons = [],

        actions = [],

        timestamp = new Date().toISOString()

    } = {}) {

        const alertSeverity =
            severity || "moderate";

        const alertScore =
            score !== null
                ? this.clamp(score)
                : this.getSeverityScore(
                    alertSeverity
                );

        return {

            id: this.generateId(type),

            type,

            title,

            message,

            field,

            crop,

            severity: alertSeverity,

            severityLabel:
                this.getSeverityLabel(
                    alertSeverity
                ),

            score: alertScore,

            reasons: Array.isArray(reasons)
                ? reasons
                : [],

            actions: Array.isArray(actions)
                ? actions
                : [],

            timestamp,

            active: true,

            dismissed: false

        };
    },


    /* =====================================================
       DISEASE ALERT
       ===================================================== */

    createDiseaseAlert(data = {}) {

        const risk = this.clamp(
            data.riskScore ??
            data.risk ??
            data.score ??
            0
        );

        if (
            risk <
            this.thresholds.diseaseRisk.moderate
        ) {
            return null;
        }


        let severity =
            this.getSeverity(risk);


        if (risk >= 85) {
            severity = "critical";
        }


        const disease =
            data.disease ||
            data.diseaseName ||
            "Potential crop disease";


        const field =
            data.field ||
            data.fieldName ||
            "Selected field";


        const crop =
            data.crop ||
            data.cropName ||
            "Crop";


        const actions = [

            "Inspect affected plants",

            "Separate or remove severely affected plant material where appropriate",

            "Avoid practices that increase leaf wetness",

            "Monitor nearby plants for symptom progression"

        ];


        if (severity === "critical") {

            actions.unshift(
                "Take immediate field-level action and seek qualified agricultural guidance"
            );

        }


        return this.createAlert({

            type: "disease",

            title:
                severity === "critical"
                    ? "Critical Disease Risk"
                    : "Elevated Disease Risk",

            message:
                `${disease} indicators have been detected in ${field}.`,

            field,

            crop,

            severity,

            score: risk,

            reasons: [

                `Disease risk: ${risk}%`,

                disease

            ],

            actions

        });
    },


    /* =====================================================
       WEATHER ALERT
       ===================================================== */

    createWeatherAlert(weather = {}) {

        const humidity =
            this.clamp(
                weather.humidity ??
                weather.relativeHumidity ??
                0
            );


        const rainfallProbability =
            this.clamp(
                weather.rainProbability ??
                weather.rainProbabilityPercent ??
                weather.precipitationProbability ??
                0
            );


        const temperature =
            this.toNumber(
                weather.temperature ??
                weather.temp ??
                0
            );


        const reasons = [];
        const actions = [];


        let score = 0;


        /* High humidity */

        if (
            humidity >=
            this.thresholds.humidity.high
        ) {

            score += 40;

            reasons.push(
                `High humidity: ${humidity}%`
            );

            actions.push(
                "Monitor crops for prolonged leaf wetness"
            );

        } else if (
            humidity >=
            this.thresholds.humidity.moderate
        ) {

            score += 20;

            reasons.push(
                `Elevated humidity: ${humidity}%`
            );

        }


        /* Rain probability */

        if (
            rainfallProbability >=
            this.thresholds.rainfallProbability.high
        ) {

            score += 40;

            reasons.push(
                `High rainfall probability: ${rainfallProbability}%`
            );

            actions.push(
                "Avoid unnecessary irrigation before expected rainfall"
            );

        } else if (
            rainfallProbability >=
            this.thresholds.rainfallProbability.moderate
        ) {

            score += 20;

            reasons.push(
                `Rainfall probability: ${rainfallProbability}%`
            );

        }


        /* Temperature */

        if (
            temperature >=
            this.thresholds.temperature.high
        ) {

            score += 20;

            reasons.push(
                `High temperature: ${temperature}°C`
            );

            actions.push(
                "Monitor crop water stress during hot periods"
            );

        } else if (
            temperature > 0 &&
            temperature <=
            this.thresholds.temperature.low
        ) {

            score += 20;

            reasons.push(
                `Low temperature: ${temperature}°C`
            );

            actions.push(
                "Monitor crops for temperature stress"
            );

        }


        if (score < 40) {
            return null;
        }


        score = this.clamp(score);


        let severity =
            this.getSeverity(score);


        if (score >= 80) {
            severity = "high";
        }


        if (
            actions.length === 0
        ) {

            actions.push(
                "Continue monitoring weather and crop conditions"
            );

        }


        return this.createAlert({

            type: "weather",

            title:
                severity === "high"
                    ? "High Weather Risk"
                    : "Weather Conditions Need Attention",

            message:
                "Current environmental conditions may increase crop stress or disease-favoring conditions.",

            field:
                weather.field ||
                weather.fieldName ||
                null,

            crop:
                weather.crop ||
                weather.cropName ||
                null,

            severity,

            score,

            reasons,

            actions

        });
    },


    /* =====================================================
       SOIL ALERT
       ===================================================== */

    createSoilAlert(soil = {}) {

        const moisture =
            this.clamp(
                soil.moisture ??
                soil.soilMoisture ??
                0
            );


        const nitrogen =
            this.toNumber(
                soil.nitrogen ??
                soil.N ??
                0
            );


        const phosphorus =
            this.toNumber(
                soil.phosphorus ??
                soil.P ??
                0
            );


        const potassium =
            this.toNumber(
                soil.potassium ??
                soil.K ??
                0
            );


        const reasons = [];
        const actions = [];


        let score = 0;


        /* Soil moisture */

        if (
            moisture <=
            this.thresholds.soilMoisture.low
        ) {

            score += 40;

            reasons.push(
                `Low soil moisture: ${moisture}%`
            );

            actions.push(
                "Assess irrigation requirements"
            );

        } else if (
            moisture >=
            this.thresholds.soilMoisture.high
        ) {

            score += 40;

            reasons.push(
                `High soil moisture: ${moisture}%`
            );

            actions.push(
                "Check drainage and avoid unnecessary irrigation"
            );

        }


        /* Nutrient indicators */

        if (
            nitrogen > 0 &&
            nitrogen < 40
        ) {

            score += 15;

            reasons.push(
                `Low nitrogen indicator: ${nitrogen}`
            );

            actions.push(
                "Review crop nutrient requirements"
            );

        }


        if (
            phosphorus > 0 &&
            phosphorus < 40
        ) {

            score += 10;

            reasons.push(
                `Low phosphorus indicator: ${phosphorus}`
            );

        }


        if (
            potassium > 0 &&
            potassium < 40
        ) {

            score += 10;

            reasons.push(
                `Low potassium indicator: ${potassium}`
            );

        }


        if (score < 25) {
            return null;
        }


        score = this.clamp(score);


        return this.createAlert({

            type: "soil",

            title:
                moisture >=
                this.thresholds.soilMoisture.high
                    ? "Excess Soil Moisture"
                    : "Soil Condition Alert",

            message:
                "Soil conditions may require attention to protect crop health.",

            field:
                soil.field ||
                soil.fieldName ||
                null,

            crop:
                soil.crop ||
                soil.cropName ||
                null,

            severity:
                this.getSeverity(score),

            score,

            reasons,

            actions

        });
    },


    /* =====================================================
       CROP HEALTH ALERT
       ===================================================== */

    createCropHealthAlert(data = {}) {

        const health =
            this.clamp(
                data.health ??
                data.cropHealth ??
                data.healthScore ??
                100
            );


        if (
            health >=
            this.thresholds.cropHealth.warning
        ) {
            return null;
        }


        let severity = "moderate";


        if (
            health <=
            this.thresholds.cropHealth.critical
        ) {

            severity = "critical";

        } else if (health < 60) {

            severity = "high";

        }


        const score =
            this.clamp(
                100 - health
            );


        return this.createAlert({

            type: "crop-health",

            title:
                severity === "critical"
                    ? "Critical Crop Health Decline"
                    : "Crop Health Declining",

            message:
                `Crop health is currently ${health}%.`,

            field:
                data.field ||
                data.fieldName ||
                null,

            crop:
                data.crop ||
                data.cropName ||
                null,

            severity,

            score,

            reasons: [

                `Crop health: ${health}%`

            ],

            actions: [

                "Inspect the crop for visible symptoms",

                "Review recent weather and soil conditions",

                "Run an AI diagnosis if symptoms are visible",

                "Monitor the field more frequently"

            ]

        });
    },


    /* =====================================================
       COMBINED RISK ANALYSIS
       ===================================================== */

    generateAlerts(context = {}) {

        const generated = [];


        /* Disease */

        const diseaseAlert =
            this.createDiseaseAlert(
                context.disease ||
                context.diagnosis ||
                context
            );


        if (diseaseAlert) {
            generated.push(diseaseAlert);
        }


        /* Weather */

        const weatherAlert =
            this.createWeatherAlert(
                context.weather ||
                {}
            );


        if (weatherAlert) {
            generated.push(weatherAlert);
        }


        /* Soil */

        const soilAlert =
            this.createSoilAlert(
                context.soil ||
                {}
            );


        if (soilAlert) {
            generated.push(soilAlert);
        }


        /* Crop health */

        const cropHealthAlert =
            this.createCropHealthAlert(
                context.cropHealth ||
                context
            );


        if (cropHealthAlert) {
            generated.push(
                cropHealthAlert
            );
        }


        /*
         * Sort most important alerts first.
         */

        generated.sort(
            (a, b) =>
                b.score - a.score
        );


        this.alerts =
            generated;


        return [
            ...generated
        ];
    },


    /* =====================================================
       COMBINED FIELD RISK
       ===================================================== */

    calculateCombinedRisk(context = {}) {

        const diseaseRisk =
            this.clamp(
                context.diseaseRisk ??
                context.riskScore ??
                0
            );


        const humidity =
            this.clamp(
                context.weather?.humidity ??
                0
            );


        const rain =
            this.clamp(
                context.weather?.rainProbability ??
                context.weather?.precipitationProbability ??
                0
            );


        const moisture =
            this.clamp(
                context.soil?.moisture ??
                context.soil?.soilMoisture ??
                50
            );


        const cropHealth =
            this.clamp(
                context.cropHealth ??
                100
            );


        /*
         * Disease risk receives the highest weight
         * because it represents the direct disease signal.
         */

        let score =
            diseaseRisk * 0.45;


        score +=
            humidity * 0.15;


        score +=
            rain * 0.15;


        /*
         * Excessively low or high moisture
         * increases environmental risk.
         */

        const moistureRisk =
            moisture < 30
                ? 100 - moisture
                : moisture > 80
                    ? moisture
                    : 0;


        score +=
            this.clamp(
                moistureRisk
            ) * 0.10;


        /*
         * Poor crop health increases vulnerability.
         */

        const healthRisk =
            100 - cropHealth;


        score +=
            this.clamp(
                healthRisk
            ) * 0.15;


        return this.clamp(
            Math.round(score)
        );
    },


    /* =====================================================
       ALERT SUMMARY
       ===================================================== */

    getActiveAlerts() {

        return this.alerts.filter(
            alert =>
                alert.active &&
                !alert.dismissed
        );
    },


    getActiveAlertCount() {

        return this.getActiveAlerts()
            .length;
    },


    getAlertsBySeverity(
        severity
    ) {

        return this.getActiveAlerts()
            .filter(
                alert =>
                    alert.severity ===
                    severity
            );
    },


    getHighestPriorityAlert() {

        const alerts =
            this.getActiveAlerts();


        if (!alerts.length) {
            return null;
        }


        return [...alerts].sort(
            (a, b) =>
                b.score - a.score
        )[0];
    },


    /* =====================================================
       ALERT MANAGEMENT
       ===================================================== */

    dismissAlert(alertId) {

        const alert =
            this.alerts.find(
                item =>
                    item.id ===
                    alertId
            );


        if (!alert) {
            return false;
        }


        alert.dismissed = true;
        alert.active = false;


        return true;
    },


    activateAlert(alertId) {

        const alert =
            this.alerts.find(
                item =>
                    item.id ===
                    alertId
            );


        if (!alert) {
            return false;
        }


        alert.dismissed = false;
        alert.active = true;


        return true;
    },


    clearAlerts() {

        this.alerts = [];

    },


    /* =====================================================
       ALERT FORMATTER
       ===================================================== */

    formatAlert(alert) {

        if (!alert) {
            return null;
        }


        return {

            id: alert.id,

            type: alert.type,

            title: alert.title,

            message: alert.message,

            field:
                alert.field ||
                "All fields",

            crop:
                alert.crop ||
                "Multiple crops",

            severity:
                alert.severity,

            severityLabel:
                alert.severityLabel,

            score:
                `${Math.round(
                    alert.score
                )}%`,

            reasons:
                [...alert.reasons],

            actions:
                [...alert.actions],

            timestamp:
                alert.timestamp,

            active:
                alert.active,

            dismissed:
                alert.dismissed

        };
    },


    /* =====================================================
       DASHBOARD-FRIENDLY DATA
       ===================================================== */

    getDashboardAlerts() {

        return this.getActiveAlerts()
            .map(
                alert =>
                    this.formatAlert(
                        alert
                    )
            );
    },


    getSummary() {

        const active =
            this.getActiveAlerts();


        return {

            total:
                active.length,

            high:
                active.filter(
                    alert =>
                        alert.severity ===
                        "high"
                ).length,

            critical:
                active.filter(
                    alert =>
                        alert.severity ===
                        "critical"
                ).length,

            moderate:
                active.filter(
                    alert =>
                        alert.severity ===
                        "moderate"
                ).length,

            low:
                active.filter(
                    alert =>
                        alert.severity ===
                        "low"
                ).length

        };
    }

};


/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.AgriGuardAlertEngine =
    AgriGuardAlertEngine;


/* Convenient aliases for app.js */

window.generateAlerts =
    function(context) {

        return AgriGuardAlertEngine
            .generateAlerts(context);

    };


window.createDiseaseAlert =
    function(data) {

        return AgriGuardAlertEngine
            .createDiseaseAlert(data);

    };


window.createWeatherAlert =
    function(data) {

        return AgriGuardAlertEngine
            .createWeatherAlert(data);

    };


window.createSoilAlert =
    function(data) {

        return AgriGuardAlertEngine
            .createSoilAlert(data);

    };


window.createCropHealthAlert =
    function(data) {

        return AgriGuardAlertEngine
            .createCropHealthAlert(data);

    };


window.getActiveAlerts =
    function() {

        return AgriGuardAlertEngine
            .getActiveAlerts();

    };


window.getActiveAlertCount =
    function() {

        return AgriGuardAlertEngine
            .getActiveAlertCount();

    };


window.dismissAlert =
    function(alertId) {

        return AgriGuardAlertEngine
            .dismissAlert(alertId);

    };


window.getAlertSummary =
    function() {

        return AgriGuardAlertEngine
            .getSummary();

    };
