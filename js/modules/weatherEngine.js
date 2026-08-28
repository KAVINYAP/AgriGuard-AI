```javascript
/* =========================================================
   AgriGuard AI - Weather Engine
   File: js/modules/weatherEngine.js

   Purpose:
   - Manage weather information
   - Provide current weather conditions
   - Provide multi-day forecasts
   - Calculate weather-related disease risk
   - Detect disease-favorable weather conditions
   - Support riskEngine.js
   - Support dashboard KPI cards
   - Support weather charts
   - Work with data.js / weatherData.json
   - Safe browser-side operation
   ========================================================= */

"use strict";


/* =========================================================
   WEATHER ENGINE
========================================================= */

const AgriGuardWeatherEngine = {

    /* -----------------------------------------------------
       Default location
    ----------------------------------------------------- */

    defaultLocation: {
        name: "Andhra Pradesh",
        latitude: 16.5062,
        longitude: 80.6480
    },


    /* -----------------------------------------------------
       Risk thresholds
    ----------------------------------------------------- */

    thresholds: {

        humidityHigh: 80,

        humidityModerate: 65,

        rainfallHigh: 10,

        rainfallModerate: 5,

        rainProbabilityHigh: 70,

        rainProbabilityModerate: 45,

        temperatureHigh: 32,

        temperatureLow: 15
    },


    /* =====================================================
       UTILITY FUNCTIONS
    ===================================================== */

    toNumber(value, fallback = 0) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    },


    clamp(
        value,
        min = 0,
        max = 100
    ) {

        const number =
            this.toNumber(
                value,
                min
            );

        return Math.max(
            min,
            Math.min(
                max,
                number
            )
        );
    },


    round(
        value,
        decimals = 1
    ) {

        const factor =
            Math.pow(
                10,
                decimals
            );

        return Math.round(
            this.toNumber(value) *
            factor
        ) / factor;
    },


    /* =====================================================
       NORMALIZE WEATHER OBJECT
    ===================================================== */

    normalizeWeather(weather = {}) {

        const source =
            weather || {};


        return {

            temperature:
                this.toNumber(
                    source.temperature ??
                    source.temp ??
                    source.temperatureC,
                    0
                ),

            humidity:
                this.clamp(
                    source.humidity ??
                    source.relativeHumidity ??
                    0
                ),

            rainfall:
                Math.max(
                    0,
                    this.toNumber(
                        source.rainfall ??
                        source.rain ??
                        source.precipitation ??
                        0
                    )
                ),

            rainProbability:
                this.clamp(
                    source.rainProbability ??
                    source.precipitationProbability ??
                    source.rainChance ??
                    0
                ),

            windSpeed:
                Math.max(
                    0,
                    this.toNumber(
                        source.windSpeed ??
                        source.wind ??
                        0
                    )
                ),

            windDirection:
                source.windDirection ??
                source.direction ??
                "",

            pressure:
                this.toNumber(
                    source.pressure ??
                    0
                ),

            visibility:
                Math.max(
                    0,
                    this.toNumber(
                        source.visibility ??
                        0
                    )
                ),

            condition:
                source.condition ??
                source.weather ??
                "Unknown",

            cloudCover:
                this.clamp(
                    source.cloudCover ??
                    source.clouds ??
                    0
                ),

            uvIndex:
                Math.max(
                    0,
                    this.toNumber(
                        source.uvIndex ??
                        source.uv ??
                        0
                    )
                ),

            timestamp:
                source.timestamp ??
                new Date().toISOString()
        };
    },


    /* =====================================================
       CURRENT WEATHER
    ===================================================== */

    getCurrentWeather(weatherData = null) {

        /*
         * Support different possible structures from
         * weatherData.json / data.js.
         */

        let current = null;


        if (
            weatherData &&
            weatherData.current
        ) {

            current =
                weatherData.current;

        } else if (
            weatherData &&
            weatherData.currentWeather
        ) {

            current =
                weatherData.currentWeather;

        } else if (
            weatherData
        ) {

            current =
                weatherData;
        }


        if (!current) {

            current = {

                temperature: 29,

                humidity: 78,

                rainfall: 0,

                rainProbability: 42,

                windSpeed: 12,

                condition: "Partly Cloudy",

                cloudCover: 48,

                uvIndex: 7
            };
        }


        return this.normalizeWeather(
            current
        );
    },


    /* =====================================================
       FORECAST
    ===================================================== */

    getForecast(weatherData = null) {

        let forecast = [];


        if (
            weatherData &&
            Array.isArray(
                weatherData.forecast
            )
        ) {

            forecast =
                weatherData.forecast;

        } else if (
            weatherData &&
            Array.isArray(
                weatherData.daily
            )
        ) {

            forecast =
                weatherData.daily;

        } else if (
            weatherData &&
            Array.isArray(
                weatherData.days
            )
        ) {

            forecast =
                weatherData.days;
        }


        /*
         * Safe fallback forecast.
         */

        if (
            forecast.length === 0
        ) {

            forecast = [

                {
                    day: "Today",
                    temperature: 29,
                    humidity: 78,
                    rainfall: 2,
                    rainProbability: 42,
                    condition: "Partly Cloudy"
                },

                {
                    day: "Tomorrow",
                    temperature: 30,
                    humidity: 76,
                    rainfall: 4,
                    rainProbability: 48,
                    condition: "Cloudy"
                },

                {
                    day: "Day 3",
                    temperature: 31,
                    humidity: 81,
                    rainfall: 8,
                    rainProbability: 64,
                    condition: "Light Rain"
                },

                {
                    day: "Day 4",
                    temperature: 28,
                    humidity: 86,
                    rainfall: 14,
                    rainProbability: 76,
                    condition: "Rain"
                },

                {
                    day: "Day 5",
                    temperature: 29,
                    humidity: 82,
                    rainfall: 9,
                    rainProbability: 68,
                    condition: "Cloudy"
                }
            ];
        }


        return forecast.map(
            (day, index) => {

                const normalized =
                    this.normalizeWeather(
                        day
                    );


                return {

                    ...normalized,

                    day:
                        day.day ??
                        day.name ??
                        `Day ${index + 1}`,

                    date:
                        day.date ??
                        null
                };
            }
        );
    },


    /* =====================================================
       TEMPERATURE RISK
    ===================================================== */

    calculateTemperatureRisk(
        temperature
    ) {

        const temp =
            this.toNumber(
                temperature
            );


        /*
         * Extremely low or high temperatures
         * can increase crop stress.
         */

        if (
            temp <=
            this.thresholds.temperatureLow
        ) {

            return this.clamp(
                75 +
                (
                    this.thresholds.temperatureLow -
                    temp
                ) * 3
            );
        }


        if (
            temp >=
            this.thresholds.temperatureHigh
        ) {

            return this.clamp(
                70 +
                (
                    temp -
                    this.thresholds.temperatureHigh
                ) * 5
            );
        }


        /*
         * Generic moderate range.
         */

        if (
            temp >= 20 &&
            temp <= 30
        ) {

            return 25;
        }


        return 45;
    },


    /* =====================================================
       HUMIDITY RISK
    ===================================================== */

    calculateHumidityRisk(
        humidity
    ) {

        const value =
            this.clamp(
                humidity
            );


        if (
            value >=
            this.thresholds.humidityHigh
        ) {

            return 95;
        }


        if (
            value >=
            this.thresholds.humidityModerate
        ) {

            return 65;
        }


        if (value >= 50) {

            return 40;
        }


        return 20;
    },


    /* =====================================================
       RAINFALL RISK
    ===================================================== */

    calculateRainfallRisk(
        rainfall,
        probability
    ) {

        const rain =
            Math.max(
                0,
                this.toNumber(
                    rainfall
                )
            );


        const chance =
            this.clamp(
                probability
            );


        let rainfallScore = 0;


        if (
            rain >=
            this.thresholds.rainfallHigh
        ) {

            rainfallScore = 95;

        } else if (
            rain >=
            this.thresholds.rainfallModerate
        ) {

            rainfallScore = 70;

        } else if (
            rain > 0
        ) {

            rainfallScore = 40;

        } else {

            rainfallScore = 15;
        }


        const probabilityScore =
            chance;


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
       WIND RISK
    ===================================================== */

    calculateWindRisk(
        windSpeed
    ) {

        const speed =
            Math.max(
                0,
                this.toNumber(
                    windSpeed
                )
            );


        /*
         * Strong winds can stress crops and may
         * influence disease spread, but are not
         * treated as a dominant factor.
         */

        if (speed >= 30) {
            return 80;
        }

        if (speed >= 20) {
            return 60;
        }

        if (speed >= 10) {
            return 35;
        }

        return 20;
    },


    /* =====================================================
       OVERALL WEATHER DISEASE RISK
    ===================================================== */

    calculateDiseaseWeatherRisk(
        weather = {}
    ) {

        const current =
            this.normalizeWeather(
                weather
            );


        const temperatureRisk =
            this.calculateTemperatureRisk(
                current.temperature
            );


        const humidityRisk =
            this.calculateHumidityRisk(
                current.humidity
            );


        const rainfallRisk =
            this.calculateRainfallRisk(
                current.rainfall,
                current.rainProbability
            );


        const windRisk =
            this.calculateWindRisk(
                current.windSpeed
            );


        /*
         * Humidity and rainfall have greater influence
         * on many disease-favorable conditions.
         */

        const score =

            (
                temperatureRisk *
                0.20
            )

            +

            (
                humidityRisk *
                0.35
            )

            +

            (
                rainfallRisk *
                0.35
            )

            +

            (
                windRisk *
                0.10
            );


        return {

            score:
                Math.round(
                    this.clamp(
                        score
                    )
                ),

            temperatureRisk:
                Math.round(
                    temperatureRisk
                ),

            humidityRisk:
                Math.round(
                    humidityRisk
                ),

            rainfallRisk:
                Math.round(
                    rainfallRisk
                ),

            windRisk:
                Math.round(
                    windRisk
                )
        };
    },


    /* =====================================================
       WEATHER RISK LEVEL
    ===================================================== */

    getRiskLevel(score) {

        const value =
            this.clamp(
                score
            );


        if (value < 20) {
            return "Very Low";
        }

        if (value < 40) {
            return "Low";
        }

        if (value < 60) {
            return "Moderate";
        }

        if (value < 80) {
            return "High";
        }

        return "Very High";
    },


    /* =====================================================
       DISEASE-FAVORABLE CONDITION DETECTION
    ===================================================== */

    detectDiseaseFavorableConditions(
        weather = {}
    ) {

        const current =
            this.normalizeWeather(
                weather
            );


        const conditions = [];


        if (
            current.humidity >=
            this.thresholds.humidityHigh
        ) {

            conditions.push({

                type: "humidity",

                severity: "high",

                title:
                    "High humidity",

                value:
                    `${current.humidity}%`,

                message:
                    "High humidity may create favorable conditions for some fungal and bacterial diseases."
            });

        } else if (
            current.humidity >=
            this.thresholds.humidityModerate
        ) {

            conditions.push({

                type: "humidity",

                severity: "moderate",

                title:
                    "Elevated humidity",

                value:
                    `${current.humidity}%`,

                message:
                    "Elevated humidity may increase disease-favorable conditions."
            });
        }


        if (
            current.rainfall >=
            this.thresholds.rainfallHigh
        ) {

            conditions.push({

                type: "rainfall",

                severity: "high",

                title:
                    "Heavy rainfall",

                value:
                    `${current.rainfall} mm`,

                message:
                    "Recent or expected rainfall may increase leaf wetness and disease pressure."
            });

        } else if (
            current.rainfall >=
            this.thresholds.rainfallModerate
        ) {

            conditions.push({

                type: "rainfall",

                severity: "moderate",

                title:
                    "Moderate rainfall",

                value:
                    `${current.rainfall} mm`,

                message:
                    "Rainfall is contributing to environmental disease risk."
            });
        }


        if (
            current.rainProbability >=
            this.thresholds.rainProbabilityHigh
        ) {

            conditions.push({

                type: "rain-probability",

                severity: "high",

                title:
                    "High rain probability",

                value:
                    `${current.rainProbability}%`,

                message:
                    "High probability of rain may increase disease-favorable moisture conditions."
            });

        } else if (
            current.rainProbability >=
            this.thresholds.rainProbabilityModerate
        ) {

            conditions.push({

                type: "rain-probability",

                severity: "moderate",

                title:
                    "Rain expected",

                value:
                    `${current.rainProbability}%`,

                message:
                    "Expected rainfall should be considered when planning field operations."
            });
        }


        if (
            current.temperature >= 30 &&
            current.humidity >= 75
        ) {

            conditions.push({

                type: "warm-humid",

                severity: "high",

                title:
                    "Warm and humid conditions",

                value:
                    `${current.temperature}°C / ${current.humidity}%`,

                message:
                    "Warm, humid conditions can favor several crop disease processes."
            });
        }


        return conditions;
    },


    /* =====================================================
       FIELD SPRAY / IRRIGATION CONDITIONS
    ===================================================== */

    getFieldOperationAdvice(
        weather = {}
    ) {

        const current =
            this.normalizeWeather(
                weather
            );


        const advice = [];


        /*
         * Irrigation
         */

        if (
            current.rainProbability >= 70 ||
            current.humidity >= 85
        ) {

            advice.push({

                operation: "irrigation",

                status: "avoid",

                title:
                    "Avoid unnecessary irrigation",

                message:
                    "Wet conditions are already present or likely. Reassess irrigation needs before applying additional water."
            });

        } else if (
            current.humidity < 50 &&
            current.rainProbability < 30
        ) {

            advice.push({

                operation: "irrigation",

                status: "monitor",

                title:
                    "Monitor irrigation needs",

                message:
                    "Dryer conditions may increase crop water demand. Use soil moisture measurements before irrigating."
            });

        } else {

            advice.push({

                operation: "irrigation",

                status: "normal",

                title:
                    "Normal irrigation monitoring",

                message:
                    "Use crop stage and soil moisture measurements to determine irrigation requirements."
            });
        }


        /*
         * Field inspection
         */

        if (
            current.humidity >= 80 ||
            current.rainProbability >= 70
        ) {

            advice.push({

                operation: "inspection",

                status: "recommended",

                title:
                    "Inspect crops",

                message:
                    "Inspect leaves and other crop tissues for early disease symptoms."
            });
        }


        /*
         * Field access
         */

        if (
            current.rainfall >= 10
        ) {

            advice.push({

                operation: "field-access",

                status: "caution",

                title:
                    "Use caution entering wet fields",

                message:
                    "Heavy rainfall may cause muddy soil and compaction risk."
            });
        }


        return advice;
    },


    /* =====================================================
       FORECAST RISK
    ===================================================== */

    calculateForecastRisk(
        forecast = []
    ) {

        if (
            !Array.isArray(
                forecast
            ) ||
            forecast.length === 0
        ) {

            return {

                averageRisk: 0,

                maximumRisk: 0,

                maximumRiskDay: null,

                highRiskDays: 0,

                daily: []
            };
        }


        const daily =
            forecast.map(
                day => {

                    const weather =
                        this.normalizeWeather(
                            day
                        );


                    const result =
                        this.calculateDiseaseWeatherRisk(
                            weather
                        );


                    return {

                        day:
                            day.day ??
                            day.name ??
                            day.date ??
                            "Unknown",

                        date:
                            day.date ??
                            null,

                        temperature:
                            weather.temperature,

                        humidity:
                            weather.humidity,

                        rainfall:
                            weather.rainfall,

                        rainProbability:
                            weather.rainProbability,

                        condition:
                            weather.condition,

                        riskScore:
                            result.score,

                        riskLevel:
                            this.getRiskLevel(
                                result.score
                            )
                    };
                }
            );


        const scores =
            daily.map(
                item =>
                    item.riskScore
            );


        const average =
            scores.reduce(
                (
                    total,
                    value
                ) =>
                    total + value,
                0
            ) / scores.length;


        const maximum =
            Math.max(
                ...scores
            );


        const highest =
            daily.find(
                item =>
                    item.riskScore ===
                    maximum
            );


        return {

            averageRisk:
                Math.round(
                    average
                ),

            maximumRisk:
                maximum,

            maximumRiskDay:
                highest?.day ??
                null,

            highRiskDays:
                daily.filter(
                    item =>
                        item.riskScore >= 60
                ).length,

            daily
        };
    },


    /* =====================================================
       COMPLETE WEATHER ANALYSIS
    ===================================================== */

    analyze(
        weatherData = null
    ) {

        const current =
            this.getCurrentWeather(
                weatherData
            );


        const forecast =
            this.getForecast(
                weatherData
            );


        const currentRisk =
            this.calculateDiseaseWeatherRisk(
                current
            );


        const conditions =
            this.detectDiseaseFavorableConditions(
                current
            );


        const operationAdvice =
            this.getFieldOperationAdvice(
                current
            );


        const forecastRisk =
            this.calculateForecastRisk(
                forecast
            );


        return {

            current,

            forecast,

            risk: {

                score:
                    currentRisk.score,

                level:
                    this.getRiskLevel(
                        currentRisk.score
                    ),

                components:
                    currentRisk
            },

            diseaseFavorableConditions:
                conditions,

            operationAdvice,

            forecastRisk,

            location:
                weatherData?.location ??
                this.defaultLocation,

            timestamp:
                new Date().toISOString()
        };
    },


    /* =====================================================
       CHART DATA
    ===================================================== */

    getChartData(
        weatherData = null
    ) {

        const forecast =
            this.getForecast(
                weatherData
            );


        const labels =
            forecast.map(
                item =>
                    item.day
            );


        const temperature =
            forecast.map(
                item =>
                    item.temperature
            );


        const humidity =
            forecast.map(
                item =>
                    item.humidity
            );


        const rainfall =
            forecast.map(
                item =>
                    item.rainfall
            );


        const rainProbability =
            forecast.map(
                item =>
                    item.rainProbability
            );


        return {

            labels,

            temperature,

            humidity,

            rainfall,

            rainProbability
        };
    },


    /* =====================================================
       DASHBOARD SUMMARY
    ===================================================== */

    getDashboardSummary(
        weatherData = null
    ) {

        const analysis =
            this.analyze(
                weatherData
            );


        return {

            temperature:
                analysis.current.temperature,

            humidity:
                analysis.current.humidity,

            rainfall:
                analysis.current.rainfall,

            rainProbability:
                analysis.current.rainProbability,

            condition:
                analysis.current.condition,

            riskScore:
                analysis.risk.score,

            riskLevel:
                analysis.risk.level,

            forecastHighRiskDays:
                analysis.forecastRisk.highRiskDays,

            forecastMaximumRisk:
                analysis.forecastRisk.maximumRisk,

            forecastMaximumRiskDay:
                analysis.forecastRisk.maximumRiskDay
        };
    }
};


/* =========================================================
   CONVENIENCE FUNCTIONS
========================================================= */


/**
 * Analyze weather data.
 */
function analyzeWeather(
    weatherData = null
) {

    return AgriGuardWeatherEngine.analyze(
        weatherData
    );
}


/**
 * Get current weather.
 */
function getCurrentWeather(
    weatherData = null
) {

    return AgriGuardWeatherEngine.getCurrentWeather(
        weatherData
    );
}


/**
 * Get forecast.
 */
function getWeatherForecast(
    weatherData = null
) {

    return AgriGuardWeatherEngine.getForecast(
        weatherData
    );
}


/**
 * Calculate weather disease risk.
 */
function calculateWeatherRisk(
    weather = {}
) {

    return AgriGuardWeatherEngine.calculateDiseaseWeatherRisk(
        weather
    );
}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.AgriGuardWeatherEngine =
    AgriGuardWeatherEngine;

window.analyzeWeather =
    analyzeWeather;

window.getCurrentWeather =
    getCurrentWeather;

window.getWeatherForecast =
    getWeatherForecast;

window.calculateWeatherRisk =
    calculateWeatherRisk;
```
