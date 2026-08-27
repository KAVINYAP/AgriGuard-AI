/* =========================================================
   AgriGuard AI - Charts Module
   File: js/charts.js

   Purpose:
   - Dashboard visualizations
   - Disease risk trend
   - Weather trend
   - Soil health
   - Disease distribution
   - Field comparison
   - Safe chart rendering / updating
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   Chart Registry
   --------------------------------------------------------- */

const AgriGuardCharts = {
    instances: {},

    colors: {
        primary: "#2e7d32",
        secondary: "#66bb6a",
        warning: "#f9a825",
        danger: "#d32f2f",
        info: "#1976d2",
        purple: "#7b1fa2",
        soil: "#795548",
        gray: "#78909c"
    },

    /**
     * Destroy an existing chart safely.
     */
    destroy(chartId) {
        if (this.instances[chartId]) {
            try {
                this.instances[chartId].destroy();
            } catch (error) {
                console.warn(`Could not destroy chart: ${chartId}`, error);
            }

            delete this.instances[chartId];
        }
    },

    /**
     * Check whether a canvas exists.
     */
    canvasExists(canvasId) {
        return document.getElementById(canvasId) !== null;
    },

    /**
     * Create a chart safely.
     */
    create(canvasId, config) {
        if (typeof Chart === "undefined") {
            console.warn(
                "Chart.js is not loaded. Charts will be skipped."
            );
            return null;
        }

        const canvas = document.getElementById(canvasId);

        if (!canvas) {
            console.warn(`Canvas #${canvasId} was not found.`);
            return null;
        }

        this.destroy(canvasId);

        try {
            this.instances[canvasId] = new Chart(canvas, config);
            return this.instances[canvasId];
        } catch (error) {
            console.error(
                `Failed to create chart #${canvasId}:`,
                error
            );
            return null;
        }
    }
};


/* =========================================================
   GLOBAL CHART DEFAULTS
   ========================================================= */

function configureChartDefaults() {
    if (typeof Chart === "undefined") {
        return;
    }

    Chart.defaults.font.family =
        "Inter, Segoe UI, Arial, sans-serif";

    Chart.defaults.font.size = 12;

    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    Chart.defaults.plugins.tooltip.backgroundColor =
        "rgba(20, 35, 25, 0.92)";

    Chart.defaults.plugins.tooltip.padding = 10;

    Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

configureChartDefaults();


/* =========================================================
   1. DISEASE RISK TREND
   ========================================================= */

function createRiskTrendChart(
    canvasId = "riskTrendChart",
    riskData = null
) {
    const labels = riskData?.labels || [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ];

    const values = riskData?.values || [
        31,
        38,
        42,
        49,
        57,
        63,
        68
    ];

    return AgriGuardCharts.create(canvasId, {
        type: "line",

        data: {
            labels,

            datasets: [
                {
                    label: "Disease Risk",

                    data: values,

                    borderColor:
                        AgriGuardCharts.colors.danger,

                    backgroundColor:
                        "rgba(211, 47, 47, 0.10)",

                    borderWidth: 3,

                    fill: true,

                    tension: 0.4,

                    pointRadius: 4,

                    pointHoverRadius: 6
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    display: true
                },

                tooltip: {
                    callbacks: {
                        label(context) {
                            return `Risk: ${context.raw}%`;
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    max: 100,

                    title: {
                        display: true,
                        text: "Risk (%)"
                    },

                    ticks: {
                        callback(value) {
                            return `${value}%`;
                        }
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}


/* =========================================================
   2. WEATHER TREND
   ========================================================= */

function createWeatherChart(
    canvasId = "weatherChart",
    weatherData = null
) {
    const labels = weatherData?.labels || [
        "6 AM",
        "9 AM",
        "12 PM",
        "3 PM",
        "6 PM",
        "9 PM"
    ];

    const temperature =
        weatherData?.temperature || [
            23,
            26,
            30,
            32,
            29,
            26
        ];

    const humidity =
        weatherData?.humidity || [
            82,
            75,
            67,
            61,
            68,
            76
        ];

    return AgriGuardCharts.create(canvasId, {
        type: "line",

        data: {
            labels,

            datasets: [
                {
                    label: "Temperature",

                    data: temperature,

                    borderColor:
                        AgriGuardCharts.colors.warning,

                    backgroundColor:
                        "rgba(249, 168, 37, 0.08)",

                    borderWidth: 2.5,

                    tension: 0.35,

                    yAxisID: "temperature"
                },

                {
                    label: "Humidity",

                    data: humidity,

                    borderColor:
                        AgriGuardCharts.colors.info,

                    backgroundColor:
                        "rgba(25, 118, 210, 0.08)",

                    borderWidth: 2.5,

                    tension: 0.35,

                    yAxisID: "humidity"
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            scales: {
                temperature: {
                    type: "linear",

                    position: "left",

                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    }
                },

                humidity: {
                    type: "linear",

                    position: "right",

                    min: 0,

                    max: 100,

                    title: {
                        display: true,
                        text: "Humidity (%)"
                    },

                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}


/* =========================================================
   3. SOIL HEALTH CHART
   ========================================================= */

function createSoilHealthChart(
    canvasId = "soilHealthChart",
    soilData = null
) {
    const values = soilData?.values || [
        72,
        68,
        81,
        65,
        74
    ];

    const labels = soilData?.labels || [
        "Nitrogen",
        "Phosphorus",
        "Potassium",
        "Moisture",
        "Organic Matter"
    ];

    return AgriGuardCharts.create(canvasId, {
        type: "radar",

        data: {
            labels,

            datasets: [
                {
                    label: "Soil Health",

                    data: values,

                    borderColor:
                        AgriGuardCharts.colors.primary,

                    backgroundColor:
                        "rgba(46, 125, 50, 0.18)",

                    borderWidth: 2,

                    pointBackgroundColor:
                        AgriGuardCharts.colors.primary,

                    pointRadius: 4
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            scales: {
                r: {
                    beginAtZero: true,

                    max: 100,

                    ticks: {
                        display: false
                    },

                    grid: {
                        circular: true
                    }
                }
            },

            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}


/* =========================================================
   4. DISEASE DISTRIBUTION
   ========================================================= */

function createDiseaseDistributionChart(
    canvasId = "diseaseDistributionChart",
    diseaseData = null
) {
    const labels =
        diseaseData?.labels || [
            "Healthy",
            "Leaf Blight",
            "Rust",
            "Bacterial Spot",
            "Other"
        ];

    const values =
        diseaseData?.values || [
            48,
            21,
            14,
            9,
            8
        ];

    return AgriGuardCharts.create(canvasId, {
        type: "doughnut",

        data: {
            labels,

            datasets: [
                {
                    data: values,

                    backgroundColor: [
                        AgriGuardCharts.colors.primary,
                        AgriGuardCharts.colors.danger,
                        AgriGuardCharts.colors.warning,
                        AgriGuardCharts.colors.info,
                        AgriGuardCharts.colors.gray
                    ],

                    borderWidth: 2,

                    hoverOffset: 8
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            cutout: "65%",

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


/* =========================================================
   5. FIELD RISK COMPARISON
   ========================================================= */

function createFieldRiskChart(
    canvasId = "fieldRiskChart",
    fieldData = null
) {
    const labels =
        fieldData?.labels || [
            "Field A",
            "Field B",
            "Field C",
            "Field D",
            "Field E"
        ];

    const values =
        fieldData?.values || [
            38,
            72,
            54,
            29,
            81
        ];

    return AgriGuardCharts.create(canvasId, {
        type: "bar",

        data: {
            labels,

            datasets: [
                {
                    label: "Risk Level (%)",

                    data: values,

                    backgroundColor: [
                        "rgba(46, 125, 50, 0.75)",
                        "rgba(211, 47, 47, 0.75)",
                        "rgba(249, 168, 37, 0.75)",
                        "rgba(46, 125, 50, 0.75)",
                        "rgba(211, 47, 47, 0.75)"
                    ],

                    borderRadius: 8,

                    borderSkipped: false
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label(context) {
                            return `Risk: ${context.raw}%`;
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    max: 100,

                    ticks: {
                        callback(value) {
                            return `${value}%`;
                        }
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}


/* =========================================================
   6. MULTI-PARAMETER FIELD HEALTH
   ========================================================= */

function createFieldHealthChart(
    canvasId = "fieldHealthChart",
    fieldData = null
) {
    const labels =
        fieldData?.labels || [
            "Field A",
            "Field B",
            "Field C",
            "Field D"
        ];

    const health =
        fieldData?.health || [
            82,
            64,
            76,
            91
        ];

    const moisture =
        fieldData?.moisture || [
            71,
            54,
            68,
            79
        ];

    return AgriGuardCharts.create(canvasId, {
        type: "bar",

        data: {
            labels,

            datasets: [
                {
                    label: "Crop Health",

                    data: health,

                    backgroundColor:
                        "rgba(46, 125, 50, 0.75)",

                    borderRadius: 6
                },

                {
                    label: "Soil Moisture",

                    data: moisture,

                    backgroundColor:
                        "rgba(25, 118, 210, 0.65)",

                    borderRadius: 6
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            scales: {
                y: {
                    beginAtZero: true,

                    max: 100,

                    ticks: {
                        callback(value) {
                            return `${value}%`;
                        }
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}


/* =========================================================
   7. NDVI / VEGETATION HEALTH TREND
   ========================================================= */

function createNDVIChart(
    canvasId = "ndviChart",
    ndviData = null
) {
    const labels =
        ndviData?.labels || [
            "Week 1",
            "Week 2",
            "Week 3",
            "Week 4",
            "Week 5",
            "Week 6"
        ];

    const values =
        ndviData?.values || [
            0.71,
            0.73,
            0.76,
            0.72,
            0.66,
            0.61
        ];

    return AgriGuardCharts.create(canvasId, {
        type: "line",

        data: {
            labels,

            datasets: [
                {
                    label: "NDVI",

                    data: values,

                    borderColor:
                        AgriGuardCharts.colors.primary,

                    backgroundColor:
                        "rgba(46, 125, 50, 0.10)",

                    fill: true,

                    tension: 0.35,

                    borderWidth: 3,

                    pointRadius: 4
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            scales: {
                y: {
                    min: 0,

                    max: 1,

                    title: {
                        display: true,
                        text: "Vegetation Index"
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}


/* =========================================================
   8. RAINFALL CHART
   ========================================================= */

function createRainfallChart(
    canvasId = "rainfallChart",
    rainfallData = null
) {
    const labels =
        rainfallData?.labels || [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun"
        ];

    const values =
        rainfallData?.values || [
            2,
            0,
            5,
            12,
            18,
            7,
            3
        ];

    return AgriGuardCharts.create(canvasId, {
        type: "bar",

        data: {
            labels,

            datasets: [
                {
                    label: "Rainfall (mm)",

                    data: values,

                    backgroundColor:
                        "rgba(25, 118, 210, 0.65)",

                    borderRadius: 7
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    title: {
                        display: true,
                        text: "Rainfall (mm)"
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}


/* =========================================================
   9. GENERIC CHART UPDATE
   ========================================================= */

function updateChart(
    chartId,
    labels,
    values,
    datasetLabel = "Value"
) {
    const chart = AgriGuardCharts.instances[chartId];

    if (!chart) {
        console.warn(
            `Chart ${chartId} does not exist.`
        );

        return;
    }

    chart.data.labels = labels;

    if (
        chart.data.datasets &&
        chart.data.datasets.length > 0
    ) {
        chart.data.datasets[0].label = datasetLabel;
        chart.data.datasets[0].data = values;
    }

    chart.update();
}


/* =========================================================
   10. UPDATE RISK CHART FROM ENGINE RESULT
   ========================================================= */

function updateRiskChartFromResult(result) {
    if (!result) {
        return;
    }

    const currentRisk =
        Number(
            result.riskScore ??
            result.score ??
            result.risk ??
            0
        );

    const chart =
        AgriGuardCharts.instances["riskTrendChart"];

    if (!chart) {
        return;
    }

    const dataset =
        chart.data.datasets[0];

    dataset.data.push(currentRisk);

    chart.data.labels.push(
        new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    );

    /*
     * Keep dashboard responsive by limiting
     * the number of points.
     */

    if (dataset.data.length > 12) {
        dataset.data.shift();
        chart.data.labels.shift();
    }

    chart.update();
}


/* =========================================================
   11. UPDATE SOIL CHART
   ========================================================= */

function updateSoilChart(soilResult) {
    if (!soilResult) {
        return;
    }

    const chart =
        AgriGuardCharts.instances["soilHealthChart"];

    if (!chart) {
        return;
    }

    const values = [
        Number(
            soilResult.nitrogen ??
            soilResult.N ??
            70
        ),

        Number(
            soilResult.phosphorus ??
            soilResult.P ??
            70
        ),

        Number(
            soilResult.potassium ??
            soilResult.K ??
            70
        ),

        Number(
            soilResult.moisture ??
            70
        ),

        Number(
            soilResult.organicMatter ??
            soilResult.organic ??
            70
        )
    ];

    chart.data.datasets[0].data =
        values.map(value =>
            Math.max(0, Math.min(100, value))
        );

    chart.update();
}


/* =========================================================
   12. INITIALIZE ALL AVAILABLE DASHBOARD CHARTS
   ========================================================= */

function initializeDashboardCharts(data = {}) {
    try {
        createRiskTrendChart(
            "riskTrendChart",
            data.riskTrend
        );

        createWeatherChart(
            "weatherChart",
            data.weather
        );

        createSoilHealthChart(
            "soilHealthChart",
            data.soil
        );

        createDiseaseDistributionChart(
            "diseaseDistributionChart",
            data.diseaseDistribution
        );

        createFieldRiskChart(
            "fieldRiskChart",
            data.fieldRisk
        );

        createFieldHealthChart(
            "fieldHealthChart",
            data.fieldHealth
        );

        createNDVIChart(
            "ndviChart",
            data.ndvi
        );

        createRainfallChart(
            "rainfallChart",
            data.rainfall
        );

    } catch (error) {
        console.error(
            "Dashboard chart initialization failed:",
            error
        );
    }
}


/* =========================================================
   13. RESPONSIVE RESIZE
   ========================================================= */

function resizeAllCharts() {
    Object.values(
        AgriGuardCharts.instances
    ).forEach(chart => {
        try {
            chart.resize();
        } catch (error) {
            console.warn(
                "Chart resize failed:",
                error
            );
        }
    });
}

window.addEventListener(
    "resize",
    resizeAllCharts
);


/* =========================================================
   14. DESTROY ALL CHARTS
   ========================================================= */

function destroyAllCharts() {
    Object.keys(
        AgriGuardCharts.instances
    ).forEach(chartId => {
        AgriGuardCharts.destroy(chartId);
    });
}


/* =========================================================
   15. AUTO INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Small delay allows app.js and the dashboard
         * DOM to finish initializing first.
         */

        setTimeout(() => {

            /*
             * Only initialize charts if Chart.js
             * is available.
             */

            if (typeof Chart === "undefined") {
                console.warn(
                    "Chart.js is not available. " +
                    "Skipping dashboard charts."
                );

                return;
            }

            initializeDashboardCharts();

        }, 100);
    }
);


/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.AgriGuardCharts =
    AgriGuardCharts;

window.createRiskTrendChart =
    createRiskTrendChart;

window.createWeatherChart =
    createWeatherChart;

window.createSoilHealthChart =
    createSoilHealthChart;

window.createDiseaseDistributionChart =
    createDiseaseDistributionChart;

window.createFieldRiskChart =
    createFieldRiskChart;

window.createFieldHealthChart =
    createFieldHealthChart;

window.createNDVIChart =
    createNDVIChart;

window.createRainfallChart =
    createRainfallChart;

window.updateChart =
    updateChart;

window.updateRiskChartFromResult =
    updateRiskChartFromResult;

window.updateSoilChart =
    updateSoilChart;

window.initializeDashboardCharts =
    initializeDashboardCharts;

window.destroyAllCharts =
    destroyAllCharts;
