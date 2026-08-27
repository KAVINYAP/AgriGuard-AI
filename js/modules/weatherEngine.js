/* ============================================================
   AGRIGUARD AI
   SIH 2026 PROTOTYPE
   WEATHER INTELLIGENCE ENGINE
============================================================ */

/*
    PURPOSE
    -------
    Converts weather and forecast information into
    agriculture-specific intelligence.

    The engine considers:

        • Temperature
        • Relative humidity
        • Rainfall
        • Rainfall accumulation
        • Leaf wetness
        • Wind speed
        • Sunshine
        • Forecast trend
        • Consecutive wet days
        • Temperature/humidity combinations
        • Disease-specific favorable conditions

    OUTPUT
    ------

        Weather Risk Score       0–100
        Disease Favorability      0–100
        Wetness Risk              0–100
        Heat Stress Risk          0–100
        Water Stress Risk         0–100
        Forecast Risk Trend
        Early Warning
        Explainable Factors
        Recommended Actions

    IMPORTANT
    ---------
    This is the FRONTEND intelligence layer.

    It works with demo weather data now.

    Later it can be connected to a live weather API
    without changing the rest of the application.

    Possible future integrations:

        OpenWeather
        WeatherAPI
        IMD / government weather services
        IoT weather station
        Satellite-derived weather
        Farm sensors
*/


/* ============================================================
   01. WEATHER ENGINE STATE
============================================================ */

const WEATHER_ENGINE_STATE = {

    current: null,

    forecast: [],

    risk: null,

    lastUpdated: null,

    source: "AgriGuard Demo Weather Intelligence",

    connectedToLiveAPI: false,

    apiStatus: "demo",

    history: []
};


/* ============================================================
   02. DEFAULT CURRENT WEATHER
============================================================ */

const DEFAULT_WEATHER = {

    temperature: 28,

    feelsLike: 30,

    humidity: 78,

    rainfall24h: 12,

    rainfall3h: 4,

    rainfall7d: 48,

    windSpeed: 8,

    windDirection: "SW",

    leafWetness: 65,

    sunshineHours: 5,

    cloudCover: 62,

    pressure: 1008,

    uvIndex: 6,

    weatherCondition: "Partly Cloudy",

    weatherTrend: "humid",

    consecutiveWetDays: 2,

    soilMoisture: 62,

    timestamp:
        new Date().toISOString()
};


/* ============================================================
   03. DEMO FORECAST
============================================================ */

/*
    Forecast values are intentionally deterministic.

    This makes the SIH demonstration reliable.
*/

const DEFAULT_FORECAST = [

    {
        day: "Today",

        date:
            getDateOffset(0),

        temperatureMin: 25,

        temperatureMax: 31,

        humidity: 78,

        rainfallProbability: 62,

        rainfall: 12,

        windSpeed: 8,

        condition: "Partly Cloudy",

        diseaseRisk: 68
    },

    {
        day: "Tomorrow",

        date:
            getDateOffset(1),

        temperatureMin: 25,

        temperatureMax: 30,

        humidity: 82,

        rainfallProbability: 72,

        rainfall: 18,

        windSpeed: 7,

        condition: "Light Rain",

        diseaseRisk: 76
    },

    {
        day: "Day 3",

        date:
            getDateOffset(2),

        temperatureMin: 24,

        temperatureMax: 29,

        humidity: 86,

        rainfallProbability: 78,

        rainfall: 24,

        windSpeed: 6,

        condition: "Rain",

        diseaseRisk: 84
    },

    {
        day: "Day 4",

        date:
            getDateOffset(3),

        temperatureMin: 24,

        temperatureMax: 30,

        humidity: 81,

        rainfallProbability: 65,

        rainfall: 15,

        windSpeed: 9,

        condition: "Cloudy",

        diseaseRisk: 72
    },

    {
        day: "Day 5",

        date:
            getDateOffset(4),

        temperatureMin: 25,

        temperatureMax: 32,

        humidity: 70,

        rainfallProbability: 42,

        rainfall: 7,

        windSpeed: 11,

        condition: "Partly Cloudy",

        diseaseRisk: 55
    },

    {
        day: "Day 6",

        date:
            getDateOffset(5),

        temperatureMin: 26,

        temperatureMax: 33,

        humidity: 67,

        rainfallProbability: 32,

        rainfall: 4,

        windSpeed: 13,

        condition: "Sunny",

        diseaseRisk: 42
    },

    {
        day: "Day 7",

        date:
            getDateOffset(6),

        temperatureMin: 26,

        temperatureMax: 32,

        humidity: 72,

        rainfallProbability: 48,

        rainfall: 8,

        windSpeed: 10,

        condition: "Cloudy",

        diseaseRisk: 50
    }
];


/* ============================================================
   04. DATE UTILITY
============================================================ */

function getDateOffset(
    offset
) {

    const date =
        new Date();


    date.setDate(
        date.getDate() +
        offset
    );


    return date
        .toISOString()
        .split("T")[0];
}


/* ============================================================
   05. NORMALIZE WEATHER DATA
============================================================ */

function normalizeWeatherData(
    weather = {}
) {

    return {

        temperature:
            Number(
                weather.temperature ??
                DEFAULT_WEATHER.temperature
            ),

        feelsLike:
            Number(
                weather.feelsLike ??
                DEFAULT_WEATHER.feelsLike
            ),

        humidity:
            clampRiskValue(
                weather.humidity ??
                DEFAULT_WEATHER.humidity
            ),

        rainfall24h:
            Math.max(
                0,
                Number(
                    weather.rainfall24h ??
                    DEFAULT_WEATHER.rainfall24h
                )
            ),

        rainfall3h:
            Math.max(
                0,
                Number(
                    weather.rainfall3h ??
                    DEFAULT_WEATHER.rainfall3h
                )
            ),

        rainfall7d:
            Math.max(
                0,
                Number(
                    weather.rainfall7d ??
                    DEFAULT_WEATHER.rainfall7d
                )
            ),

        windSpeed:
            Math.max(
                0,
                Number(
                    weather.windSpeed ??
                    DEFAULT_WEATHER.windSpeed
                )
            ),

        windDirection:
            weather.windDirection ||
            DEFAULT_WEATHER.windDirection,

        leafWetness:
            clampRiskValue(
                weather.leafWetness ??
                DEFAULT_WEATHER.leafWetness
            ),

        sunshineHours:
            Math.max(
                0,
                Number(
                    weather.sunshineHours ??
                    DEFAULT_WEATHER.sunshineHours
                )
            ),

        cloudCover:
            clampRiskValue(
                weather.cloudCover ??
                DEFAULT_WEATHER.cloudCover
            ),

        pressure:
            Number(
                weather.pressure ??
                DEFAULT_WEATHER.pressure
            ),

        uvIndex:
            Math.max(
                0,
                Number(
                    weather.uvIndex ??
                    DEFAULT_WEATHER.uvIndex
                )
            ),

        weatherCondition:
            weather.weatherCondition ||
            DEFAULT_WEATHER.weatherCondition,

        weatherTrend:
            weather.weatherTrend ||
            DEFAULT_WEATHER.weatherTrend,

        consecutiveWetDays:
            Math.max(
                0,
                Number(
                    weather.consecutiveWetDays ??
                    DEFAULT_WEATHER.consecutiveWetDays
                )
            ),

        soilMoisture:
            clampRiskValue(
                weather.soilMoisture ??
                DEFAULT_WEATHER.soilMoisture
            ),

        timestamp:
            weather.timestamp ||
            new Date().toISOString()
    };
}


/* ============================================================
   06. TEMPERATURE RISK
============================================================ */

function calculateWeatherTemperatureRisk(
    temperature,
    disease = null
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

        return 50;

    }


    /*
        Disease-specific temperature range
    */

    let favorableRange =
        null;


    if (
        disease?.favorableConditions
            ?.temperature
    ) {

        favorableRange =
            disease
                .favorableConditions
                .temperature;

    }


    if (
        favorableRange &&
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
        Generic disease-favorable range
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


    /*
        Extreme heat / cold
    */

    if (
        temperature > 38
    ) {

        return 20;

    }


    if (
        temperature < 12
    ) {

        return 15;

    }


    return 35;
}


/* ============================================================
   07. HUMIDITY RISK
============================================================ */

function calculateWeatherHumidityRisk(
    humidity
) {

    humidity =
        clampRiskValue(
            humidity
        );


    if (
        humidity >= 90
    ) {

        return 100;

    }


    if (
        humidity >= 85
    ) {

        return 95;

    }


    if (
        humidity >= 75
    ) {

        return 82;

    }


    if (
        humidity >= 65
    ) {

        return 58;

    }


    if (
        humidity >= 50
    ) {

        return 30;

    }


    return 10;
}


/* ============================================================
   08. RAINFALL RISK
============================================================ */

function calculateWeatherRainfallRisk(
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


    let recentRisk = 0;


    if (
        rainfall24h >= 40
    ) {

        recentRisk = 100;

    } else if (
        rainfall24h >= 25
    ) {

        recentRisk = 90;

    } else if (
        rainfall24h >= 15
    ) {

        recentRisk = 75;

    } else if (
        rainfall24h >= 5
    ) {

        recentRisk = 45;

    } else {

        recentRisk = 15;

    }


    let accumulatedRisk = 0;


    if (
        rainfall7d >= 120
    ) {

        accumulatedRisk = 100;

    } else if (
        rainfall7d >= 80
    ) {

        accumulatedRisk = 85;

    } else if (
        rainfall7d >= 50
    ) {

        accumulatedRisk = 70;

    } else if (
        rainfall7d >= 30
    ) {

        accumulatedRisk = 45;

    } else {

        accumulatedRisk = 20;

    }


    return clampRiskValue(
        (
            recentRisk * 0.65
        ) +
        (
            accumulatedRisk * 0.35
        )
    );
}


/* ============================================================
   09. LEAF WETNESS RISK
============================================================ */

function calculateWeatherLeafWetnessRisk(
    leafWetness
) {

    leafWetness =
        clampRiskValue(
            leafWetness
        );


    if (
        leafWetness >= 85
    ) {

        return 100;

    }


    if (
        leafWetness >= 70
    ) {

        return 88;

    }


    if (
        leafWetness >= 55
    ) {

        return 65;

    }


    if (
        leafWetness >= 35
    ) {

        return 35;

    }


    return 10;
}


/* ============================================================
   10. WIND RISK
============================================================ */

function calculateWindRisk(
    windSpeed
) {

    windSpeed =
        Math.max(
            0,
            Number(
                windSpeed
            ) || 0
        );


    /*
        Low/moderate wind + humidity can maintain
        leaf wetness.

        Very high wind can contribute to spore spread
        for some diseases, but this prototype keeps
        the effect moderate.
    */

    if (
        windSpeed >= 20
    ) {

        return 60;

    }


    if (
        windSpeed >= 12
    ) {

        return 45;

    }


    if (
        windSpeed >= 5
    ) {

        return 35;

    }


    return 55;
}


/* ============================================================
   11. CLOUD COVER / SUNSHINE RISK
============================================================ */

function calculateCloudWetnessRisk(
    cloudCover,
    sunshineHours
) {

    cloudCover =
        clampRiskValue(
            cloudCover
        );


    sunshineHours =
        Math.max(
            0,
            Number(
                sunshineHours
            ) || 0
        );


    let score = 0;


    if (
        cloudCover >= 85
    ) {

        score += 75;

    } else if (
        cloudCover >= 65
    ) {

        score += 55;

    } else if (
        cloudCover >= 45
    ) {

        score += 35;

    } else {

        score += 15;

    }


    if (
        sunshineHours < 3
    ) {

        score += 20;

    } else if (
        sunshineHours < 5
    ) {

        score += 10;

    }


    return clampRiskValue(
        score
    );
}


/* ============================================================
   12. HEAT STRESS RISK
============================================================ */

function calculateHeatStressRisk(
    temperature,
    humidity
) {

    temperature =
        Number(
            temperature
        );


    humidity =
        clampRiskValue(
            humidity
        );


    let score = 0;


    /*
        Temperature component
    */

    if (
        temperature >= 40
    ) {

        score += 100;

    } else if (
        temperature >= 36
    ) {

        score += 80;

    } else if (
        temperature >= 33
    ) {

        score += 55;

    } else if (
        temperature >= 30
    ) {

        score += 30;

    } else {

        score += 10;

    }


    /*
        Humidity modifies heat stress.
    */

    if (
        humidity >= 80
    ) {

        score += 15;

    } else if (
        humidity >= 65
    ) {

        score += 8;

    }


    return clampRiskValue(
        score
    );
}


/* ============================================================
   13. WATER STRESS RISK
============================================================ */

function calculateWaterStressRisk(
    rainfall7d,
    soilMoisture,
    temperature
) {

    rainfall7d =
        Math.max(
            0,
            Number(
                rainfall7d
            ) || 0
        );


    soilMoisture =
        clampRiskValue(
            soilMoisture
        );


    temperature =
        Number(
            temperature
        );


    let score = 20;


    /*
        Dryness
    */

    if (
        rainfall7d < 10
    ) {

        score += 45;

    } else if (
        rainfall7d < 20
    ) {

        score += 30;

    } else if (
        rainfall7d < 35
    ) {

        score += 15;

    }


    /*
        Soil moisture
    */

    if (
        soilMoisture < 25
    ) {

        score += 40;

    } else if (
        soilMoisture < 40
    ) {

        score += 25;

    } else if (
        soilMoisture < 55
    ) {

        score += 10;

    }


    /*
        High temperature increases water demand.
    */

    if (
        temperature >= 35
    ) {

        score += 20;

    } else if (
        temperature >= 32
    ) {

        score += 10;

    }


    return clampRiskValue(
        score
    );
}


/* ============================================================
   14. CONSECUTIVE WET DAYS RISK
============================================================ */

function calculateWetDayRisk(
    consecutiveWetDays
) {

    consecutiveWetDays =
        Math.max(
            0,
            Number(
                consecutiveWetDays
            ) || 0
        );


    if (
        consecutiveWetDays >= 5
    ) {

        return 100;

    }


    if (
        consecutiveWetDays >= 4
    ) {

        return 90;

    }


    if (
        consecutiveWetDays >= 3
    ) {

        return 75;

    }


    if (
        consecutiveWetDays >= 2
    ) {

        return 55;

    }


    if (
        consecutiveWetDays >= 1
    ) {

        return 30;

    }


    return 10;
}


/* ============================================================
   15. DISEASE-SPECIFIC WEATHER MATCH
============================================================ */

/*
    Compares the current weather against the
    favorable conditions of the detected disease.
*/

function calculateDiseaseWeatherMatch(
    weather,
    diagnosis
) {

    if (
        !diagnosis?.diseaseId
    ) {

        return {

            score: 0,

            disease:
                null,

            factors: [],

            explanation:
                "No disease-specific weather matching is active."
        };

    }


    const disease =
        getDiseaseById(
            diagnosis.diseaseId
        );


    if (!disease) {

        return {

            score: 0,

            disease:
                null,

            factors: [],

            explanation:
                "Disease profile is unavailable."
        };

    }


    const favorable =
        disease
            .favorableConditions ||
        {};


    const factors = [];


    let score = 0;

    let factorCount = 0;


    /*
        Temperature
    */

    if (
        Array.isArray(
            favorable.temperature
        )
    ) {

        const min =
            Number(
                favorable.temperature[0]
            );

        const max =
            Number(
                favorable.temperature[1]
            );


        if (
            weather.temperature >= min &&
            weather.temperature <= max
        ) {

            score += 100;

            factors.push(
                `Temperature (${weather.temperature}°C) is favorable for ${disease.name}.`
            );

        } else {

            score +=
                calculateWeatherTemperatureRisk(
                    weather.temperature,
                    favorable.temperature
                );

        }


        factorCount++;

    }


    /*
        Humidity
    */

    if (
        favorable.humidityMin !==
        undefined
    ) {

        const minimum =
            Number(
                favorable.humidityMin
            );


        if (
            weather.humidity >= minimum
        ) {

            score += 100;

            factors.push(
                `Humidity (${weather.humidity}%) is above the disease-favorable threshold.`
            );

        } else {

            score +=
                calculateWeatherHumidityRisk(
                    weather.humidity
                );

        }


        factorCount++;

    }


    /*
        Rainfall
    */

    if (
        favorable.rainfall
    ) {

        const rainfallRisk =
            calculateWeatherRainfallRisk(
                weather.rainfall24h,
                weather.rainfall7d
            );


        score +=
            rainfallRisk;


        factors.push(
            `Rainfall contributes ${Math.round(rainfallRisk)}% weather pressure.`
        );


        factorCount++;

    }


    /*
        Leaf wetness
    */

    if (
        favorable.leafWetnessMin !==
        undefined
    ) {

        const minimum =
            Number(
                favorable.leafWetnessMin
            );


        if (
            weather.leafWetness >= minimum
        ) {

            score += 100;

            factors.push(
                `Leaf wetness (${weather.leafWetness}%) is favorable for pathogen development.`
            );

        } else {

            score +=
                calculateWeatherLeafWetnessRisk(
                    weather.leafWetness
                );

        }


        factorCount++;

    }


    if (
        factorCount === 0
    ) {

        return {

            score: 0,

            disease:
                disease.name,

            factors: [],

            explanation:
                "No disease-specific weather parameters are configured."
        };

    }


    const finalScore =
        clampRiskValue(
            score /
            factorCount
        );


    return {

        score:
            Number(
                finalScore.toFixed(1)
            ),

        disease:
            disease.name,

        factors,

        explanation:
            factors.length
                ? factors.join(" ")
                : "Weather does not strongly match the known favorable conditions."
    };
}


/* ============================================================
   16. CURRENT WEATHER RISK
============================================================ */

function calculateCurrentWeatherRisk(
    weatherInput = null,
    diagnosis = null
) {

    const weather =
        normalizeWeatherData(
            weatherInput ||
            DEFAULT_WEATHER
        );


    /*
        General environmental risks
    */

    const temperatureRisk =
        calculateWeatherTemperatureRisk(
            weather.temperature,
            diagnosis
                ? getDiseaseById(
                    diagnosis.diseaseId
                )
                : null
        );


    const humidityRisk =
        calculateWeatherHumidityRisk(
            weather.humidity
        );


    const rainfallRisk =
        calculateWeatherRainfallRisk(
            weather.rainfall24h,
            weather.rainfall7d
        );


    const leafWetnessRisk =
        calculateWeatherLeafWetnessRisk(
            weather.leafWetness
        );


    const windRisk =
        calculateWindRisk(
            weather.windSpeed
        );


    const cloudRisk =
        calculateCloudWetnessRisk(
            weather.cloudCover,
            weather.sunshineHours
        );


    const wetDayRisk =
        calculateWetDayRisk(
            weather.consecutiveWetDays
        );


    const heatStressRisk =
        calculateHeatStressRisk(
            weather.temperature,
            weather.humidity
        );


    const waterStressRisk =
        calculateWaterStressRisk(
            weather.rainfall7d,
            weather.soilMoisture,
            weather.temperature
        );


    /*
        Disease-specific matching
    */

    const diseaseMatch =
        calculateDiseaseWeatherMatch(
            weather,
            diagnosis
        );


    /*
        General disease-development weather score.

        Wetness and humidity receive higher weight because
        they are particularly important for many crop
        disease scenarios.
    */

    let generalDiseaseRisk =

        (
            temperatureRisk *
            0.20
        ) +

        (
            humidityRisk *
            0.25
        ) +

        (
            rainfallRisk *
            0.20
        ) +

        (
            leafWetnessRisk *
            0.20
        ) +

        (
            cloudRisk *
            0.05
        ) +

        (
            wetDayRisk *
            0.10
        );


    /*
        If disease is already detected, blend its
        known weather favorability into the result.
    */

    let finalDiseaseRisk =
        generalDiseaseRisk;


    if (
        diseaseMatch.score > 0
    ) {

        finalDiseaseRisk =
            (
                generalDiseaseRisk *
                0.45
            ) +
            (
                diseaseMatch.score *
                0.55
            );

    }


    finalDiseaseRisk =
        clampRiskValue(
            finalDiseaseRisk
        );


    /*
        Overall weather risk

        This includes both disease-development pressure
        and crop stress.
    */

    let overallScore =

        (
            finalDiseaseRisk *
            0.70
        ) +

        (
            heatStressRisk *
            0.15
        ) +

        (
            waterStressRisk *
            0.15
        );


    /*
        Avoid making heat/water stress dominate a disease
        warning unless they are genuinely high.
    */

    overallScore =
        clampRiskValue(
            overallScore
        );


    const classification =
        classifyRisk(
            overallScore
        );


    const factors =
        buildWeatherRiskFactors({
            weather,
            temperatureRisk,
            humidityRisk,
            rainfallRisk,
            leafWetnessRisk,
            windRisk,
            cloudRisk,
            wetDayRisk,
            heatStressRisk,
            waterStressRisk,
            diseaseMatch
        });


    const warnings =
        generateWeatherWarnings({
            weather,
            overallScore,
            temperatureRisk,
            humidityRisk,
            rainfallRisk,
            leafWetnessRisk,
            wetDayRisk,
            heatStressRisk,
            waterStressRisk,
            diseaseMatch
        });


    const actions =
        generateWeatherActions({
            weather,
            overallScore,
            humidityRisk,
            rainfallRisk,
            leafWetnessRisk,
            heatStressRisk,
            waterStressRisk
        });


    const result = {

        score:
            Number(
                overallScore.toFixed(1)
            ),

        ...classification,

        diseaseRisk:
            Number(
                finalDiseaseRisk.toFixed(1)
            ),

        heatStressRisk:
            Number(
                heatStressRisk.toFixed(1)
            ),

        waterStressRisk:
            Number(
                waterStressRisk.toFixed(1)
            ),

        temperatureRisk:
            Number(
                temperatureRisk.toFixed(1)
            ),

        humidityRisk:
            Number(
                humidityRisk.toFixed(1)
            ),

        rainfallRisk:
            Number(
                rainfallRisk.toFixed(1)
            ),

        leafWetnessRisk:
            Number(
                leafWetnessRisk.toFixed(1)
            ),

        wetDayRisk:
            Number(
                wetDayRisk.toFixed(1)
            ),

        diseaseMatch,

        factors,

        warnings,

        actions,

        weather,

        calculatedAt:
            new Date().toISOString(),

        source:
            WEATHER_ENGINE_STATE.source
    };


    WEATHER_ENGINE_STATE.current =
        weather;


    WEATHER_ENGINE_STATE.risk =
        result;


    WEATHER_ENGINE_STATE.lastUpdated =
        result.calculatedAt;


    WEATHER_ENGINE_STATE.history.unshift(
        result
    );


    if (
        WEATHER_ENGINE_STATE.history.length >
        30
    ) {

        WEATHER_ENGINE_STATE.history.pop();

    }


    /*
        Update global application state.
    */

    if (
        typeof APP_STATE !==
        "undefined"
    ) {

        APP_STATE.currentWeather =
            weather;

        APP_STATE.currentWeatherRisk =
            result;

    }


    /*
        Notify dashboard.
    */

    window.dispatchEvent(
        new CustomEvent(
            "agriguard:weatherUpdated",
            {
                detail: result
            }
        )
    );


    return result;
}


/* ============================================================
   17. WEATHER RISK FACTORS
============================================================ */

function buildWeatherRiskFactors(
    context
) {

    const factors = [];


    if (
        context.humidityRisk >= 70
    ) {

        factors.push({

            type:
                "humidity",

            score:
                context.humidityRisk,

            severity:
                context.humidityRisk >= 85
                    ? "critical"
                    : "high",

            title:
                "High Humidity",

            description:
                `Relative humidity is ${context.weather.humidity}%, increasing disease-development favorability.`
        });

    }


    if (
        context.rainfallRisk >= 60
    ) {

        factors.push({

            type:
                "rainfall",

            score:
                context.rainfallRisk,

            severity:
                context.rainfallRisk >= 80
                    ? "high"
                    : "moderate",

            title:
                "Rainfall Pressure",

            description:
                `${context.weather.rainfall24h} mm rainfall was recorded over the recent period, with ${context.weather.rainfall7d} mm accumulated over 7 days.`
        });

    }


    if (
        context.leafWetnessRisk >= 60
    ) {

        factors.push({

            type:
                "leaf-wetness",

            score:
                context.leafWetnessRisk,

            severity:
                context.leafWetnessRisk >= 80
                    ? "high"
                    : "moderate",

            title:
                "Leaf Wetness",

            description:
                `Estimated leaf wetness is ${context.weather.leafWetness}%, creating favorable conditions for several foliar diseases.`
        });

    }


    if (
        context.wetDayRisk >= 60
    ) {

        factors.push({

            type:
                "wet-days",

            score:
                context.wetDayRisk,

            severity:
                context.wetDayRisk >= 80
                    ? "high"
                    : "moderate",

            title:
                "Consecutive Wet Days",

            description:
                `${context.weather.consecutiveWetDays} consecutive wet day(s) can increase pathogen-development pressure.`
        });

    }


    if (
        context.heatStressRisk >= 60
    ) {

        factors.push({

            type:
                "heat",

            score:
                context.heatStressRisk,

            severity:
                context.heatStressRisk >= 80
                    ? "critical"
                    : "high",

            title:
                "Heat Stress",

            description:
                `Temperature is ${context.weather.temperature}°C with ${context.weather.humidity}% humidity.`
        });

    }


    if (
        context.waterStressRisk >= 60
    ) {

        factors.push({

            type:
                "water",

            score:
                context.waterStressRisk,

            severity:
                context.waterStressRisk >= 80
                    ? "high"
                    : "moderate",

            title:
                "Water Stress",

            description:
                "Rainfall, soil moisture and temperature indicate increased water-management pressure."
        });

    }


    if (
        context.diseaseMatch.score >= 70
    ) {

        factors.push({

            type:
                "disease-weather-match",

            score:
                context.diseaseMatch.score,

            severity:
                context.diseaseMatch.score >= 85
                    ? "critical"
                    : "high",

            title:
                "Disease-Favorable Weather",

            description:
                context.diseaseMatch.explanation
        });

    }


    /*
        Sort highest risk first.
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
   18. WEATHER WARNINGS
============================================================ */

function generateWeatherWarnings(
    context
) {

    const warnings = [];


    /*
        Disease warning
    */

    if (
        context.diseaseMatch.score >= 80
    ) {

        warnings.push({

            level:
                "critical",

            title:
                "Disease-Favorable Weather Window",

            message:
                `Current weather strongly favors ${context.diseaseMatch.disease || "disease"} development.`,

            priority:
                1
        });

    } else if (
        context.diseaseMatch.score >= 65
    ) {

        warnings.push({

            level:
                "high",

            title:
                "Elevated Disease Weather Risk",

            message:
                "Weather conditions are becoming favorable for disease development.",

            priority:
                2
        });

    }


    /*
        Humidity
    */

    if (
        context.weather.humidity >= 85
    ) {

        warnings.push({

            level:
                "high",

            title:
                "High Humidity Alert",

            message:
                `Humidity is ${context.weather.humidity}%. Increase crop monitoring.`,

            priority:
                3
        });

    }


    /*
        Rainfall
    */

    if (
        context.weather.rainfall24h >= 25
    ) {

        warnings.push({

            level:
                "high",

            title:
                "Heavy Rainfall Alert",

            message:
                `${context.weather.rainfall24h} mm recent rainfall may increase waterlogging and disease pressure.`,

            priority:
                4
        });

    }


    /*
        Heat
    */

    if (
        context.heatStressRisk >= 75
    ) {

        warnings.push({

            level:
                "critical",

            title:
                "Heat Stress Alert",

            message:
                "High temperature conditions may increase crop water demand and heat stress.",

            priority:
                5
        });

    }


    /*
        Water stress
    */

    if (
        context.waterStressRisk >= 75
    ) {

        warnings.push({

            level:
                "high",

            title:
                "Water Stress Alert",

            message:
                "Current weather and soil conditions indicate increased irrigation demand.",

            priority:
                6
        });

    }


    warnings.sort(
        (
            a,
            b
        ) =>
            a.priority -
            b.priority
    );


    return warnings;
}


/* ============================================================
   19. WEATHER ACTIONS
============================================================ */

function generateWeatherActions(
    context
) {

    const actions = [];


    if (
        context.overallScore >= 75
    ) {

        actions.push({

            priority:
                "URGENT",

            title:
                "Inspect fields promptly",

            description:
                "Prioritize scouting of low-lying, dense-canopy and previously affected areas.",

            category:
                "field-scouting"
        });

    }


    if (
        context.humidityRisk >= 75 ||
        context.leafWetnessRisk >= 75
    ) {

        actions.push({

            priority:
                "HIGH",

            title:
                "Increase disease monitoring",

            description:
                "Check foliage for new lesions, spots, discoloration or abnormal growth.",

            category:
                "disease-monitoring"
        });

    }


    if (
        context.rainfallRisk >= 70
    ) {

        actions.push({

            priority:
                "HIGH",

            title:
                "Check drainage",

            description:
                "Inspect fields for standing water and blocked drainage channels after rainfall.",

            category:
                "drainage"
        });

    }


    if (
        context.heatStressRisk >= 70
    ) {

        actions.push({

            priority:
                "HIGH",

            title:
                "Review irrigation requirement",

            description:
                "Evaluate soil moisture and crop condition before irrigation.",

            category:
                "irrigation"
        });

    }


    if (
        context.waterStressRisk >= 70
    ) {

        actions.push({

            priority:
                "HIGH",

            title:
                "Monitor soil moisture",

            description:
                "Use soil moisture readings to guide irrigation instead of applying water solely on a fixed schedule.",

            category:
                "water-management"
        });

    }


    if (
        actions.length === 0
    ) {

        actions.push({

            priority:
                "LOW",

            title:
                "Continue routine monitoring",

            description:
                "No immediate weather-related intervention is indicated.",

            category:
                "monitoring"
        });

    }


    return actions;
}


/* ============================================================
   20. FORECAST RISK CALCULATION
============================================================ */

function calculateForecastRisk(
    forecast = [],
    diagnosis = null
) {

    if (
        !Array.isArray(
            forecast
        ) ||
        forecast.length === 0
    ) {

        return {

            averageRisk:
                0,

            maximumRisk:
                0,

            trend:
                "stable",

            forecast: []
        };

    }


    const processed =
        forecast.map(
            day => {

                const temperature =
                    (
                        Number(
                            day.temperatureMin
                        ) +
                        Number(
                            day.temperatureMax
                        )
                    ) / 2;


                const humidity =
                    Number(
                        day.humidity
                    ) || 0;


                const rainfall =
                    Number(
                        day.rainfall
                    ) || 0;


                const rainfallProbability =
                    Number(
                        day.rainfallProbability
                    ) || 0;


                const temperatureRisk =
                    calculateWeatherTemperatureRisk(
                        temperature,
                        diagnosis
                            ? getDiseaseById(
                                diagnosis.diseaseId
                            )
                            : null
                    );


                const humidityRisk =
                    calculateWeatherHumidityRisk(
                        humidity
                    );


                const rainfallRisk =
                    calculateWeatherRainfallRisk(
                        rainfall,
                        rainfall
                    );


                const precipitationPressure =
                    clampRiskValue(
                        (
                            rainfallRisk *
                            0.60
                        ) +
                        (
                            rainfallProbability *
                            0.40
                        )
                    );


                const diseaseRisk =
                    clampRiskValue(
                        (
                            temperatureRisk *
                            0.25
                        ) +
                        (
                            humidityRisk *
                            0.35
                        ) +
                        (
                            precipitationPressure *
                            0.40
                        )
                    );


                return {

                    ...day,

                    temperature,

                    temperatureRisk:
                        Number(
                            temperatureRisk.toFixed(1)
                        ),

                    humidityRisk:
                        Number(
                            humidityRisk.toFixed(1)
                        ),

                    rainfallRisk:
                        Number(
                            rainfallRisk.toFixed(1)
                        ),

                    diseaseRisk:
                        Number(
                            diseaseRisk.toFixed(1)
                        )
                };

            }
        );


    const risks =
        processed.map(
            item =>
                item.diseaseRisk
        );


    const averageRisk =
        risks.reduce(
            (
                sum,
                value
            ) =>
                sum + value,
            0
        ) /
        risks.length;


    const maximumRisk =
        Math.max(
            ...risks
        );


    const first =
        risks[0] || 0;


    const last =
        risks[
            risks.length - 1
        ] || 0;


    let trend =
        "stable";


    if (
        last - first >= 10
    ) {

        trend =
            "rising";

    } else if (
        last - first <= -10
    ) {

        trend =
            "falling";

    }


    return {

        averageRisk:
            Number(
                averageRisk.toFixed(1)
            ),

        maximumRisk:
            Number(
                maximumRisk.toFixed(1)
            ),

        trend,

        forecast:
            processed
    };
}


/* ============================================================
   21. SET FORECAST
============================================================ */

function setWeatherForecast(
    forecast
) {

    if (
        !Array.isArray(
            forecast
        )
    ) {

        return [];

    }


    WEATHER_ENGINE_STATE.forecast =
        forecast.map(
            item => ({
                ...item
            })
        );


    return WEATHER_ENGINE_STATE.forecast;
}


/* ============================================================
   22. GET FORECAST
============================================================ */

function getWeatherForecast() {

    if (
        WEATHER_ENGINE_STATE.forecast.length
    ) {

        return [
            ...WEATHER_ENGINE_STATE.forecast
        ];

    }


    return [
        ...DEFAULT_FORECAST
    ];
}


/* ============================================================
   23. SET CURRENT WEATHER
============================================================ */

function setCurrentWeather(
    weather
) {

    const normalized =
        normalizeWeatherData(
            weather
        );


    WEATHER_ENGINE_STATE.current =
        normalized;


    WEATHER_ENGINE_STATE.lastUpdated =
        normalized.timestamp;


    return normalized;
}


/* ============================================================
   24. GET CURRENT WEATHER
============================================================ */

function getCurrentWeather() {

    return (
        WEATHER_ENGINE_STATE.current ||
        normalizeWeatherData(
            DEFAULT_WEATHER
        )
    );
}


/* ============================================================
   25. GET CURRENT WEATHER RISK
============================================================ */

function getCurrentWeatherRisk() {

    return (
        WEATHER_ENGINE_STATE.risk ||
        null
    );
}


/* ============================================================
   26. WEATHER TREND
============================================================ */

function getWeatherTrend(
    forecast = null
) {

    const data =
        forecast ||
        getWeatherForecast();


    if (
        data.length < 2
    ) {

        return {

            direction:
                "stable",

            label:
                "Stable",

            change:
                0
        };

    }


    const first =
        Number(
            data[0].diseaseRisk ||
            0
        );


    const last =
        Number(
            data[
                data.length - 1
            ].diseaseRisk ||
            0
        );


    const change =
        Number(
            (
                last -
                first
            ).toFixed(1)
        );


    if (
        change >= 10
    ) {

        return {

            direction:
                "rising",

            label:
                "Disease weather risk increasing",

            change
        };

    }


    if (
        change <= -10
    ) {

        return {

            direction:
                "falling",

            label:
                "Disease weather risk decreasing",

            change
        };

    }


    return {

        direction:
            "stable",

        label:
            "Disease weather risk relatively stable",

        change
    };
}


/* ============================================================
   27. WEATHER SUMMARY
============================================================ */

function generateWeatherSummary(
    weather,
    risk
) {

    if (
        !weather ||
        !risk
    ) {

        return "Weather intelligence is not yet available.";

    }


    const parts = [];


    parts.push(
        `Temperature is ${weather.temperature}°C`
    );


    parts.push(
        `humidity is ${weather.humidity}%`
    );


    if (
        weather.rainfall24h > 0
    ) {

        parts.push(
            `recent rainfall is ${weather.rainfall24h} mm`
        );

    }


    if (
        weather.leafWetness >= 60
    ) {

        parts.push(
            "leaf wetness is elevated"
        );

    }


    const sentence =
        parts.join(
            ", "
        );


    if (
        risk.score >= 75
    ) {

        return `${sentence}. Current weather conditions indicate CRITICAL agricultural risk.`;

    }


    if (
        risk.score >= 50
    ) {

        return `${sentence}. Current weather conditions indicate HIGH agricultural risk.`;

    }


    if (
        risk.score >= 25
    ) {

        return `${sentence}. Current weather conditions indicate MODERATE agricultural risk.`;

    }


    return `${sentence}. Current weather conditions indicate LOW agricultural risk.`;
}


/* ============================================================
   28. WEATHER DASHBOARD DATA
============================================================ */

/*
    Returns one clean object for charts and dashboard UI.
*/

function getWeatherDashboardData(
    diagnosis = null
) {

    const weather =
        getCurrentWeather();


    const risk =
        calculateCurrentWeatherRisk(
            weather,
            diagnosis
        );


    const forecast =
        getWeatherForecast();


    const forecastRisk =
        calculateForecastRisk(
            forecast,
            diagnosis
        );


    return {

        current: weather,

        risk,

        forecast:
            forecastRisk.forecast,

        forecastAverageRisk:
            forecastRisk.averageRisk,

        forecastMaximumRisk:
            forecastRisk.maximumRisk,

        forecastTrend:
            forecastRisk.trend,

        summary:
            generateWeatherSummary(
                weather,
                risk
            ),

        lastUpdated:
            WEATHER_ENGINE_STATE.lastUpdated,

        source:
            WEATHER_ENGINE_STATE.source
    };
}


/* ============================================================
   29. LIVE WEATHER API PLACEHOLDER
============================================================ */

/*
    FUTURE IMPLEMENTATION

    The frontend can later call your backend:

        GET /api/weather?lat=...&lon=...

    The backend should retrieve official/live weather
    information and return a normalized object.

    Example:

        const response = await fetch(
            `/api/weather?lat=${lat}&lon=${lon}`
        );

        const data = await response.json();

        setCurrentWeather(data);

    Keeping API access behind this function means the
    dashboard doesn't need to know where the weather
    information comes from.
*/

async function fetchLiveWeather(
    latitude,
    longitude
) {

    console.warn(
        "Live weather API is not connected. Using demo weather data."
    );


    /*
        Prototype fallback
    */

    await delay(
        400
    );


    WEATHER_ENGINE_STATE.connectedToLiveAPI =
        false;

    WEATHER_ENGINE_STATE.apiStatus =
        "demo";


    return normalizeWeatherData(
        DEFAULT_WEATHER
    );
}


/* ============================================================
   30. REFRESH WEATHER INTELLIGENCE
============================================================ */

async function refreshWeatherIntelligence(
    options = {}
) {

    const diagnosis =
        options.diagnosis ||
        (
            typeof getCurrentDiagnosis ===
            "function"
                ? getCurrentDiagnosis()
                : null
        );


    let weather;


    if (
        options.useLiveAPI === true &&
        options.latitude !== undefined &&
        options.longitude !== undefined
    ) {

        weather =
            await fetchLiveWeather(
                options.latitude,
                options.longitude
            );

    } else {

        weather =
            normalizeWeatherData(
                options.weather ||
                DEFAULT_WEATHER
            );

    }


    setCurrentWeather(
        weather
    );


    /*
        Use supplied forecast or demo forecast.
    */

    const forecast =
        options.forecast ||
        DEFAULT_FORECAST;


    setWeatherForecast(
        forecast
    );


    const dashboardData =
        getWeatherDashboardData(
            diagnosis
        );


    /*
        Dispatch update.
    */

    window.dispatchEvent(
        new CustomEvent(
            "agriguard:weatherIntelligenceReady",
            {
                detail:
                    dashboardData
            }
        )
    );


    return dashboardData;
}


/* ============================================================
   31. WEATHER ALERT GENERATION
============================================================ */

function createWeatherAlerts(
    weatherData
) {

    if (
        !weatherData
    ) {

        return [];

    }


    const alerts = [];


    /*
        Current alerts
    */

    if (
        weatherData.risk?.score >= 75
    ) {

        alerts.push({

            id:
                `WX-${Date.now()}-1`,

            type:
                "Weather Risk",

            severity:
                "critical",

            title:
                "Critical Weather Risk",

            message:
                weatherData.summary,

            createdAt:
                new Date().toISOString(),

            status:
                "active"
        });

    } else if (
        weatherData.risk?.score >= 50
    ) {

        alerts.push({

            id:
                `WX-${Date.now()}-2`,

            type:
                "Weather Risk",

            severity:
                "high",

            title:
                "High Weather Risk",

            message:
                weatherData.summary,

            createdAt:
                new Date().toISOString(),

            status:
                "active"
        });

    }


    /*
        Forecast alerts
    */

    const riskyDays =
        (
            weatherData.forecast ||
            []
        ).filter(
            day =>
                day.diseaseRisk >= 75
        );


    if (
        riskyDays.length > 0
    ) {

        alerts.push({

            id:
                `WX-${Date.now()}-3`,

            type:
                "Forecast Warning",

            severity:
                "high",

            title:
                "Disease Risk Window Forecast",

            message:
                `${riskyDays.length} upcoming day(s) show elevated disease-favorable weather conditions.`,

            createdAt:
                new Date().toISOString(),

            status:
                "active",

            affectedDays:
                riskyDays.map(
                    day =>
                        day.date
                )
        });

    }


    return alerts;
}


/* ============================================================
   32. WEATHER DATA FOR CHARTS
============================================================ */

function getWeatherChartData(
    diagnosis = null
) {

    const forecast =
        calculateForecastRisk(
            getWeatherForecast(),
            diagnosis
        );


    return {

        labels:
            forecast.forecast.map(
                day =>
                    day.day
            ),

        temperature:
            forecast.forecast.map(
                day =>
                    Number(
                        day.temperature
                    )
            ),

        humidity:
            forecast.forecast.map(
                day =>
                    Number(
                        day.humidity
                    )
            ),

        rainfall:
            forecast.forecast.map(
                day =>
                    Number(
                        day.rainfall
                    )
            ),

        rainfallProbability:
            forecast.forecast.map(
                day =>
                    Number(
                        day.rainfallProbability
                    )
            ),

        diseaseRisk:
            forecast.forecast.map(
                day =>
                    Number(
                        day.diseaseRisk
                    )
            )
    };
}


/* ============================================================
   33. DELAY UTILITY
============================================================ */

function delay(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


/* ============================================================
   34. RESET WEATHER ENGINE
============================================================ */

function resetWeatherEngine() {

    WEATHER_ENGINE_STATE.current =
        null;

    WEATHER_ENGINE_STATE.forecast =
        [];

    WEATHER_ENGINE_STATE.risk =
        null;

    WEATHER_ENGINE_STATE.lastUpdated =
        null;

    WEATHER_ENGINE_STATE.history =
        [];

    WEATHER_ENGINE_STATE.connectedToLiveAPI =
        false;

    WEATHER_ENGINE_STATE.apiStatus =
        "demo";
}


/* ============================================================
   35. PUBLIC API
============================================================ */

window.WEATHER_ENGINE_STATE =
    WEATHER_ENGINE_STATE;


window.DEFAULT_WEATHER =
    DEFAULT_WEATHER;


window.DEFAULT_FORECAST =
    DEFAULT_FORECAST;


window.normalizeWeatherData =
    normalizeWeatherData;


window.calculateWeatherTemperatureRisk =
    calculateWeatherTemperatureRisk;


window.calculateWeatherHumidityRisk =
    calculateWeatherHumidityRisk;


window.calculateWeatherRainfallRisk =
    calculateWeatherRainfallRisk;


window.calculateWeatherLeafWetnessRisk =
    calculateWeatherLeafWetnessRisk;


window.calculateWindRisk =
    calculateWindRisk;


window.calculateCloudWetnessRisk =
    calculateCloudWetnessRisk;


window.calculateHeatStressRisk =
    calculateHeatStressRisk;


window.calculateWaterStressRisk =
    calculateWaterStressRisk;


window.calculateWetDayRisk =
    calculateWetDayRisk;


window.calculateDiseaseWeatherMatch =
    calculateDiseaseWeatherMatch;


window.calculateCurrentWeatherRisk =
    calculateCurrentWeatherRisk;


window.calculateForecastRisk =
    calculateForecastRisk;


window.setWeatherForecast =
    setWeatherForecast;


window.getWeatherForecast =
    getWeatherForecast;


window.setCurrentWeather =
    setCurrentWeather;


window.getCurrentWeather =
    getCurrentWeather;


window.getCurrentWeatherRisk =
    getCurrentWeatherRisk;


window.getWeatherTrend =
    getWeatherTrend;


window.generateWeatherSummary =
    generateWeatherSummary;


window.getWeatherDashboardData =
    getWeatherDashboardData;


window.fetchLiveWeather =
    fetchLiveWeather;


window.refreshWeatherIntelligence =
    refreshWeatherIntelligence;


window.createWeatherAlerts =
    createWeatherAlerts;


window.getWeatherChartData =
    getWeatherChartData;


window.resetWeatherEngine =
    resetWeatherEngine;


/* ============================================================
   36. INITIALIZATION
============================================================ */

console.log(
    "%c🌦️ AgriGuard Weather Intelligence Engine",
    "font-size:16px;font-weight:bold;"
);

console.log(
    "Weather monitoring initialized."
);

console.log(
    "Forecast horizon:",
    DEFAULT_FORECAST.length,
    "days"
);

console.log(
    "Live API:",
    WEATHER_ENGINE_STATE.connectedToLiveAPI
        ? "Connected"
        : "Demo Mode"
);
