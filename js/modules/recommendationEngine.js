/* ============================================================
   AGRIGUARD AI
   SIH 2026 PROTOTYPE
   RECOMMENDATION & DECISION SUPPORT ENGINE
============================================================ */

/*
    PURPOSE
    -------
    Converts AgriGuard's intelligence outputs into
    clear, prioritized and explainable actions.

    INPUTS
    ------
    • Crop
    • Crop growth stage
    • Disease detection
    • Disease confidence
    • Overall risk score
    • Weather conditions
    • Soil health
    • Soil moisture
    • Soil pH
    • NPK status
    • Salinity
    • Irrigation requirement
    • Field conditions
    • Previous alerts

    OUTPUTS
    -------
    • Immediate actions
    • Today's actions
    • Preventive actions
    • Monitoring actions
    • Irrigation advice
    • Disease-management advice
    • Soil-management advice
    • Weather-aware advice
    • Priority
    • Confidence
    • Explainable reasons
    • Farmer-friendly summary

    DESIGN PRINCIPLE
    ----------------
    AgriGuard should not simply say:

        "Disease detected."

    It should answer:

        WHAT?
        WHY?
        HOW URGENT?
        WHAT SHOULD THE FARMER DO?
        WHAT SHOULD THE FARMER AVOID?
        WHEN SHOULD IT BE RECHECKED?

    IMPORTANT
    ---------
    This is a decision-support prototype.

    It deliberately avoids prescribing exact chemical
    pesticide/fertilizer dosages because those should be
    based on the crop, local label, soil test, formulation,
    growth stage and qualified agricultural guidance.
*/


/* ============================================================
   01. ENGINE STATE
============================================================ */

const RECOMMENDATION_ENGINE_STATE = {

    current:
        null,

    history:
        [],

    lastUpdated:
        null,

    version:
        "1.0.0",

    mode:
        "prototype",

    maxHistory:
        50
};


/* ============================================================
   02. PRIORITY DEFINITIONS
============================================================ */

const RECOMMENDATION_PRIORITY = {

    CRITICAL:
        100,

    URGENT:
        90,

    HIGH:
        75,

    MEDIUM:
        55,

    LOW:
        30,

    INFO:
        10
};


/* ============================================================
   03. CROP STAGES
============================================================ */

const CROP_STAGES = {

    seedling:
        "Seedling",

    vegetative:
        "Vegetative",

    flowering:
        "Flowering",

    fruiting:
        "Fruiting",

    maturity:
        "Maturity",

    harvest:
        "Harvest"
};


/* ============================================================
   04. NORMALIZE CROP NAME
============================================================ */

function normalizeCropName(
    crop
) {

    if (
        !crop
    ) {

        return "generic";

    }


    const value =
        String(
            crop
        )
        .toLowerCase()
        .trim();


    const aliases = {

        paddy:
            "rice",

        rice:
            "rice",

        tomato:
            "tomato",

        maize:
            "maize",

        corn:
            "maize",

        cotton:
            "cotton",

        chilli:
            "chili",

        chili:
            "chili",

        groundnut:
            "groundnut",

        peanut:
            "groundnut"
    };


    return (
        aliases[value] ||
        value
    );
}


/* ============================================================
   05. NORMALIZE STAGE
============================================================ */

function normalizeCropStage(
    stage
) {

    if (
        !stage
    ) {

        return "vegetative";

    }


    const value =
        String(
            stage
        )
        .toLowerCase()
        .trim();


    const aliases = {

        germination:
            "seedling",

        seedling:
            "seedling",

        early:
            "seedling",

        vegetative:
            "vegetative",

        growth:
            "vegetative",

        flowering:
            "flowering",

        bloom:
            "flowering",

        fruiting:
            "fruiting",

        fruit:
            "fruiting",

        maturity:
            "maturity",

        mature:
            "maturity",

        harvest:
            "harvest"
    };


    return (
        aliases[value] ||
        "vegetative"
    );
}


/* ============================================================
   06. SAFE NUMBER
============================================================ */

function safeNumber(
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
   07. CLAMP
============================================================ */

function clampRecommendation(
    value,
    min = 0,
    max = 100
) {

    return Math.min(
        max,
        Math.max(
            min,
            safeNumber(
                value
            )
        )
    );
}


/* ============================================================
   08. CREATE RECOMMENDATION
============================================================ */

function createRecommendation(
    config = {}
) {

    return {

        id:
            config.id ||
            `REC-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        category:
            config.category ||
            "general",

        priority:
            config.priority ||
            "MEDIUM",

        priorityScore:
            RECOMMENDATION_PRIORITY[
                config.priority ||
                "MEDIUM"
            ] ||
            55,

        title:
            config.title ||
            "Recommended Action",

        action:
            config.action ||
            "",

        reason:
            config.reason ||
            "",

        expectedBenefit:
            config.expectedBenefit ||
            "",

        timing:
            config.timing ||
            "As appropriate",

        confidence:
            clampRecommendation(
                config.confidence ??
                80
            ),

        source:
            config.source ||
            "AgriGuard AI",

        status:
            config.status ||
            "recommended",

        safety:
            config.safety ||
            "Follow local agricultural guidance and product labels.",

        tags:
            Array.isArray(
                config.tags
            )
                ? config.tags
                : [],

        createdAt:
            new Date().toISOString()
    };
}


/* ============================================================
   09. DISEASE NORMALIZATION
============================================================ */

function normalizeDiseaseData(
    disease
) {

    if (
        !disease
    ) {

        return {

            detected:
                false,

            name:
                "No disease detected",

            confidence:
                0,

            severity:
                "none",

            symptoms:
                [],

            source:
                "AgriGuard AI"
        };
    }


    /*
        Support different property names from
        possible diseaseDetection.js implementations.
    */

    const detected =
        Boolean(
            disease.detected ??
            disease.isDiseaseDetected ??
            (
                disease.name &&
                disease.name !==
                    "healthy"
            )
        );


    const name =
        disease.name ||
        disease.disease ||
        disease.prediction ||
        "Unknown condition";


    const confidence =
        clampRecommendation(
            disease.confidence ??
            disease.probability ??
            disease.score ??
            0
        );


    const severity =
        String(
            disease.severity ||
            disease.riskLevel ||
            "moderate"
        )
        .toLowerCase();


    const symptoms =
        Array.isArray(
            disease.symptoms
        )
            ? disease.symptoms
            : [];


    return {

        ...disease,

        detected,

        name,

        confidence,

        severity,

        symptoms
    };
}


/* ============================================================
   10. WEATHER NORMALIZATION
============================================================ */

function normalizeWeatherData(
    weather
) {

    if (
        !weather
    ) {

        return {

            temperature:
                null,

            humidity:
                null,

            rainfall24h:
                0,

            rainfallProbability:
                0,

            windSpeed:
                null,

            weatherRisk:
                0,

            condition:
                "Unknown",

            source:
                "AgriGuard AI"
        };
    }


    return {

        ...weather,

        temperature:
            safeNumber(
                weather.temperature ??
                weather.temp,
                null
            ),

        humidity:
            safeNumber(
                weather.humidity,
                null
            ),

        rainfall24h:
            Math.max(
                0,
                safeNumber(
                    weather.rainfall24h ??
                    weather.rainfall ??
                    weather.precipitation,
                    0
                )
            ),

        rainfallProbability:
            clampRecommendation(
                weather.rainfallProbability ??
                weather.rainProbability ??
                weather.precipitationProbability ??
                0
            ),

        windSpeed:
            safeNumber(
                weather.windSpeed ??
                weather.wind,
                null
            ),

        weatherRisk:
            clampRecommendation(
                weather.weatherRisk ??
                weather.riskScore ??
                0
            ),

        condition:
            weather.condition ||
            weather.description ||
            "Unknown"
    };
}


/* ============================================================
   11. SOIL NORMALIZATION
============================================================ */

function normalizeSoilRecommendationData(
    soil
) {

    if (
        !soil
    ) {

        return {

            available:
                false,

            soilHealthScore:
                null,

            soilStressScore:
                null,

            moisture:
                null,

            pH:
                null,

            salinityRisk:
                null,

            waterloggingRisk:
                null,

            nutrientBalance:
                null,

            irrigation:
                null,

            factors:
                [],

            recommendations:
                []
        };
    }


    return {

        ...soil,

        available:
            true,

        soilHealthScore:
            safeNumber(
                soil.soilHealthScore ??
                soil.healthScore,
                null
            ),

        soilStressScore:
            safeNumber(
                soil.soilStressScore ??
                soil.stressScore,
                null
            ),

        moisture:
            safeNumber(
                soil.moisture ??
                soil.soil?.moisture,
                null
            ),

        pH:
            safeNumber(
                soil.pH ??
                soil.soil?.pH,
                null
            ),

        salinityRisk:
            safeNumber(
                soil.salinityRisk,
                null
            ),

        waterloggingRisk:
            safeNumber(
                soil.waterloggingRisk,
                null
            )
    };
}


/* ============================================================
   12. RISK NORMALIZATION
============================================================ */

function normalizeRiskData(
    risk
) {

    if (
        !risk
    ) {

        return {

            overall:
                0,

            disease:
                0,

            weather:
                0,

            soil:
                0,

            pest:
                0,

            water:
                0
        };
    }


    return {

        ...risk,

        overall:
            clampRecommendation(
                risk.overall ??
                risk.overallRisk ??
                risk.riskScore ??
                0
            ),

        disease:
            clampRecommendation(
                risk.disease ??
                risk.diseaseRisk ??
                0
            ),

        weather:
            clampRecommendation(
                risk.weather ??
                risk.weatherRisk ??
                0
            ),

        soil:
            clampRecommendation(
                risk.soil ??
                risk.soilRisk ??
                0
            ),

        pest:
            clampRecommendation(
                risk.pest ??
                risk.pestRisk ??
                0
            ),

        water:
            clampRecommendation(
                risk.water ??
                risk.waterRisk ??
                0
            )
    };
}


/* ============================================================
   13. OVERALL RISK CLASSIFICATION
============================================================ */

function classifyOverallRisk(
    score
) {

    const value =
        clampRecommendation(
            score
        );


    if (
        value >= 85
    ) {

        return {

            level:
                "CRITICAL",

            label:
                "Critical Risk",

            message:
                "Immediate field attention is recommended."
        };

    }


    if (
        value >= 70
    ) {

        return {

            level:
                "HIGH",

            label:
                "High Risk",

            message:
                "Priority management action is recommended."
        };

    }


    if (
        value >= 50
    ) {

        return {

            level:
                "MEDIUM",

            label:
                "Moderate Risk",

            message:
                "Monitor closely and take preventive action."
        };

    }


    if (
        value >= 25
    ) {

        return {

            level:
                "LOW",

            label:
                "Low Risk",

            message:
                "Continue monitoring field conditions."
        };

    }


    return {

        level:
            "INFO",

        label:
            "Normal",

        message:
            "No major immediate risk identified."
    };
}


/* ============================================================
   14. DISEASE RECOMMENDATIONS
============================================================ */

function generateDiseaseRecommendations(
    disease,
    crop,
    stage,
    weather
) {

    const recommendations = [];


    if (
        !disease.detected
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "DISEASE-PREVENTION",

                category:
                    "disease",

                priority:
                    "LOW",

                title:
                    "Continue Disease Monitoring",

                action:
                    "Inspect representative plants regularly for new spots, lesions, discoloration, wilting or abnormal growth.",

                reason:
                    "No confirmed disease signal is currently available.",

                expectedBenefit:
                    "Early detection reduces the chance of rapid field-level spread.",

                timing:
                    "Regular field scouting",

                confidence:
                    80,

                tags:
                    [
                        "prevention",
                        "monitoring"
                    ]
            })
        );


        return recommendations;
    }


    /*
        Disease detected
    */

    const confidence =
        disease.confidence;


    let priority =
        "MEDIUM";


    if (
        confidence >= 90
    ) {

        priority =
            "URGENT";

    } else if (
        confidence >= 75
    ) {

        priority =
            "HIGH";

    }


    /*
        Severe disease increases urgency.
    */

    if (
        disease.severity.includes(
            "critical"
        ) ||
        disease.severity.includes(
            "severe"
        )
    ) {

        priority =
            "CRITICAL";

    }


    recommendations.push(
        createRecommendation({

            id:
                "DISEASE-CONTAIN",

            category:
                "disease",

            priority,

            title:
                `Inspect and Isolate Affected Plants`,

            action:
                `Inspect the suspected ${disease.name} symptoms in the field and separate heavily affected plant material where practical.`,

            reason:
                `The detection module identified ${disease.name} with approximately ${confidence}% confidence.`,

            expectedBenefit:
                "Helps reduce further spread and improves confirmation accuracy.",

            timing:
                priority === "CRITICAL" ||
                priority === "URGENT"
                    ? "Today"
                    : "Within 24 hours",

            confidence,

            tags:
                [
                    "disease",
                    "containment",
                    crop,
                    stage
                ]
        })
    );


    /*
        Avoid wet-field operations if weather
        increases fungal/bacterial spread risk.
    */

    if (
        weather.humidity !== null &&
        weather.humidity >= 80
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "DISEASE-HUMIDITY",

                category:
                    "disease",

                priority:
                    "HIGH",

                title:
                    "Increase Disease Surveillance",

                action:
                    "Prioritize inspection of dense canopy areas and lower leaves, especially where moisture remains on foliage.",

                reason:
                    `Relative humidity is around ${weather.humidity}%, creating conditions that can favor several moisture-associated diseases.`,

                expectedBenefit:
                    "Earlier detection of disease progression.",

                timing:
                    "Today and next 48 hours",

                confidence:
                    82,

                tags:
                    [
                        "humidity",
                        "fungal-risk",
                        "monitoring"
                    ]
            })
        );

    }


    /*
        Rainfall warning
    */

    if (
        weather.rainfallProbability >= 70 ||
        weather.rainfall24h >= 10
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "DISEASE-RAIN",

                category:
                    "disease",

                priority:
                    "HIGH",

                title:
                    "Avoid Unnecessary Wet-Field Operations",

                action:
                    "Avoid unnecessary irrigation and plan field operations around rainfall where possible.",

                reason:
                    "Wet conditions can increase disease-favorable leaf and soil moisture.",

                expectedBenefit:
                    "Reduces prolonged moisture exposure and avoids unnecessary water input.",

                timing:
                    "Before the next rainfall event",

                confidence:
                    85,

                tags:
                    [
                        "rain",
                        "disease-prevention"
                    ]
            })
        );

    }


    /*
        Chemical treatment guidance is intentionally
        generic and label-aware.
    */

    recommendations.push(
        createRecommendation({

            id:
                "DISEASE-CONFIRM",

            category:
                "disease",

            priority:
                confidence >= 85
                    ? "HIGH"
                    : "MEDIUM",

            title:
                "Confirm Diagnosis Before Treatment",

            action:
                "Compare symptoms with a trusted agricultural diagnostic source or local extension/agriculture expert before selecting a treatment.",

            reason:
                `AI image detection is a screening tool and should not be treated as definitive laboratory diagnosis.`,

            expectedBenefit:
                "Reduces incorrect treatment and unnecessary chemical use.",

            timing:
                "Before treatment",

            confidence:
                95,

            safety:
                "Use only legally registered products and follow the current product label and local agricultural guidance.",

            tags:
                [
                    "verification",
                    "responsible-use"
                ]
        })
    );


    return recommendations;
}


/* ============================================================
   15. WEATHER RECOMMENDATIONS
============================================================ */

function generateWeatherRecommendations(
    weather,
    crop,
    stage
) {

    const recommendations = [];


    /*
        Heavy rain
    */

    if (
        weather.rainfall24h >= 25
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "WEATHER-HEAVY-RAIN",

                category:
                    "weather",

                priority:
                    "HIGH",

                title:
                    "Inspect Drainage After Heavy Rain",

                action:
                    "Check field drainage, standing water and low-lying areas after rainfall.",

                reason:
                    `${weather.rainfall24h} mm of recent rainfall can increase waterlogging and root-zone stress.`,

                expectedBenefit:
                    "Early removal of standing water can reduce root stress.",

                timing:
                    "Within 24 hours after rainfall",

                confidence:
                    90,

                tags:
                    [
                        "rain",
                        "drainage",
                        "waterlogging"
                    ]
            })
        );

    }


    /*
        High rainfall probability
    */

    if (
        weather.rainfallProbability >= 70
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "WEATHER-DEFER-IRRIGATION",

                category:
                    "irrigation",

                priority:
                    "HIGH",

                title:
                    "Consider Deferring Irrigation",

                action:
                    "Recheck soil moisture before irrigating; rainfall may reduce the crop's immediate water requirement.",

                reason:
                    `Rainfall probability is approximately ${weather.rainfallProbability}%.`,

                expectedBenefit:
                    "Prevents unnecessary irrigation and water wastage.",

                timing:
                    "Before the next irrigation cycle",

                confidence:
                    88,

                tags:
                    [
                        "rain",
                        "water-saving"
                    ]
            })
        );

    }


    /*
        High temperature
    */

    if (
        weather.temperature !== null &&
        weather.temperature >= 35
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "WEATHER-HEAT",

                category:
                    "weather",

                priority:
                    "HIGH",

                title:
                    "Monitor Heat Stress",

                action:
                    "Inspect leaves during the hottest part of the day and prioritize moisture monitoring.",

                reason:
                    `Forecast/observed temperature is around ${weather.temperature}°C.`,

                expectedBenefit:
                    "Helps identify heat and water stress before visible damage becomes severe.",

                timing:
                    "Today",

                confidence:
                    85,

                tags:
                    [
                        "heat",
                        "water-stress"
                    ]
            })
        );

    }


    /*
        Low temperature
    */

    if (
        weather.temperature !== null &&
        weather.temperature <= 12
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "WEATHER-COLD",

                category:
                    "weather",

                priority:
                    "MEDIUM",

                title:
                    "Monitor Cold Stress",

                action:
                    "Inspect sensitive growth and young plants for cold-related stress.",

                reason:
                    `Temperature is around ${weather.temperature}°C.`,

                expectedBenefit:
                    "Early identification of temperature stress.",

                timing:
                    "Today and next morning",

                confidence:
                    82,

                tags:
                    [
                        "cold",
                        "monitoring"
                    ]
            })
        );

    }


    /*
        High wind
    */

    if (
        weather.windSpeed !== null &&
        weather.windSpeed >= 35
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "WEATHER-WIND",

                category:
                    "weather",

                priority:
                    "HIGH",

                title:
                    "Avoid Risky Spraying During Strong Winds",

                action:
                    "Avoid pesticide or foliar application during strong winds and follow the product label for safe application conditions.",

                reason:
                    `Wind speed is around ${weather.windSpeed} km/h.`,

                expectedBenefit:
                    "Reduces drift, off-target exposure and application losses.",

                timing:
                    "Until wind conditions improve",

                confidence:
                    94,

                safety:
                    "Follow product-label wind limits and local regulations.",

                tags:
                    [
                        "wind",
                        "spraying",
                        "safety"
                    ]
            })
        );

    }


    return recommendations;
}


/* ============================================================
   16. SOIL RECOMMENDATIONS
============================================================ */

function generateSoilRecommendations(
    soil,
    crop,
    stage
) {

    const recommendations = [];


    if (
        !soil.available
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-DATA",

                category:
                    "soil",

                priority:
                    "LOW",

                title:
                    "Collect Soil Information",

                action:
                    "Add recent soil-test or sensor readings for moisture, pH and NPK to improve field-level recommendations.",

                reason:
                    "Soil information is currently unavailable or incomplete.",

                expectedBenefit:
                    "Improves irrigation, nutrient and soil-health decisions.",

                timing:
                    "When convenient",

                confidence:
                    95,

                tags:
                    [
                        "soil-test",
                        "data"
                    ]
            })
        );


        return recommendations;
    }


    /*
        Poor soil health
    */

    if (
        soil.soilHealthScore !== null &&
        soil.soilHealthScore < 50
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-HEALTH",

                category:
                    "soil",

                priority:
                    "HIGH",

                title:
                    "Prioritize Soil Health Assessment",

                action:
                    "Review soil-test parameters and identify the main limiting factors before applying corrective inputs.",

                reason:
                    `Current soil health score is ${soil.soilHealthScore}/100.`,

                expectedBenefit:
                    "Targets the actual limiting factor instead of applying unnecessary inputs.",

                timing:
                    "Within the next management cycle",

                confidence:
                    90,

                tags:
                    [
                        "soil-health",
                        "soil-test"
                    ]
            })
        );

    }


    /*
        Low moisture
    */

    if (
        soil.moisture !== null &&
        soil.moisture < 40
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-DRY",

                category:
                    "irrigation",

                priority:
                    "HIGH",

                title:
                    "Check Soil Moisture Before Irrigation",

                action:
                    "Verify root-zone moisture and irrigate according to crop requirement and local water availability.",

                reason:
                    `Soil moisture is approximately ${soil.moisture}%.`,

                expectedBenefit:
                    "Reduces water stress while avoiding unnecessary over-irrigation.",

                timing:
                    "Today",

                confidence:
                    88,

                tags:
                    [
                        "moisture",
                        "irrigation"
                    ]
            })
        );

    }


    /*
        High moisture
    */

    if (
        soil.moisture !== null &&
        soil.moisture >= 80
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-WET",

                category:
                    "irrigation",

                priority:
                    "HIGH",

                title:
                    "Avoid Additional Irrigation",

                action:
                    "Do not add irrigation until root-zone moisture is reassessed.",

                reason:
                    `Soil moisture is approximately ${soil.moisture}%.`,

                expectedBenefit:
                    "Reduces waterlogging and root-zone oxygen stress.",

                timing:
                    "Until moisture falls into the target range",

                confidence:
                    92,

                tags:
                    [
                        "waterlogging",
                        "water-saving"
                    ]
            })
        );

    }


    /*
        Waterlogging
    */

    if (
        soil.waterloggingRisk !== null &&
        soil.waterloggingRisk >= 60
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-WATERLOG",

                category:
                    "drainage",

                priority:
                    soil.waterloggingRisk >= 80
                        ? "URGENT"
                        : "HIGH",

                title:
                    "Inspect Field Drainage",

                action:
                    "Check standing water and blocked drainage channels, particularly in low-lying sections of the field.",

                reason:
                    `Estimated waterlogging risk is ${soil.waterloggingRisk}/100.`,

                expectedBenefit:
                    "Reduces root-zone stress and prolonged saturation.",

                timing:
                    "Today",

                confidence:
                    91,

                tags:
                    [
                        "waterlogging",
                        "drainage"
                    ]
            })
        );

    }


    /*
        Salinity
    */

    if (
        soil.salinityRisk !== null &&
        soil.salinityRisk >= 60
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-SALINITY",

                category:
                    "soil",

                priority:
                    soil.salinityRisk >= 80
                        ? "HIGH"
                        : "MEDIUM",

                title:
                    "Investigate Salinity Pressure",

                action:
                    "Confirm electrical conductivity with a reliable soil test and review irrigation-water quality and drainage.",

                reason:
                    `Estimated salinity risk is ${soil.salinityRisk}/100.`,

                expectedBenefit:
                    "Identifies potential salt accumulation before crop productivity is affected.",

                timing:
                    "Within the next soil-management cycle",

                confidence:
                    88,

                tags:
                    [
                        "salinity",
                        "soil-test",
                        "water-quality"
                    ]
            })
        );

    }


    /*
        Low pH
    */

    if (
        soil.pH !== null &&
        soil.pH < 5.5
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-LOW-PH",

                category:
                    "soil",

                priority:
                    "HIGH",

                title:
                    "Verify Acidic Soil Condition",

                action:
                    "Confirm soil pH with a laboratory or reliable soil test before selecting an amendment.",

                reason:
                    `Measured/estimated soil pH is ${soil.pH}.`,

                expectedBenefit:
                    "Improves nutrient availability and prevents inappropriate amendment use.",

                timing:
                    "Before applying soil amendments",

                confidence:
                    94,

                safety:
                    "Use soil-test-based amendment recommendations from qualified local agricultural guidance.",

                tags:
                    [
                        "ph",
                        "soil-test"
                    ]
            })
        );

    }


    /*
        High pH
    */

    if (
        soil.pH !== null &&
        soil.pH > 8
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-HIGH-PH",

                category:
                    "soil",

                priority:
                    "HIGH",

                title:
                    "Verify Alkaline Soil Condition",

                action:
                    "Confirm soil pH and investigate nutrient availability before applying corrective amendments.",

                reason:
                    `Measured/estimated soil pH is ${soil.pH}.`,

                expectedBenefit:
                    "Helps identify nutrient-availability constraints.",

                timing:
                    "Before corrective treatment",

                confidence:
                    94,

                tags:
                    [
                        "ph",
                        "nutrient-availability"
                    ]
            })
        );

    }


    /*
        Organic matter
    */

    if (
        soil.soil?.organicCarbon !==
            undefined &&
        safeNumber(
            soil.soil.organicCarbon
        ) < 0.5
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "SOIL-ORGANIC",

                category:
                    "soil-health",

                priority:
                    "MEDIUM",

                title:
                    "Improve Organic Matter Management",

                action:
                    "Consider locally suitable organic-matter practices such as residue management, compost or other approved soil-health practices.",

                reason:
                    "Low organic carbon can reduce soil structure, nutrient cycling and water-holding performance.",

                expectedBenefit:
                    "Supports long-term soil structure and nutrient cycling.",

                timing:
                    "Long-term soil-health plan",

                confidence:
                    82,

                tags:
                    [
                        "organic-matter",
                        "soil-health"
                    ]
            })
        );

    }


    return recommendations;
}


/* ============================================================
   17. IRRIGATION RECOMMENDATIONS
============================================================ */

function generateIrrigationRecommendations(
    soil,
    weather
) {

    const recommendations = [];


    if (
        !soil.irrigation
    ) {

        return recommendations;

    }


    const irrigation =
        soil.irrigation;


    if (
        irrigation.priority ===
        "URGENT"
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "IRRIGATION-URGENT",

                category:
                    "irrigation",

                priority:
                    "URGENT",

                title:
                    "Irrigation Priority: Urgent",

                action:
                    "Verify root-zone moisture and provide irrigation according to crop water requirement and local water availability.",

                reason:
                    "Soil moisture is below the selected crop's target range.",

                expectedBenefit:
                    "Reduces crop water stress.",

                timing:
                    "Today",

                confidence:
                    90,

                tags:
                    [
                        "irrigation",
                        "water-stress"
                    ]
            })
        );

    }


    if (
        irrigation.priority ===
        "HIGH"
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "IRRIGATION-HIGH",

                category:
                    "irrigation",

                priority:
                    "HIGH",

                title:
                    "Irrigation Recommended",

                action:
                    "Check root-zone moisture and irrigate if the crop is showing water stress.",

                reason:
                    "Soil moisture is trending below the preferred range.",

                expectedBenefit:
                    "Maintains adequate crop water availability.",

                timing:
                    "Next irrigation cycle",

                confidence:
                    86,

                tags:
                    [
                        "irrigation"
                    ]
            })
        );

    }


    if (
        irrigation.priority ===
        "DEFER"
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "IRRIGATION-DEFER",

                category:
                    "irrigation",

                priority:
                    "HIGH",

                title:
                    "Defer Irrigation",

                action:
                    "Recheck soil moisture after the expected rainfall before irrigating.",

                reason:
                    irrigation.weatherModifier ||
                    "Weather conditions may provide sufficient water.",

                expectedBenefit:
                    "Avoids unnecessary water use.",

                timing:
                    "After rainfall",

                confidence:
                    91,

                tags:
                    [
                        "water-saving",
                        "rain"
                    ]
            })
        );

    }


    if (
        irrigation.priority ===
        "AVOID"
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "IRRIGATION-AVOID",

                category:
                    "irrigation",

                priority:
                    "HIGH",

                title:
                    "Avoid Irrigation",

                action:
                    "Do not irrigate until soil moisture is reassessed.",

                reason:
                    "Current conditions indicate excessive moisture or substantial rainfall.",

                expectedBenefit:
                    "Reduces waterlogging and root-zone stress.",

                timing:
                    "Until conditions improve",

                confidence:
                    94,

                tags:
                    [
                        "waterlogging",
                        "water-saving"
                    ]
            })
        );

    }


    /*
        If no irrigation issue exists,
        provide water conservation guidance.
    */

    if (
        recommendations.length === 0
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "IRRIGATION-MONITOR",

                category:
                    "irrigation",

                priority:
                    "LOW",

                title:
                    "Maintain Moisture Monitoring",

                action:
                    "Continue checking root-zone moisture before each irrigation cycle.",

                reason:
                    "No immediate irrigation stress was identified.",

                expectedBenefit:
                    "Supports efficient water use.",

                timing:
                    "Before irrigation",

                confidence:
                    88,

                tags:
                    [
                        "water-saving",
                        "monitoring"
                    ]
            })
        );

    }


    return recommendations;
}


/* ============================================================
   18. CROP-STAGE RECOMMENDATIONS
============================================================ */

function generateCropStageRecommendations(
    crop,
    stage
) {

    const recommendations = [];


    switch (
        stage
    ) {

        case "seedling":

            recommendations.push(
                createRecommendation({

                    id:
                        "STAGE-SEEDLING",

                    category:
                        "crop-stage",

                    priority:
                        "MEDIUM",

                    title:
                        "Protect Early Growth",

                    action:
                        "Monitor seedling establishment, moisture and early pest/disease symptoms closely.",

                    reason:
                        "Young plants can be particularly sensitive to moisture and pest stress.",

                    expectedBenefit:
                        "Improves early crop establishment.",

                    timing:
                        "Frequent monitoring",

                    confidence:
                        85,

                    tags:
                        [
                            "seedling",
                            "monitoring"
                        ]
                })
            );

            break;


        case "vegetative":

            recommendations.push(
                createRecommendation({

                    id:
                        "STAGE-VEGETATIVE",

                    category:
                        "crop-stage",

                    priority:
                        "MEDIUM",

                    title:
                        "Monitor Vegetative Growth",

                    action:
                        "Track canopy development, nutrient status, moisture and early pest/disease symptoms.",

                    reason:
                        "Vegetative growth determines much of the crop's canopy development.",

                    expectedBenefit:
                        "Supports healthy crop establishment and canopy development.",

                    timing:
                        "Weekly or according to field conditions",

                    confidence:
                        84,

                    tags:
                        [
                            "vegetative",
                            "growth"
                        ]
                })
            );

            break;


        case "flowering":

            recommendations.push(
                createRecommendation({

                    id:
                        "STAGE-FLOWERING",

                    category:
                        "crop-stage",

                    priority:
                        "HIGH",

                    title:
                        "Protect Flowering Stage",

                    action:
                        "Maintain stable moisture and monitor closely for heat, disease and pest stress during flowering.",

                    reason:
                        "Flowering can be sensitive to environmental and biotic stress.",

                    expectedBenefit:
                        "Supports flowering and potential yield formation.",

                    timing:
                        "Daily monitoring during stress events",

                    confidence:
                        88,

                    tags:
                        [
                            "flowering",
                            "yield"
                        ]
                })
            );

            break;


        case "fruiting":

            recommendations.push(
                createRecommendation({

                    id:
                        "STAGE-FRUITING",

                    category:
                        "crop-stage",

                    priority:
                        "HIGH",

                    title:
                        "Protect Fruit Development",

                    action:
                        "Monitor water availability, disease pressure and nutrient balance during fruit development.",

                    reason:
                        "Stress during fruit development can affect crop quality and yield.",

                    expectedBenefit:
                        "Supports fruit development and crop quality.",

                    timing:
                        "Frequent monitoring",

                    confidence:
                        87,

                    tags:
                        [
                            "fruiting",
                            "yield"
                        ]
                })
            );

            break;


        case "maturity":

            recommendations.push(
                createRecommendation({

                    id:
                        "STAGE-MATURITY",

                    category:
                        "crop-stage",

                    priority:
                        "MEDIUM",

                    title:
                        "Monitor Crop Maturity",

                    action:
                        "Monitor maturity indicators, disease progression and field conditions while preparing for harvest.",

                    reason:
                        "Late-season conditions can affect harvest quality.",

                    expectedBenefit:
                        "Supports timely and efficient harvest planning.",

                    timing:
                        "Regular pre-harvest scouting",

                    confidence:
                        84,

                    tags:
                        [
                            "maturity",
                            "harvest"
                        ]
                })
            );

            break;


        case "harvest":

            recommendations.push(
                createRecommendation({

                    id:
                        "STAGE-HARVEST",

                    category:
                        "crop-stage",

                    priority:
                        "HIGH",

                    title:
                        "Plan Harvest Around Field Conditions",

                    action:
                        "Coordinate harvest timing with crop maturity, weather and field accessibility.",

                    reason:
                        "Weather and field moisture can affect harvest operations and post-harvest quality.",

                    expectedBenefit:
                        "Reduces avoidable harvest losses.",

                    timing:
                        "Before harvest",

                    confidence:
                        88,

                    tags:
                        [
                            "harvest",
                            "planning"
                        ]
                })
            );

            break;

    }


    return recommendations;
}


/* ============================================================
   19. WATER-SAVING RECOMMENDATIONS
============================================================ */

function generateWaterSavingRecommendations(
    soil,
    weather
) {

    const recommendations = [];


    const rainfallLikely =
        weather.rainfallProbability >= 60 ||
        weather.rainfall24h >= 10;


    const soilMoistureGood =
        soil.moisture !== null &&
        soil.moisture >= 50 &&
        soil.moisture <= 75;


    if (
        rainfallLikely
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "WATER-RAIN",

                category:
                    "water-management",

                priority:
                    "MEDIUM",

                title:
                    "Use Rainfall Opportunity",

                action:
                    "Recheck soil moisture after rainfall before scheduling the next irrigation cycle.",

                reason:
                    "Recent or forecast rainfall may reduce irrigation demand.",

                expectedBenefit:
                    "Reduces water consumption.",

                timing:
                    "After rainfall",

                confidence:
                    90,

                tags:
                    [
                        "water-saving",
                        "rainfall"
                    ]
            })
        );

    }


    if (
        soilMoistureGood
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "WATER-MOISTURE",

                category:
                    "water-management",

                priority:
                    "LOW",

                title:
                    "Avoid Calendar-Only Irrigation",

                action:
                    "Use actual root-zone moisture and crop condition to decide the next irrigation rather than irrigating only by a fixed schedule.",

                reason:
                    `Current soil moisture is ${soil.moisture}%.`,

                expectedBenefit:
                    "Improves irrigation efficiency.",

                timing:
                    "Every irrigation cycle",

                confidence:
                    91,

                tags:
                    [
                        "smart-irrigation",
                        "water-saving"
                    ]
            })
        );

    }


    return recommendations;
}


/* ============================================================
   20. PREVENTIVE RECOMMENDATIONS
============================================================ */

function generatePreventiveRecommendations(
    context
) {

    const recommendations = [];


    /*
        General scouting
    */

    recommendations.push(
        createRecommendation({

            id:
                "PREVENTIVE-SCOUT",

            category:
                "prevention",

            priority:
                "LOW",

            title:
                "Perform Structured Field Scouting",

            action:
                "Inspect multiple representative locations instead of relying on a single plant or image.",

            reason:
                "Field-level variability can cause localized problems that a single sample may miss.",

            expectedBenefit:
                "Improves early detection and decision confidence.",

            timing:
                "Regularly",

            confidence:
                92,

            tags:
                [
                    "scouting",
                    "prevention"
                ]
        })
    );


    /*
        High overall risk
    */

    if (
        context.risk.overall >= 70
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "PREVENTIVE-HIGH-RISK",

                category:
                    "risk",

                priority:
                    "HIGH",

                title:
                    "Increase Monitoring Frequency",

                action:
                    "Increase field inspection frequency until the major risk drivers return to normal.",

                reason:
                    `Overall field risk is currently ${context.risk.overall}/100.`,

                expectedBenefit:
                    "Reduces the chance of missing rapid changes.",

                timing:
                    "Daily during elevated risk",

                confidence:
                    91,

                tags:
                    [
                        "risk",
                        "monitoring"
                    ]
            })
        );

    }


    /*
        Low confidence disease detection
    */

    if (
        context.disease.detected &&
        context.disease.confidence < 70
    ) {

        recommendations.push(
            createRecommendation({

                id:
                    "PREVENTIVE-VERIFY",

                category:
                    "verification",

                priority:
                    "HIGH",

                title:
                    "Capture Additional Diagnostic Images",

                action:
                    "Capture clear images of multiple affected leaves/plants under good lighting and compare the symptoms before taking treatment decisions.",

                reason:
                    `Disease detection confidence is only ${context.disease.confidence}%.`,

                expectedBenefit:
                    "Improves diagnostic confidence.",

                timing:
                    "As soon as practical",

                confidence:
                    95,

                tags:
                    [
                        "ai",
                        "verification",
                        "image-quality"
                    ]
            })
        );

    }


    return recommendations;
}


/* ============================================================
   21. MAIN RECOMMENDATION GENERATOR
============================================================ */

function generateRecommendations(
    input = {}
) {

    /*
        Normalize all incoming intelligence.
    */

    const crop =
        normalizeCropName(
            input.crop ||
            input.cropName
        );


    const stage =
        normalizeCropStage(
            input.cropStage ||
            input.stage
        );


    const disease =
        normalizeDiseaseData(
            input.disease ||
            input.diseaseDetection ||
            input.detection
        );


    const weather =
        normalizeWeatherData(
            input.weather
        );


    const soil =
        normalizeSoilRecommendationData(
            input.soil ||
            input.soilAnalysis
        );


    const risk =
        normalizeRiskData(
            input.risk ||
            input.riskAnalysis
        );


    /*
        Build context.
    */

    const context = {

        crop,

        stage,

        disease,

        weather,

        soil,

        risk,

        field:
            input.field ||
            null,

        location:
            input.location ||
            null
    };


    let recommendations = [];


    /*
        Generate intelligence-specific recommendations.
    */

    recommendations.push(
        ...generateDiseaseRecommendations(
            disease,
            crop,
            stage,
            weather
        )
    );


    recommendations.push(
        ...generateWeatherRecommendations(
            weather,
            crop,
            stage
        )
    );


    recommendations.push(
        ...generateSoilRecommendations(
            soil,
            crop,
            stage
        )
    );


    recommendations.push(
        ...generateIrrigationRecommendations(
            soil,
            weather
        )
    );


    recommendations.push(
        ...generateCropStageRecommendations(
            crop,
            stage
        )
    );


    recommendations.push(
        ...generateWaterSavingRecommendations(
            soil,
            weather
        )
    );


    recommendations.push(
        ...generatePreventiveRecommendations(
            context
        )
    );


    /*
        Add incoming recommendations from soil engine
        if available.
    */

    if (
        Array.isArray(
            soil.recommendations
        )
    ) {

        soil.recommendations
            .forEach(
                item => {

                    recommendations.push(
                        createRecommendation({

                            id:
                                `SOIL-${Math.random()
                                    .toString(36)
                                    .slice(2, 9)}`,

                            category:
                                "soil",

                            priority:
                                item.priority ||
                                "MEDIUM",

                            title:
                                item.status ||
                                "Soil Recommendation",

                            action:
                                item.recommendation ||
                                "",

                            reason:
                                "Generated from soil intelligence.",

                            expectedBenefit:
                                "Improves field-specific soil management.",

                            timing:
                                "As appropriate",

                            confidence:
                                85,

                            tags:
                                [
                                    "soil",
                                    "engine"
                                ]
                        })
                    );

                }
            );

    }


    /*
        Deduplicate recommendations.
    */

    recommendations =
        deduplicateRecommendations(
            recommendations
        );


    /*
        Sort by priority.
    */

    recommendations.sort(
        (
            a,
            b
        ) => {

            if (
                b.priorityScore !==
                a.priorityScore
            ) {

                return (
                    b.priorityScore -
                    a.priorityScore
                );

            }


            return (
                b.confidence -
                a.confidence
            );

        }
    );


    /*
        Limit dashboard output.

        Keep all recommendations in `all`.
    */

    const topRecommendations =
        recommendations.slice(
            0,
            12
        );


    const immediate =
        recommendations.filter(
            item =>
                [
                    "CRITICAL",
                    "URGENT"
                ].includes(
                    item.priority
                )
        );


    const today =
        recommendations.filter(
            item =>
                [
                    "CRITICAL",
                    "URGENT",
                    "HIGH"
                ].includes(
                    item.priority
                )
        );


    const preventive =
        recommendations.filter(
            item =>
                [
                    "MEDIUM",
                    "LOW",
                    "INFO"
                ].includes(
                    item.priority
                )
        );


    /*
        Generate farmer summary.
    */

    const summary =
        generateFarmerSummary(
            context,
            recommendations
        );


    /*
        Determine decision confidence.
    */

    const confidence =
        calculateDecisionConfidence(
            context,
            recommendations
        );


    /*
        Create final result.
    */

    const result = {

        success:
            true,

        crop,

        cropStage:
            stage,

        cropStageLabel:
            CROP_STAGES[
                stage
            ],

        overallRisk:
            classifyOverallRisk(
                risk.overall
            ),

        riskScore:
            risk.overall,

        decisionConfidence:
            confidence,

        summary,

        immediate,

        today,

        preventive,

        recommendations:
            topRecommendations,

        all:
            recommendations,

        counts: {

            total:
                recommendations.length,

            critical:
                recommendations.filter(
                    item =>
                        item.priority ===
                        "CRITICAL"
                ).length,

            urgent:
                recommendations.filter(
                    item =>
                        item.priority ===
                        "URGENT"
                ).length,

            high:
                recommendations.filter(
                    item =>
                        item.priority ===
                        "HIGH"
                ).length,

            medium:
                recommendations.filter(
                    item =>
                        item.priority ===
                        "MEDIUM"
                ).length,

            low:
                recommendations.filter(
                    item =>
                        item.priority ===
                        "LOW"
                ).length
        },

        context,

        generatedAt:
            new Date().toISOString(),

        engineVersion:
            RECOMMENDATION_ENGINE_STATE.version
    };


    /*
        Save state.
    */

    RECOMMENDATION_ENGINE_STATE.current =
        result;


    RECOMMENDATION_ENGINE_STATE.lastUpdated =
        result.generatedAt;


    RECOMMENDATION_ENGINE_STATE.history.unshift(
        result
    );


    if (
        RECOMMENDATION_ENGINE_STATE.history.length >
        RECOMMENDATION_ENGINE_STATE.maxHistory
    ) {

        RECOMMENDATION_ENGINE_STATE.history.pop();

    }


    /*
        Update global APP_STATE if available.
    */

    if (
        typeof APP_STATE !==
        "undefined"
    ) {

        APP_STATE.recommendations =
            result;

    }


    /*
        Emit event for dashboard.
    */

    window.dispatchEvent(
        new CustomEvent(
            "agriguard:recommendationsUpdated",
            {
                detail:
                    result
            }
        )
    );


    return result;
}


/* ============================================================
   22. DEDUPLICATE
============================================================ */

function deduplicateRecommendations(
    recommendations
) {

    const seen =
        new Set();


    const output =
        [];


    recommendations.forEach(
        recommendation => {

            const key =
                [
                    recommendation.category,

                    recommendation.title
                        .toLowerCase(),

                    recommendation.action
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
                recommendation
            );

        }
    );


    return output;
}


/* ============================================================
   23. DECISION CONFIDENCE
============================================================ */

function calculateDecisionConfidence(
    context,
    recommendations
) {

    let score =
        70;


    /*
        Disease confidence
    */

    if (
        context.disease.detected
    ) {

        if (
            context.disease.confidence >= 90
        ) {

            score += 12;

        } else if (
            context.disease.confidence >= 75
        ) {

            score += 7;

        } else if (
            context.disease.confidence < 60
        ) {

            score -= 12;

        }

    }


    /*
        Soil availability
    */

    if (
        context.soil.available
    ) {

        score += 8;

    } else {

        score -= 5;

    }


    /*
        Weather availability
    */

    if (
        context.weather.condition !==
        "Unknown"
    ) {

        score += 5;

    } else {

        score -= 3;

    }


    /*
        Too many conflicting high-priority
        recommendations reduces decision certainty.
    */

    const highCount =
        recommendations.filter(
            item =>
                [
                    "CRITICAL",
                    "URGENT",
                    "HIGH"
                ].includes(
                    item.priority
                )
        ).length;


    if (
        highCount >= 8
    ) {

        score -= 8;

    }


    return Math.round(
        clampRecommendation(
            score
        )
    );
}


/* ============================================================
   24. FARMER SUMMARY
============================================================ */

function generateFarmerSummary(
    context,
    recommendations
) {

    const risk =
        context.risk.overall;


    const riskClass =
        classifyOverallRisk(
            risk
        );


    /*
        Critical disease
    */

    if (
        context.disease.detected &&
        context.disease.confidence >= 85
    ) {

        return `AgriGuard detected ${context.disease.name} with ${context.disease.confidence}% confidence. Prioritize field inspection and diagnosis confirmation, while considering current weather and soil conditions before treatment.`;

    }


    /*
        High overall risk
    */

    if (
        risk >= 70
    ) {

        return `Field risk is ${riskClass.label.toLowerCase()}. Prioritize the highest-risk conditions today and increase field monitoring until conditions stabilize.`;

    }


    /*
        Soil issue
    */

    if (
        context.soil.soilHealthScore !== null &&
        context.soil.soilHealthScore < 50
    ) {

        return `Soil health requires attention. Review the main soil constraints before applying additional inputs and use soil-test information to guide corrective action.`;

    }


    /*
        Irrigation
    */

    if (
        context.soil.irrigation &&
        [
            "URGENT",
            "HIGH"
        ].includes(
            context.soil.irrigation.priority
        )
    ) {

        return `Water management is currently a priority. Recheck root-zone moisture and adjust irrigation according to crop requirement and rainfall conditions.`;

    }


    /*
        Normal condition
    */

    return `Current field conditions appear manageable. Continue structured scouting, monitor weather and soil conditions, and respond early if risk indicators increase.`;
}


/* ============================================================
   25. GET TOP ACTIONS
============================================================ */

function getTopRecommendations(
    count = 5
) {

    if (
        !RECOMMENDATION_ENGINE_STATE.current
    ) {

        return [];

    }


    return RECOMMENDATION_ENGINE_STATE
        .current
        .all
        .slice(
            0,
            count
        );
}


/* ============================================================
   26. GET IMMEDIATE ACTIONS
============================================================ */

function getImmediateRecommendations() {

    if (
        !RECOMMENDATION_ENGINE_STATE.current
    ) {

        return [];

    }


    return RECOMMENDATION_ENGINE_STATE
        .current
        .immediate;
}


/* ============================================================
   27. GET PREVENTIVE ACTIONS
============================================================ */

function getPreventiveRecommendations() {

    if (
        !RECOMMENDATION_ENGINE_STATE.current
    ) {

        return [];

    }


    return RECOMMENDATION_ENGINE_STATE
        .current
        .preventive;
}


/* ============================================================
   28. CATEGORY FILTER
============================================================ */

function getRecommendationsByCategory(
    category
) {

    if (
        !RECOMMENDATION_ENGINE_STATE.current
    ) {

        return [];

    }


    return RECOMMENDATION_ENGINE_STATE
        .current
        .all
        .filter(
            recommendation =>
                recommendation.category ===
                category
        );
}


/* ============================================================
   29. PRIORITY FILTER
============================================================ */

function getRecommendationsByPriority(
    priority
) {

    if (
        !RECOMMENDATION_ENGINE_STATE.current
    ) {

        return [];

    }


    return RECOMMENDATION_ENGINE_STATE
        .current
        .all
        .filter(
            recommendation =>
                recommendation.priority ===
                priority
        );
}


/* ============================================================
   30. MARK ACTION COMPLETE
============================================================ */

function markRecommendationComplete(
    recommendationId
) {

    if (
        !RECOMMENDATION_ENGINE_STATE.current
    ) {

        return false;

    }


    const recommendation =
        RECOMMENDATION_ENGINE_STATE
            .current
            .all
            .find(
                item =>
                    item.id ===
                    recommendationId
            );


    if (
        !recommendation
    ) {

        return false;

    }


    recommendation.status =
        "completed";


    recommendation.completedAt =
        new Date().toISOString();


    window.dispatchEvent(
        new CustomEvent(
            "agriguard:recommendationCompleted",
            {
                detail:
                    recommendation
            }
        )
    );


    return true;
}


/* ============================================================
   31. DISMISS RECOMMENDATION
============================================================ */

function dismissRecommendation(
    recommendationId
) {

    if (
        !RECOMMENDATION_ENGINE_STATE.current
    ) {

        return false;

    }


    const recommendation =
        RECOMMENDATION_ENGINE_STATE
            .current
            .all
            .find(
                item =>
                    item.id ===
                    recommendationId
            );


    if (
        !recommendation
    ) {

        return false;

    }


    recommendation.status =
        "dismissed";


    recommendation.dismissedAt =
        new Date().toISOString();


    window.dispatchEvent(
        new CustomEvent(
            "agriguard:recommendationDismissed",
            {
                detail:
                    recommendation
            }
        )
    );


    return true;
}


/* ============================================================
   32. GET ACTIVE RECOMMENDATIONS
============================================================ */

function getActiveRecommendations() {

    if (
        !RECOMMENDATION_ENGINE_STATE.current
    ) {

        return [];

    }


    return RECOMMENDATION_ENGINE_STATE
        .current
        .all
        .filter(
            item =>
                item.status ===
                "recommended"
        );
}


/* ============================================================
   33. GENERATE QUICK ACTIONS
============================================================ */

/*
    Designed for large dashboard buttons.
*/

function getQuickActions(
    result = null
) {

    const analysis =
        result ||
        RECOMMENDATION_ENGINE_STATE.current;


    if (
        !analysis
    ) {

        return [];

    }


    const actions =
        [];


    const recommendations =
        analysis.all ||
        [];


    const firstHigh =
        recommendations.find(
            item =>
                [
                    "CRITICAL",
                    "URGENT",
                    "HIGH"
                ].includes(
                    item.priority
                )
        );


    if (
        firstHigh
    ) {

        actions.push({

            id:
                "quick-primary",

            label:
                firstHigh.title,

            description:
                firstHigh.action,

            priority:
                firstHigh.priority,

            recommendationId:
                firstHigh.id
        });

    }


    /*
        Disease action
    */

    const diseaseAction =
        recommendations.find(
            item =>
                item.category ===
                "disease"
        );


    if (
        diseaseAction
    ) {

        actions.push({

            id:
                "quick-disease",

            label:
                "Review Disease",

            description:
                diseaseAction.action,

            priority:
                diseaseAction.priority,

            recommendationId:
                diseaseAction.id
        });

    }


    /*
        Irrigation action
    */

    const irrigationAction =
        recommendations.find(
            item =>
                item.category ===
                "irrigation"
        );


    if (
        irrigationAction
    ) {

        actions.push({

            id:
                "quick-irrigation",

            label:
                "Check Irrigation",

            description:
                irrigationAction.action,

            priority:
                irrigationAction.priority,

            recommendationId:
                irrigationAction.id
        });

    }


    /*
        Soil action
    */

    const soilAction =
        recommendations.find(
            item =>
                item.category ===
                    "soil" ||
                item.category ===
                    "soil-health"
        );


    if (
        soilAction
    ) {

        actions.push({

            id:
                "quick-soil",

            label:
                "Review Soil",

            description:
                soilAction.action,

            priority:
                soilAction.priority,

            recommendationId:
                soilAction.id
        });

    }


    return actions.slice(
        0,
        4
    );
}


/* ============================================================
   34. EXPLAIN A RECOMMENDATION
============================================================ */

function explainRecommendation(
    recommendation
) {

    if (
        !recommendation
    ) {

        return {

            explanation:
                "No recommendation selected.",

            factors:
                []
        };

    }


    return {

        title:
            recommendation.title,

        explanation:
            recommendation.action,

        why:
            recommendation.reason,

        benefit:
            recommendation.expectedBenefit,

        timing:
            recommendation.timing,

        confidence:
            recommendation.confidence,

        safety:
            recommendation.safety,

        factors:
            recommendation.tags || []
    };
}


/* ============================================================
   35. DAILY ACTION PLAN
============================================================ */

function generateDailyActionPlan(
    result = null
) {

    const analysis =
        result ||
        RECOMMENDATION_ENGINE_STATE.current;


    if (
        !analysis
    ) {

        return {

            morning: [],

            afternoon: [],

            evening: []
        };

    }


    const all =
        analysis.all ||
        [];


    const high =
        all.filter(
            item =>
                [
                    "CRITICAL",
                    "URGENT",
                    "HIGH"
                ].includes(
                    item.priority
                )
        );


    const medium =
        all.filter(
            item =>
                item.priority ===
                "MEDIUM"
        );


    return {

        morning:

            high
                .filter(
                    item =>
                        item.category ===
                            "disease" ||
                        item.category ===
                            "field" ||
                        item.category ===
                            "soil"
                )
                .slice(
                    0,
                    3
                ),


        afternoon:

            high
                .filter(
                    item =>
                        item.category ===
                            "irrigation" ||
                        item.category ===
                            "weather"
                )
                .slice(
                    0,
                    3
                ),


        evening:

            medium
                .slice(
                    0,
                    3
                )
    };
}


/* ============================================================
   36. EXPORT / API
============================================================ */

window.RECOMMENDATION_ENGINE_STATE =
    RECOMMENDATION_ENGINE_STATE;


window.RECOMMENDATION_PRIORITY =
    RECOMMENDATION_PRIORITY;


window.CROP_STAGES =
    CROP_STAGES;


window.createRecommendation =
    createRecommendation;


window.normalizeCropName =
    normalizeCropName;


window.normalizeCropStage =
    normalizeCropStage;


window.normalizeDiseaseData =
    normalizeDiseaseData;


window.normalizeWeatherData =
    normalizeWeatherData;


window.normalizeSoilRecommendationData =
    normalizeSoilRecommendationData;


window.normalizeRiskData =
    normalizeRiskData;


window.classifyOverallRisk =
    classifyOverallRisk;


window.generateDiseaseRecommendations =
    generateDiseaseRecommendations;


window.generateWeatherRecommendations =
    generateWeatherRecommendations;


window.generateSoilRecommendations =
    generateSoilRecommendations;


window.generateIrrigationRecommendations =
    generateIrrigationRecommendations;


window.generateCropStageRecommendations =
    generateCropStageRecommendations;


window.generateWaterSavingRecommendations =
    generateWaterSavingRecommendations;


window.generatePreventiveRecommendations =
    generatePreventiveRecommendations;


window.generateRecommendations =
    generateRecommendations;


window.getTopRecommendations =
    getTopRecommendations;


window.getImmediateRecommendations =
    getImmediateRecommendations;


window.getPreventiveRecommendations =
    getPreventiveRecommendations;


window.getRecommendationsByCategory =
    getRecommendationsByCategory;


window.getRecommendationsByPriority =
    getRecommendationsByPriority;


window.markRecommendationComplete =
    markRecommendationComplete;


window.dismissRecommendation =
    dismissRecommendation;


window.getActiveRecommendations =
    getActiveRecommendations;


window.getQuickActions =
    getQuickActions;


window.explainRecommendation =
    explainRecommendation;


window.generateDailyActionPlan =
    generateDailyActionPlan;


/* ============================================================
   37. INITIALIZATION
============================================================ */

console.log(
    "%c🤖 AgriGuard AI Recommendation Engine",
    "font-size:16px;font-weight:bold;"
);

console.log(
    "Decision-support engine initialized."
);

console.log(
    "Version:",
    RECOMMENDATION_ENGINE_STATE.version
);
