/* ============================================================
   AGRIGUARD AI
   SIH 2026 PROTOTYPE
   RISK ENGINE
============================================================ */

/*
    PURPOSE
    -------
    Converts multiple agricultural signals into a unified
    0–100 crop-health / disease-risk score.

    INPUTS CONSIDERED
    -----------------
    1. Disease detection
    2. AI confidence
    3. Temperature
    4. Relative humidity
    5. Rainfall
    6. Leaf wetness
    7. Soil moisture
    8. Soil pH
    9. Crop growth stage
    10. Disease history
    11. Crop susceptibility
    12. Field history
    13. Irrigation condition
    14. Recent weather trend
    15. Image quality

    OUTPUT
    ------
    Unified Risk Score: 0–100

    0–24   → Low
    25–49  → Moderate
    50–74  → High
    75–100 → Critical

    NOTE
    ----
    This is the explainable prototype risk engine.

    It is designed so that a future backend can replace
    these rule-based calculations with a trained ML model
    without changing the dashboard architecture.
*/


/* ============================================================
   01. RISK ENGINE STATE
============================================================ */

const RISK_ENGINE_STATE = {

    lastResult: null,

    lastCalculatedAt: null,

    history: [],

    weights: {

        disease: 0.30,

        weather: 0.20,

        soil: 0.15,

        crop: 0.10,

        history: 0.10,

        field: 0.10,

        image: 0.05
    }
};


/* ============================================================
   02. DEFAULT ENVIRONMENT
============================================================ */

const DEFAULT_ENVIRONMENT = {

    temperature: 28,

    humidity: 78,

    rainfall24h: 12,

    rainfall7d: 48,

    leafWetness: 65,

    soilMoisture: 62,

    soilPH: 6.5,

    irrigation: "normal",

    weatherTrend: "humid",

    windSpeed: 8,

    sunshineHours: 5
};


/* ============================================================
   03. CLAMP VALUE
============================================================ */

function clampRiskValue(
    value,
    min = 0,
    max = 100
) {

    return Math.max(
        min,
        Math.min(
            max,
            Number(value) || 0
        )
    );
}


/* ============================================================
   04. NORMALIZE VALUE
============================================================ */

function normalizeRiskValue(
    value,
    min,
    max
) {

    if (
        max === min
    ) {

        return 0;

    }


    return clampRiskValue(
        (
            (value - min) /
            (max - min)
        ) * 100
    );
}


/* ============================================================
   05. RISK CLASSIFICATION
============================================================ */

function classifyRisk(
    score
) {

    score =
        clampRiskValue(
            score
        );


    if (
        score >= 75
    ) {

        return {

            label: "Critical",

            level: "critical",

            score,

            colorClass:
                "risk-critical",

            icon:
                "🚨",

            description:
                "Immediate field attention is recommended."
        };

    }


    if (
        score >= 50
    ) {

        return {

            label: "High",

            level: "high",

            score,

            colorClass:
                "risk-high",

            icon:
                "⚠️",

            description:
                "The crop has elevated risk and should be monitored closely."
        };

    }


    if (
        score >= 25
    ) {

        return {

            label: "Moderate",

            level: "moderate",

            score,

            colorClass:
                "risk-moderate",

            icon:
                "🟡",

            description:
                "Some risk indicators are present."
        };

    }


    return {

        label: "Low",

        level: "low",

        score,

        colorClass:
            "risk-low",

        icon:
            "🟢",

        description:
            "Current conditions indicate relatively low risk."
    };
}


/* ============================================================
   06. DISEASE RISK
============================================================ */

/*
    Disease detection receives the highest weight.

    Example:

        Disease detected
        + high confidence
        + high severity
        = high disease component
*/

function calculateDiseaseRisk(
    diagnosis
) {

    if (!diagnosis) {

        return {

            score: 0,

            confidence: 0,

            severityScore: 0,

            detected: false,

            explanation:
                "No disease diagnosis is currently available."
        };

    }


    let score = 0;


    /*
        Disease presence
    */

    if (
        diagnosis.diseaseId
    ) {

        score += 55;

    } else {

        score += 5;

    }


    /*
        AI confidence
    */

    const confidence =
        clampRiskValue(
            diagnosis.confidence
        );


    score +=
        confidence *
        0.20;


    /*
        Severity
    */

    const severity =
        String(
            diagnosis.severity ||
            ""
        ).toLowerCase();


    if (
        severity.includes("critical")
    ) {

        score += 25;

    } else if (
        severity.includes("high")
    ) {

        score += 20;

    } else if (
        severity.includes("moderate")
    ) {

        score += 12;

    } else if (
        severity.includes("low")
    ) {

        score += 5;

    }


    /*
        Poor image quality reduces certainty.
    */

    const imageQuality =
        clampRiskValue(
            diagnosis.imageQuality ??
            100
        );


    if (
        imageQuality < 50
    ) {

        score *= 0.75;

    } else if (
        imageQuality < 70
    ) {

        score *= 0.90;

    }


    score =
        clampRiskValue(
            score
        );


    return {

        score,

        confidence,

        severityScore:
            score,

        detected:
            Boolean(
                diagnosis.diseaseId
            ),

        explanation:
            diagnosis.diseaseId
                ? `${diagnosis.diseaseName} detected with ${confidence}% AI confidence.`
                : "No significant disease detected."
    };
}


/* ============================================================
   07. TEMPERATURE RISK
============================================================ */

function calculateTemperatureRisk(
    temperature,
    favorableRange = null
) {

    temperature =
        Number(
            temperature
        );


    if (
        Number.isNaN(
            temperature
        )
    ) {

        return 0;

    }


    /*
        Use disease-specific favorable range
        when available.
    */

    if (
        favorableRange &&
        Array.isArray(
            favorableRange
        ) &&
        favorableRange.length >= 2
    ) {

        const min =
            Number(
                favorableRange[0]
            );

        const max =
            Number(
                favorableRange[1]
            );


        if (
            temperature >= min &&
            temperature <= max
        ) {

            return 100;

        }


        const distance =
            temperature < min
                ? min - temperature
                : temperature - max;


        return clampRiskValue(
            100 -
            (
                distance *
                15
            )
        );

    }


    /*
        Generic fungal-disease risk range.
    */

    if (
        temperature >= 24 &&
        temperature <= 30
    ) {

        return 100;

    }


    if (
        temperature >= 20 &&
        temperature < 24
    ) {

        return 65;

    }


    if (
        temperature > 30 &&
        temperature <= 34
    ) {

        return 65;

    }


    return 30;
}


/* ============================================================
   08. HUMIDITY RISK
============================================================ */

function calculateHumidityRisk(
    humidity
) {

    humidity =
        clampRiskValue(
            humidity
        );


    if (
        humidity >= 85
    ) {

        return 100;

    }


    if (
        humidity >= 75
    ) {

        return 85;

    }


    if (
        humidity >= 65
    ) {

        return 60;

    }


    if (
        humidity >= 50
    ) {

        return 30;

    }


    return 10;
}


/* ============================================================
   09. RAINFALL RISK
============================================================ */

function calculateRainfallRisk(
    rainfall24h,
    rainfall7d
) {

    rainfall24h =
        Math.max(
            0,
            Number(
                rainfall24h
            ) || 0
        );


    rainfall7d =
        Math.max(
            0,
            Number(
                rainfall7d
            ) || 0
        );


    let score = 0;


    /*
        Recent rainfall
    */

    if (
        rainfall24h >= 30
    ) {

        score += 55;

    } else if (
        rainfall24h >= 15
    ) {

        score += 40;

    } else if (
        rainfall24h >= 5
    ) {

        score += 20;

    }


    /*
        Accumulated rainfall
    */

    if (
        rainfall7d >= 100
    ) {

        score += 45;

    } else if (
        rainfall7d >= 60
    ) {

        score += 30;

    } else if (
        rainfall7d >= 30
    ) {

        score += 15;

    }


    return clampRiskValue(
        score
    );
}


/* ============================================================
   10. LEAF WETNESS RISK
============================================================ */

function calculateLeafWetnessRisk(
    leafWetness
) {

    leafWetness =
        clampRiskValue(
            leafWetness
        );


    if (
        leafWetness >= 80
    ) {

        return 100;

    }


    if (
        leafWetness >= 65
    ) {

        return 80;

    }


    if (
        leafWetness >= 45
    ) {

        return 50;

    }


    if (
        leafWetness >= 25
    ) {

        return 25;

    }


    return 5;
}


/* ============================================================
   11. WEATHER RISK
============================================================ */

function calculateWeatherRisk(
    environment,
    diagnosis
) {

    environment =
        {
            ...DEFAULT_ENVIRONMENT,
            ...(environment || {})
        };


    let temperatureRange =
        null;


    /*
        Disease-specific favorable temperature.
    */

    if (
        diagnosis?.diseaseId
    ) {

        const disease =
            getDiseaseById(
                diagnosis.diseaseId
            );


        if (
            disease?.favorableConditions
                ?.temperature
        ) {

            temperatureRange =
                disease
                    .favorableConditions
                    .temperature;

        }

    }


    const temperatureRisk =
        calculateTemperatureRisk(
            environment.temperature,
            temperatureRange
        );


    const humidityRisk =
        calculateHumidityRisk(
            environment.humidity
        );


    const rainfallRisk =
        calculateRainfallRisk(
            environment.rainfall24h,
            environment.rainfall7d
        );


    const leafWetnessRisk =
        calculateLeafWetnessRisk(
            environment.leafWetness
        );


    /*
        Weather trend modifier
    */

    let trendModifier = 0;


    const trend =
        String(
            environment.weatherTrend ||
            ""
        ).toLowerCase();


    if (
        trend.includes("humid") ||
        trend.includes("wet") ||
        trend.includes("rain")
    ) {

        trendModifier = 10;

    } else if (
        trend.includes("dry")
    ) {

        trendModifier = -5;

    }


    const score =
        clampRiskValue(
            (
                temperatureRisk * 0.30
            ) +
            (
                humidityRisk * 0.30
            ) +
            (
                rainfallRisk * 0.20
            ) +
            (
                leafWetnessRisk * 0.20
            ) +
            trendModifier
        );


    return {

        score,

        temperatureRisk,

        humidityRisk,

        rainfallRisk,

        leafWetnessRisk,

        trendModifier,

        explanation:
            buildWeatherExplanation(
                environment,
                score
            )
    };
}


/* ============================================================
   12. WEATHER EXPLANATION
============================================================ */

function buildWeatherExplanation(
    environment,
    score
) {

    const reasons = [];


    if (
        environment.humidity >= 75
    ) {

        reasons.push(
            "high humidity"
        );

    }


    if (
        environment.rainfall24h >= 10
    ) {

        reasons.push(
            "recent rainfall"
        );

    }


    if (
        environment.leafWetness >= 60
    ) {

        reasons.push(
            "extended leaf wetness"
        );

    }


    if (
        environment.temperature >= 24 &&
        environment.temperature <= 30
    ) {

        reasons.push(
            "favorable temperature"
        );

    }


    if (
        reasons.length === 0
    ) {

        return "Weather conditions are currently not strongly favorable for disease development.";

    }


    return `Weather risk is elevated due to ${reasons.join(", ")}.`;
}


/* ============================================================
   13. SOIL MOISTURE RISK
============================================================ */

function calculateSoilMoistureRisk(
    moisture
) {

    moisture =
        clampRiskValue(
            moisture
        );


    /*
        Excess moisture is generally more favorable
        to several fungal/pathogen problems.
    */

    if (
        moisture >= 85
    ) {

        return 100;

    }


    if (
        moisture >= 70
    ) {

        return 80;

    }


    if (
        moisture >= 55
    ) {

        return 50;

    }


    if (
        moisture >= 35
    ) {

        return 30;

    }


    return 20;
}


/* ============================================================
   14. SOIL pH RISK
============================================================ */

function calculateSoilPHRisk(
    ph,
    idealRange = [6, 7]
) {

    ph =
        Number(
            ph
        );


    if (
        Number.isNaN(
            ph
        )
    ) {

        return 50;

    }


    const min =
        Number(
            idealRange[0]
        );


    const max =
        Number(
            idealRange[1]
        );


    if (
        ph >= min &&
        ph <= max
    ) {

        return 10;

    }


    const distance =
        ph < min
            ? min - ph
            : ph - max;


    return clampRiskValue(
        20 +
        (
            distance *
            35
        )
    );
}


/* ============================================================
   15. IRRIGATION RISK
============================================================ */

function calculateIrrigationRisk(
    irrigation
) {

    const value =
        String(
            irrigation ||
            "normal"
        ).toLowerCase();


    if (
        value.includes("excess") ||
        value.includes("over")
    ) {

        return 85;

    }


    if (
        value.includes("poor") ||
        value.includes("blocked")
    ) {

        return 75;

    }


    if (
        value.includes("irregular")
    ) {

        return 55;

    }


    if (
        value.includes("normal")
    ) {

        return 25;

    }


    if (
        value.includes("drip")
    ) {

        return 15;

    }


    return 30;
}


/* ============================================================
   16. SOIL RISK
============================================================ */

function calculateSoilRisk(
    environment,
    diagnosis
) {

    environment =
        {
            ...DEFAULT_ENVIRONMENT,
            ...(environment || {})
        };


    let idealPH =
        [6, 7];


    if (
        diagnosis?.diseaseId
    ) {

        const disease =
            getDiseaseById(
                diagnosis.diseaseId
            );


        if (
            disease?.favorableConditions
                ?.soilPH
        ) {

            idealPH =
                disease
                    .favorableConditions
                    .soilPH;

        }

    }


    const moistureRisk =
        calculateSoilMoistureRisk(
            environment.soilMoisture
        );


    const phRisk =
        calculateSoilPHRisk(
            environment.soilPH,
            idealPH
        );


    const irrigationRisk =
        calculateIrrigationRisk(
            environment.irrigation
        );


    const score =
        clampRiskValue(
            (
                moistureRisk * 0.45
            ) +
            (
                phRisk * 0.30
            ) +
            (
                irrigationRisk * 0.25
            )
        );


    return {

        score,

        moistureRisk,

        phRisk,

        irrigationRisk,

        explanation:
            buildSoilExplanation(
                environment,
                score
            )
    };
}


/* ============================================================
   17. SOIL EXPLANATION
============================================================ */

function buildSoilExplanation(
    environment,
    score
) {

    const reasons = [];


    if (
        environment.soilMoisture >= 70
    ) {

        reasons.push(
            "high soil moisture"
        );

    }


    if (
        environment.soilPH < 5.5 ||
        environment.soilPH > 7.5
    ) {

        reasons.push(
            "soil pH outside preferred range"
        );

    }


    if (
        String(
            environment.irrigation
        ).toLowerCase()
            .includes("excess")
    ) {

        reasons.push(
            "excess irrigation"
        );

    }


    if (
        reasons.length === 0
    ) {

        return "Soil conditions are currently within a relatively acceptable range.";

    }


    return `Soil risk is elevated due to ${reasons.join(", ")}.`;
}


/* ============================================================
   18. CROP SUSCEPTIBILITY
============================================================ */

function calculateCropRisk(
    cropId,
    diseaseId
) {

    const crop =
        getCropById(
            cropId
        );


    if (!crop) {

        return {

            score: 40,

            susceptibility:
                "unknown",

            explanation:
                "Crop susceptibility information is unavailable."
        };

    }


    let score = 30;


    /*
        Disease-specific susceptibility
    */

    if (
        diseaseId &&
        crop.commonDiseases?.includes(
            diseaseId
        )
    ) {

        score += 45;

    }


    /*
        Crop growth duration / stage can later
        be incorporated through crop metadata.
    */

    const susceptibility =
        score >= 70
            ? "high"
            : score >= 50
                ? "moderate"
                : "low";


    return {

        score:
            clampRiskValue(
                score
            ),

        susceptibility,

        cropName:
            crop.name,

        explanation:
            crop.commonDiseases?.includes(
                diseaseId
            )
                ? `${crop.name} is known to be susceptible to the detected condition.`
                : `${crop.name} does not show a strong disease-specific susceptibility signal.`
    };
}


/* ============================================================
   19. DISEASE HISTORY RISK
============================================================ */

function calculateHistoryRisk(
    history = []
) {

    if (
        !Array.isArray(
            history
        ) ||
        history.length === 0
    ) {

        return {

            score: 15,

            recentCases: 0,

            explanation:
                "No significant recent disease history is available."
        };

    }


    /*
        Consider only recent history.
    */

    const now =
        Date.now();


    const recent =
        history.filter(
            item => {

                if (
                    !item.date
                ) {

                    return false;

                }


                const date =
                    new Date(
                        item.date
                    );


                const days =
                    (
                        now -
                        date.getTime()
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    );


                return days <= 30;

            }
        );


    let score =
        Math.min(
            80,
            15 +
            (
                recent.length *
                12
            )
        );


    /*
        Repeated disease detections increase risk.
    */

    const diseased =
        recent.filter(
            item =>
                item.diseaseId
        );


    if (
        diseased.length >= 3
    ) {

        score += 15;

    }


    score =
        clampRiskValue(
            score
        );


    return {

        score,

        recentCases:
            recent.length,

        diseaseCases:
            diseased.length,

        explanation:
            recent.length > 0
                ? `${recent.length} recent crop-health record(s) were found, including ${diseased.length} disease-related record(s).`
                : "No recent disease records were found."
    };
}


/* ============================================================
   20. FIELD RISK
============================================================ */

function calculateFieldRisk(
    field
) {

    if (!field) {

        return {

            score: 30,

            explanation:
                "Field information is incomplete."
        };

    }


    let score = 20;


    /*
        Larger affected area
    */

    const affectedArea =
        Number(
            field.affectedAreaPercent ||
            0
        );


    if (
        affectedArea >= 50
    ) {

        score += 45;

    } else if (
        affectedArea >= 25
    ) {

        score += 30;

    } else if (
        affectedArea >= 10
    ) {

        score += 15;

    }


    /*
        Poor drainage
    */

    if (
        String(
            field.drainage ||
            ""
        )
            .toLowerCase()
            .includes("poor")
    ) {

        score += 20;

    }


    /*
        Previous disease history
    */

    if (
        field.previousDisease
    ) {

        score += 15;

    }


    /*
        Monitoring status
    */

    if (
        field.monitoringStatus ===
        "high-risk"
    ) {

        score += 15;

    }


    score =
        clampRiskValue(
            score
        );


    return {

        score,

        affectedArea,

        explanation:
            score >= 60
                ? "Field-level conditions indicate elevated spatial risk."
                : "Field-level indicators are currently manageable."
    };
}


/* ============================================================
   21. IMAGE QUALITY RISK
============================================================ */

function calculateImageRisk(
    imageQuality
) {

    imageQuality =
        clampRiskValue(
            imageQuality
        );


    /*
        Poor image quality creates uncertainty.

        This component should not dominate the total
        disease risk.
    */

    if (
        imageQuality >= 85
    ) {

        return 10;

    }


    if (
        imageQuality >= 70
    ) {

        return 25;

    }


    if (
        imageQuality >= 50
    ) {

        return 55;

    }


    return 80;
}


/* ============================================================
   22. GROWTH-STAGE RISK
============================================================ */

function calculateGrowthStageRisk(
    stage
) {

    const value =
        String(
            stage ||
            ""
        ).toLowerCase();


    /*
        Disease impact can be more important during
        flowering / reproductive stages.
    */

    if (
        value.includes("flower")
    ) {

        return 80;

    }


    if (
        value.includes("fruit") ||
        value.includes("grain") ||
        value.includes("reproductive")
    ) {

        return 75;

    }


    if (
        value.includes("vegetative")
    ) {

        return 55;

    }


    if (
        value.includes("seedling")
    ) {

        return 65;

    }


    return 45;
}


/* ============================================================
   23. UNIFIED RISK CALCULATION
============================================================ */

function calculateUnifiedRisk(
    options = {}
) {

    /*
        Resolve inputs
    */

    const diagnosis =
        options.diagnosis ||
        DISEASE_DETECTION_STATE?.result ||
        APP_STATE?.selectedDiagnosis ||
        null;


    const cropId =
        options.cropId ||
        diagnosis?.cropId ||
        APP_STATE?.selectedCropId ||
        "rice";


    const environment =
        {
            ...DEFAULT_ENVIRONMENT,
            ...(options.environment || {})
        };


    const field =
        options.field ||
        (
            typeof getFieldById === "function"
                ? getFieldById(
                    APP_STATE?.selectedFieldId
                )
                : null
        );


    const history =
        options.history ||
        (
            typeof DIAGNOSIS_HISTORY !==
            "undefined"
                ? DIAGNOSIS_HISTORY
                : []
        );


    /*
        Calculate components
    */

    const disease =
        calculateDiseaseRisk(
            diagnosis
        );


    const weather =
        calculateWeatherRisk(
            environment,
            diagnosis
        );


    const soil =
        calculateSoilRisk(
            environment,
            diagnosis
        );


    const crop =
        calculateCropRisk(
            cropId,
            diagnosis?.diseaseId
        );


    const historyRisk =
        calculateHistoryRisk(
            history
        );


    const fieldRisk =
        calculateFieldRisk(
            field
        );


    const image =
        calculateImageRisk(
            diagnosis?.imageQuality ??
            100
        );


    /*
        Growth stage
    */

    const growthStage =
        calculateGrowthStageRisk(
            options.growthStage ||
            field?.growthStage
        );


    /*
        We use the configured weights.
    */

    const weights =
        {
            ...RISK_ENGINE_STATE.weights
        };


    /*
        Crop stage is integrated into the crop
        component rather than being an additional
        independent weight.

        This avoids exceeding 100% total weight.
    */

    const adjustedCropScore =
        (
            crop.score *
            0.65
        ) +
        (
            growthStage *
            0.35
        );


    /*
        Calculate weighted total.
    */

    let score =

        (
            disease.score *
            weights.disease
        ) +

        (
            weather.score *
            weights.weather
        ) +

        (
            soil.score *
            weights.soil
        ) +

        (
            adjustedCropScore *
            weights.crop
        ) +

        (
            historyRisk.score *
            weights.history
        ) +

        (
            fieldRisk.score *
            weights.field
        ) +

        (
            image *
            weights.image
        );


    /*
        Disease detection override

        If a high-confidence critical disease is
        detected, the total score should not be
        artificially diluted by otherwise-normal
        environmental conditions.
    */

    if (
        diagnosis?.diseaseId &&
        diagnosis.confidence >= 90 &&
        (
            String(
                diagnosis.severity
            )
                .toLowerCase()
                .includes("critical")
        )
    ) {

        score =
            Math.max(
                score,
                80
            );

    }


    /*
        High-confidence high-severity disease
    */

    if (
        diagnosis?.diseaseId &&
        diagnosis.confidence >= 90 &&
        (
            String(
                diagnosis.severity
            )
                .toLowerCase()
                .includes("high")
        )
    ) {

        score =
            Math.max(
                score,
                65
            );

    }


    score =
        Number(
            clampRiskValue(
                score
            ).toFixed(1)
        );


    const classification =
        classifyRisk(
            score
        );


    /*
        Explainable risk factors
    */

    const factors =
        buildRiskFactors({
            disease,
            weather,
            soil,
            crop,
            history: historyRisk,
            field: fieldRisk,
            image,
            growthStage
        });


    /*
        Priority actions
    */

    const actions =
        buildRiskActions({
            score,
            diagnosis,
            weather,
            soil,
            field: fieldRisk
        });


    const result = {

        score,

        ...classification,

        cropId,

        cropName:
            crop.cropName ||
            getCropById(cropId)?.name ||
            "Unknown Crop",

        disease:
            diagnosis?.diseaseName ||
            "No disease detected",

        confidence:
            diagnosis?.confidence ||
            0,

        components: {

            disease:
                Number(
                    disease.score.toFixed(1)
                ),

            weather:
                Number(
                    weather.score.toFixed(1)
                ),

            soil:
                Number(
                    soil.score.toFixed(1)
                ),

            crop:
                Number(
                    adjustedCropScore.toFixed(1)
                ),

            history:
                Number(
                    historyRisk.score.toFixed(1)
                ),

            field:
                Number(
                    fieldRisk.score.toFixed(1)
                ),

            image:
                Number(
                    image.toFixed(1)
                ),

            growthStage:
                Number(
                    growthStage.toFixed(1)
                )
        },

        factors,

        actions,

        environment,

        calculatedAt:
            new Date().toISOString(),

        engine:
            "AgriGuard Explainable Risk Engine v1.0"
    };


    /*
        Store result
    */

    RISK_ENGINE_STATE.lastResult =
        result;


    RISK_ENGINE_STATE.lastCalculatedAt =
        result.calculatedAt;


    RISK_ENGINE_STATE.history.unshift(
        result
    );


    if (
        RISK_ENGINE_STATE.history.length >
        30
    ) {

        RISK_ENGINE_STATE.history.pop();

    }


    /*
        Update global state
    */

    if (
        typeof APP_STATE !==
        "undefined"
    ) {

        APP_STATE.currentRiskScore =
            score;

        APP_STATE.currentRiskLevel =
            classification.label;

        APP_STATE.currentRiskResult =
            result;

    }


    /*
        Notify application.
    */

    if (
        typeof window !==
        "undefined"
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "agriguard:riskUpdated",
                {
                    detail: result
                }
            )
        );

    }


    return result;
}


/* ============================================================
   24. RISK FACTORS
============================================================ */

function buildRiskFactors(
    components
) {

    const factors = [];


    /*
        Disease
    */

    if (
        components.disease.detected
    ) {

        factors.push({

            type:
                "disease",

            severity:
                components.disease.score >= 75
                    ? "critical"
                    : components.disease.score >= 50
                        ? "high"
                        : "moderate",

            score:
                Number(
                    components.disease.score.toFixed(1)
                ),

            title:
                "Disease Detection",

            description:
                components.disease.explanation
        });

    }


    /*
        Weather
    */

    if (
        components.weather.score >= 50
    ) {

        factors.push({

            type:
                "weather",

            severity:
                components.weather.score >= 75
                    ? "high"
                    : "moderate",

            score:
                Number(
                    components.weather.score.toFixed(1)
                ),

            title:
                "Weather Conditions",

            description:
                components.weather.explanation
        });

    }


    /*
        Soil
    */

    if (
        components.soil.score >= 50
    ) {

        factors.push({

            type:
                "soil",

            severity:
                components.soil.score >= 75
                    ? "high"
                    : "moderate",

            score:
                Number(
                    components.soil.score.toFixed(1)
                ),

            title:
                "Soil Conditions",

            description:
                components.soil.explanation
        });

    }


    /*
        History
    */

    if (
        components.history.score >= 40
    ) {

        factors.push({

            type:
                "history",

            severity:
                components.history.score >= 70
                    ? "high"
                    : "moderate",

            score:
                Number(
                    components.history.score.toFixed(1)
                ),

            title:
                "Disease History",

            description:
                components.history.explanation
        });

    }


    /*
        Field
    */

    if (
        components.field.score >= 50
    ) {

        factors.push({

            type:
                "field",

            severity:
                components.field.score >= 75
                    ? "high"
                    : "moderate",

            score:
                Number(
                    components.field.score.toFixed(1)
                ),

            title:
                "Field Conditions",

            description:
                components.field.explanation
        });

    }


    /*
        Image quality
    */

    if (
        components.image >= 50
    ) {

        factors.push({

            type:
                "image",

            severity:
                "warning",

            score:
                Number(
                    components.image.toFixed(1)
                ),

            title:
                "Image Quality",

            description:
                "Lower image quality increases uncertainty in the AI diagnosis."
        });

    }


    /*
        If no major factors exist
    */

    if (
        factors.length === 0
    ) {

        factors.push({

            type:
                "system",

            severity:
                "low",

            score:
                10,

            title:
                "No Major Risk Driver",

            description:
                "Current monitored conditions do not show a dominant risk factor."
        });

    }


    /*
        Highest-risk factors first.
    */

    factors.sort(
        (
            a,
            b
        ) =>
            b.score -
            a.score
    );


    return factors;
}


/* ============================================================
   25. RISK ACTIONS
============================================================ */

function buildRiskActions(
    context
) {

    const actions = [];


    if (
        context.score >= 75
    ) {

        actions.push({

            priority:
                "URGENT",

            title:
                "Inspect affected area immediately",

            description:
                "Verify the AI finding in the field and isolate visibly affected plants where appropriate.",

            category:
                "field-inspection"
        });


        actions.push({

            priority:
                "HIGH",

            title:
                "Increase monitoring frequency",

            description:
                "Perform a follow-up inspection within 24 hours.",

            category:
                "monitoring"
        });

    } else if (
        context.score >= 50
    ) {

        actions.push({

            priority:
                "HIGH",

            title:
                "Inspect crop within 24–48 hours",

            description:
                "Check leaves, stems and surrounding plants for disease progression.",

            category:
                "field-inspection"
        });


        actions.push({

            priority:
                "MEDIUM",

            title:
                "Increase monitoring",

            description:
                "Repeat image-based assessment and monitor weather conditions.",

            category:
                "monitoring"
        });

    } else if (
        context.score >= 25
    ) {

        actions.push({

            priority:
                "MEDIUM",

            title:
                "Continue preventive monitoring",

            description:
                "Monitor crop symptoms and environmental changes.",

            category:
                "monitoring"
        });

    } else {

        actions.push({

            priority:
                "LOW",

            title:
                "Maintain routine monitoring",

            description:
                "Current conditions indicate relatively low disease risk.",

            category:
                "monitoring"
        });

    }


    /*
        Weather-specific action
    */

    if (
        context.weather.score >= 70
    ) {

        actions.push({

            priority:
                "HIGH",

            title:
                "Monitor after wet/humid conditions",

            description:
                "High humidity, rainfall or leaf wetness can increase disease development risk.",

            category:
                "weather"
        });

    }


    /*
        Soil-specific action
    */

    if (
        context.soil.score >= 70
    ) {

        actions.push({

            priority:
                "MEDIUM",

            title:
                "Review irrigation and drainage",

            description:
                "Avoid unnecessary over-irrigation and address water accumulation where present.",

            category:
                "soil"
        });

    }


    /*
        Diagnosis-specific action
    */

    if (
        context.diagnosis?.diseaseId
    ) {

        actions.push({

            priority:
                "HIGH",

            title:
                "Follow disease-specific management guidance",

            description:
                "Use the recommended integrated crop-management measures and locally approved interventions.",

            category:
                "disease-management"
        });

    }


    return actions;
}


/* ============================================================
   26. RISK TREND
============================================================ */

function calculateRiskTrend(
    scores = []
) {

    if (
        !Array.isArray(
            scores
        ) ||
        scores.length < 2
    ) {

        return {

            direction:
                "stable",

            change:
                0,

            label:
                "Insufficient history"
        };

    }


    const latest =
        Number(
            scores[0]
        ) || 0;


    const previous =
        Number(
            scores[1]
        ) || 0;


    const change =
        Number(
            (
                latest -
                previous
            ).toFixed(1)
        );


    if (
        change >= 10
    ) {

        return {

            direction:
                "rising",

            change,

            label:
                "Risk increasing rapidly"
        };

    }


    if (
        change >= 3
    ) {

        return {

            direction:
                "rising",

            change,

            label:
                "Risk increasing"
        };

    }


    if (
        change <= -10
    ) {

        return {

            direction:
                "falling",

            change,

            label:
                "Risk decreasing rapidly"
        };

    }


    if (
        change <= -3
    ) {

        return {

            direction:
                "falling",

            change,

            label:
                "Risk decreasing"
        };

    }


    return {

        direction:
            "stable",

        change,

        label:
            "Risk relatively stable"
    };
}


/* ============================================================
   27. GET CURRENT RISK
============================================================ */

function getCurrentRisk() {

    return (
        RISK_ENGINE_STATE.lastResult
        || null
    );
}


/* ============================================================
   28. GET RISK TREND
============================================================ */

function getCurrentRiskTrend() {

    const scores =
        RISK_ENGINE_STATE.history
            .map(
                item =>
                    item.score
            );


    return calculateRiskTrend(
        scores
    );
}


/* ============================================================
   29. RISK SCORE COLOR/CLASS
============================================================ */

function getRiskPresentation(
    score
) {

    const risk =
        classifyRisk(
            score
        );


    return {

        label:
            risk.label,

        level:
            risk.level,

        icon:
            risk.icon,

        className:
            risk.colorClass,

        description:
            risk.description
    };
}


/* ============================================================
   30. RESET ENGINE
============================================================ */

function resetRiskEngine() {

    RISK_ENGINE_STATE.lastResult =
        null;

    RISK_ENGINE_STATE.lastCalculatedAt =
        null;

    RISK_ENGINE_STATE.history =
        [];

}


/* ============================================================
   31. PUBLIC API
============================================================ */

window.RISK_ENGINE_STATE =
    RISK_ENGINE_STATE;


window.DEFAULT_ENVIRONMENT =
    DEFAULT_ENVIRONMENT;


window.clampRiskValue =
    clampRiskValue;


window.normalizeRiskValue =
    normalizeRiskValue;


window.classifyRisk =
    classifyRisk;


window.calculateDiseaseRisk =
    calculateDiseaseRisk;


window.calculateTemperatureRisk =
    calculateTemperatureRisk;


window.calculateHumidityRisk =
    calculateHumidityRisk;


window.calculateRainfallRisk =
    calculateRainfallRisk;


window.calculateLeafWetnessRisk =
    calculateLeafWetnessRisk;


window.calculateWeatherRisk =
    calculateWeatherRisk;


window.calculateSoilMoistureRisk =
    calculateSoilMoistureRisk;


window.calculateSoilPHRisk =
    calculateSoilPHRisk;


window.calculateIrrigationRisk =
    calculateIrrigationRisk;


window.calculateSoilRisk =
    calculateSoilRisk;


window.calculateCropRisk =
    calculateCropRisk;


window.calculateHistoryRisk =
    calculateHistoryRisk;


window.calculateFieldRisk =
    calculateFieldRisk;


window.calculateImageRisk =
    calculateImageRisk;


window.calculateGrowthStageRisk =
    calculateGrowthStageRisk;


window.calculateUnifiedRisk =
    calculateUnifiedRisk;


window.calculateRiskTrend =
    calculateRiskTrend;


window.getCurrentRisk =
    getCurrentRisk;


window.getCurrentRiskTrend =
    getCurrentRiskTrend;


window.getRiskPresentation =
    getRiskPresentation;


window.resetRiskEngine =
    resetRiskEngine;


/* ============================================================
   32. INITIALIZATION
============================================================ */

console.log(
    "%c🧠 AgriGuard Risk Engine",
    "font-size:16px;font-weight:bold;"
);

console.log(
    "Multi-factor agricultural risk engine initialized."
);

console.log(
    "Risk weights:",
    RISK_ENGINE_STATE.weights
);
