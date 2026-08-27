/* ============================================================
   AGRIGUARD AI
   SIH 2026 PROTOTYPE
   ALERT & EARLY-WARNING ENGINE
============================================================ */

/*
    PURPOSE
    -------
    Converts AgriGuard intelligence into farmer-friendly
    alerts and early warnings.

    INPUTS
    ------
    • Disease detection
    • Disease confidence
    • Risk score
    • Weather
    • Soil
    • Irrigation
    • Recommendations
    • Field conditions

    OUTPUTS
    -------
    • Critical alerts
    • High-priority warnings
    • Moderate warnings
    • Informational alerts
    • Alert severity
    • Alert category
    • Alert explanation
    • Recommended action
    • Time sensitivity
    • Alert confidence

    DESIGN
    ------
    AgriGuard follows:

        DETECT
           ↓
        ASSESS
           ↓
        ALERT
           ↓
        EXPLAIN
           ↓
        ACT
           ↓
        MONITOR

    This module is intentionally designed as a
    decision-support / early-warning system.
*/


/* ============================================================
   01. ENGINE STATE
============================================================ */

const ALERT_ENGINE_STATE = {

    alerts:
        [],

    history:
        [],

    acknowledged:
        [],

    dismissed:
        [],

    lastUpdated:
        null,

    version:
        "1.0.0",

    maxActiveAlerts:
        30,

    maxHistory:
        100
};


/* ============================================================
   02. ALERT LEVELS
============================================================ */

const ALERT_LEVELS = {

    CRITICAL: {
        score: 100,
        label: "Critical",
        colorClass: "critical",
        icon: "🚨"
    },

    HIGH: {
        score: 80,
        label: "High",
        colorClass: "high",
        icon: "⚠️"
    },

    MEDIUM: {
        score: 60,
        label: "Moderate",
        colorClass: "medium",
        icon: "🟠"
    },

    LOW: {
        score: 35,
        label: "Low",
        colorClass: "low",
        icon: "🟡"
    },

    INFO: {
        score: 10,
        label: "Information",
        colorClass: "info",
        icon: "ℹ️"
    }
};


/* ============================================================
   03. ALERT CATEGORIES
============================================================ */

const ALERT_CATEGORIES = {

    DISEASE:
        "disease",

    WEATHER:
        "weather",

    SOIL:
        "soil",

    WATER:
        "water",

    PEST:
        "pest",

    CROP:
        "crop",

    FIELD:
        "field",

    SYSTEM:
        "system"
};


/* ============================================================
   04. ALERT STATUS
============================================================ */

const ALERT_STATUS = {

    ACTIVE:
        "active",

    ACKNOWLEDGED:
        "acknowledged",

    DISMISSED:
        "dismissed",

    RESOLVED:
        "resolved"
};


/* ============================================================
   05. SAFE NUMBER
============================================================ */

function safeAlertNumber(
    value,
    fallback = 0
) {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}


/* ============================================================
   06. CLAMP
============================================================ */

function clampAlertScore(
    value,
    min = 0,
    max = 100
) {

    return Math.min(
        max,
        Math.max(
            min,
            safeAlertNumber(
                value
            )
        )
    );
}


/* ============================================================
   07. NORMALIZE INPUT
============================================================ */

function normalizeAlertInput(
    input = {}
) {

    const disease =
        input.disease ||
        input.diseaseDetection ||
        input.detection ||
        {};


    const weather =
        input.weather ||
        {};


    const soil =
        input.soil ||
        input.soilAnalysis ||
        {};


    const risk =
        input.risk ||
        input.riskAnalysis ||
        {};


    const recommendations =
        input.recommendations ||
        {};


    return {

        crop:
            input.crop ||
            input.cropName ||
            "Unknown Crop",

        cropStage:
            input.cropStage ||
            input.stage ||
            "vegetative",

        location:
            input.location ||
            "Field",

        disease: {

            detected:
                Boolean(
                    disease.detected ??
                    disease.isDiseaseDetected ??
                    false
                ),

            name:
                disease.name ||
                disease.disease ||
                disease.prediction ||
                "Unknown condition",

            confidence:
                clampAlertScore(
                    disease.confidence ??
                    disease.probability ??
                    disease.score ??
                    0
                ),

            severity:
                disease.severity ||
                disease.riskLevel ||
                "unknown"
        },

        weather: {

            temperature:
                safeAlertNumber(
                    weather.temperature ??
                    weather.temp,
                    null
                ),

            humidity:
                safeAlertNumber(
                    weather.humidity,
                    null
                ),

            rainfall24h:
                safeAlertNumber(
                    weather.rainfall24h ??
                    weather.rainfall ??
                    weather.precipitation,
                    0
                ),

            rainfallProbability:
                clampAlertScore(
                    weather.rainfallProbability ??
                    weather.rainProbability ??
                    weather.precipitationProbability ??
                    0
                ),

            windSpeed:
                safeAlertNumber(
                    weather.windSpeed ??
                    weather.wind,
                    null
                ),

            weatherRisk:
                clampAlertScore(
                    weather.weatherRisk ??
                    weather.riskScore ??
                    0
                )
        },

        soil: {

            moisture:
                safeAlertNumber(
                    soil.moisture ??
                    soil.soil?.moisture,
                    null
                ),

            pH:
                safeAlertNumber(
                    soil.pH ??
                    soil.soil?.pH,
                    null
                ),

            soilHealthScore:
                safeAlertNumber(
                    soil.soilHealthScore ??
                    soil.healthScore,
                    null
                ),

            salinityRisk:
                safeAlertNumber(
                    soil.salinityRisk,
                    null
                ),

            waterloggingRisk:
                safeAlertNumber(
                    soil.waterloggingRisk,
                    null
                ),

            soilStressScore:
                safeAlertNumber(
                    soil.soilStressScore ??
                    soil.stressScore,
                    null
                ),

            irrigation:
                soil.irrigation ||
                null
        },

        risk: {

            overall:
                clampAlertScore(
                    risk.overall ??
                    risk.overallRisk ??
                    risk.riskScore ??
                    0
                ),

            disease:
                clampAlertScore(
                    risk.disease ??
                    risk.diseaseRisk ??
                    0
                ),

            weather:
                clampAlertScore(
                    risk.weather ??
                    risk.weatherRisk ??
                    0
                ),

            soil:
                clampAlertScore(
                    risk.soil ??
                    risk.soilRisk ??
                    0
                ),

            pest:
                clampAlertScore(
                    risk.pest ??
                    risk.pestRisk ??
                    0
                ),

            water:
                clampAlertScore(
                    risk.water ??
                    risk.waterRisk ??
                    0
                )
        },

        recommendations:
            Array.isArray(
                recommendations
            )
                ? recommendations
                : (
                    recommendations.all ||
                    recommendations.recommendations ||
                    []
                )
    };
}


/* ============================================================
   08. CREATE ALERT
============================================================ */

function createAlert(
    config = {}
) {

    const level =
        config.level ||
        "MEDIUM";


    const levelInfo =
        ALERT_LEVELS[
            level
        ] ||
        ALERT_LEVELS.MEDIUM;


    const timestamp =
        new Date().toISOString();


    return {

        id:
            config.id ||
            `ALERT-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        category:
            config.category ||
            ALERT_CATEGORIES.SYSTEM,

        level,

        levelScore:
            levelInfo.score,

        severity:
            levelInfo.label,

        icon:
            levelInfo.icon,

        colorClass:
            levelInfo.colorClass,

        title:
            config.title ||
            "AgriGuard Alert",

        message:
            config.message ||
            "",

        explanation:
            config.explanation ||
            "",

        action:
            config.action ||
            "",

        why:
            config.why ||
            "",

        timing:
            config.timing ||
            "Monitor conditions",

        confidence:
            clampAlertScore(
                config.confidence ??
                80
            ),

        crop:
            config.crop ||
            "Unknown Crop",

        cropStage:
            config.cropStage ||
            "Unknown",

        location:
            config.location ||
            "Field",

        source:
            config.source ||
            "AgriGuard AI",

        status:
            ALERT_STATUS.ACTIVE,

        acknowledged:
            false,

        dismissed:
            false,

        resolved:
            false,

        createdAt:
            timestamp,

        updatedAt:
            timestamp,

        tags:
            Array.isArray(
                config.tags
            )
                ? config.tags
                : [],

        relatedRecommendationId:
            config.relatedRecommendationId ||
            null,

        metrics:
            config.metrics ||
            {}
    };
}


/* ============================================================
   09. DISEASE ALERTS
============================================================ */

function generateDiseaseAlerts(
    context
) {

    const alerts =
        [];


    const disease =
        context.disease;


    if (
        !disease.detected
    ) {

        return alerts;

    }


    /*
        CRITICAL
    */

    if (
        disease.confidence >= 90 &&
        (
            String(
                disease.severity
            )
            .toLowerCase()
            .includes(
                "severe"
            ) ||
            context.risk.disease >= 85
        )
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-DISEASE-CRITICAL",

                category:
                    ALERT_CATEGORIES.DISEASE,

                level:
                    "CRITICAL",

                title:
                    "Critical Disease Risk Detected",

                message:
                    `${disease.name} detected with high confidence.`,

                explanation:
                    `The AI screening system detected ${disease.name} with ${disease.confidence}% confidence and the associated disease risk is elevated.`,

                action:
                    "Inspect affected plants immediately and confirm the diagnosis before selecting a treatment.",

                why:
                    "Rapid identification and confirmation can reduce potential field spread.",

                timing:
                    "Immediate",

                confidence:
                    disease.confidence,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "disease",
                        "critical",
                        "ai-detection"
                    ],

                metrics: {

                    diseaseConfidence:
                        disease.confidence,

                    diseaseRisk:
                        context.risk.disease
                }
            })
        );


        return alerts;
    }


    /*
        HIGH
    */

    if (
        disease.confidence >= 75 ||
        context.risk.disease >= 70
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-DISEASE-HIGH",

                category:
                    ALERT_CATEGORIES.DISEASE,

                level:
                    "HIGH",

                title:
                    "Disease Risk Alert",

                message:
                    `${disease.name} is suspected in the field.`,

                explanation:
                    `The detection system reports ${disease.confidence}% confidence for ${disease.name}.`,

                action:
                    "Inspect additional plants and capture clear images for confirmation.",

                why:
                    "A disease signal is strong enough to justify immediate monitoring.",

                timing:
                    "Today",

                confidence:
                    disease.confidence,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "disease",
                        "high-risk"
                    ],

                metrics: {

                    diseaseConfidence:
                        disease.confidence,

                    diseaseRisk:
                        context.risk.disease
                }
            })
        );


        return alerts;
    }


    /*
        MEDIUM / UNCERTAIN
    */

    alerts.push(
        createAlert({

            id:
                "ALERT-DISEASE-MEDIUM",

            category:
                ALERT_CATEGORIES.DISEASE,

            level:
                "MEDIUM",

            title:
                "Possible Disease Signal",

            message:
                `${disease.name} may be present.`,

            explanation:
                `The current detection confidence is ${disease.confidence}%, so additional verification is recommended.`,

            action:
                "Capture more images from different affected plants and compare symptoms with trusted agricultural guidance.",

            why:
                "AI screening confidence is not high enough to treat the result as a confirmed diagnosis.",

            timing:
                "As soon as practical",

            confidence:
                disease.confidence,

            crop:
                context.crop,

            cropStage:
                context.cropStage,

            location:
                context.location,

            tags:
                [
                    "disease",
                    "verification"
                ]
        })
    );


    return alerts;
}


/* ============================================================
   10. WEATHER ALERTS
============================================================ */

function generateWeatherAlerts(
    context
) {

    const alerts =
        [];


    const weather =
        context.weather;


    /*
        HEAVY RAIN
    */

    if (
        weather.rainfall24h >= 50
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-RAIN-CRITICAL",

                category:
                    ALERT_CATEGORIES.WEATHER,

                level:
                    "CRITICAL",

                title:
                    "Heavy Rainfall Alert",

                message:
                    `${weather.rainfall24h} mm of rainfall has been recorded/reported.`,

                explanation:
                    "Heavy rainfall can increase waterlogging, erosion, nutrient loss and disease-favorable conditions.",

                action:
                    "Inspect drainage and standing water. Avoid unnecessary irrigation.",

                why:
                    "Excess water can cause root-zone stress and field-access problems.",

                timing:
                    "Immediate / after rainfall",

                confidence:
                    94,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "rain",
                        "waterlogging",
                        "weather"
                    ],

                metrics: {

                    rainfall24h:
                        weather.rainfall24h
                }
            })
        );

    }

    else if (
        weather.rainfall24h >= 25
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-RAIN-HIGH",

                category:
                    ALERT_CATEGORIES.WEATHER,

                level:
                    "HIGH",

                title:
                    "High Rainfall Risk",

                message:
                    `${weather.rainfall24h} mm of recent rainfall may affect field conditions.`,

                explanation:
                    "Recent rainfall can temporarily increase soil moisture and disease pressure.",

                action:
                    "Check drainage and reassess soil moisture before irrigation.",

                why:
                    "Avoiding excess water can reduce waterlogging and root stress.",

                timing:
                    "Today",

                confidence:
                    91,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "rain",
                        "soil-moisture"
                    ]
            })
        );

    }


    /*
        HIGH RAIN PROBABILITY
    */

    if (
        weather.rainfallProbability >= 80
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-RAIN-FORECAST",

                category:
                    ALERT_CATEGORIES.WEATHER,

                level:
                    "HIGH",

                title:
                    "High Rain Probability",

                message:
                    `Rain probability is approximately ${weather.rainfallProbability}%.`,

                explanation:
                    "Forecast rainfall may change irrigation requirements and field-operating conditions.",

                action:
                    "Recheck soil moisture before irrigation and plan field operations around the expected rain.",

                why:
                    "Using rainfall opportunity can reduce unnecessary water use.",

                timing:
                    "Before the expected rain",

                confidence:
                    87,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "forecast",
                        "rain",
                        "water-saving"
                    ]
            })
        );

    }


    /*
        HEAT
    */

    if (
        weather.temperature !== null &&
        weather.temperature >= 40
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-HEAT-CRITICAL",

                category:
                    ALERT_CATEGORIES.WEATHER,

                level:
                    "CRITICAL",

                title:
                    "Extreme Heat Stress Risk",

                message:
                    `Temperature is around ${weather.temperature}°C.`,

                explanation:
                    "Extreme heat can rapidly increase crop water demand and heat stress.",

                action:
                    "Check crop condition and root-zone moisture; follow locally appropriate heat-management practices.",

                why:
                    "High temperature can increase evapotranspiration and physiological stress.",

                timing:
                    "Today",

                confidence:
                    93,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "heat",
                        "water-stress"
                    ]
            })
        );

    }

    else if (
        weather.temperature !== null &&
        weather.temperature >= 35
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-HEAT-HIGH",

                category:
                    ALERT_CATEGORIES.WEATHER,

                level:
                    "HIGH",

                title:
                    "Heat Stress Warning",

                message:
                    `Temperature is around ${weather.temperature}°C.`,

                explanation:
                    "Elevated temperatures can increase crop water demand.",

                action:
                    "Monitor crop condition and soil moisture more frequently.",

                why:
                    "Heat can increase water loss and stress.",

                timing:
                    "Today",

                confidence:
                    88,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "heat",
                        "monitoring"
                    ]
            })
        );

    }


    /*
        HIGH WIND
    */

    if (
        weather.windSpeed !== null &&
        weather.windSpeed >= 50
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-WIND-CRITICAL",

                category:
                    ALERT_CATEGORIES.WEATHER,

                level:
                    "CRITICAL",

                title:
                    "Strong Wind Alert",

                message:
                    `Wind speed is around ${weather.windSpeed} km/h.`,

                explanation:
                    "Strong winds can cause physical crop damage and make spraying unsafe.",

                action:
                    "Avoid unnecessary field spraying and inspect vulnerable crop structures after the event.",

                why:
                    "High wind increases drift and physical crop-damage risk.",

                timing:
                    "During strong winds",

                confidence:
                    94,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "wind",
                        "spraying",
                        "safety"
                    ]
            })
        );

    }

    else if (
        weather.windSpeed !== null &&
        weather.windSpeed >= 35
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-WIND-HIGH",

                category:
                    ALERT_CATEGORIES.WEATHER,

                level:
                    "HIGH",

                title:
                    "High Wind Warning",

                message:
                    `Wind speed is around ${weather.windSpeed} km/h.`,

                explanation:
                    "Windy conditions can affect spraying and field operations.",

                action:
                    "Postpone unnecessary spraying until conditions are suitable.",

                why:
                    "Reduces spray drift and application losses.",

                timing:
                    "Until wind decreases",

                confidence:
                    92,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "wind",
                        "spraying"
                    ]
            })
        );

    }


    return alerts;
}


/* ============================================================
   11. SOIL ALERTS
============================================================ */

function generateSoilAlerts(
    context
) {

    const alerts =
        [];


    const soil =
        context.soil;


    /*
        WATERLOGGING
    */

    if (
        soil.waterloggingRisk !== null &&
        soil.waterloggingRisk >= 80
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-WATERLOG-CRITICAL",

                category:
                    ALERT_CATEGORIES.WATER,

                level:
                    "CRITICAL",

                title:
                    "Critical Waterlogging Risk",

                message:
                    `Waterlogging risk is approximately ${soil.waterloggingRisk}/100.`,

                explanation:
                    "Excess water around roots can reduce oxygen availability and cause crop stress.",

                action:
                    "Inspect drainage and standing water immediately.",

                why:
                    "Rapid action may reduce prolonged root-zone saturation.",

                timing:
                    "Immediate",

                confidence:
                    92,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "soil",
                        "waterlogging",
                        "critical"
                    ]
            })
        );

    }

    else if (
        soil.waterloggingRisk !== null &&
        soil.waterloggingRisk >= 60
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-WATERLOG-HIGH",

                category:
                    ALERT_CATEGORIES.WATER,

                level:
                    "HIGH",

                title:
                    "Waterlogging Warning",

                message:
                    `Waterlogging risk is approximately ${soil.waterloggingRisk}/100.`,

                explanation:
                    "Soil saturation may be increasing root-zone stress.",

                action:
                    "Inspect low-lying areas and drainage channels.",

                why:
                    "Early drainage management can reduce prolonged saturation.",

                timing:
                    "Today",

                confidence:
                    89,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "waterlogging",
                        "drainage"
                    ]
            })
        );

    }


    /*
        LOW SOIL MOISTURE
    */

    if (
        soil.moisture !== null &&
        soil.moisture < 25
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-MOISTURE-CRITICAL",

                category:
                    ALERT_CATEGORIES.WATER,

                level:
                    "CRITICAL",

                title:
                    "Critical Soil Moisture Deficit",

                message:
                    `Soil moisture is approximately ${soil.moisture}%.`,

                explanation:
                    "Very low root-zone moisture can cause crop water stress.",

                action:
                    "Verify the sensor reading and assess the crop before irrigation.",

                why:
                    "Rapid moisture loss can affect crop growth.",

                timing:
                    "Today",

                confidence:
                    91,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "soil-moisture",
                        "water-stress"
                    ]
            })
        );

    }

    else if (
        soil.moisture !== null &&
        soil.moisture < 40
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-MOISTURE-HIGH",

                category:
                    ALERT_CATEGORIES.WATER,

                level:
                    "HIGH",

                title:
                    "Low Soil Moisture",

                message:
                    `Soil moisture is approximately ${soil.moisture}%.`,

                explanation:
                    "The root zone may be becoming too dry for the crop's current needs.",

                action:
                    "Check crop condition and irrigation requirement.",

                why:
                    "Maintaining adequate root-zone moisture can reduce water stress.",

                timing:
                    "Next irrigation assessment",

                confidence:
                    87,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "soil-moisture",
                        "irrigation"
                    ]
            })
        );

    }


    /*
        HIGH SOIL MOISTURE
    */

    if (
        soil.moisture !== null &&
        soil.moisture >= 85
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-MOISTURE-WET",

                category:
                    ALERT_CATEGORIES.WATER,

                level:
                    "HIGH",

                title:
                    "Excess Soil Moisture",

                message:
                    `Soil moisture is approximately ${soil.moisture}%.`,

                explanation:
                    "Excess moisture may increase waterlogging and root-zone stress.",

                action:
                    "Avoid unnecessary irrigation and inspect drainage.",

                why:
                    "Additional water could worsen saturation.",

                timing:
                    "Until moisture decreases",

                confidence:
                    93,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "soil-moisture",
                        "waterlogging"
                    ]
            })
        );

    }


    /*
        SALINITY
    */

    if (
        soil.salinityRisk !== null &&
        soil.salinityRisk >= 80
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-SALINITY-CRITICAL",

                category:
                    ALERT_CATEGORIES.SOIL,

                level:
                    "CRITICAL",

                title:
                    "Critical Salinity Risk",

                message:
                    `Estimated salinity risk is ${soil.salinityRisk}/100.`,

                explanation:
                    "High salinity can interfere with water uptake and nutrient balance.",

                action:
                    "Confirm electrical conductivity through reliable soil/water testing and review drainage.",

                why:
                    "Confirmed salinity requires evidence-based soil and water management.",

                timing:
                    "Priority soil assessment",

                confidence:
                    88,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "salinity",
                        "soil-test"
                    ]
            })
        );

    }

    else if (
        soil.salinityRisk !== null &&
        soil.salinityRisk >= 60
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-SALINITY-HIGH",

                category:
                    ALERT_CATEGORIES.SOIL,

                level:
                    "HIGH",

                title:
                    "Elevated Salinity Risk",

                message:
                    `Estimated salinity risk is ${soil.salinityRisk}/100.`,

                explanation:
                    "There may be increasing salt stress in the root zone.",

                action:
                    "Confirm soil and irrigation-water EC and review drainage.",

                why:
                    "Verification is needed before corrective action.",

                timing:
                    "Next soil assessment",

                confidence:
                    86,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "salinity",
                        "soil"
                    ]
            })
        );

    }


    /*
        LOW SOIL HEALTH
    */

    if (
        soil.soilHealthScore !== null &&
        soil.soilHealthScore < 35
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-SOIL-HEALTH",

                category:
                    ALERT_CATEGORIES.SOIL,

                level:
                    "HIGH",

                title:
                    "Poor Soil Health Indicator",

                message:
                    `Soil health score is approximately ${soil.soilHealthScore}/100.`,

                explanation:
                    "Poor soil-health indicators can affect nutrient availability, structure and water management.",

                action:
                    "Review recent soil-test results and identify the dominant soil constraint.",

                why:
                    "Corrective action should target the actual limiting factor.",

                timing:
                    "Next soil-management cycle",

                confidence:
                    90,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "soil-health",
                        "soil-test"
                    ]
            })
        );

    }


    /*
        pH
    */

    if (
        soil.pH !== null &&
        (
            soil.pH < 5 ||
            soil.pH > 8.5
        )
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-PH",

                category:
                    ALERT_CATEGORIES.SOIL,

                level:
                    "HIGH",

                title:
                    "Extreme Soil pH Indicator",

                message:
                    `Soil pH is approximately ${soil.pH}.`,

                explanation:
                    "Extreme pH can affect nutrient availability and crop growth.",

                action:
                    "Confirm pH with a reliable soil test before selecting amendments.",

                why:
                    "Soil amendments should be based on verified soil conditions.",

                timing:
                    "Before corrective treatment",

                confidence:
                    94,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "ph",
                        "soil-test"
                    ]
            })
        );

    }


    return alerts;
}


/* ============================================================
   12. OVERALL RISK ALERT
============================================================ */

function generateOverallRiskAlert(
    context
) {

    const risk =
        context.risk.overall;


    if (
        risk < 50
    ) {

        return null;

    }


    let level =
        "MEDIUM";


    if (
        risk >= 85
    ) {

        level =
            "CRITICAL";

    }

    else if (
        risk >= 70
    ) {

        level =
            "HIGH";

    }


    return createAlert({

        id:
            "ALERT-OVERALL-RISK",

        category:
            ALERT_CATEGORIES.FIELD,

        level,

        title:
            `${level === "CRITICAL"
                ? "Critical"
                : level === "HIGH"
                    ? "High"
                    : "Moderate"} Overall Field Risk`,

        message:
            `Overall field risk is ${risk}/100.`,

        explanation:
            "AgriGuard combines disease, weather, soil, water and other available indicators to estimate overall field risk.",

        action:
            "Open the risk dashboard and prioritize the highest-scoring risk factors.",

        why:
            "Combined risk indicators provide a broader field-level view than any single parameter.",

        timing:
            risk >= 70
                ? "Today"
                : "Monitor closely",

        confidence:
            90,

        crop:
            context.crop,

        cropStage:
            context.cropStage,

        location:
            context.location,

        tags:
            [
                "overall-risk",
                "field-risk"
            ],

        metrics: {

            overallRisk:
                risk,

            diseaseRisk:
                context.risk.disease,

            weatherRisk:
                context.risk.weather,

            soilRisk:
                context.risk.soil,

            waterRisk:
                context.risk.water,

            pestRisk:
                context.risk.pest
        }
    });
}


/* ============================================================
   13. IRRIGATION ALERT
============================================================ */

function generateIrrigationAlert(
    context
) {

    const irrigation =
        context.soil.irrigation;


    if (
        !irrigation
    ) {

        return null;

    }


    const priority =
        String(
            irrigation.priority ||
            ""
        )
        .toUpperCase();


    /*
        URGENT IRRIGATION
    */

    if (
        priority ===
        "URGENT"
    ) {

        return createAlert({

            id:
                "ALERT-IRRIGATION-URGENT",

            category:
                ALERT_CATEGORIES.WATER,

            level:
                "CRITICAL",

            title:
                "Urgent Irrigation Requirement",

            message:
                "The irrigation engine indicates elevated water requirement.",

            explanation:
                irrigation.reason ||
                "Soil moisture appears below the preferred range.",

            action:
                "Verify soil moisture and crop condition before irrigation.",

            why:
                "The field may be experiencing water stress.",

            timing:
                "Today",

            confidence:
                90,

            crop:
                context.crop,

            cropStage:
                context.cropStage,

            location:
                context.location,

            tags:
                [
                    "irrigation",
                    "water-stress"
                ]
        });

    }


    /*
        HIGH IRRIGATION REQUIREMENT
    */

    if (
        priority ===
        "HIGH"
    ) {

        return createAlert({

            id:
                "ALERT-IRRIGATION-HIGH",

            category:
                ALERT_CATEGORIES.WATER,

            level:
                "HIGH",

            title:
                "Irrigation Attention Required",

            message:
                "Irrigation may be required based on current field conditions.",

            explanation:
                irrigation.reason ||
                "Current moisture conditions suggest increased water requirement.",

            action:
                "Recheck root-zone moisture and irrigate according to crop requirement.",

            why:
                "Maintaining adequate moisture can reduce water stress.",

            timing:
                "Next irrigation assessment",

            confidence:
                86,

            crop:
                context.crop,

            cropStage:
                context.cropStage,

            location:
                context.location,

            tags:
                [
                    "irrigation"
                ]
        });

    }


    /*
        DEFER / AVOID IRRIGATION
    */

    if (
        priority ===
        "DEFER" ||
        priority ===
        "AVOID"
    ) {

        return createAlert({

            id:
                "ALERT-IRRIGATION-DEFER",

            category:
                ALERT_CATEGORIES.WATER,

            level:
                "MEDIUM",

            title:
                "Irrigation Can Be Deferred",

            message:
                "Current conditions do not support immediate additional irrigation.",

            explanation:
                irrigation.reason ||
                "Soil moisture/rainfall conditions may provide sufficient water.",

            action:
                "Recheck soil moisture before the next irrigation cycle.",

            why:
                "Avoiding unnecessary irrigation saves water and reduces waterlogging risk.",

            timing:
                "Reassess later",

            confidence:
                91,

            crop:
                context.crop,

            cropStage:
                context.cropStage,

            location:
                context.location,

            tags:
                [
                    "water-saving",
                    "irrigation"
                ]
        });

    }


    return null;
}


/* ============================================================
   14. RECOMMENDATION-BASED ALERTS
============================================================ */

function generateRecommendationAlerts(
    context
) {

    const alerts =
        [];


    const recommendations =
        context.recommendations;


    recommendations.forEach(
        recommendation => {

            if (
                !recommendation
            ) {

                return;

            }


            const priority =
                String(
                    recommendation.priority ||
                    ""
                )
                .toUpperCase();


            /*
                Only convert urgent/critical
                recommendations into alerts.
            */

            if (
                priority !== "CRITICAL" &&
                priority !== "URGENT"
            ) {

                return;

            }


            let level =
                priority ===
                "CRITICAL"
                    ? "CRITICAL"
                    : "HIGH";


            alerts.push(
                createAlert({

                    id:
                        `ALERT-REC-${recommendation.id}`,

                    category:
                        recommendation.category ||
                        ALERT_CATEGORIES.SYSTEM,

                    level,

                    title:
                        recommendation.title ||
                        "Priority Action",

                    message:
                        recommendation.action ||
                        "A priority field action is recommended.",

                    explanation:
                        recommendation.reason ||
                        "Generated from AgriGuard decision-support analysis.",

                    action:
                        recommendation.action ||
                        "",

                    why:
                        recommendation.reason ||
                        "",

                    timing:
                        recommendation.timing ||
                        "Today",

                    confidence:
                        recommendation.confidence ??
                        85,

                    crop:
                        context.crop,

                    cropStage:
                        context.cropStage,

                    location:
                        context.location,

                    tags:
                        [
                            "recommendation",
                            ...(recommendation.tags || [])
                        ],

                    relatedRecommendationId:
                        recommendation.id
                })
            );

        }
    );


    return alerts;
}


/* ============================================================
   15. CROSS-FACTOR ALERTS
============================================================ */

/*
    This is important for the SIH prototype.

    Instead of treating every input independently,
    AgriGuard detects combinations.

    Example:

        High humidity
        +
        Disease detected
        =
        Higher disease-spread warning

    Or:

        Low moisture
        +
        High temperature
        =
        Higher water-stress warning
*/

function generateCrossFactorAlerts(
    context
) {

    const alerts =
        [];


    const {

        disease,

        weather,

        soil,

        risk

    } = context;


    /*
        Disease + humidity
    */

    if (
        disease.detected &&
        disease.confidence >= 70 &&
        weather.humidity !== null &&
        weather.humidity >= 80
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-CROSS-DISEASE-HUMIDITY",

                category:
                    ALERT_CATEGORIES.DISEASE,

                level:
                    risk.disease >= 80
                        ? "CRITICAL"
                        : "HIGH",

                title:
                    "Disease + High Humidity Risk",

                message:
                    "Disease signal and high humidity are occurring together.",

                explanation:
                    `Disease confidence is ${disease.confidence}% and humidity is approximately ${weather.humidity}%.`,

                action:
                    "Increase scouting frequency and inspect dense/wet canopy areas.",

                why:
                    "Moist conditions can favor development of several crop diseases.",

                timing:
                    "Today and next 48 hours",

                confidence:
                    88,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "multi-factor",
                        "disease",
                        "humidity"
                    ],

                metrics: {

                    diseaseConfidence:
                        disease.confidence,

                    humidity:
                        weather.humidity
                }
            })
        );

    }


    /*
        Heat + low moisture
    */

    if (
        weather.temperature !== null &&
        weather.temperature >= 35 &&
        soil.moisture !== null &&
        soil.moisture < 40
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-CROSS-HEAT-DRY",

                category:
                    ALERT_CATEGORIES.WATER,

                level:
                    risk.water >= 80
                        ? "CRITICAL"
                        : "HIGH",

                title:
                    "Heat + Low Moisture Stress",

                message:
                    "High temperature and low soil moisture are occurring together.",

                explanation:
                    `Temperature is ${weather.temperature}°C and soil moisture is approximately ${soil.moisture}%.`,

                action:
                    "Verify root-zone moisture and monitor the crop for heat/water stress.",

                why:
                    "High temperature can increase crop water demand while low moisture limits availability.",

                timing:
                    "Today",

                confidence:
                    92,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "multi-factor",
                        "heat",
                        "water-stress"
                    ]
            })
        );

    }


    /*
        Rain + wet soil
    */

    if (
        weather.rainfallProbability >= 70 &&
        soil.moisture !== null &&
        soil.moisture >= 75
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-CROSS-RAIN-WET",

                category:
                    ALERT_CATEGORIES.WATER,

                level:
                    risk.water >= 80
                        ? "CRITICAL"
                        : "HIGH",

                title:
                    "Rain + High Soil Moisture",

                message:
                    "Rainfall is likely while soil moisture is already high.",

                explanation:
                    `Rain probability is ${weather.rainfallProbability}% and soil moisture is approximately ${soil.moisture}%.`,

                action:
                    "Avoid unnecessary irrigation and inspect drainage.",

                why:
                    "Additional rainfall may increase waterlogging risk.",

                timing:
                    "Before rainfall",

                confidence:
                    94,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "multi-factor",
                        "rain",
                        "waterlogging"
                    ]
            })
        );

    }


    /*
        Disease + rainfall
    */

    if (
        disease.detected &&
        disease.confidence >= 70 &&
        weather.rainfallProbability >= 70
    ) {

        alerts.push(
            createAlert({

                id:
                    "ALERT-CROSS-DISEASE-RAIN",

                category:
                    ALERT_CATEGORIES.DISEASE,

                level:
                    risk.disease >= 80
                        ? "CRITICAL"
                        : "HIGH",

                title:
                    "Disease + Rainfall Risk",

                message:
                    "A disease signal coincides with high rainfall probability.",

                explanation:
                    `Disease confidence is ${disease.confidence}% and rain probability is ${weather.rainfallProbability}%.`,

                action:
                    "Increase field scouting and reassess disease symptoms after rainfall.",

                why:
                    "Wet conditions can favor development or spread of several diseases.",

                timing:
                    "Before and after rainfall",

                confidence:
                    87,

                crop:
                    context.crop,

                cropStage:
                    context.cropStage,

                location:
                    context.location,

                tags:
                    [
                        "multi-factor",
                        "disease",
                        "rain"
                    ]
            })
        );

    }


    return alerts;
}


/* ============================================================
   16. GENERATE ALL ALERTS
============================================================ */

function generateAlerts(
    input = {}
) {

    const context =
        normalizeAlertInput(
            input
        );


    let alerts =
        [];


    /*
        Independent intelligence.
    */

    alerts.push(
        ...generateDiseaseAlerts(
            context
        )
    );


    alerts.push(
        ...generateWeatherAlerts(
            context
        )
    );


    alerts.push(
        ...generateSoilAlerts(
            context
        )
    );


    /*
        Overall field risk.
    */

    const overallRiskAlert =
        generateOverallRiskAlert(
            context
        );


    if (
        overallRiskAlert
    ) {

        alerts.push(
            overallRiskAlert
        );

    }


    /*
        Irrigation.
    */

    const irrigationAlert =
        generateIrrigationAlert(
            context
        );


    if (
        irrigationAlert
    ) {

        alerts.push(
            irrigationAlert
        );

    }


    /*
        Recommendations.
    */

    alerts.push(
        ...generateRecommendationAlerts(
            context
        )
    );


    /*
        Cross-factor intelligence.
    */

    alerts.push(
        ...generateCrossFactorAlerts(
            context
        )
    );


    /*
        Deduplicate.
    */

    alerts =
        deduplicateAlerts(
            alerts
        );


    /*
        Sort.
    */

    alerts.sort(
        (
            a,
            b
        ) => {

            if (
                b.levelScore !==
                a.levelScore
            ) {

                return (
                    b.levelScore -
                    a.levelScore
                );

            }


            return (
                b.confidence -
                a.confidence
            );

        }
    );


    /*
        Limit active dashboard alerts.
    */

    alerts =
        alerts.slice(
            0,
            ALERT_ENGINE_STATE.maxActiveAlerts
        );


    /*
        Save state.
    */

    ALERT_ENGINE_STATE.alerts =
        alerts;


    ALERT_ENGINE_STATE.lastUpdated =
        new Date().toISOString();


    ALERT_ENGINE_STATE.history.unshift(
        ...alerts
    );


    if (
        ALERT_ENGINE_STATE.history.length >
        ALERT_ENGINE_STATE.maxHistory
    ) {

        ALERT_ENGINE_STATE.history =
            ALERT_ENGINE_STATE.history.slice(
                0,
                ALERT_ENGINE_STATE.maxHistory
            );

    }


    /*
        Update global application state
        if app.js has already created APP_STATE.
    */

    if (
        typeof APP_STATE !==
        "undefined"
    ) {

        APP_STATE.alerts =
            alerts;

    }


    /*
        Emit dashboard event.
    */

    window.dispatchEvent(
        new CustomEvent(
            "agriguard:alertsUpdated",
            {
                detail: {

                    alerts,

                    summary:
                        getAlertSummary(
                            alerts
                        ),

                    generatedAt:
                        ALERT_ENGINE_STATE.lastUpdated
                }
            }
        )
    );


    return {

        success:
            true,

        alerts,

        summary:
            getAlertSummary(
                alerts
            ),

        generatedAt:
            ALERT_ENGINE_STATE.lastUpdated,

        engineVersion:
            ALERT_ENGINE_STATE.version
    };
}


/* ============================================================
   17. DEDUPLICATE ALERTS
============================================================ */

function deduplicateAlerts(
    alerts
) {

    const seen =
        new Set();


    const output =
        [];


    alerts.forEach(
        alert => {

            const key =
                [
                    alert.category,

                    alert.level,

                    alert.title
                        .toLowerCase()
                ]
                .join(
                    "|"
                );


            if (
                seen.has(
                    key
                )
            ) {

                return;

            }


            seen.add(
                key
            );


            output.push(
                alert
            );

        }
    );


    return output;
}


/* ============================================================
   18. ALERT SUMMARY
============================================================ */

function getAlertSummary(
    alerts =
        ALERT_ENGINE_STATE.alerts
) {

    const list =
        Array.isArray(
            alerts
        )
            ? alerts
            : [];


    return {

        total:
            list.length,

        critical:
            list.filter(
                alert =>
                    alert.level ===
                    "CRITICAL"
            ).length,

        high:
            list.filter(
                alert =>
                    alert.level ===
                    "HIGH"
            ).length,

        medium:
            list.filter(
                alert =>
                    alert.level ===
                    "MEDIUM"
            ).length,

        low:
            list.filter(
                alert =>
                    alert.level ===
                    "LOW"
            ).length,

        info:
            list.filter(
                alert =>
                    alert.level ===
                    "INFO"
            ).length,

        active:
            list.filter(
                alert =>
                    alert.status ===
                    ALERT_STATUS.ACTIVE
            ).length,

        acknowledged:
            list.filter(
                alert =>
                    alert.status ===
                    ALERT_STATUS.ACKNOWLEDGED
            ).length
    };
}


/* ============================================================
   19. GET CRITICAL ALERTS
============================================================ */

function getCriticalAlerts() {

    return ALERT_ENGINE_STATE
        .alerts
        .filter(
            alert =>
                alert.level ===
                "CRITICAL" &&
                alert.status !==
                ALERT_STATUS.DISMISSED
        );
}


/* ============================================================
   20. GET HIGH ALERTS
============================================================ */

function getHighAlerts() {

    return ALERT_ENGINE_STATE
        .alerts
        .filter(
            alert =>
                (
                    alert.level ===
                    "CRITICAL" ||
                    alert.level ===
                    "HIGH"
                ) &&
                alert.status !==
                ALERT_STATUS.DISMISSED
        );
}


/* ============================================================
   21. GET ACTIVE ALERTS
============================================================ */

function getActiveAlerts() {

    return ALERT_ENGINE_STATE
        .alerts
        .filter(
            alert =>
                alert.status ===
                ALERT_STATUS.ACTIVE
        );
}


/* ============================================================
   22. GET ALERTS BY CATEGORY
============================================================ */

function getAlertsByCategory(
    category
) {

    return ALERT_ENGINE_STATE
        .alerts
        .filter(
            alert =>
                alert.category ===
                category
        );
}


/* ============================================================
   23. GET ALERTS BY LEVEL
============================================================ */

function getAlertsByLevel(
    level
) {

    return ALERT_ENGINE_STATE
        .alerts
        .filter(
            alert =>
                alert.level ===
                level
        );
}


/* ============================================================
   24. FIND ALERT
============================================================ */

function findAlert(
    alertId
) {

    return ALERT_ENGINE_STATE
        .alerts
        .find(
            alert =>
                alert.id ===
                alertId
        ) ||
        null;
}


/* ============================================================
   25. ACKNOWLEDGE ALERT
============================================================ */

function acknowledgeAlert(
    alertId
) {

    const alert =
        findAlert(
            alertId
        );


    if (
        !alert
    ) {

        return false;

    }


    alert.status =
        ALERT_STATUS.ACKNOWLEDGED;


    alert.acknowledged =
        true;


    alert.acknowledgedAt =
        new Date().toISOString();


    alert.updatedAt =
        alert.acknowledgedAt;


    ALERT_ENGINE_STATE.acknowledged.push(
        alertId
    );


    window.dispatchEvent(
        new CustomEvent(
            "agriguard:alertAcknowledged",
            {
                detail:
                    alert
            }
        )
    );


    return true;
}


/* ============================================================
   26. DISMISS ALERT
============================================================ */

function dismissAlert(
    alertId
) {

    const alert =
        findAlert(
            alertId
        );


    if (
        !alert
    ) {

        return false;

    }


    alert.status =
        ALERT_STATUS.DISMISSED;


    alert.dismissed =
        true;


    alert.dismissedAt =
        new Date().toISOString();


    alert.updatedAt =
        alert.dismissedAt;


    ALERT_ENGINE_STATE.dismissed.push(
        alertId
    );


    window.dispatchEvent(
        new CustomEvent(
            "agriguard:alertDismissed",
            {
                detail:
                    alert
            }
        )
    );


    return true;
}


/* ============================================================
   27. RESOLVE ALERT
============================================================ */

function resolveAlert(
    alertId
) {

    const alert =
        findAlert(
            alertId
        );


    if (
        !alert
    ) {

        return false;

    }


    alert.status =
        ALERT_STATUS.RESOLVED;


    alert.resolved =
        true;


    alert.resolvedAt =
        new Date().toISOString();


    alert.updatedAt =
        alert.resolvedAt;


    window.dispatchEvent(
        new CustomEvent(
            "agriguard:alertResolved",
            {
                detail:
                    alert
            }
        )
    );


    return true;
}


/* ============================================================
   28. ALERT AGE
============================================================ */

function getAlertAgeMinutes(
    alert
) {

    if (
        !alert ||
        !alert.createdAt
    ) {

        return null;

    }


    const created =
        new Date(
            alert.createdAt
        )
        .getTime();


    const now =
        Date.now();


    if (
        Number.isNaN(
            created
        )
    ) {

        return null;

    }


    return Math.max(
        0,
        Math.round(
            (
                now -
                created
            ) /
            60000
        )
    );
}


/* ============================================================
   29. ALERT DISPLAY MODEL
============================================================ */

/*
    This function makes it easy for app.js to
    render cards without understanding the
    internal alert structure.
*/

function getAlertDisplayModel(
    alert
) {

    if (
        !alert
    ) {

        return null;

    }


    return {

        id:
            alert.id,

        icon:
            alert.icon,

        severity:
            alert.severity,

        level:
            alert.level,

        colorClass:
            alert.colorClass,

        title:
            alert.title,

        message:
            alert.message,

        action:
            alert.action,

        explanation:
            alert.explanation,

        why:
            alert.why,

        timing:
            alert.timing,

        confidence:
            `${alert.confidence}%`,

        location:
            alert.location,

        status:
            alert.status,

        age:
            getAlertAgeMinutes(
                alert
            ),

        tags:
            alert.tags
    };
}


/* ============================================================
   30. DASHBOARD ALERT FEED
============================================================ */

function getDashboardAlertFeed(
    limit = 8
) {

    return getActiveAlerts()
        .slice(
            0,
            limit
        )
        .map(
            getAlertDisplayModel
        );
}


/* ============================================================
   31. CRITICAL ALERT COUNT
============================================================ */

function getCriticalAlertCount() {

    return getCriticalAlerts()
        .length;
}


/* ============================================================
   32. HIGH ALERT COUNT
============================================================ */

function getHighAlertCount() {

    return getHighAlerts()
        .length;
}


/* ============================================================
   33. HAS URGENT ALERT
============================================================ */

function hasUrgentAlert() {

    return (
        getCriticalAlertCount() >
        0
    );
}


/* ============================================================
   34. GENERATE ALERT BANNER
============================================================ */

function generateAlertBanner(
    alerts =
        ALERT_ENGINE_STATE.alerts
) {

    const critical =
        alerts.find(
            alert =>
                alert.level ===
                "CRITICAL"
        );


    if (
        critical
    ) {

        return {

            visible:
                true,

            type:
                "critical",

            icon:
                "🚨",

            title:
                critical.title,

            message:
                critical.message,

            action:
                critical.action,

            alertId:
                critical.id
        };
    }


    const high =
        alerts.find(
            alert =>
                alert.level ===
                "HIGH"
        );


    if (
        high
    ) {

        return {

            visible:
                true,

            type:
                "high",

            icon:
                "⚠️",

            title:
                high.title,

            message:
                high.message,

            action:
                high.action,

            alertId:
                high.id
        };
    }


    return {

        visible:
            false,

        type:
            "normal",

        icon:
            "✓",

        title:
            "Field Conditions Stable",

        message:
            "No critical alerts are currently active.",

        action:
            "Continue routine monitoring.",

        alertId:
            null
    };
}


/* ============================================================
   35. ALERT SOUND / NOTIFICATION DECISION
============================================================ */

/*
    The UI can use this to decide whether to show
    a browser notification / sound.

    No sound is triggered automatically here.
*/

function shouldNotifyUser(
    alert
) {

    if (
        !alert
    ) {

        return false;

    }


    if (
        alert.status !==
        ALERT_STATUS.ACTIVE
    ) {

        return false;

    }


    return (
        alert.level ===
            "CRITICAL" ||
        (
            alert.level ===
            "HIGH" &&
            alert.confidence >= 80
        )
    );
}


/* ============================================================
   36. NOTIFICATION PAYLOAD
============================================================ */

function getNotificationPayload(
    alert
) {

    if (
        !alert
    ) {

        return null;

    }


    return {

        title:
            `AgriGuard: ${alert.title}`,

        body:
            alert.message,

        icon:
            alert.icon,

        tag:
            alert.id,

        data: {

            alertId:
                alert.id,

            category:
                alert.category,

            level:
                alert.level,

            action:
                alert.action
        }
    };
}


/* ============================================================
   37. ALERT HEALTH SCORE
============================================================ */

/*
    A simple field alert health score:

        100 = no meaningful active alerts
         75 = low concern
         50 = moderate concern
         25 = high concern
          0 = critical concern
*/

function calculateAlertHealthScore(
    alerts =
        ALERT_ENGINE_STATE.alerts
) {

    const active =
        alerts.filter(
            alert =>
                alert.status ===
                ALERT_STATUS.ACTIVE
        );


    if (
        active.length ===
        0
    ) {

        return 100;

    }


    let penalty =
        0;


    active.forEach(
        alert => {

            switch (
                alert.level
            ) {

                case "CRITICAL":

                    penalty +=
                        40;

                    break;

                case "HIGH":

                    penalty +=
                        20;

                    break;

                case "MEDIUM":

                    penalty +=
                        10;

                    break;

                case "LOW":

                    penalty +=
                        3;

                    break;

                default:

                    penalty +=
                        0;
            }

        }
    );


    return Math.round(
        clampAlertScore(
            100 -
            penalty
        )
    );
}


/* ============================================================
   38. ALERT HEALTH LABEL
============================================================ */

function getAlertHealthLabel(
    score
) {

    const value =
        clampAlertScore(
            score
        );


    if (
        value >= 80
    ) {

        return {

            label:
                "Healthy",

            level:
                "LOW"
        };

    }


    if (
        value >= 60
    ) {

        return {

            label:
                "Watch",

            level:
                "MEDIUM"
        };

    }


    if (
        value >= 30
    ) {

        return {

            label:
                "At Risk",

            level:
                "HIGH"
        };

    }


    return {

        label:
            "Critical",

        level:
            "CRITICAL"
    };
}


/* ============================================================
   39. EXPORT TO JSON
============================================================ */

function exportAlertsJSON() {

    return JSON.stringify(
        {

            generatedAt:
                new Date().toISOString(),

            engineVersion:
                ALERT_ENGINE_STATE.version,

            alerts:
                ALERT_ENGINE_STATE.alerts,

            summary:
                getAlertSummary()
        },
        null,
        2
    );
}


/* ============================================================
   40. RESET ALERTS
============================================================ */

function resetAlerts() {

    ALERT_ENGINE_STATE.alerts =
        [];

    ALERT_ENGINE_STATE.acknowledged =
        [];

    ALERT_ENGINE_STATE.dismissed =
        [];

    ALERT_ENGINE_STATE.lastUpdated =
        new Date().toISOString();


    window.dispatchEvent(
        new CustomEvent(
            "agriguard:alertsReset"
        )
    );


    return true;
}


/* ============================================================
   41. PUBLIC API
============================================================ */

window.ALERT_ENGINE_STATE =
    ALERT_ENGINE_STATE;


window.ALERT_LEVELS =
    ALERT_LEVELS;


window.ALERT_CATEGORIES =
    ALERT_CATEGORIES;


window.ALERT_STATUS =
    ALERT_STATUS;


window.createAlert =
    createAlert;


window.normalizeAlertInput =
    normalizeAlertInput;


window.generateDiseaseAlerts =
    generateDiseaseAlerts;


window.generateWeatherAlerts =
    generateWeatherAlerts;


window.generateSoilAlerts =
    generateSoilAlerts;


window.generateOverallRiskAlert =
    generateOverallRiskAlert;


window.generateIrrigationAlert =
    generateIrrigationAlert;


window.generateRecommendationAlerts =
    generateRecommendationAlerts;


window.generateCrossFactorAlerts =
    generateCrossFactorAlerts;


window.generateAlerts =
    generateAlerts;


window.getAlertSummary =
    getAlertSummary;


window.getCriticalAlerts =
    getCriticalAlerts;


window.getHighAlerts =
    getHighAlerts;


window.getActiveAlerts =
    getActiveAlerts;


window.getAlertsByCategory =
    getAlertsByCategory;


window.getAlertsByLevel =
    getAlertsByLevel;


window.findAlert =
    findAlert;


window.acknowledgeAlert =
    acknowledgeAlert;


window.dismissAlert =
    dismissAlert;


window.resolveAlert =
    resolveAlert;


window.getAlertAgeMinutes =
    getAlertAgeMinutes;


window.getAlertDisplayModel =
    getAlertDisplayModel;


window.getDashboardAlertFeed =
    getDashboardAlertFeed;


window.getCriticalAlertCount =
    getCriticalAlertCount;


window.getHighAlertCount =
    getHighAlertCount;


window.hasUrgentAlert =
    hasUrgentAlert;


window.generateAlertBanner =
    generateAlertBanner;


window.shouldNotifyUser =
    shouldNotifyUser;


window.getNotificationPayload =
    getNotificationPayload;


window.calculateAlertHealthScore =
    calculateAlertHealthScore;


window.getAlertHealthLabel =
    getAlertHealthLabel;


window.exportAlertsJSON =
    exportAlertsJSON;


window.resetAlerts =
    resetAlerts;


/* ============================================================
   42. INITIALIZATION
============================================================ */

console.log(
    "%c🚨 AgriGuard AI Alert Engine",
    "font-size:16px;font-weight:bold;"
);

console.log(
    "Early-warning and alert system initialized."
);

console.log(
    "Version:",
    ALERT_ENGINE_STATE.version
);
