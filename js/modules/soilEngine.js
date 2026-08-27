/* ============================================================
   AGRIGUARD AI
   SIH 2026 PROTOTYPE
   SOIL INTELLIGENCE ENGINE
============================================================ */

/*
    PURPOSE
    -------
    Converts soil information into actionable agricultural
    intelligence.

    PARAMETERS CONSIDERED
    ---------------------
    • Soil moisture
    • Soil pH
    • Nitrogen (N)
    • Phosphorus (P)
    • Potassium (K)
    • Electrical conductivity (EC)
    • Organic carbon
    • Soil temperature
    • Soil type
    • Drainage
    • Water-holding capacity
    • Salinity pressure
    • Nutrient balance
    • Soil moisture stress
    • Waterlogging risk
    • Irrigation requirement
    • Soil health score
    • Crop-specific suitability

    OUTPUT
    ------
    • Soil Health Score
    • Soil Stress Score
    • Nutrient Score
    • Moisture Risk
    • Salinity Risk
    • pH Risk
    • Waterlogging Risk
    • Irrigation Recommendation
    • Nutrient Recommendation
    • Explainable Factors
    • Soil Alerts

    NOTE
    ----
    This is a frontend prototype intelligence layer.

    It can work with manually entered values now and can
    later be connected to:

        • IoT soil sensors
        • Soil testing laboratories
        • Government soil-health APIs
        • Farm sensors
        • Field sampling
*/


/* ============================================================
   01. SOIL ENGINE STATE
============================================================ */

const SOIL_ENGINE_STATE = {

    current: null,

    history: [],

    lastUpdated: null,

    source:
        "AgriGuard Demo Soil Intelligence",

    sensorConnected:
        false,

    apiStatus:
        "demo"
};


/* ============================================================
   02. DEFAULT SOIL PROFILE
============================================================ */

/*
    Values are realistic prototype values.

    Units:

        Moisture       %
        pH             0–14
        N              kg/ha
        P              kg/ha
        K              kg/ha
        EC             dS/m
        Organic Carbon %
        Temperature    °C
*/

const DEFAULT_SOIL = {

    moisture:
        62,

    pH:
        6.7,

    nitrogen:
        285,

    phosphorus:
        42,

    potassium:
        245,

    electricalConductivity:
        1.1,

    organicCarbon:
        0.72,

    temperature:
        26,

    soilType:
        "Loamy",

    drainage:
        "Good",

    waterHoldingCapacity:
        65,

    texture:
        "Loam",

    bulkDensity:
        1.35,

    depth:
        30,

    timestamp:
        new Date().toISOString()
};


/* ============================================================
   03. CROP SOIL PROFILES
============================================================ */

/*
    These ranges are prototype agronomic profiles.

    The system can be expanded with more crops later.
*/

const SOIL_CROP_PROFILES = {

    rice: {

        name:
            "Rice",

        pH:
            [5.5, 7.0],

        moisture:
            [55, 85],

        nitrogen:
            [250, 400],

        phosphorus:
            [25, 60],

        potassium:
            [180, 350],

        electricalConductivity:
            [0, 2.0],

        organicCarbon:
            [0.5, 1.2],

        temperature:
            [20, 35]
    },


    tomato: {

        name:
            "Tomato",

        pH:
            [5.8, 7.0],

        moisture:
            [50, 75],

        nitrogen:
            [220, 350],

        phosphorus:
            [30, 70],

        potassium:
            [250, 450],

        electricalConductivity:
            [0, 2.5],

        organicCarbon:
            [0.6, 1.5],

        temperature:
            [18, 30]
    },


    cotton: {

        name:
            "Cotton",

        pH:
            [5.8, 8.0],

        moisture:
            [40, 70],

        nitrogen:
            [200, 350],

        phosphorus:
            [25, 60],

        potassium:
            [200, 400],

        electricalConductivity:
            [0, 2.0],

        organicCarbon:
            [0.4, 1.2],

        temperature:
            [21, 35]
    },


    maize: {

        name:
            "Maize",

        pH:
            [5.8, 7.2],

        moisture:
            [45, 75],

        nitrogen:
            [250, 400],

        phosphorus:
            [30, 70],

        potassium:
            [180, 350],

        electricalConductivity:
            [0, 2.0],

        organicCarbon:
            [0.5, 1.5],

        temperature:
            [18, 32]
    },


    chili: {

        name:
            "Chilli",

        pH:
            [6.0, 7.0],

        moisture:
            [50, 75],

        nitrogen:
            [180, 320],

        phosphorus:
            [30, 65],

        potassium:
            [220, 400],

        electricalConductivity:
            [0, 2.0],

        organicCarbon:
            [0.6, 1.5],

        temperature:
            [18, 32]
    },


    groundnut: {

        name:
            "Groundnut",

        pH:
            [6.0, 7.5],

        moisture:
            [40, 65],

        nitrogen:
            [100, 200],

        phosphorus:
            [25, 60],

        potassium:
            [150, 300],

        electricalConductivity:
            [0, 2.0],

        organicCarbon:
            [0.4, 1.2],

        temperature:
            [22, 32]
    },


    generic: {

        name:
            "General Crop",

        pH:
            [6.0, 7.5],

        moisture:
            [45, 75],

        nitrogen:
            [200, 350],

        phosphorus:
            [25, 60],

        potassium:
            [180, 350],

        electricalConductivity:
            [0, 2.0],

        organicCarbon:
            [0.5, 1.5],

        temperature:
            [18, 32]
    }
};


/* ============================================================
   04. UTILITY
============================================================ */

function clampSoilValue(
    value,
    min = 0,
    max = 100
) {

    const numeric =
        Number(value);


    if (
        Number.isNaN(
            numeric
        )
    ) {

        return min;

    }


    return Math.min(
        max,
        Math.max(
            min,
            numeric
        )
    );
}


/* ============================================================
   05. NORMALIZE SOIL DATA
============================================================ */

function normalizeSoilData(
    soil = {}
) {

    return {

        moisture:
            clampSoilValue(
                soil.moisture ??
                DEFAULT_SOIL.moisture
            ),

        pH:
            Number(
                soil.pH ??
                DEFAULT_SOIL.pH
            ),

        nitrogen:
            Math.max(
                0,
                Number(
                    soil.nitrogen ??
                    DEFAULT_SOIL.nitrogen
                )
            ),

        phosphorus:
            Math.max(
                0,
                Number(
                    soil.phosphorus ??
                    DEFAULT_SOIL.phosphorus
                )
            ),

        potassium:
            Math.max(
                0,
                Number(
                    soil.potassium ??
                    DEFAULT_SOIL.potassium
                )
            ),

        electricalConductivity:
            Math.max(
                0,
                Number(
                    soil.electricalConductivity ??
                    DEFAULT_SOIL.electricalConductivity
                )
            ),

        organicCarbon:
            Math.max(
                0,
                Number(
                    soil.organicCarbon ??
                    DEFAULT_SOIL.organicCarbon
                )
            ),

        temperature:
            Number(
                soil.temperature ??
                DEFAULT_SOIL.temperature
            ),

        soilType:
            soil.soilType ||
            DEFAULT_SOIL.soilType,

        drainage:
            soil.drainage ||
            DEFAULT_SOIL.drainage,

        waterHoldingCapacity:
            clampSoilValue(
                soil.waterHoldingCapacity ??
                DEFAULT_SOIL.waterHoldingCapacity
            ),

        texture:
            soil.texture ||
            DEFAULT_SOIL.texture,

        bulkDensity:
            Number(
                soil.bulkDensity ??
                DEFAULT_SOIL.bulkDensity
            ),

        depth:
            Number(
                soil.depth ??
                DEFAULT_SOIL.depth
            ),

        timestamp:
            soil.timestamp ||
            new Date().toISOString()
    };
}


/* ============================================================
   06. GET CROP PROFILE
============================================================ */

function getSoilCropProfile(
    crop
) {

    if (
        !crop
    ) {

        return SOIL_CROP_PROFILES.generic;

    }


    const normalized =
        String(
            crop
        )
        .toLowerCase()
        .trim();


    if (
        SOIL_CROP_PROFILES[
            normalized
        ]
    ) {

        return SOIL_CROP_PROFILES[
            normalized
        ];

    }


    /*
        Aliases
    */

    const aliases = {

        "rice":
            "rice",

        "paddy":
            "rice",

        "tomato":
            "tomato",

        "cotton":
            "cotton",

        "maize":
            "maize",

        "corn":
            "maize",

        "chilli":
            "chili",

        "chili":
            "chili",

        "groundnut":
            "groundnut",

        "peanut":
            "groundnut"
    };


    const profileKey =
        aliases[
            normalized
        ];


    return (
        SOIL_CROP_PROFILES[
            profileKey
        ] ||
        SOIL_CROP_PROFILES.generic
    );
}


/* ============================================================
   07. pH RISK
============================================================ */

function calculateSoilPHRisk(
    pH,
    crop = "generic"
) {

    const profile =
        getSoilCropProfile(
            crop
        );


    const range =
        profile.pH;


    const value =
        Number(
            pH
        );


    if (
        Number.isNaN(
            value
        )
    ) {

        return 50;

    }


    const min =
        range[0];

    const max =
        range[1];


    if (
        value >= min &&
        value <= max
    ) {

        return 0;

    }


    const distance =
        value < min
            ? min - value
            : value - max;


    /*
        pH is logarithmic, so even small deviations
        can matter for nutrient availability.
    */

    if (
        distance >= 1.5
    ) {

        return 100;

    }


    if (
        distance >= 1
    ) {

        return 85;

    }


    if (
        distance >= 0.5
    ) {

        return 65;

    }


    return 35;
}


/* ============================================================
   08. SOIL MOISTURE RISK
============================================================ */

function calculateSoilMoistureRisk(
    moisture,
    crop = "generic"
) {

    const profile =
        getSoilCropProfile(
            crop
        );


    const range =
        profile.moisture;


    const value =
        clampSoilValue(
            moisture
        );


    const min =
        range[0];

    const max =
        range[1];


    if (
        value >= min &&
        value <= max
    ) {

        /*
            Slightly favor the middle of the
            crop's optimal moisture range.
        */

        const midpoint =
            (
                min +
                max
            ) / 2;


        const distance =
            Math.abs(
                value -
                midpoint
            );


        return clampSoilValue(
            distance * 3,
            0,
            40
        );

    }


    if (
        value < min
    ) {

        const deficit =
            min -
            value;


        if (
            deficit >= 30
        ) {

            return 100;

        }


        if (
            deficit >= 20
        ) {

            return 85;

        }


        if (
            deficit >= 10
        ) {

            return 65;

        }


        return 40;
    }


    const excess =
        value -
        max;


    if (
        excess >= 25
    ) {

        return 100;

    }


    if (
        excess >= 15
    ) {

        return 85;

    }


    if (
        excess >= 8
    ) {

        return 65;

    }


    return 40;
}


/* ============================================================
   09. NUTRIENT STATUS
============================================================ */

function evaluateNutrient(
    value,
    range,
    nutrientName
) {

    const numeric =
        Number(
            value
        );


    const minimum =
        Number(
            range[0]
        );

    const maximum =
        Number(
            range[1]
        );


    let status =
        "optimal";


    let score =
        100;


    let deficiencyRisk =
        0;


    let excessRisk =
        0;


    if (
        numeric < minimum
    ) {

        const deficit =
            minimum -
            numeric;


        if (
            deficit >=
            minimum * 0.5
        ) {

            deficiencyRisk =
                100;

        } else if (
            deficit >=
            minimum * 0.3
        ) {

            deficiencyRisk =
                80;

        } else if (
            deficit >=
            minimum * 0.15
        ) {

            deficiencyRisk =
                55;

        } else {

            deficiencyRisk =
                30;

        }


        score =
            100 -
            deficiencyRisk;


        status =
            "deficient";

    } else if (
        numeric > maximum
    ) {

        const excess =
            numeric -
            maximum;


        if (
            excess >=
            maximum * 0.5
        ) {

            excessRisk =
                100;

        } else if (
            excess >=
            maximum * 0.3
        ) {

            excessRisk =
                80;

        } else if (
            excess >=
            maximum * 0.15
        ) {

            excessRisk =
                55;

        } else {

            excessRisk =
                30;

        }


        score =
            100 -
            excessRisk;


        status =
            "excess";

    }


    return {

        nutrient:
            nutrientName,

        value:
            numeric,

        minimum,

        maximum,

        status,

        score:
            Number(
                score.toFixed(1)
            ),

        deficiencyRisk,

        excessRisk
    };
}


/* ============================================================
   10. NPK EVALUATION
============================================================ */

function calculateNutrientBalance(
    soil,
    crop = "generic"
) {

    const profile =
        getSoilCropProfile(
            crop
        );


    const nitrogen =
        evaluateNutrient(
            soil.nitrogen,
            profile.nitrogen,
            "Nitrogen"
        );


    const phosphorus =
        evaluateNutrient(
            soil.phosphorus,
            profile.phosphorus,
            "Phosphorus"
        );


    const potassium =
        evaluateNutrient(
            soil.potassium,
            profile.potassium,
            "Potassium"
        );


    const nutrientScore =
        (
            nitrogen.score * 0.40
        ) +
        (
            phosphorus.score * 0.25
        ) +
        (
            potassium.score * 0.35
        );


    return {

        score:
            Number(
                nutrientScore.toFixed(1)
            ),

        nitrogen,

        phosphorus,

        potassium,

        deficientNutrients:
            [
                nitrogen,
                phosphorus,
                potassium
            ]
            .filter(
                item =>
                    item.status ===
                    "deficient"
            ),

        excessiveNutrients:
            [
                nitrogen,
                phosphorus,
                potassium
            ]
            .filter(
                item =>
                    item.status ===
                    "excess"
            )
    };
}


/* ============================================================
   11. SALINITY RISK
============================================================ */

function calculateSoilSalinityRisk(
    ec
) {

    const value =
        Math.max(
            0,
            Number(
                ec
            ) || 0
        );


    /*
        General prototype EC interpretation.

        < 1.0     low
        1–2       manageable
        2–4       moderate/high
        > 4       severe
    */

    if (
        value <= 1
    ) {

        return 10;

    }


    if (
        value <= 2
    ) {

        return 30;

    }


    if (
        value <= 4
    ) {

        return 65;

    }


    if (
        value <= 8
    ) {

        return 90;

    }


    return 100;
}


/* ============================================================
   12. ORGANIC CARBON SCORE
============================================================ */

function calculateOrganicCarbonScore(
    organicCarbon
) {

    const value =
        Math.max(
            0,
            Number(
                organicCarbon
            ) || 0
        );


    if (
        value >= 1.0
    ) {

        return 100;

    }


    if (
        value >= 0.75
    ) {

        return 90;

    }


    if (
        value >= 0.5
    ) {

        return 70;

    }


    if (
        value >= 0.3
    ) {

        return 45;

    }


    return 20;
}


/* ============================================================
   13. SOIL TEMPERATURE RISK
============================================================ */

function calculateSoilTemperatureRisk(
    temperature,
    crop = "generic"
) {

    const profile =
        getSoilCropProfile(
            crop
        );


    const range =
        profile.temperature;


    const value =
        Number(
            temperature
        );


    if (
        value >= range[0] &&
        value <= range[1]
    ) {

        return 10;

    }


    const distance =
        value < range[0]
            ? range[0] - value
            : value - range[1];


    if (
        distance >= 8
    ) {

        return 100;

    }


    if (
        distance >= 5
    ) {

        return 80;

    }


    if (
        distance >= 3
    ) {

        return 55;

    }


    return 30;
}


/* ============================================================
   14. DRAINAGE RISK
============================================================ */

function calculateDrainageRisk(
    drainage
) {

    const value =
        String(
            drainage ||
            ""
        )
        .toLowerCase()
        .trim();


    if (
        value.includes(
            "excellent"
        )
    ) {

        return 5;

    }


    if (
        value.includes(
            "good"
        )
    ) {

        return 15;

    }


    if (
        value.includes(
            "moderate"
        ) ||
        value.includes(
            "medium"
        )
    ) {

        return 45;

    }


    if (
        value.includes(
            "poor"
        )
    ) {

        return 80;

    }


    if (
        value.includes(
            "very poor"
        )
    ) {

        return 100;

    }


    return 40;
}


/* ============================================================
   15. WATERLOGGING RISK
============================================================ */

function calculateWaterloggingRisk(
    soil
) {

    const moistureRisk =
        soil.moisture >= 90
            ? 100
            : soil.moisture >= 80
                ? 80
                : soil.moisture >= 70
                    ? 55
                    : 20;


    const drainageRisk =
        calculateDrainageRisk(
            soil.drainage
        );


    const waterHoldingAdjustment =
        soil.waterHoldingCapacity >= 80
            ? 15
            : 0;


    const risk =
        (
            moistureRisk *
            0.55
        ) +
        (
            drainageRisk *
            0.35
        ) +
        (
            waterHoldingAdjustment *
            0.10
        );


    return clampSoilValue(
        risk
    );
}


/* ============================================================
   16. COMPACTION RISK
============================================================ */

function calculateCompactionRisk(
    bulkDensity,
    soilType
) {

    const density =
        Number(
            bulkDensity
        );


    if (
        Number.isNaN(
            density
        )
    ) {

        return 40;

    }


    /*
        Approximate prototype thresholds.
    */

    if (
        density <= 1.2
    ) {

        return 10;

    }


    if (
        density <= 1.4
    ) {

        return 25;

    }


    if (
        density <= 1.6
    ) {

        return 55;

    }


    if (
        density <= 1.8
    ) {

        return 80;

    }


    return 100;
}


/* ============================================================
   17. IRRIGATION REQUIREMENT
============================================================ */

function calculateIrrigationRequirement(
    soil,
    crop = "generic",
    weather = null
) {

    const profile =
        getSoilCropProfile(
            crop
        );


    const minMoisture =
        profile.moisture[0];


    const maxMoisture =
        profile.moisture[1];


    const moisture =
        soil.moisture;


    let status =
        "No immediate irrigation";


    let priority =
        "LOW";


    let estimatedNeed =
        0;


    if (
        moisture <
        minMoisture
    ) {

        const deficit =
            minMoisture -
            moisture;


        estimatedNeed =
            clampSoilValue(
                deficit * 1.2,
                0,
                40
            );


        if (
            deficit >= 20
        ) {

            status =
                "Irrigation urgently required";

            priority =
                "URGENT";

        } else if (
            deficit >= 10
        ) {

            status =
                "Irrigation recommended";

            priority =
                "HIGH";

        } else {

            status =
                "Light irrigation may be required";

            priority =
                "MEDIUM";
        }

    } else if (
        moisture >
        maxMoisture
    ) {

        status =
            "Do NOT irrigate";


        priority =
            "AVOID";


        estimatedNeed =
            0;

    } else {

        status =
            "Moisture within target range";


        priority =
            "LOW";


        estimatedNeed =
            0;
    }


    /*
        Weather forecast modifier.
    */

    let weatherModifier =
        "No weather adjustment";


    if (
        weather
    ) {

        const rainfall =
            Number(
                weather.rainfall24h
            ) || 0;


        const probability =
            Number(
                weather.rainfallProbability
            ) || 0;


        if (
            rainfall >= 10 ||
            probability >= 70
        ) {

            if (
                priority !==
                "AVOID"
            ) {

                priority =
                    "DEFER";

            }


            status =
                "Defer irrigation — rainfall likely";


            estimatedNeed =
                0;


            weatherModifier =
                "Rainfall forecast reduces irrigation requirement.";
        }


        if (
            rainfall >= 25
        ) {

            status =
                "Avoid irrigation — significant rainfall";


            priority =
                "AVOID";


            estimatedNeed =
                0;

        }

    }


    return {

        status,

        priority,

        estimatedNeed:
            Number(
                estimatedNeed.toFixed(1)
            ),

        targetMoisture:
            [
                minMoisture,
                maxMoisture
            ],

        currentMoisture:
            moisture,

        weatherModifier
    };
}


/* ============================================================
   18. NUTRIENT RECOMMENDATION
============================================================ */

function generateNutrientRecommendations(
    nutrientBalance
) {

    const recommendations = [];


    nutrientBalance
        .deficientNutrients
        .forEach(
            nutrient => {

                let recommendation;


                switch (
                    nutrient.nutrient
                ) {

                    case "Nitrogen":

                        recommendation =
                            "Consider nitrogen supplementation after confirming crop stage and soil-test results.";

                        break;


                    case "Phosphorus":

                        recommendation =
                            "Consider phosphorus management based on crop stage and soil-test recommendations.";

                        break;


                    case "Potassium":

                        recommendation =
                            "Consider potassium supplementation if confirmed by soil testing and crop requirement.";

                        break;


                    default:

                        recommendation =
                            `Review ${nutrient.nutrient} availability.`;

                }


                recommendations.push({

                    nutrient:
                        nutrient.nutrient,

                    priority:
                        nutrient.deficiencyRisk >= 80
                            ? "HIGH"
                            : "MEDIUM",

                    status:
                        "Deficient",

                    recommendation
                });

            }
        );


    nutrientBalance
        .excessiveNutrients
        .forEach(
            nutrient => {

                recommendations.push({

                    nutrient:
                        nutrient.nutrient,

                    priority:
                        "HIGH",

                    status:
                        "Excess",

                    recommendation:
                        `Avoid unnecessary ${nutrient.nutrient} application until the excess is confirmed and corrected.`
                });

            }
        );


    if (
        recommendations.length === 0
    ) {

        recommendations.push({

            nutrient:
                "NPK",

            priority:
                "LOW",

            status:
                "Balanced",

            recommendation:
                "NPK levels are within the selected crop's target range."
        });

    }


    return recommendations;
}


/* ============================================================
   19. SOIL HEALTH SCORE
============================================================ */

function calculateSoilHealthScore(
    context
) {

    const moistureScore =
        100 -
        context.moistureRisk;


    const phScore =
        100 -
        context.phRisk;


    const nutrientScore =
        context.nutrientBalance.score;


    const salinityScore =
        100 -
        context.salinityRisk;


    const organicCarbonScore =
        context.organicCarbonScore;


    const temperatureScore =
        100 -
        context.temperatureRisk;


    const drainageScore =
        100 -
        context.drainageRisk;


    const compactionScore =
        100 -
        context.compactionRisk;


    const score =

        (
            moistureScore *
            0.15
        ) +

        (
            phScore *
            0.15
        ) +

        (
            nutrientScore *
            0.25
        ) +

        (
            salinityScore *
            0.10
        ) +

        (
            organicCarbonScore *
            0.15
        ) +

        (
            temperatureScore *
            0.05
        ) +

        (
            drainageScore *
            0.10
        ) +

        (
            compactionScore *
            0.05
        );


    return clampSoilValue(
        score
    );
}


/* ============================================================
   20. SOIL RISK FACTORS
============================================================ */

function buildSoilRiskFactors(
    context
) {

    const factors = [];


    if (
        context.phRisk >= 40
    ) {

        factors.push({

            type:
                "pH",

            score:
                context.phRisk,

            severity:
                context.phRisk >= 75
                    ? "high"
                    : "moderate",

            title:
                "pH Imbalance",

            description:
                `Soil pH is ${context.soil.pH}. This may reduce nutrient availability for ${context.cropProfile.name}.`
        });

    }


    if (
        context.moistureRisk >= 50
    ) {

        factors.push({

            type:
                "moisture",

            score:
                context.moistureRisk,

            severity:
                context.moistureRisk >= 80
                    ? "high"
                    : "moderate",

            title:
                "Soil Moisture Stress",

            description:
                `Current soil moisture is ${context.soil.moisture}%.`
        });

    }


    if (
        context.salinityRisk >= 50
    ) {

        factors.push({

            type:
                "salinity",

            score:
                context.salinityRisk,

            severity:
                context.salinityRisk >= 80
                    ? "high"
                    : "moderate",

            title:
                "Salinity Pressure",

            description:
                `Electrical conductivity is ${context.soil.electricalConductivity} dS/m.`
        });

    }


    if (
        context.waterloggingRisk >= 60
    ) {

        factors.push({

            type:
                "waterlogging",

            score:
                context.waterloggingRisk,

            severity:
                context.waterloggingRisk >= 80
                    ? "high"
                    : "moderate",

            title:
                "Waterlogging Risk",

            description:
                "High moisture and/or poor drainage may increase root-zone stress."
        });

    }


    if (
        context.compactionRisk >= 60
    ) {

        factors.push({

            type:
                "compaction",

            score:
                context.compactionRisk,

            severity:
                context.compactionRisk >= 80
                    ? "high"
                    : "moderate",

            title:
                "Soil Compaction",

            description:
                `Estimated bulk density is ${context.soil.bulkDensity} g/cm³.`
        });

    }


    if (
        context.nutrientBalance
            .deficientNutrients
            .length > 0
    ) {

        context.nutrientBalance
            .deficientNutrients
            .forEach(
                nutrient => {

                    factors.push({

                        type:
                            "nutrient-deficiency",

                        score:
                            nutrient.deficiencyRisk,

                        severity:
                            nutrient.deficiencyRisk >= 80
                                ? "high"
                                : "moderate",

                        title:
                            `${nutrient.nutrient} Deficiency`,

                        description:
                            `${nutrient.nutrient} is below the selected crop's target range.`
                    });

                }
            );

    }


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
   21. SOIL ALERTS
============================================================ */

function generateSoilAlerts(
    context
) {

    const alerts = [];


    if (
        context.soilHealthScore < 40
    ) {

        alerts.push({

            severity:
                "critical",

            title:
                "Poor Soil Health",

            message:
                "Multiple soil parameters require attention.",

            priority:
                1
        });

    } else if (
        context.soilHealthScore < 60
    ) {

        alerts.push({

            severity:
                "high",

            title:
                "Soil Health Needs Attention",

            message:
                "Several soil parameters are outside their preferred range.",

            priority:
                2
        });

    }


    if (
        context.waterloggingRisk >= 80
    ) {

        alerts.push({

            severity:
                "critical",

            title:
                "Waterlogging Risk",

            message:
                "Avoid unnecessary irrigation and inspect field drainage.",

            priority:
                3
        });

    }


    if (
        context.salinityRisk >= 80
    ) {

        alerts.push({

            severity:
                "high",

            title:
                "High Salinity Risk",

            message:
                "Electrical conductivity indicates possible salinity stress.",

            priority:
                4
        });

    }


    if (
        context.nutrientBalance
            .deficientNutrients
            .length
    ) {

        alerts.push({

            severity:
                "medium",

            title:
                "Nutrient Deficiency Detected",

            message:
                context.nutrientBalance
                    .deficientNutrients
                    .map(
                        item =>
                            item.nutrient
                    )
                    .join(
                        ", "
                    ) +
                " may require management.",

            priority:
                5
        });

    }


    if (
        context.irrigation.priority ===
        "URGENT"
    ) {

        alerts.push({

            severity:
                "high",

            title:
                "Irrigation Required",

            message:
                "Soil moisture is below the selected crop's target range.",

            priority:
                6
        });

    }


    alerts.sort(
        (
            a,
            b
        ) =>
            a.priority -
            b.priority
    );


    return alerts;
}


/* ============================================================
   22. COMPLETE SOIL ANALYSIS
============================================================ */

function analyzeSoil(
    soilInput = null,
    options = {}
) {

    const soil =
        normalizeSoilData(
            soilInput ||
            DEFAULT_SOIL
        );


    const crop =
        options.crop ||
        "generic";


    const cropProfile =
        getSoilCropProfile(
            crop
        );


    /*
        Individual parameter analysis
    */

    const phRisk =
        calculateSoilPHRisk(
            soil.pH,
            crop
        );


    const moistureRisk =
        calculateSoilMoistureRisk(
            soil.moisture,
            crop
        );


    const nutrientBalance =
        calculateNutrientBalance(
            soil,
            crop
        );


    const salinityRisk =
        calculateSoilSalinityRisk(
            soil.electricalConductivity
        );


    const organicCarbonScore =
        calculateOrganicCarbonScore(
            soil.organicCarbon
        );


    const temperatureRisk =
        calculateSoilTemperatureRisk(
            soil.temperature,
            crop
        );


    const drainageRisk =
        calculateDrainageRisk(
            soil.drainage
        );


    const waterloggingRisk =
        calculateWaterloggingRisk(
            soil
        );


    const compactionRisk =
        calculateCompactionRisk(
            soil.bulkDensity,
            soil.soilType
        );


    /*
        Irrigation
    */

    const irrigation =
        calculateIrrigationRequirement(
            soil,
            crop,
            options.weather ||
            null
        );


    /*
        Soil health
    */

    const healthContext = {

        soil,

        cropProfile,

        crop,

        phRisk,

        moistureRisk,

        nutrientBalance,

        salinityRisk,

        organicCarbonScore,

        temperatureRisk,

        drainageRisk,

        waterloggingRisk,

        compactionRisk,

        irrigation
    };


    const soilHealthScore =
        calculateSoilHealthScore(
            healthContext
        );


    /*
        Overall soil stress

        Higher = worse.
    */

    const soilStressScore =
        clampSoilValue(

            (
                phRisk *
                0.15
            ) +

            (
                moistureRisk *
                0.15
            ) +

            (
                (100 -
                    nutrientBalance.score
                ) *
                0.25
            ) +

            (
                salinityRisk *
                0.10
            ) +

            (
                (100 -
                    organicCarbonScore
                ) *
                0.10
            ) +

            (
                temperatureRisk *
                0.05
            ) +

            (
                drainageRisk *
                0.10
            ) +

            (
                waterloggingRisk *
                0.10
            )
        );


    const context = {

        ...healthContext,

        soilHealthScore,

        soilStressScore
    };


    /*
        Explainable factors
    */

    const factors =
        buildSoilRiskFactors(
            context
        );


    /*
        Recommendations
    */

    const nutrientRecommendations =
        generateNutrientRecommendations(
            nutrientBalance
        );


    const recommendations = [

        ...nutrientRecommendations
    ];


    if (
        irrigation.priority !==
        "LOW"
    ) {

        recommendations.push({

            nutrient:
                "Water",

            priority:
                irrigation.priority,

            status:
                irrigation.status,

            recommendation:
                irrigation.status
        });

    }


    if (
        waterloggingRisk >= 60
    ) {

        recommendations.push({

            nutrient:
                "Drainage",

            priority:
                waterloggingRisk >= 80
                    ? "HIGH"
                    : "MEDIUM",

            status:
                "Attention Required",

            recommendation:
                "Inspect field drainage and avoid unnecessary irrigation until excess water has cleared."
        });

    }


    if (
        phRisk >= 50
    ) {

        recommendations.push({

            nutrient:
                "pH",

            priority:
                "MEDIUM",

            status:
                "Imbalanced",

            recommendation:
                "Confirm pH through a reliable soil test before applying amendments."
        });

    }


    if (
        organicCarbonScore < 60
    ) {

        recommendations.push({

            nutrient:
                "Organic Carbon",

            priority:
                "MEDIUM",

            status:
                "Low",

            recommendation:
                "Consider suitable organic matter management such as compost or crop-residue incorporation after local agronomic assessment."
        });

    }


    /*
        Alerts
    */

    const alerts =
        generateSoilAlerts(
            context
        );


    /*
        Classification
    */

    const classification =
        classifySoilHealth(
            soilHealthScore
        );


    const result = {

        soil,

        crop,

        cropProfile,

        soilHealthScore:
            Number(
                soilHealthScore.toFixed(1)
            ),

        soilStressScore:
            Number(
                soilStressScore.toFixed(1)
            ),

        ...classification,

        phRisk:
            Number(
                phRisk.toFixed(1)
            ),

        moistureRisk:
            Number(
                moistureRisk.toFixed(1)
            ),

        nutrientBalance,

        salinityRisk:
            Number(
                salinityRisk.toFixed(1)
            ),

        organicCarbonScore:
            Number(
                organicCarbonScore.toFixed(1)
            ),

        temperatureRisk:
            Number(
                temperatureRisk.toFixed(1)
            ),

        drainageRisk:
            Number(
                drainageRisk.toFixed(1)
            ),

        waterloggingRisk:
            Number(
                waterloggingRisk.toFixed(1)
            ),

        compactionRisk:
            Number(
                compactionRisk.toFixed(1)
            ),

        irrigation,

        factors,

        recommendations,

        alerts,

        calculatedAt:
            new Date().toISOString(),

        source:
            SOIL_ENGINE_STATE.source
    };


    /*
        Update state
    */

    SOIL_ENGINE_STATE.current =
        result;


    SOIL_ENGINE_STATE.lastUpdated =
        result.calculatedAt;


    SOIL_ENGINE_STATE.history.unshift(
        result
    );


    if (
        SOIL_ENGINE_STATE.history.length >
        30
    ) {

        SOIL_ENGINE_STATE.history.pop();

    }


    /*
        Update global application state
        if app.js already created it.
    */

    if (
        typeof APP_STATE !==
        "undefined"
    ) {

        APP_STATE.currentSoil =
            result;

        APP_STATE.soilHealthScore =
            result.soilHealthScore;
    }


    /*
        Notify dashboard
    */

    window.dispatchEvent(
        new CustomEvent(
            "agriguard:soilUpdated",
            {
                detail:
                    result
            }
        )
    );


    return result;
}


/* ============================================================
   23. SOIL HEALTH CLASSIFICATION
============================================================ */

function classifySoilHealth(
    score
) {

    const value =
        Number(
            score
        );


    if (
        value >= 80
    ) {

        return {

            healthLevel:
                "Excellent",

            healthClass:
                "excellent",

            message:
                "Soil conditions are highly suitable for the selected crop."
        };

    }


    if (
        value >= 65
    ) {

        return {

            healthLevel:
                "Good",

            healthClass:
                "good",

            message:
                "Soil conditions are generally suitable with minor management requirements."
        };

    }


    if (
        value >= 50
    ) {

        return {

            healthLevel:
                "Moderate",

            healthClass:
                "moderate",

            message:
                "Several soil parameters should be monitored and managed."
        };

    }


    if (
        value >= 35
    ) {

        return {

            healthLevel:
                "Poor",

            healthClass:
                "poor",

            message:
                "Soil conditions may limit crop performance and require intervention."
        };

    }


    return {

        healthLevel:
            "Critical",

        healthClass:
            "critical",

        message:
            "Multiple soil constraints require immediate assessment."
    };
}


/* ============================================================
   24. SOIL SUMMARY
============================================================ */

function generateSoilSummary(
    result
) {

    if (
        !result
    ) {

        return "Soil intelligence is not available.";

    }


    const score =
        result.soilHealthScore;


    if (
        score >= 80
    ) {

        return `Soil health is excellent (${score}/100). Current conditions are favorable for ${result.cropProfile.name}.`;

    }


    if (
        score >= 65
    ) {

        return `Soil health is good (${score}/100), with some parameters requiring routine monitoring.`;

    }


    if (
        score >= 50
    ) {

        return `Soil health is moderate (${score}/100). Targeted soil and water management is recommended.`;

    }


    if (
        score >= 35
    ) {

        return `Soil health is poor (${score}/100). Multiple constraints may affect crop performance.`;

    }


    return `Soil health is critical (${score}/100). Immediate soil assessment and corrective management are recommended.`;
}


/* ============================================================
   25. SET CURRENT SOIL
============================================================ */

function setCurrentSoil(
    soil
) {

    const normalized =
        normalizeSoilData(
            soil
        );


    SOIL_ENGINE_STATE.current =
        normalized;


    SOIL_ENGINE_STATE.lastUpdated =
        normalized.timestamp;


    return normalized;
}


/* ============================================================
   26. GET CURRENT SOIL
============================================================ */

function getCurrentSoil() {

    return (
        SOIL_ENGINE_STATE.current ||
        normalizeSoilData(
            DEFAULT_SOIL
        )
    );
}


/* ============================================================
   27. GET LAST SOIL ANALYSIS
============================================================ */

function getCurrentSoilAnalysis() {

    return (
        SOIL_ENGINE_STATE.currentAnalysis ||
        null
    );
}


/* ============================================================
   28. SOIL DASHBOARD DATA
============================================================ */

function getSoilDashboardData(
    crop = "generic",
    weather = null
) {

    const soil =
        getCurrentSoil();


    const result =
        analyzeSoil(
            soil,
            {
                crop,
                weather
            }
        );


    return {

        healthScore:
            result.soilHealthScore,

        healthLevel:
            result.healthLevel,

        stressScore:
            result.soilStressScore,

        moisture:
            result.soil.moisture,

        pH:
            result.soil.pH,

        nitrogen:
            result.nutrientBalance
                .nitrogen,

        phosphorus:
            result.nutrientBalance
                .phosphorus,

        potassium:
            result.nutrientBalance
                .potassium,

        salinityRisk:
            result.salinityRisk,

        organicCarbon:
            result.soil.organicCarbon,

        waterloggingRisk:
            result.waterloggingRisk,

        irrigation:
            result.irrigation,

        factors:
            result.factors,

        recommendations:
            result.recommendations,

        alerts:
            result.alerts,

        summary:
            generateSoilSummary(
                result
            ),

        calculatedAt:
            result.calculatedAt
    };
}


/* ============================================================
   29. SOIL CHART DATA
============================================================ */

function getSoilChartData(
    result = null
) {

    const analysis =
        result ||
        SOIL_ENGINE_STATE.current;


    if (
        !analysis
    ) {

        return {

            labels: [],

            values: []
        };

    }


    return {

        labels: [

            "Moisture",

            "pH",

            "Nitrogen",

            "Phosphorus",

            "Potassium",

            "Organic Carbon",

            "Salinity Safety"
        ],


        values: [

            analysis.soil.moisture,

            convertPHToScore(
                analysis.soil.pH
            ),

            analysis.nutrientBalance
                .nitrogen
                .score,

            analysis.nutrientBalance
                .phosphorus
                .score,

            analysis.nutrientBalance
                .potassium
                .score,

            analysis.organicCarbonScore,

            100 -
                analysis.salinityRisk
        ]
    };
}


/* ============================================================
   30. pH → 0–100 SCORE
============================================================ */

function convertPHToScore(
    pH,
    crop = "generic"
) {

    return clampSoilValue(

        100 -
        calculateSoilPHRisk(
            pH,
            crop
        )

    );
}


/* ============================================================
   31. SOIL SENSOR SIMULATION
============================================================ */

/*
    Useful for the SIH prototype.

    Clicking "Refresh Sensor" can produce a slightly
    changing sensor value without needing physical hardware.
*/

function simulateSoilSensorReading() {

    const base =
        normalizeSoilData(
            DEFAULT_SOIL
        );


    const randomVariation =
        (
            value,
            variation
        ) => {

            return Number(
                (
                    value +
                    (
                        (
                            Math.random() *
                            2
                        ) -
                        1
                    ) *
                    variation
                ).toFixed(2)
            );

        };


    const reading = {

        ...base,

        moisture:
            clampSoilValue(
                randomVariation(
                    base.moisture,
                    5
                )
            ),

        pH:
            randomVariation(
                base.pH,
                0.15
            ),

        nitrogen:
            Math.max(
                0,
                randomVariation(
                    base.nitrogen,
                    20
                )
            ),

        phosphorus:
            Math.max(
                0,
                randomVariation(
                    base.phosphorus,
                    5
                )
            ),

        potassium:
            Math.max(
                0,
                randomVariation(
                    base.potassium,
                    20
                )
            ),

        electricalConductivity:
            Math.max(
                0,
                randomVariation(
                    base.electricalConductivity,
                    0.15
                )
            ),

        organicCarbon:
            Math.max(
                0,
                randomVariation(
                    base.organicCarbon,
                    0.05
                )
            ),

        temperature:
            randomVariation(
                base.temperature,
                1
            ),

        timestamp:
            new Date().toISOString()
    };


    SOIL_ENGINE_STATE.sensorConnected =
        true;


    SOIL_ENGINE_STATE.apiStatus =
        "simulated-sensor";


    setCurrentSoil(
        reading
    );


    window.dispatchEvent(
        new CustomEvent(
            "agriguard:soilSensorUpdated",
            {
                detail:
                    reading
            }
        )
    );


    return reading;
}


/* ============================================================
   32. LIVE SENSOR PLACEHOLDER
============================================================ */

async function fetchLiveSoilSensorData(
    sensorId
) {

    console.warn(
        "Live soil sensor API is not connected. Using simulated sensor."
    );


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                400
            )
    );


    /*
        Future architecture:

        GET /api/soil?sensorId=...

        Backend retrieves readings from:

        • ESP32
        • Arduino
        • LoRa sensor
        • MQTT
        • Cloud IoT platform
    */


    const reading =
        simulateSoilSensorReading();


    reading.sensorId =
        sensorId ||
        "DEMO-SOIL-001";


    return reading;
}


/* ============================================================
   33. REFRESH SOIL INTELLIGENCE
============================================================ */

async function refreshSoilIntelligence(
    options = {}
) {

    const crop =
        options.crop ||
        (
            typeof getCurrentCrop ===
            "function"
                ? getCurrentCrop()
                : "generic"
        );


    let soil;


    if (
        options.useSensor === true
    ) {

        soil =
            await fetchLiveSoilSensorData(
                options.sensorId
            );

    } else {

        soil =
            options.soil ||
            getCurrentSoil();

    }


    setCurrentSoil(
        soil
    );


    const result =
        analyzeSoil(
            soil,
            {

                crop,

                weather:
                    options.weather ||
                    null
            }
        );


    window.dispatchEvent(
        new CustomEvent(
            "agriguard:soilIntelligenceReady",
            {
                detail:
                    result
            }
        )
    );


    return result;
}


/* ============================================================
   34. SOIL TREND
============================================================ */

function getSoilHealthTrend() {

    const history =
        SOIL_ENGINE_STATE.history;


    if (
        history.length < 2
    ) {

        return {

            direction:
                "stable",

            change:
                0,

            label:
                "Insufficient historical data"
        };

    }


    const latest =
        history[0]
            .soilHealthScore;


    const previous =
        history[1]
            .soilHealthScore;


    const change =
        Number(
            (
                latest -
                previous
            ).toFixed(1)
        );


    if (
        change >= 5
    ) {

        return {

            direction:
                "improving",

            change,

            label:
                "Soil health improving"
        };

    }


    if (
        change <= -5
    ) {

        return {

            direction:
                "declining",

            change,

            label:
                "Soil health declining"
        };

    }


    return {

        direction:
            "stable",

        change,

        label:
            "Soil health stable"
    };
}


/* ============================================================
   35. RESET ENGINE
============================================================ */

function resetSoilEngine() {

    SOIL_ENGINE_STATE.current =
        null;

    SOIL_ENGINE_STATE.history =
        [];

    SOIL_ENGINE_STATE.lastUpdated =
        null;

    SOIL_ENGINE_STATE.sensorConnected =
        false;

    SOIL_ENGINE_STATE.apiStatus =
        "demo";
}


/* ============================================================
   36. PUBLIC API
============================================================ */

window.SOIL_ENGINE_STATE =
    SOIL_ENGINE_STATE;


window.DEFAULT_SOIL =
    DEFAULT_SOIL;


window.SOIL_CROP_PROFILES =
    SOIL_CROP_PROFILES;


window.normalizeSoilData =
    normalizeSoilData;


window.getSoilCropProfile =
    getSoilCropProfile;


window.calculateSoilPHRisk =
    calculateSoilPHRisk;


window.calculateSoilMoistureRisk =
    calculateSoilMoistureRisk;


window.evaluateNutrient =
    evaluateNutrient;


window.calculateNutrientBalance =
    calculateNutrientBalance;


window.calculateSoilSalinityRisk =
    calculateSoilSalinityRisk;


window.calculateOrganicCarbonScore =
    calculateOrganicCarbonScore;


window.calculateSoilTemperatureRisk =
    calculateSoilTemperatureRisk;


window.calculateDrainageRisk =
    calculateDrainageRisk;


window.calculateWaterloggingRisk =
    calculateWaterloggingRisk;


window.calculateCompactionRisk =
    calculateCompactionRisk;


window.calculateIrrigationRequirement =
    calculateIrrigationRequirement;


window.generateNutrientRecommendations =
    generateNutrientRecommendations;


window.calculateSoilHealthScore =
    calculateSoilHealthScore;


window.analyzeSoil =
    analyzeSoil;


window.classifySoilHealth =
    classifySoilHealth;


window.generateSoilSummary =
    generateSoilSummary;


window.setCurrentSoil =
    setCurrentSoil;


window.getCurrentSoil =
    getCurrentSoil;


window.getCurrentSoilAnalysis =
    getCurrentSoilAnalysis;


window.getSoilDashboardData =
    getSoilDashboardData;


window.getSoilChartData =
    getSoilChartData;


window.convertPHToScore =
    convertPHToScore;


window.simulateSoilSensorReading =
    simulateSoilSensorReading;


window.fetchLiveSoilSensorData =
    fetchLiveSoilSensorData;


window.refreshSoilIntelligence =
    refreshSoilIntelligence;


window.getSoilHealthTrend =
    getSoilHealthTrend;


window.resetSoilEngine =
    resetSoilEngine;


/* ============================================================
   37. INITIALIZATION LOG
============================================================ */

console.log(
    "%c🌱 AgriGuard Soil Intelligence Engine",
    "font-size:16px;font-weight:bold;"
);

console.log(
    "Soil intelligence initialized."
);

console.log(
    "Supported crop profiles:",
    Object.keys(
        SOIL_CROP_PROFILES
    )
);

console.log(
    "Sensor:",
    SOIL_ENGINE_STATE.sensorConnected
        ? "Connected"
        : "Demo Mode"
);
