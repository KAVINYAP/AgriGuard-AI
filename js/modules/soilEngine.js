```javascript
/* =========================================================
   AgriGuard AI - Soil Engine
   File: js/modules/soilEngine.js

   Purpose:
   - Soil condition analysis
   - Soil health scoring
   - Moisture assessment
   - Nutrient assessment
   - Soil-related disease-risk factors
   - Safe integration with data.js, riskEngine.js
     and recommendationEngine.js

   Expected global dependencies:
   - AgriGuardData (optional)
   - No external libraries required
   ========================================================= */

"use strict";


/* =========================================================
   SOIL ENGINE
   ========================================================= */

const AgriGuardSoilEngine = {

    /* -----------------------------------------------------
       Recommended ranges
    ----------------------------------------------------- */

    ranges: {

        nitrogen: {
            min: 40,
            max: 80
        },

        phosphorus: {
            min: 40,
            max: 80
        },

        potassium: {
            min: 40,
            max: 80
        },

        moisture: {
            min: 35,
            max: 75
        },

        organicMatter: {
            min: 40,
            max: 80
        }
    },


    /* -----------------------------------------------------
       Clamp value between 0 and 100
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       Convert different soil input formats to number
    ----------------------------------------------------- */

    normalizeValue(value, fallback = 50) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return fallback;
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return this.clamp(number);
    },


    /* =====================================================
       1. NORMALIZE SOIL DATA
       ===================================================== */

    normalizeSoilData(soil = {}) {

        return {

            nitrogen: this.normalizeValue(
                soil.nitrogen ??
                soil.N ??
                soil.n,
                70
            ),

            phosphorus: this.normalizeValue(
                soil.phosphorus ??
                soil.P ??
                soil.p,
                70
            ),

            potassium: this.normalizeValue(
                soil.potassium ??
                soil.K ??
                soil.k,
                70
            ),

            moisture: this.normalizeValue(
                soil.moisture ??
                soil.soilMoisture ??
                soil.waterContent,
                60
            ),

            organicMatter: this.normalizeValue(
                soil.organicMatter ??
                soil.organic ??
                soil.om,
                65
            ),

            pH: this.normalizePH(
                soil.pH ??
                soil.ph ??
                soil.soilPH
            ),

            drainage:
                soil.drainage ||
                soil.drainageCondition ||
                "normal",

            texture:
                soil.texture ||
                soil.soilTexture ||
                "loam",

            salinity:
                this.normalizeValue(
                    soil.salinity,
                    20
                )
        };
    },


    /* =====================================================
       2. SOIL pH
       ===================================================== */

    normalizePH(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return 6.5;
        }

        return Math.max(
            3,
            Math.min(10, number)
        );
    },


    getPHStatus(pH) {

        const value = this.normalizePH(pH);

        if (value < 5.5) {
            return {
                status: "Acidic",
                level: "warning",
                score: 55
            };
        }

        if (value > 8.0) {
            return {
                status: "Alkaline",
                level: "warning",
                score: 55
            };
        }

        if (value >= 6.0 && value <= 7.5) {
            return {
                status: "Optimal",
                level: "good",
                score: 100
            };
        }

        return {
            status: "Acceptable",
            level: "normal",
            score: 80
        };
    },


    /* =====================================================
       3. MOISTURE STATUS
       ===================================================== */

    getMoistureStatus(moisture) {

        const value = this.clamp(
            this.normalizeValue(moisture, 60)
        );

        if (value < 25) {

            return {
                value,
                status: "Very Dry",
                level: "danger",
                score: 25,
                irrigationNeeded: true
            };
        }

        if (value < 35) {

            return {
                value,
                status: "Dry",
                level: "warning",
                score: 55,
                irrigationNeeded: true
            };
        }

        if (value <= 75) {

            return {
                value,
                status: "Optimal",
                level: "good",
                score: 100,
                irrigationNeeded: false
            };
        }

        if (value <= 85) {

            return {
                value,
                status: "Wet",
                level: "warning",
                score: 65,
                irrigationNeeded: false
            };
        }

        return {
            value,
            status: "Waterlogged",
            level: "danger",
            score: 30,
            irrigationNeeded: false
        };
    },


    /* =====================================================
       4. NUTRIENT STATUS
       ===================================================== */

    getNutrientStatus(name, value) {

        const normalized = this.normalizeValue(
            value,
            50
        );

        const range =
            this.ranges[name] || {
                min: 40,
                max: 80
            };

        if (normalized < 25) {

            return {
                nutrient: name,
                value: normalized,
                status: "Very Low",
                level: "danger",
                score: 25
            };
        }

        if (normalized < range.min) {

            return {
                nutrient: name,
                value: normalized,
                status: "Low",
                level: "warning",
                score: 55
            };
        }

        if (normalized <= range.max) {

            return {
                nutrient: name,
                value: normalized,
                status: "Optimal",
                level: "good",
                score: 100
            };
        }

        if (normalized <= 90) {

            return {
                nutrient: name,
                value: normalized,
                status: "High",
                level: "warning",
                score: 70
            };
        }

        return {
            nutrient: name,
            value: normalized,
            status: "Very High",
            level: "danger",
            score: 45
        };
    },


    /* =====================================================
       5. ORGANIC MATTER
       ===================================================== */

    getOrganicMatterStatus(value) {

        const normalized =
            this.normalizeValue(value, 65);

        if (normalized < 30) {

            return {
                value: normalized,
                status: "Very Low",
                level: "danger",
                score: 30
            };
        }

        if (normalized < 40) {

            return {
                value: normalized,
                status: "Low",
                level: "warning",
                score: 55
            };
        }

        if (normalized <= 80) {

            return {
                value: normalized,
                status: "Healthy",
                level: "good",
                score: 100
            };
        }

        return {
            value: normalized,
            status: "High",
            level: "normal",
            score: 85
        };
    },


    /* =====================================================
       6. DRAINAGE STATUS
       ===================================================== */

    getDrainageStatus(drainage) {

        const value =
            String(
                drainage || "normal"
            ).toLowerCase().trim();

        if (
            value.includes("poor") ||
            value.includes("bad") ||
            value.includes("waterlog")
        ) {

            return {
                status: "Poor",
                level: "danger",
                score: 35,
                diseaseRiskModifier: 15
            };
        }

        if (
            value.includes("excess") ||
            value.includes("wet")
        ) {

            return {
                status: "Excess Moisture",
                level: "warning",
                score: 60,
                diseaseRiskModifier: 8
            };
        }

        if (
            value.includes("good") ||
            value.includes("well")
        ) {

            return {
                status: "Good",
                level: "good",
                score: 100,
                diseaseRiskModifier: 0
            };
        }

        return {
            status: "Normal",
            level: "normal",
            score: 85,
            diseaseRiskModifier: 2
        };
    },


    /* =====================================================
       7. SALINITY STATUS
       ===================================================== */

    getSalinityStatus(value) {

        const normalized =
            this.normalizeValue(value, 20);

        if (normalized < 30) {

            return {
                value: normalized,
                status: "Low",
                level: "good",
                score: 100
            };
        }

        if (normalized < 60) {

            return {
                value: normalized,
                status: "Moderate",
                level: "warning",
                score: 70
            };
        }

        if (normalized < 80) {

            return {
                value: normalized,
                status: "High",
                level: "danger",
                score: 45
            };
        }

        return {
            value: normalized,
            status: "Very High",
            level: "danger",
            score: 25
        };
    },


    /* =====================================================
       8. CALCULATE OVERALL SOIL HEALTH
       ===================================================== */

    calculateHealth(soil = {}) {

        const normalized =
            this.normalizeSoilData(soil);

        const nitrogen =
            this.getNutrientStatus(
                "nitrogen",
                normalized.nitrogen
            );

        const phosphorus =
            this.getNutrientStatus(
                "phosphorus",
                normalized.phosphorus
            );

        const potassium =
            this.getNutrientStatus(
                "potassium",
                normalized.potassium
            );

        const moisture =
            this.getMoistureStatus(
                normalized.moisture
            );

        const organicMatter =
            this.getOrganicMatterStatus(
                normalized.organicMatter
            );

        const ph =
            this.getPHStatus(
                normalized.pH
            );

        const drainage =
            this.getDrainageStatus(
                normalized.drainage
            );

        const salinity =
            this.getSalinityStatus(
                normalized.salinity
            );


        /*
         * Weighted soil-health score.
         *
         * Nutrients:
         * 40%
         *
         * Moisture:
         * 15%
         *
         * Organic matter:
         * 15%
         *
         * pH:
         * 10%
         *
         * Drainage:
         * 10%
         *
         * Salinity:
         * 10%
         */

        const score =
            (
                nitrogen.score * 0.15 +
                phosphorus.score * 0.125 +
                potassium.score * 0.125 +
                moisture.score * 0.15 +
                organicMatter.score * 0.15 +
                ph.score * 0.10 +
                drainage.score * 0.10 +
                salinity.score * 0.10
            );


        const finalScore =
            Math.round(
                this.clamp(score)
            );


        let status = "Healthy";
        let level = "good";

        if (finalScore < 40) {

            status = "Poor";
            level = "danger";

        } else if (finalScore < 60) {

            status = "Needs Attention";
            level = "warning";

        } else if (finalScore < 80) {

            status = "Fair";
            level = "normal";
        }


        return {

            score: finalScore,

            status,

            level,

            values: {
                nitrogen: normalized.nitrogen,
                phosphorus: normalized.phosphorus,
                potassium: normalized.potassium,
                moisture: normalized.moisture,
                organicMatter: normalized.organicMatter,
                pH: normalized.pH,
                salinity: normalized.salinity
            },

            nutrientStatus: {
                nitrogen,
                phosphorus,
                potassium
            },

            moistureStatus: moisture,

            organicMatterStatus: organicMatter,

            phStatus: ph,

            drainageStatus: drainage,

            salinityStatus: salinity
        };
    },


    /* =====================================================
       9. DISEASE-RISK CONTRIBUTION
       ===================================================== */

    calculateDiseaseRiskFactor(soil = {}) {

        const normalized =
            this.normalizeSoilData(soil);

        let risk = 0;

        const moisture =
            this.getMoistureStatus(
                normalized.moisture
            );

        const drainage =
            this.getDrainageStatus(
                normalized.drainage
            );


        /*
         * Excess moisture can increase conditions
         * favorable to several disease types.
         */

        if (moisture.status === "Wet") {
            risk += 8;
        }

        if (moisture.status === "Waterlogged") {
            risk += 15;
        }

        if (drainage.status === "Poor") {
            risk += 15;
        }

        if (
            drainage.status ===
            "Excess Moisture"
        ) {
            risk += 8;
        }


        /*
         * Severe nutrient imbalance can reduce
         * crop vigor and resilience.
         */

        const nutrients = [
            this.getNutrientStatus(
                "nitrogen",
                normalized.nitrogen
            ),

            this.getNutrientStatus(
                "phosphorus",
                normalized.phosphorus
            ),

            this.getNutrientStatus(
                "potassium",
                normalized.potassium
            )
        ];


        nutrients.forEach(nutrient => {

            if (nutrient.level === "danger") {
                risk += 5;
            } else if (
                nutrient.level === "warning"
            ) {
                risk += 2;
            }

        });


        /*
         * Avoid allowing this module to
         * produce an impossible percentage.
         */

        risk =
            Math.round(
                this.clamp(risk, 0, 40)
            );


        let level = "Low";

        if (risk >= 25) {
            level = "High";
        } else if (risk >= 12) {
            level = "Moderate";
        }


        return {
            score: risk,
            level,
            moisture: moisture,
            drainage: drainage
        };
    },


    /* =====================================================
       10. RECOMMENDATIONS
       ===================================================== */

    getRecommendations(soil = {}) {

        const normalized =
            this.normalizeSoilData(soil);

        const recommendations = [];


        const moisture =
            this.getMoistureStatus(
                normalized.moisture
            );

        if (moisture.status === "Very Dry") {

            recommendations.push(
                "Irrigate according to crop water requirements and local field conditions."
            );

        } else if (moisture.status === "Dry") {

            recommendations.push(
                "Monitor soil moisture closely and provide irrigation when appropriate."
            );

        } else if (
            moisture.status === "Wet" ||
            moisture.status === "Waterlogged"
        ) {

            recommendations.push(
                "Avoid unnecessary irrigation and improve drainage where required."
            );
        }


        const nutrients = [
            [
                "Nitrogen",
                normalized.nitrogen
            ],
            [
                "Phosphorus",
                normalized.phosphorus
            ],
            [
                "Potassium",
                normalized.potassium
            ]
        ];


        nutrients.forEach(
            ([name, value]) => {

                const status =
                    this.getNutrientStatus(
                        name.toLowerCase(),
                        value
                    );

                if (
                    status.status === "Very Low" ||
                    status.status === "Low"
                ) {

                    recommendations.push(
                        `${name} appears low; confirm with soil testing before applying fertilizer.`
                    );
                }

                if (
                    status.status === "High" ||
                    status.status === "Very High"
                ) {

                    recommendations.push(
                        `${name} appears elevated; avoid unnecessary additional application.`
                    );
                }
            }
        );


        const organic =
            this.getOrganicMatterStatus(
                normalized.organicMatter
            );

        if (
            organic.status === "Low" ||
            organic.status === "Very Low"
        ) {

            recommendations.push(
                "Consider locally appropriate practices that improve soil organic matter."
            );
        }


        const ph =
            this.getPHStatus(
                normalized.pH
            );

        if (ph.status === "Acidic") {

            recommendations.push(
                "Soil pH is acidic; confirm with a soil test and follow locally recommended correction practices."
            );

        } else if (ph.status === "Alkaline") {

            recommendations.push(
                "Soil pH is alkaline; confirm with a soil test and follow locally recommended correction practices."
            );
        }


        const drainage =
            this.getDrainageStatus(
                normalized.drainage
            );

        if (drainage.status === "Poor") {

            recommendations.push(
                "Improve drainage where feasible to reduce prolonged soil wetness."
            );
        }


        if (recommendations.length === 0) {

            recommendations.push(
                "Soil conditions are currently within the monitored target ranges. Continue regular monitoring."
            );
        }


        return recommendations;
    },


    /* =====================================================
       11. COMPLETE SOIL ANALYSIS
       ===================================================== */

    analyze(soil = {}) {

        const normalized =
            this.normalizeSoilData(soil);

        const health =
            this.calculateHealth(
                normalized
            );

        const diseaseRisk =
            this.calculateDiseaseRiskFactor(
                normalized
            );

        const recommendations =
            this.getRecommendations(
                normalized
            );


        return {

            timestamp:
                new Date().toISOString(),

            soil: normalized,

            health,

            diseaseRisk,

            recommendations
        };
    },


    /* =====================================================
       12. GET CHART VALUES
       ===================================================== */

    getChartData(soil = {}) {

        const normalized =
            this.normalizeSoilData(soil);

        return {

            labels: [
                "Nitrogen",
                "Phosphorus",
                "Potassium",
                "Moisture",
                "Organic Matter"
            ],

            values: [
                normalized.nitrogen,
                normalized.phosphorus,
                normalized.potassium,
                normalized.moisture,
                normalized.organicMatter
            ]
        };
    },


    /* =====================================================
       13. ENGINE RESULT FOR OTHER MODULES
       ===================================================== */

    getEngineResult(soil = {}) {

        const analysis =
            this.analyze(soil);

        return {

            soilHealth:
                analysis.health.score,

            soilStatus:
                analysis.health.status,

            moisture:
                analysis.soil.moisture,

            moistureStatus:
                analysis.health.moistureStatus.status,

            diseaseRiskContribution:
                analysis.diseaseRisk.score,

            diseaseRiskLevel:
                analysis.diseaseRisk.level,

            recommendations:
                analysis.recommendations
        };
    }
};


/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.AgriGuardSoilEngine =
    AgriGuardSoilEngine;


/* =========================================================
   BACKWARD-COMPATIBLE HELPER FUNCTIONS
   ========================================================= */

window.analyzeSoil =
    function (soil) {
        return AgriGuardSoilEngine.analyze(soil);
    };


window.calculateSoilHealth =
    function (soil) {
        return AgriGuardSoilEngine.calculateHealth(soil);
    };


window.getSoilRecommendations =
    function (soil) {
        return AgriGuardSoilEngine.getRecommendations(soil);
    };


window.getSoilDiseaseRisk =
    function (soil) {
        return AgriGuardSoilEngine.calculateDiseaseRiskFactor(soil);
    };
```
