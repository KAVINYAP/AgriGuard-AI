```javascript
/* =========================================================
   AgriGuard AI - Recommendation Engine
   File: js/modules/recommendationEngine.js

   Purpose:
   - Generate integrated crop-management recommendations
   - Combine disease diagnosis, risk, weather and soil data
   - Prioritize immediate actions
   - Generate preventive measures
   - Generate treatment guidance
   - Generate monitoring recommendations
   - Provide recommendations suitable for app.js UI

   Dependencies:
   - AgriGuardDiseaseDetection
   - AgriGuardRiskEngine
   - AgriGuardWeatherEngine
   - AgriGuardSoilEngine

   No external libraries required.
   ========================================================= */

"use strict";


/* =========================================================
   RECOMMENDATION ENGINE
   ========================================================= */

const AgriGuardRecommendationEngine = {


    /* =====================================================
       PRIORITY LEVELS
       ===================================================== */

    priorities: {
        critical: 4,
        high: 3,
        moderate: 2,
        low: 1,
        normal: 0
    },


    /* =====================================================
       UTILITY FUNCTIONS
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


    safeNumber(value, fallback = 0) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    },


    normalizeText(value, fallback = "") {

        if (
            value === null ||
            value === undefined
        ) {
            return fallback;
        }

        return String(value)
            .trim()
            .toLowerCase();
    },


    unique(items = []) {

        return [
            ...new Set(
                items.filter(
                    item =>
                        typeof item === "string" &&
                        item.trim().length > 0
                )
            )
        ];
    },


    /* =====================================================
       1. DETERMINE OVERALL PRIORITY
       ===================================================== */

    determinePriority(context = {}) {

        const diseaseRisk =
            this.safeNumber(
                context.diseaseRisk ??
                context.riskScore ??
                context.risk,
                0
            );

        const severity =
            this.normalizeText(
                context.severity
            );

        const riskLevel =
            this.normalizeText(
                context.riskLevel
            );


        if (
            diseaseRisk >= 80 ||
            severity === "critical" ||
            riskLevel === "critical"
        ) {
            return "Critical";
        }


        if (
            diseaseRisk >= 60 ||
            severity === "severe" ||
            severity === "high" ||
            riskLevel === "high"
        ) {
            return "High";
        }


        if (
            diseaseRisk >= 35 ||
            severity === "moderate" ||
            riskLevel === "moderate"
        ) {
            return "Moderate";
        }


        if (diseaseRisk >= 15) {
            return "Low";
        }


        return "Routine";
    },


    /* =====================================================
       2. DISEASE-SPECIFIC KNOWLEDGE
       ===================================================== */

    diseaseProfiles: {

        "rice blast": {

            category: "fungal",

            immediate: [
                "Inspect affected plants and nearby plants for additional lesions.",
                "Separate or clearly identify affected areas for closer monitoring.",
                "Avoid practices that unnecessarily prolong leaf wetness."
            ],

            preventive: [
                "Maintain appropriate crop spacing and field ventilation.",
                "Avoid excessive nitrogen application.",
                "Monitor humidity, rainfall and leaf-wetness conditions closely."
            ],

            treatment: [
                "Follow locally approved rice-blast management recommendations.",
                "Use only products registered and recommended for the crop and disease in your area.",
                "Follow the product label for dose, timing, safety and pre-harvest requirements."
            ],

            monitoring: [
                "Reinspect affected areas regularly for expansion of lesions.",
                "Monitor nearby plants because disease can spread through the field."
            ]
        },


        "leaf blast": {

            category: "fungal",

            immediate: [
                "Inspect affected leaves and surrounding plants.",
                "Reduce conditions that keep foliage wet for prolonged periods.",
                "Mark affected field areas for continued monitoring."
            ],

            preventive: [
                "Maintain adequate plant spacing and airflow.",
                "Avoid excessive nitrogen application.",
                "Monitor humid and rainy periods carefully."
            ],

            treatment: [
                "Follow locally approved disease-management recommendations.",
                "Use only crop-approved products according to the product label."
            ],

            monitoring: [
                "Monitor newly emerging leaves for additional symptoms."
            ]
        },


        "bacterial leaf blight": {

            category: "bacterial",

            immediate: [
                "Inspect the field for additional symptomatic plants.",
                "Avoid unnecessary movement through visibly affected areas when conditions favor spread.",
                "Manage irrigation and drainage appropriately."
            ],

            preventive: [
                "Maintain good field sanitation.",
                "Avoid excessive nitrogen fertilization.",
                "Use clean planting material and appropriate crop-management practices."
            ],

            treatment: [
                "Follow locally approved bacterial-disease management guidance.",
                "Do not apply unapproved antibiotics or crop-protection products."
            ],

            monitoring: [
                "Track whether symptoms are appearing on new leaves or spreading to nearby plants."
            ]
        },


        "bacterial spot": {

            category: "bacterial",

            immediate: [
                "Inspect affected plants and neighboring plants.",
                "Avoid unnecessary handling of wet foliage.",
                "Remove severely affected plant material where locally appropriate."
            ],

            preventive: [
                "Improve airflow around plants.",
                "Avoid unnecessary overhead irrigation.",
                "Use clean planting material and maintain field sanitation."
            ],

            treatment: [
                "Follow locally approved bacterial-spot management recommendations.",
                "Use only products registered for the crop and disease in your location."
            ],

            monitoring: [
                "Monitor new growth for expanding spots."
            ]
        },


        "early blight": {

            category: "fungal",

            immediate: [
                "Inspect lower and older leaves for additional symptoms.",
                "Remove severely affected plant material where appropriate.",
                "Avoid prolonged leaf wetness."
            ],

            preventive: [
                "Improve airflow through appropriate plant spacing.",
                "Avoid unnecessary overhead irrigation.",
                "Maintain field sanitation and remove infected debris where appropriate."
            ],

            treatment: [
                "Follow locally approved early-blight management recommendations.",
                "Follow product-label instructions if a registered treatment is used."
            ],

            monitoring: [
                "Monitor lower leaves and new growth for progression."
            ]
        },


        "late blight": {

            category: "fungal",

            immediate: [
                "Inspect the entire field for rapidly developing symptoms.",
                "Separate affected areas for close monitoring.",
                "Avoid prolonged leaf wetness where possible."
            ],

            preventive: [
                "Monitor cool, humid and rainy conditions closely.",
                "Improve airflow through appropriate crop management.",
                "Remove severely affected material where locally appropriate."
            ],

            treatment: [
                "Seek prompt local agricultural guidance when late blight is suspected.",
                "Use only locally approved crop-protection products according to their labels."
            ],

            monitoring: [
                "Monitor the field frequently because disease can progress rapidly under favorable conditions."
            ]
        },


        "powdery mildew": {

            category: "fungal",

            immediate: [
                "Inspect both sides of leaves and nearby plants.",
                "Remove severely affected material where appropriate.",
                "Improve airflow around the crop."
            ],

            preventive: [
                "Avoid excessive plant density.",
                "Monitor susceptible growth during favorable weather.",
                "Maintain balanced crop nutrition."
            ],

            treatment: [
                "Follow locally approved powdery-mildew management recommendations.",
                "Use only registered products according to their labels."
            ],

            monitoring: [
                "Watch for expansion of powdery growth to new leaves."
            ]
        },


        "downy mildew": {

            category: "fungal-like",

            immediate: [
                "Inspect nearby plants for additional symptoms.",
                "Reduce prolonged leaf wetness where feasible.",
                "Improve airflow through appropriate crop management."
            ],

            preventive: [
                "Monitor humid and wet weather closely.",
                "Avoid unnecessary overhead irrigation.",
                "Maintain field sanitation."
            ],

            treatment: [
                "Follow locally approved downy-mildew management recommendations.",
                "Use only crop-approved products according to label directions."
            ],

            monitoring: [
                "Inspect new growth regularly during humid or rainy periods."
            ]
        },


        "rust": {

            category: "fungal",

            immediate: [
                "Inspect nearby plants for additional rust lesions or pustules.",
                "Identify and monitor affected areas.",
                "Avoid unnecessary prolonged leaf wetness."
            ],

            preventive: [
                "Maintain appropriate spacing and airflow.",
                "Monitor humid conditions.",
                "Maintain balanced crop nutrition."
            ],

            treatment: [
                "Follow locally approved rust-management recommendations.",
                "Use only registered treatments according to product labels."
            ],

            monitoring: [
                "Monitor new leaves and surrounding plants for additional symptoms."
            ]
        },


        "anthracnose": {

            category: "fungal",

            immediate: [
                "Inspect affected plants and surrounding crop areas.",
                "Remove severely infected plant material where locally appropriate.",
                "Avoid unnecessary handling of wet plants."
            ],

            preventive: [
                "Improve field sanitation.",
                "Improve airflow and reduce prolonged leaf wetness.",
                "Use healthy planting material."
            ],

            treatment: [
                "Follow locally approved anthracnose-management recommendations.",
                "Follow product-label instructions for any approved treatment."
            ],

            monitoring: [
                "Monitor fruit, stems and leaves for expanding lesions."
            ]
        },


        "healthy": {

            category: "none",

            immediate: [
                "No immediate disease-control action is indicated from the current assessment."
            ],

            preventive: [
                "Continue regular crop inspection.",
                "Maintain balanced nutrition and appropriate irrigation.",
                "Continue monitoring weather and soil conditions."
            ],

            treatment: [
                "No disease treatment is recommended solely from a healthy assessment."
            ],

            monitoring: [
                "Continue routine field monitoring and reassess if symptoms appear."
            ]
        }
    },


    /* =====================================================
       3. GET DISEASE PROFILE
       ===================================================== */

    getDiseaseProfile(disease) {

        const normalized =
            this.normalizeText(disease);

        if (
            this.diseaseProfiles[normalized]
        ) {
            return this.diseaseProfiles[
                normalized
            ];
        }


        /*
         * Partial disease matching.
         */

        const matchingKey =
            Object.keys(
                this.diseaseProfiles
            ).find(key =>
                normalized.includes(key) ||
                key.includes(normalized)
            );


        if (matchingKey) {
            return this.diseaseProfiles[
                matchingKey
            ];
        }


        /*
         * Generic fallback.
         */

        return {

            category: "unknown",

            immediate: [
                "Inspect the affected crop and nearby plants carefully."
            ],

            preventive: [
                "Maintain good field sanitation.",
                "Monitor weather, soil and crop conditions regularly."
            ],

            treatment: [
                "Confirm the diagnosis before applying a disease-specific treatment.",
                "Follow locally approved agricultural recommendations and product-label instructions."
            ],

            monitoring: [
                "Reassess the crop after additional observation or diagnosis."
            ]
        };
    },


    /* =====================================================
       4. WEATHER-BASED RECOMMENDATIONS
       ===================================================== */

    getWeatherRecommendations(weather = {}) {

        const recommendations = [];

        const humidity =
            this.safeNumber(
                weather.humidity,
                0
            );

        const rainfall =
            this.safeNumber(
                weather.rainfall ??
                weather.rainfallAmount ??
                weather.rain,
                0
            );

        const rainProbability =
            this.safeNumber(
                weather.rainProbability ??
                weather.rainProbabilityPercent ??
                weather.precipitationProbability,
                0
            );

        const temperature =
            this.safeNumber(
                weather.temperature ??
                weather.temp,
                0
            );

        const condition =
            this.normalizeText(
                weather.condition
            );


        if (humidity >= 85) {

            recommendations.push(
                "High humidity may favor disease development; increase field scouting frequency."
            );

        } else if (humidity >= 75) {

            recommendations.push(
                "Humidity is elevated; monitor crops closely for fungal or moisture-related symptoms."
            );
        }


        if (rainProbability >= 70) {

            recommendations.push(
                "High rainfall probability is expected; avoid unnecessary irrigation and prepare for disease-favorable wet conditions."
            );

        } else if (rainProbability >= 50) {

            recommendations.push(
                "Rain is possible; review irrigation plans and monitor field drainage."
            );
        }


        if (rainfall >= 20) {

            recommendations.push(
                "Recent rainfall is substantial; inspect fields for prolonged wetness and disease-favorable conditions."
            );
        }


        if (temperature >= 35) {

            recommendations.push(
                "High temperature may increase crop water stress; monitor soil moisture and crop condition."
            );

        } else if (
            temperature > 0 &&
            temperature <= 15
        ) {

            recommendations.push(
                "Cool conditions may affect crop growth; monitor crop response and local weather changes."
            );
        }


        if (
            condition.includes("storm") ||
            condition.includes("heavy rain")
        ) {

            recommendations.push(
                "Severe weather conditions are possible; inspect fields after the event for physical and moisture-related damage."
            );
        }


        return this.unique(
            recommendations
        );
    },


    /* =====================================================
       5. SOIL-BASED RECOMMENDATIONS
       ===================================================== */

    getSoilRecommendations(soil = {}) {

        const recommendations = [];


        /*
         * If the complete Soil Engine is available,
         * use its analysis.
         */

        if (
            window.AgriGuardSoilEngine &&
            typeof
            window.AgriGuardSoilEngine.analyze ===
            "function"
        ) {

            try {

                const analysis =
                    window.AgriGuardSoilEngine.analyze(
                        soil
                    );

                if (
                    Array.isArray(
                        analysis.recommendations
                    )
                ) {

                    recommendations.push(
                        ...analysis.recommendations
                    );
                }

                return this.unique(
                    recommendations
                );

            } catch (error) {

                console.warn(
                    "Soil engine recommendation lookup failed:",
                    error
                );
            }
        }


        /*
         * Fallback when Soil Engine is unavailable.
         */

        const moisture =
            this.safeNumber(
                soil.moisture ??
                soil.soilMoisture,
                60
            );


        if (moisture < 35) {

            recommendations.push(
                "Monitor soil moisture and irrigate according to crop requirements."
            );

        } else if (moisture > 80) {

            recommendations.push(
                "Avoid unnecessary irrigation and inspect drainage."
            );
        }


        const nitrogen =
            this.safeNumber(
                soil.nitrogen ??
                soil.N,
                70
            );

        const phosphorus =
            this.safeNumber(
                soil.phosphorus ??
                soil.P,
                70
            );

        const potassium =
            this.safeNumber(
                soil.potassium ??
                soil.K,
                70
            );


        if (nitrogen < 40) {

            recommendations.push(
                "Nitrogen appears low; confirm soil status before applying fertilizer."
            );
        }

        if (phosphorus < 40) {

            recommendations.push(
                "Phosphorus appears low; confirm soil status before applying fertilizer."
            );
        }

        if (potassium < 40) {

            recommendations.push(
                "Potassium appears low; confirm soil status before applying fertilizer."
            );
        }


        return this.unique(
            recommendations
        );
    },


    /* =====================================================
       6. GROWTH-STAGE RECOMMENDATIONS
       ===================================================== */

    getGrowthStageRecommendations(
        growthStage
    ) {

        const stage =
            this.normalizeText(
                growthStage
            );

        switch (stage) {

            case "seedling":

                return [
                    "Inspect young plants frequently for early symptoms and establishment problems.",
                    "Maintain appropriate moisture without prolonged waterlogging."
                ];


            case "vegetative":

                return [
                    "Monitor new leaves and actively growing tissue for disease symptoms.",
                    "Maintain balanced crop nutrition and appropriate irrigation."
                ];


            case "flowering":

                return [
                    "Increase monitoring during flowering because crop stress and disease can affect yield formation.",
                    "Avoid unnecessary moisture stress and prolonged leaf wetness."
                ];


            case "fruiting":

                return [
                    "Inspect leaves, stems and developing fruit regularly.",
                    "Follow crop-specific disease-management guidance to protect yield."
                ];


            case "maturity":

                return [
                    "Continue monitoring crop health through harvest.",
                    "Follow appropriate pre-harvest and harvest-interval requirements for any approved treatment."
                ];


            default:

                return [
                    "Continue regular crop monitoring according to the crop growth stage."
                ];
        }
    },


    /* =====================================================
       7. CROP-SPECIFIC RECOMMENDATIONS
       ===================================================== */

    getCropRecommendations(
        crop
    ) {

        const normalized =
            this.normalizeText(crop);

        switch (normalized) {

            case "rice":

                return [
                    "Monitor field moisture, drainage and humidity closely.",
                    "Inspect rice leaves regularly for blast and bacterial disease symptoms."
                ];


            case "cotton":

                return [
                    "Inspect leaves and developing structures regularly.",
                    "Monitor humidity, rainfall and field conditions for disease-favorable periods."
                ];


            case "chilli":

                return [
                    "Inspect leaves, stems and fruit for disease symptoms.",
                    "Avoid prolonged wetness and maintain appropriate field ventilation."
                ];


            case "tomato":

                return [
                    "Inspect lower leaves and developing fruit regularly.",
                    "Monitor humid and rainy periods closely for disease development."
                ];


            default:

                return [
                    "Continue crop-specific field scouting and follow local agronomic guidance."
                ];
        }
    },


    /* =====================================================
       8. IMMEDIATE ACTIONS
       ===================================================== */

    buildImmediateActions(
        context = {}
    ) {

        const actions = [];


        const disease =
            context.disease ??
            context.diagnosis ??
            context.diseaseName ??
            "Unknown";


        const profile =
            this.getDiseaseProfile(
                disease
            );


        actions.push(
            ...profile.immediate
        );


        const risk =
            this.safeNumber(
                context.diseaseRisk ??
                context.riskScore ??
                context.risk,
                0
            );


        if (risk >= 70) {

            actions.push(
                "Prioritize inspection of the affected field and nearby plants."
            );

        } else if (risk >= 40) {

            actions.push(
                "Increase scouting frequency and monitor affected areas closely."
            );
        }


        const weatherActions =
            this.getWeatherRecommendations(
                context.weather || {}
            );


        /*
         * Only keep the most relevant immediate
         * weather recommendations.
         */

        actions.push(
            ...weatherActions.slice(0, 2)
        );


        const soilActions =
            this.getSoilRecommendations(
                context.soil || {}
            );


        actions.push(
            ...soilActions.slice(0, 2)
        );


        return this.unique(
            actions
        ).slice(0, 7);
    },


    /* =====================================================
       9. PREVENTIVE MEASURES
       ===================================================== */

    buildPreventiveMeasures(
        context = {}
    ) {

        const measures = [];


        const disease =
            context.disease ??
            context.diagnosis ??
            context.diseaseName ??
            "Unknown";


        const profile =
            this.getDiseaseProfile(
                disease
            );


        measures.push(
            ...profile.preventive
        );


        measures.push(
            ...this.getCropRecommendations(
                context.crop
            )
        );


        measures.push(
            ...this.getGrowthStageRecommendations(
                context.growthStage ??
                context.stage
            )
        );


        /*
         * Weather-based prevention.
         */

        const weather =
            context.weather || {};

        const humidity =
            this.safeNumber(
                weather.humidity,
                0
            );

        const rainProbability =
            this.safeNumber(
                weather.rainProbability,
                0
            );


        if (
            humidity >= 80 ||
            rainProbability >= 60
        ) {

            measures.push(
                "Increase preventive scouting during humid or rainy periods."
            );
        }


        return this.unique(
            measures
        ).slice(0, 10);
    },


    /* =====================================================
       10. TREATMENT GUIDANCE
       ===================================================== */

    buildTreatmentGuidance(
        context = {}
    ) {

        const disease =
            context.disease ??
            context.diagnosis ??
            context.diseaseName ??
            "Unknown";


        const profile =
            this.getDiseaseProfile(
                disease
            );


        const guidance = [
            ...profile.treatment
        ];


        /*
         * Diagnostic uncertainty.
         */

        const confidence =
            this.safeNumber(
                context.confidence,
                0
            );


        if (
            confidence > 0 &&
            confidence < 70
        ) {

            guidance.unshift(
                "Confirm the diagnosis before applying disease-specific treatment because AI confidence is limited."
            );
        }


        /*
         * High severity.
         */

        const severity =
            this.normalizeText(
                context.severity
            );


        if (
            severity === "severe" ||
            severity === "critical"
        ) {

            guidance.unshift(
                "Seek timely advice from a qualified local agricultural professional or extension service."
            );
        }


        /*
         * Safety statement.
         */

        guidance.push(
            "Use protective equipment and observe all safety, label and pre-harvest requirements for any approved product."
        );


        return this.unique(
            guidance
        ).slice(0, 8);
    },


    /* =====================================================
       11. MONITORING PLAN
       ===================================================== */

    buildMonitoringPlan(
        context = {}
    ) {

        const monitoring = [];


        const disease =
            context.disease ??
            context.diagnosis ??
            context.diseaseName ??
            "Unknown";


        const profile =
            this.getDiseaseProfile(
                disease
            );


        monitoring.push(
            ...profile.monitoring
        );


        const risk =
            this.safeNumber(
                context.diseaseRisk ??
                context.riskScore ??
                context.risk,
                0
            );


        if (risk >= 70) {

            monitoring.push(
                "Perform frequent scouting until disease risk decreases or the crop condition stabilizes."
            );

        } else if (risk >= 40) {

            monitoring.push(
                "Increase scouting frequency during favorable disease conditions."
            );

        } else {

            monitoring.push(
                "Continue routine field monitoring."
            );
        }


        monitoring.push(
            "Record changes in symptoms, crop stage, weather and soil conditions for future assessments."
        );


        return this.unique(
            monitoring
        ).slice(0, 6);
    },


    /* =====================================================
       12. CREATE COMPLETE RECOMMENDATION
       ===================================================== */

    generate(context = {}) {

        const disease =
            context.disease ??
            context.diagnosis ??
            context.diseaseName ??
            "Unknown";


        const diseaseRisk =
            this.safeNumber(
                context.diseaseRisk ??
                context.riskScore ??
                context.risk,
                0
            );


        const confidence =
            this.safeNumber(
                context.confidence,
                0
            );


        const priority =
            this.determinePriority({
                ...context,
                diseaseRisk
            });


        const immediateActions =
            this.buildImmediateActions(
                context
            );


        const preventiveMeasures =
            this.buildPreventiveMeasures(
                context
            );


        const treatmentGuidance =
            this.buildTreatmentGuidance(
                context
            );


        const monitoringPlan =
            this.buildMonitoringPlan(
                context
            );


        return {

            timestamp:
                new Date().toISOString(),

            priority,

            disease,

            confidence,

            riskScore:
                this.clamp(
                    diseaseRisk
                ),

            immediateActions,

            preventiveMeasures,

            treatmentGuidance,

            monitoringPlan,

            summary:
                this.createSummary({
                    ...context,
                    disease,
                    diseaseRisk,
                    priority
                })
        };
    },


    /* =====================================================
       13. CREATE SUMMARY
       ===================================================== */

    createSummary(
        context = {}
    ) {

        const disease =
            context.disease ||
            "the detected condition";

        const risk =
            this.safeNumber(
                context.diseaseRisk ??
                context.riskScore ??
                context.risk,
                0
            );

        const priority =
            context.priority ||
            this.determinePriority(
                context
            );


        if (
            this.normalizeText(
                disease
            ) === "healthy"
        ) {

            return (
                "No specific disease treatment is indicated. " +
                "Continue routine crop, soil and weather monitoring."
            );
        }


        if (risk >= 70) {

            return (
                `${disease} requires high-priority attention. ` +
                "Inspect the affected field promptly and follow locally approved disease-management guidance."
            );
        }


        if (risk >= 40) {

            return (
                `${disease} presents a moderate level of concern. ` +
                "Increase monitoring and address environmental conditions that may favor disease development."
            );
        }


        return (
            `${disease} was identified with relatively limited current risk. ` +
            "Continue preventive management and regular field monitoring."
        );
    },


    /* =====================================================
       14. CONVERT RESULT TO UI FORMAT
       ===================================================== */

    toUIResult(
        recommendation
    ) {

        if (!recommendation) {
            return null;
        }


        return {

            priority:
                recommendation.priority,

            summary:
                recommendation.summary,

            immediate:
                recommendation.immediateActions || [],

            preventive:
                recommendation.preventiveMeasures || [],

            treatment:
                recommendation.treatmentGuidance || [],

            monitoring:
                recommendation.monitoringPlan || []
        };
    },


    /* =====================================================
       15. QUICK RECOMMENDATION FUNCTION
       ===================================================== */

    quickRecommend({
        disease = "Unknown",
        confidence = 0,
        risk = 0,
        severity = "Unknown",
        crop = "",
        growthStage = "",
        soil = {},
        weather = {}
    } = {}) {

        return this.generate({

            disease,

            confidence,

            diseaseRisk: risk,

            severity,

            crop,

            growthStage,

            soil,

            weather
        });
    }
};


/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.AgriGuardRecommendationEngine =
    AgriGuardRecommendationEngine;


/* =========================================================
   BACKWARD-COMPATIBLE GLOBAL HELPERS
   ========================================================= */

window.generateRecommendations =
    function (context) {

        return AgriGuardRecommendationEngine.generate(
            context
        );
    };


window.getTreatmentRecommendations =
    function (context) {

        const result =
            AgriGuardRecommendationEngine.generate(
                context
            );

        return result.treatmentGuidance;
    };


window.getPreventiveRecommendations =
    function (context) {

        const result =
            AgriGuardRecommendationEngine.generate(
                context
            );

        return result.preventiveMeasures;
    };


window.getImmediateActions =
    function (context) {

        const result =
            AgriGuardRecommendationEngine.generate(
                context
            );

        return result.immediateActions;
    };
```
