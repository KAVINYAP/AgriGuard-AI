```javascript
/* =========================================================
   AgriGuard AI - Risk Engine
   File: js/modules/riskEngine.js

   Purpose:
   - Calculate crop disease risk
   - Combine environmental + crop + disease factors
   - Produce explainable risk scores
   - Classify risk severity
   - Generate risk factors
   - Support dashboard and diagnosis modules
   - Safe browser-side operation
   ========================================================= */

"use strict";


/* =========================================================
   RISK ENGINE NAMESPACE
========================================================= */

const AgriGuardRiskEngine = {

    /* -----------------------------------------------------
       Risk thresholds
    ----------------------------------------------------- */

    thresholds: {
        veryLow: 20,
        low: 40,
        moderate: 60,
        high: 80
    },


    /* -----------------------------------------------------
       Maximum risk score
    ----------------------------------------------------- */

    maxScore: 100,


    /* -----------------------------------------------------
       Default weights

       Total = 100

       These weights represent the relative importance of
       each category in the final risk calculation.
    ----------------------------------------------------- */

    weights: {
        disease: 25,
        weather: 25,
        humidity: 15,
        soil: 10,
        cropStage: 10,
        cropSusceptibility: 10,
        fieldCondition: 5
    },


    /* =====================================================
       CLAMP VALUE
    ===================================================== */

    clamp(value, min = 0, max = 100) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return min;
        }

        return Math.max(
            min,
            Math.min(max, number)
        );
    },


    /* =====================================================
       NORMALIZE VALUE
    ===================================================== */

    normalize(value, min, max) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return 0;
        }

        if (max === min) {
            return 0;
        }

        return this.clamp(
            ((number - min) / (max - min)) * 100
        );
    },


    /* =====================================================
       RISK LEVEL
    ===================================================== */

    getRiskLevel(score) {

        const value = this.clamp(score);

        if (value < this.thresholds.veryLow) {
            return "Very Low";
        }

        if (value < this.thresholds.low) {
            return "Low";
        }

        if (value < this.thresholds.moderate) {
            return "Moderate";
        }

        if (value < this.thresholds.high) {
            return "High";
        }

        return "Very High";
    },


    /* =====================================================
       RISK STATUS
    ===================================================== */

    getRiskStatus(score) {

        const level = this.getRiskLevel(score);

        switch (level) {

            case "Very Low":
                return "safe";

            case "Low":
                return "low";

            case "Moderate":
                return "moderate";

            case "High":
                return "high";

            case "Very High":
                return "critical";

            default:
                return "unknown";
        }
    },


    /* =====================================================
       DISEASE CONTRIBUTION
    ===================================================== */

    calculateDiseaseRisk(diseaseResult) {

        if (!diseaseResult) {
            return 0;
        }

        /*
         * Confidence indicates how strongly the disease
         * detection engine believes the diagnosis.
         */

        const confidence =
            Number(
                diseaseResult.confidence ??
                diseaseResult.confidenceScore ??
                0
            );

        /*
         * Disease severity increases risk.
         */

        const severity =
            String(
                diseaseResult.severity ??
                ""
            ).toLowerCase();


        let severityScore = 0;

        if (severity.includes("very high") ||
            severity.includes("critical")) {

            severityScore = 100;

        } else if (severity.includes("high")) {

            severityScore = 80;

        } else if (severity.includes("moderate")) {

            severityScore = 60;

        } else if (severity.includes("low")) {

            severityScore = 30;

        } else {

            severityScore = 20;
        }


        /*
         * Existing disease detection is a stronger
         * indicator than confidence alone.
         */

        const diseaseDetected =
            diseaseResult.diseaseDetected === true ||
            diseaseResult.detected === true ||
            (
                diseaseResult.disease &&
                String(
                    diseaseResult.disease
                ).toLowerCase() !== "healthy"
            );


        if (!diseaseDetected) {

            return this.clamp(
                severityScore * 0.25
            );
        }


        /*
         * Confidence is expected as either:
         *
         * 0.0 - 1.0
         * OR
         * 0 - 100
         */

        const normalizedConfidence =
            confidence <= 1
                ? confidence * 100
                : confidence;


        /*
         * Combine confidence and severity.
         */

        return this.clamp(
            (
                normalizedConfidence * 0.55
            ) +
            (
                severityScore * 0.45
            )
        );
    },


    /* =====================================================
       TEMPERATURE RISK
    ===================================================== */

    calculateTemperatureRisk(
        temperature,
        crop = null
    ) {

        const temp = Number(temperature);

        if (!Number.isFinite(temp)) {
            return 0;
        }


        /*
         * Generic agricultural disease-risk ranges.

         * This is deliberately conservative.
         * Crop-specific ranges can be supplied later
         * through cropData.json.
         */

        const idealMin =
            Number(
                crop?.idealTemperatureMin ??
                20
            );

        const idealMax =
            Number(
                crop?.idealTemperatureMax ??
                30
            );


        if (
            temp >= idealMin &&
            temp <= idealMax
        ) {
            return 20;
        }


        const distance =
            temp < idealMin
                ? idealMin - temp
                : temp - idealMax;


        return this.clamp(
            20 + (distance * 8)
        );
    },


    /* =====================================================
       HUMIDITY RISK
    ===================================================== */

    calculateHumidityRisk(humidity) {

        const value =
            Number(humidity);

        if (!Number.isFinite(value)) {
            return 0;
        }


        if (value < 50) {
            return 15;
        }


        if (value < 65) {
            return 30;
        }


        if (value < 75) {
            return 50;
        }


        if (value < 85) {
            return 75;
        }


        return 95;
    },


    /* =====================================================
       RAINFALL RISK
    ===================================================== */

    calculateRainfallRisk(
        rainfall = 0,
        rainProbability = 0
    ) {

        const rain =
            Number(rainfall) || 0;

        const probability =
            Number(rainProbability) || 0;


        const rainfallScore =
            this.clamp(
                rain * 4
            );


        const probabilityScore =
            this.clamp(
                probability
            );


        return this.clamp(
            (
                rainfallScore * 0.45
            ) +
            (
                probabilityScore * 0.55
            )
        );
    },


    /* =====================================================
       WEATHER RISK
    ===================================================== */

    calculateWeatherRisk(
        weather = {},
        crop = null
    ) {

        const temperature =
            this.calculateTemperatureRisk(
                weather.temperature,
                crop
            );


        const humidity =
            this.calculateHumidityRisk(
                weather.humidity
            );


        const rainfall =
            this.calculateRainfallRisk(
                weather.rainfall ??
                weather.rain ??
                0,

                weather.rainProbability ??
                weather.precipitationProbability ??
                0
            );


        /*
         * Weather combination.
         */

        const score =
            (
                temperature * 0.25
            ) +
            (
                humidity * 0.40
            ) +
            (
                rainfall * 0.35
            );


        return {
            score: this.clamp(score),

            temperatureRisk:
                temperature,

            humidityRisk:
                humidity,

            rainfallRisk:
                rainfall
        };
    },


    /* =====================================================
       SOIL RISK
    ===================================================== */

    calculateSoilRisk(soil = {}) {

        const moisture =
            Number(
                soil.moisture ??
                soil.soilMoisture ??
                0
            );


        const drainage =
            String(
                soil.drainage ??
                soil.condition ??
                ""
            ).toLowerCase();


        let moistureRisk = 0;


        if (moisture >= 85) {

            moistureRisk = 90;

        } else if (moisture >= 75) {

            moistureRisk = 70;

        } else if (moisture >= 60) {

            moistureRisk = 40;

        } else if (moisture >= 40) {

            moistureRisk = 20;

        } else {

            moistureRisk = 35;
        }


        let drainageRisk = 0;


        if (
            drainage.includes("poor") ||
            drainage.includes("waterlogged")
        ) {
            drainageRisk = 85;

        } else if (
            drainage.includes("moderate")
        ) {
            drainageRisk = 45;

        } else {
            drainageRisk = 20;
        }


        return this.clamp(
            (
                moistureRisk * 0.65
            ) +
            (
                drainageRisk * 0.35
            )
        );
    },


    /* =====================================================
       CROP STAGE RISK
    ===================================================== */

    calculateCropStageRisk(stage) {

        const value =
            String(stage ?? "")
                .toLowerCase()
                .trim();


        switch (value) {

            case "seedling":
                return 55;

            case "vegetative":
                return 40;

            case "flowering":
                return 75;

            case "fruiting":
                return 70;

            case "maturity":
                return 50;

            default:
                return 40;
        }
    },


    /* =====================================================
       CROP SUSCEPTIBILITY
    ===================================================== */

    calculateCropSusceptibility(
        crop,
        diseaseResult = null
    ) {

        /*
         * If disease engine supplies a susceptibility
         * value, use it.
         */

        if (
            diseaseResult &&
            diseaseResult.susceptibility !== undefined
        ) {

            return this.clamp(
                diseaseResult.susceptibility
            );
        }


        /*
         * If crop data contains susceptibility.
         */

        if (
            crop &&
            crop.susceptibility !== undefined
        ) {

            return this.clamp(
                crop.susceptibility
            );
        }


        /*
         * Default neutral susceptibility.
         */

        return 50;
    },


    /* =====================================================
       FIELD CONDITION RISK
    ===================================================== */

    calculateFieldConditionRisk(
        field = {}
    ) {

        let score = 25;


        const condition =
            String(
                field.condition ??
                field.status ??
                ""
            ).toLowerCase();


        if (
            condition.includes("poor") ||
            condition.includes("critical")
        ) {

            score += 45;

        } else if (
            condition.includes("warning") ||
            condition.includes("stressed")
        ) {

            score += 30;

        } else if (
            condition.includes("good") ||
            condition.includes("healthy")
        ) {

            score -= 10;
        }


        /*
         * Previous disease history can increase risk.
         */

        if (
            field.previousDisease === true ||
            field.diseaseHistory === true
        ) {

            score += 20;
        }


        /*
         * Poor ventilation increases fungal risk.
         */

        if (
            field.ventilation === "poor"
        ) {

            score += 20;
        }


        return this.clamp(score);
    },


    /* =====================================================
       RISK FACTORS
    ===================================================== */

    generateRiskFactors(context) {

        const factors = [];


        const weather =
            context.weatherRisk || {};


        if (
            weather.humidityRisk >= 75
        ) {

            factors.push({
                type: "humidity",
                severity: "high",
                label: "High humidity",
                value:
                    context.weather?.humidity ?? null,
                message:
                    "High humidity can increase conditions favorable to several crop diseases."
            });

        } else if (
            weather.humidityRisk >= 50
        ) {

            factors.push({
                type: "humidity",
                severity: "moderate",
                label: "Moderate humidity",
                value:
                    context.weather?.humidity ?? null,
                message:
                    "Humidity is contributing moderately to disease risk."
            });
        }


        if (
            weather.rainfallRisk >= 70
        ) {

            factors.push({
                type: "rainfall",
                severity: "high",
                label: "High rainfall risk",
                value:
                    context.weather?.rainProbability ?? null,
                message:
                    "Wet conditions may increase disease-favorable conditions."
            });

        } else if (
            weather.rainfallRisk >= 45
        ) {

            factors.push({
                type: "rainfall",
                severity: "moderate",
                label: "Rainfall contribution",
                value:
                    context.weather?.rainProbability ?? null,
                message:
                    "Expected rainfall is contributing to the current risk."
            });
        }


        if (
            context.soilRisk >= 70
        ) {

            factors.push({
                type: "soil",
                severity: "high",
                label: "Unfavorable soil moisture",
                value:
                    context.soil?.moisture ?? null,
                message:
                    "Excess moisture or poor drainage may increase disease risk."
            });
        }


        if (
            context.cropStageRisk >= 70
        ) {

            factors.push({
                type: "crop-stage",
                severity: "moderate",
                label:
                    `Sensitive crop stage: ${
                        context.cropStage || "Current stage"
                    }`,
                value:
                    context.cropStage ?? null,
                message:
                    "The current crop stage may increase susceptibility to disease."
            });
        }


        if (
            context.diseaseRisk >= 70
        ) {

            factors.push({
                type: "disease",
                severity: "high",
                label: "Disease indicators detected",
                value:
                    context.diseaseRisk,
                message:
                    "The AI diagnosis indicates meaningful disease-related evidence."
            });
        }


        if (
            context.fieldRisk >= 65
        ) {

            factors.push({
                type: "field",
                severity: "moderate",
                label: "Field conditions increase risk",
                value:
                    context.fieldRisk,
                message:
                    "Current field conditions are contributing to disease risk."
            });
        }


        return factors;
    },


    /* =====================================================
       MAIN RISK CALCULATION
    ===================================================== */

    calculateRisk(input = {}) {

        const diseaseResult =
            input.diseaseResult ??
            input.disease ??
            null;


        const weather =
            input.weather ??
            {};


        const soil =
            input.soil ??
            {};


        const crop =
            input.crop ??
            {};


        const field =
            input.field ??
            {};


        const cropStage =
            input.cropStage ??
            input.growthStage ??
            field.cropStage ??
            "";


        /* -------------------------------------------------
           Individual components
        ------------------------------------------------- */

        const diseaseRisk =
            this.calculateDiseaseRisk(
                diseaseResult
            );


        const weatherRisk =
            this.calculateWeatherRisk(
                weather,
                crop
            );


        const soilRisk =
            this.calculateSoilRisk(
                soil
            );


        const cropStageRisk =
            this.calculateCropStageRisk(
                cropStage
            );


        const cropSusceptibility =
            this.calculateCropSusceptibility(
                crop,
                diseaseResult
            );


        const fieldRisk =
            this.calculateFieldConditionRisk(
                field
            );


        /* -------------------------------------------------
           Weighted score
        ------------------------------------------------- */

        const weightedScore =

            (
                diseaseRisk *
                this.weights.disease /
                100
            )

            +

            (
                weatherRisk.score *
                this.weights.weather /
                100
            )

            +

            (
                weatherRisk.humidityRisk *
                this.weights.humidity /
                100
            )

            +

            (
                soilRisk *
                this.weights.soil /
                100
            )

            +

            (
                cropStageRisk *
                this.weights.cropStage /
                100
            )

            +

            (
                cropSusceptibility *
                this.weights.cropSusceptibility /
                100
            )

            +

            (
                fieldRisk *
                this.weights.fieldCondition /
                100
            );


        const riskScore =
            Math.round(
                this.clamp(weightedScore)
            );


        const riskLevel =
            this.getRiskLevel(
                riskScore
            );


        const riskStatus =
            this.getRiskStatus(
                riskScore
            );


        const context = {

            diseaseRisk,

            weatherRisk,

            soilRisk,

            cropStageRisk,

            cropSusceptibility,

            fieldRisk,

            weather,

            soil,

            crop,

            field,

            cropStage
        };


        const factors =
            this.generateRiskFactors(
                context
            );


        return {

            riskScore,

            score: riskScore,

            risk: riskScore,

            riskLevel,

            level: riskLevel,

            status: riskStatus,

            factors,

            components: {

                disease:
                    Math.round(
                        diseaseRisk
                    ),

                weather:
                    Math.round(
                        weatherRisk.score
                    ),

                humidity:
                    Math.round(
                        weatherRisk.humidityRisk
                    ),

                rainfall:
                    Math.round(
                        weatherRisk.rainfallRisk
                    ),

                soil:
                    Math.round(
                        soilRisk
                    ),

                cropStage:
                    Math.round(
                        cropStageRisk
                    ),

                cropSusceptibility:
                    Math.round(
                        cropSusceptibility
                    ),

                field:
                    Math.round(
                        fieldRisk
                    )
            },

            timestamp:
                new Date().toISOString()
        };
    },


    /* =====================================================
       SIMPLE API
    ===================================================== */

    getScore(input = {}) {

        return this.calculateRisk(
            input
        ).riskScore;
    },


    getLevel(input = {}) {

        return this.calculateRisk(
            input
        ).riskLevel;
    },


    /* =====================================================
       QUICK WEATHER-ONLY RISK
    ===================================================== */

    calculateWeatherOnlyRisk(weather = {}) {

        const result =
            this.calculateWeatherRisk(
                weather
            );


        return {

            riskScore:
                Math.round(
                    result.score
                ),

            riskLevel:
                this.getRiskLevel(
                    result.score
                ),

            components: result
        };
    },


    /* =====================================================
       RISK TREND HELPER
    ===================================================== */

    calculateTrend(
        previousScore,
        currentScore
    ) {

        const previous =
            Number(previousScore) || 0;

        const current =
            Number(currentScore) || 0;


        const difference =
            current - previous;


        let direction =
            "stable";


        if (difference > 2) {
            direction = "increasing";
        } else if (difference < -2) {
            direction = "decreasing";
        }


        return {

            direction,

            difference:
                Math.round(
                    difference * 10
                ) / 10,

            percentage:
                previous > 0
                    ? Math.round(
                        (
                            difference /
                            previous
                        ) * 100
                    )
                    : 0
        };
    }
};


/* =========================================================
   CONVENIENCE FUNCTION
========================================================= */

function calculateDiseaseRisk(input = {}) {

    return AgriGuardRiskEngine.calculateRisk(
        input
    );
}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.AgriGuardRiskEngine =
    AgriGuardRiskEngine;

window.calculateDiseaseRisk =
    calculateDiseaseRisk;


/* =========================================================
   OPTIONAL COMMON ALIASES

   These make integration easier if app.js or another
   module uses slightly different naming.
========================================================= */

window.calculateRisk =
    function(input = {}) {

        return AgriGuardRiskEngine.calculateRisk(
            input
        );
    };


window.getRiskLevel =
    function(score) {

        return AgriGuardRiskEngine.getRiskLevel(
            score
        );
    };


window.getRiskStatus =
    function(score) {

        return AgriGuardRiskEngine.getRiskStatus(
            score
        );
    };
```
