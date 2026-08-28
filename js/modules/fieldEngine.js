```javascript
/* =========================================================
   AgriGuard AI - Field Engine
   File: js/modules/fieldEngine.js

   Purpose:
   - Manage agricultural field records
   - Calculate field health
   - Calculate field risk
   - Select active field
   - Add / update / remove fields
   - Provide field summaries
   - Support dashboard + field management UI
   - Integrate with other AgriGuard AI engines
   ========================================================= */

"use strict";


/* =========================================================
   FIELD ENGINE
   ========================================================= */

const AgriGuardFieldEngine = {

    /* -----------------------------------------------------
       Internal State
       ----------------------------------------------------- */

    fields: [],

    selectedFieldId: null,

    initialized: false,


    /* -----------------------------------------------------
       Utility
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


    normalizeId(value) {

        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-_]/g, "");
    },


    /* -----------------------------------------------------
       Normalize Field
       ----------------------------------------------------- */

    normalizeField(field = {}) {

        const id =
            field.id ||
            field.fieldId ||
            this.normalizeId(field.name) ||
            `field-${Date.now()}`;

        const crop =
            field.crop ||
            field.cropType ||
            "Unknown";

        const area =
            Number(
                field.area ??
                field.areaAcres ??
                0
            );


        const health =
            this.clamp(
                field.health ??
                field.cropHealth ??
                75
            );


        const risk =
            this.clamp(
                field.risk ??
                field.diseaseRisk ??
                25
            );


        const moisture =
            this.clamp(
                field.moisture ??
                field.soilMoisture ??
                60
            );


        const stage =
            field.stage ||
            field.growthStage ||
            "Vegetative";


        const status =
            field.status ||
            this.getHealthStatus(health);


        return {

            id: String(id),

            name:
                field.name ||
                this.formatFieldName(id),

            crop,

            area: Number.isFinite(area)
                ? area
                : 0,

            health,

            risk,

            moisture,

            stage,

            status,

            location:
                field.location ||
                "Andhra Pradesh",

            variety:
                field.variety ||
                "",

            soilType:
                field.soilType ||
                "",

            lastInspection:
                field.lastInspection ||
                new Date().toISOString(),

            createdAt:
                field.createdAt ||
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };
    },


    /* -----------------------------------------------------
       Field Name Formatting
       ----------------------------------------------------- */

    formatFieldName(id) {

        const text =
            String(id || "field")
                .replace(/[-_]+/g, " ")
                .trim();

        if (!text) {
            return "Field";
        }

        return text
            .split(" ")
            .map(word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
            )
            .join(" ");
    },


    /* -----------------------------------------------------
       Health Status
       ----------------------------------------------------- */

    getHealthStatus(health) {

        const value =
            this.clamp(health);


        if (value >= 85) {
            return "Healthy";
        }

        if (value >= 70) {
            return "Good";
        }

        if (value >= 50) {
            return "Watch";
        }

        if (value >= 30) {
            return "At Risk";
        }

        return "Critical";
    },


    /* -----------------------------------------------------
       Risk Status
       ----------------------------------------------------- */

    getRiskStatus(risk) {

        const value =
            this.clamp(risk);


        if (value >= 75) {
            return "High";
        }

        if (value >= 50) {
            return "Moderate";
        }

        if (value >= 25) {
            return "Low";
        }

        return "Minimal";
    },


    /* -----------------------------------------------------
       Calculate Field Health
       ----------------------------------------------------- */

    calculateHealth(field = {}) {

        const existingHealth =
            Number(
                field.health ??
                field.cropHealth
            );


        if (Number.isFinite(existingHealth)) {

            return this.clamp(
                existingHealth
            );
        }


        const moisture =
            this.clamp(
                field.moisture ??
                field.soilMoisture ??
                60
            );


        const risk =
            this.clamp(
                field.risk ??
                field.diseaseRisk ??
                25
            );


        /*
         * Health is inversely related to disease risk,
         * while reasonable soil moisture provides a
         * positive contribution.
         */

        const moistureScore =
            100 -
            Math.abs(
                60 - moisture
            );


        const calculated =
            (
                (100 - risk) * 0.70
            ) +
            (
                moistureScore * 0.30
            );


        return Math.round(
            this.clamp(calculated)
        );
    },


    /* -----------------------------------------------------
       Calculate Disease Risk
       ----------------------------------------------------- */

    calculateRisk(field = {}) {

        const existingRisk =
            Number(
                field.risk ??
                field.diseaseRisk
            );


        if (Number.isFinite(existingRisk)) {

            return this.clamp(
                existingRisk
            );
        }


        const health =
            this.calculateHealth(field);


        return Math.round(
            this.clamp(
                100 - health
            )
        );
    },


    /* -----------------------------------------------------
       Initialize
       ----------------------------------------------------- */

    initialize(fields = null) {

        let source = fields;


        /*
         * Attempt to use data.js if no data
         * was explicitly provided.
         */

        if (!source) {

            if (
                typeof AgriGuardData !== "undefined"
            ) {

                source =
                    AgriGuardData.fields ||
                    AgriGuardData.fieldData ||
                    AgriGuardData.initialFields ||
                    null;
            }
        }


        /*
         * Also support a globally exported
         * field dataset.
         */

        if (!source) {

            source =
                window.FIELD_DATA ||
                window.fieldData ||
                null;
        }


        if (!Array.isArray(source)) {

            source = [
                {
                    id: "field-a",
                    name: "Field A",
                    crop: "Rice",
                    area: 2.4,
                    health: 86,
                    risk: 23,
                    moisture: 61,
                    stage: "Flowering",
                    status: "Healthy"
                },

                {
                    id: "field-b",
                    name: "Field B",
                    crop: "Cotton",
                    area: 3.1,
                    health: 64,
                    risk: 72,
                    moisture: 54,
                    stage: "Flowering",
                    status: "At Risk"
                },

                {
                    id: "field-c",
                    name: "Field C",
                    crop: "Chilli",
                    area: 1.8,
                    health: 76,
                    risk: 54,
                    moisture: 68,
                    stage: "Fruiting",
                    status: "Watch"
                },

                {
                    id: "field-d",
                    name: "Field D",
                    crop: "Tomato",
                    area: 2.7,
                    health: 91,
                    risk: 29,
                    moisture: 79,
                    stage: "Vegetative",
                    status: "Healthy"
                }
            ];
        }


        this.fields =
            source.map(field =>
                this.normalizeField(field)
            );


        if (
            !this.selectedFieldId &&
            this.fields.length > 0
        ) {

            this.selectedFieldId =
                this.fields[0].id;
        }


        this.initialized = true;


        return this.getFields();
    },


    /* -----------------------------------------------------
       Get All Fields
       ----------------------------------------------------- */

    getFields() {

        return this.fields.map(field => ({
            ...field
        }));
    },


    /* -----------------------------------------------------
       Get Field By ID
       ----------------------------------------------------- */

    getField(fieldId) {

        if (!fieldId) {
            return null;
        }


        const id =
            String(fieldId);


        return (
            this.fields.find(
                field =>
                    String(field.id) === id
            ) ||
            null
        );
    },


    /* -----------------------------------------------------
       Get Selected Field
       ----------------------------------------------------- */

    getSelectedField() {

        return this.getField(
            this.selectedFieldId
        );
    },


    /* -----------------------------------------------------
       Select Field
       ----------------------------------------------------- */

    selectField(fieldId) {

        const field =
            this.getField(fieldId);


        if (!field) {

            console.warn(
                `Field "${fieldId}" was not found.`
            );

            return null;
        }


        this.selectedFieldId =
            field.id;


        this.dispatchFieldEvent(
            "field:selected",
            field
        );


        return {
            ...field
        };
    },


    /* -----------------------------------------------------
       Add Field
       ----------------------------------------------------- */

    addField(fieldData = {}) {

        const normalized =
            this.normalizeField(
                fieldData
            );


        /*
         * Prevent duplicate IDs.
         */

        if (
            this.getField(normalized.id)
        ) {

            normalized.id =
                `${normalized.id}-${Date.now()}`;
        }


        normalized.health =
            this.calculateHealth(
                normalized
            );


        normalized.risk =
            this.calculateRisk(
                normalized
            );


        normalized.status =
            this.getHealthStatus(
                normalized.health
            );


        this.fields.push(
            normalized
        );


        if (!this.selectedFieldId) {

            this.selectedFieldId =
                normalized.id;
        }


        this.dispatchFieldEvent(
            "field:added",
            normalized
        );


        return {
            ...normalized
        };
    },


    /* -----------------------------------------------------
       Update Field
       ----------------------------------------------------- */

    updateField(
        fieldId,
        updates = {}
    ) {

        const field =
            this.getField(fieldId);


        if (!field) {

            console.warn(
                `Cannot update unknown field "${fieldId}".`
            );

            return null;
        }


        Object.assign(
            field,
            updates
        );


        /*
         * Recalculate derived values.
         */

        if (
            updates.health === undefined &&
            updates.cropHealth === undefined
        ) {

            field.health =
                this.calculateHealth(
                    field
                );
        } else {

            field.health =
                this.clamp(
                    field.health
                );
        }


        if (
            updates.risk === undefined &&
            updates.diseaseRisk === undefined
        ) {

            field.risk =
                this.calculateRisk(
                    field
                );
        } else {

            field.risk =
                this.clamp(
                    field.risk
                );
        }


        field.status =
            this.getHealthStatus(
                field.health
            );


        field.updatedAt =
            new Date().toISOString();


        this.dispatchFieldEvent(
            "field:updated",
            field
        );


        return {
            ...field
        };
    },


    /* -----------------------------------------------------
       Remove Field
       ----------------------------------------------------- */

    removeField(fieldId) {

        const index =
            this.fields.findIndex(
                field =>
                    String(field.id) ===
                    String(fieldId)
            );


        if (index === -1) {

            console.warn(
                `Cannot remove unknown field "${fieldId}".`
            );

            return false;
        }


        const removed =
            this.fields[index];


        this.fields.splice(
            index,
            1
        );


        /*
         * If selected field was removed,
         * select another available field.
         */

        if (
            String(this.selectedFieldId) ===
            String(fieldId)
        ) {

            this.selectedFieldId =
                this.fields.length > 0
                    ? this.fields[0].id
                    : null;
        }


        this.dispatchFieldEvent(
            "field:removed",
            removed
        );


        return true;
    },


    /* -----------------------------------------------------
       Get Healthy Fields
       ----------------------------------------------------- */

    getHealthyFields() {

        return this.fields.filter(
            field =>
                field.health >= 70
        );
    },


    /* -----------------------------------------------------
       Get At-Risk Fields
       ----------------------------------------------------- */

    getAtRiskFields() {

        return this.fields.filter(
            field =>
                field.risk >= 50
        );
    },


    /* -----------------------------------------------------
       Get High-Risk Fields
       ----------------------------------------------------- */

    getHighRiskFields() {

        return this.fields.filter(
            field =>
                field.risk >= 75
        );
    },


    /* -----------------------------------------------------
       Find Fields By Crop
       ----------------------------------------------------- */

    getFieldsByCrop(crop) {

        if (!crop) {
            return [];
        }


        const normalizedCrop =
            String(crop)
                .trim()
                .toLowerCase();


        return this.fields.filter(
            field =>
                String(field.crop)
                    .trim()
                    .toLowerCase() ===
                normalizedCrop
        );
    },


    /* -----------------------------------------------------
       Search Fields
       ----------------------------------------------------- */

    searchFields(query = "") {

        const search =
            String(query)
                .trim()
                .toLowerCase();


        if (!search) {
            return this.getFields();
        }


        return this.fields.filter(
            field => {

                return (

                    String(field.name)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(field.crop)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(field.location)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(field.stage)
                        .toLowerCase()
                        .includes(search)
                );
            }
        );
    },


    /* -----------------------------------------------------
       Sort Fields
       ----------------------------------------------------- */

    sortFields(
        fields = this.fields,
        sortBy = "name",
        direction = "asc"
    ) {

        const multiplier =
            direction === "desc"
                ? -1
                : 1;


        return [...fields].sort(
            (a, b) => {

                let valueA =
                    a[sortBy];

                let valueB =
                    b[sortBy];


                if (
                    typeof valueA === "string"
                ) {

                    valueA =
                        valueA.toLowerCase();
                }


                if (
                    typeof valueB === "string"
                ) {

                    valueB =
                        valueB.toLowerCase();
                }


                if (valueA < valueB) {
                    return -1 * multiplier;
                }


                if (valueA > valueB) {
                    return 1 * multiplier;
                }


                return 0;
            }
        );
    },


    /* -----------------------------------------------------
       Calculate Farm Summary
       ----------------------------------------------------- */

    getFarmSummary() {

        const count =
            this.fields.length;


        if (count === 0) {

            return {
                totalFields: 0,
                totalArea: 0,
                averageHealth: 0,
                averageRisk: 0,
                averageMoisture: 0,
                healthyFields: 0,
                atRiskFields: 0,
                highRiskFields: 0
            };
        }


        const totalArea =
            this.fields.reduce(
                (sum, field) =>
                    sum +
                    Number(field.area || 0),
                0
            );


        const averageHealth =
            this.fields.reduce(
                (sum, field) =>
                    sum +
                    Number(field.health || 0),
                0
            ) / count;


        const averageRisk =
            this.fields.reduce(
                (sum, field) =>
                    sum +
                    Number(field.risk || 0),
                0
            ) / count;


        const averageMoisture =
            this.fields.reduce(
                (sum, field) =>
                    sum +
                    Number(field.moisture || 0),
                0
            ) / count;


        return {

            totalFields:
                count,

            totalArea:
                Number(
                    totalArea.toFixed(2)
                ),

            averageHealth:
                Math.round(
                    averageHealth
                ),

            averageRisk:
                Math.round(
                    averageRisk
                ),

            averageMoisture:
                Math.round(
                    averageMoisture
                ),

            healthyFields:
                this.getHealthyFields()
                    .length,

            atRiskFields:
                this.getAtRiskFields()
                    .length,

            highRiskFields:
                this.getHighRiskFields()
                    .length
        };
    },


    /* -----------------------------------------------------
       Field Risk Ranking
       ----------------------------------------------------- */

    getRiskRanking() {

        return this.sortFields(
            this.fields,
            "risk",
            "desc"
        ).map(
            (field, index) => ({

                rank:
                    index + 1,

                id:
                    field.id,

                name:
                    field.name,

                crop:
                    field.crop,

                risk:
                    field.risk,

                status:
                    this.getRiskStatus(
                        field.risk
                    )
            })
        );
    },


    /* -----------------------------------------------------
       Health Ranking
       ----------------------------------------------------- */

    getHealthRanking() {

        return this.sortFields(
            this.fields,
            "health",
            "desc"
        ).map(
            (field, index) => ({

                rank:
                    index + 1,

                id:
                    field.id,

                name:
                    field.name,

                crop:
                    field.crop,

                health:
                    field.health,

                status:
                    field.status
            })
        );
    },


    /* -----------------------------------------------------
       Field Statistics
       ----------------------------------------------------- */

    getFieldStatistics(fieldId) {

        const field =
            this.getField(fieldId);


        if (!field) {
            return null;
        }


        return {

            id:
                field.id,

            name:
                field.name,

            crop:
                field.crop,

            area:
                field.area,

            health:
                field.health,

            risk:
                field.risk,

            moisture:
                field.moisture,

            stage:
                field.stage,

            healthStatus:
                this.getHealthStatus(
                    field.health
                ),

            riskStatus:
                this.getRiskStatus(
                    field.risk
                )
        };
    },


    /* -----------------------------------------------------
       Update From Diagnosis
       ----------------------------------------------------- */

    updateFromDiagnosis(
        fieldId,
        diagnosis = {}
    ) {

        const field =
            this.getField(fieldId);


        if (!field) {
            return null;
        }


        /*
         * Diagnosis risk can be supplied by
         * riskEngine or diseaseDetection.
         */

        const diagnosisRisk =
            Number(
                diagnosis.riskScore ??
                diagnosis.risk ??
                diagnosis.diseaseRisk
            );


        if (
            Number.isFinite(
                diagnosisRisk
            )
        ) {

            field.risk =
                this.clamp(
                    diagnosisRisk
                );

            field.health =
                this.clamp(
                    100 -
                    field.risk
                );
        }


        if (
            diagnosis.crop
        ) {

            field.crop =
                diagnosis.crop;
        }


        if (
            diagnosis.growthStage ||
            diagnosis.stage
        ) {

            field.stage =
                diagnosis.growthStage ||
                diagnosis.stage;
        }


        field.status =
            this.getHealthStatus(
                field.health
            );


        field.updatedAt =
            new Date().toISOString();


        this.dispatchFieldEvent(
            "field:diagnosis-updated",
            field
        );


        return {
            ...field
        };
    },


    /* -----------------------------------------------------
       Update From Soil Result
       ----------------------------------------------------- */

    updateFromSoil(
        fieldId,
        soilResult = {}
    ) {

        const field =
            this.getField(fieldId);


        if (!field) {
            return null;
        }


        const moisture =
            Number(
                soilResult.moisture ??
                soilResult.soilMoisture
            );


        if (
            Number.isFinite(
                moisture
            )
        ) {

            field.moisture =
                this.clamp(
                    moisture
                );
        }


        field.health =
            this.calculateHealth(
                field
            );


        field.status =
            this.getHealthStatus(
                field.health
            );


        field.updatedAt =
            new Date().toISOString();


        this.dispatchFieldEvent(
            "field:soil-updated",
            field
        );


        return {
            ...field
        };
    },


    /* -----------------------------------------------------
       Update From Weather
       ----------------------------------------------------- */

    updateFromWeather(
        fieldId,
        weatherResult = {}
    ) {

        const field =
            this.getField(fieldId);


        if (!field) {
            return null;
        }


        /*
         * Weather itself does not directly overwrite
         * the field risk. Instead, modest risk adjustments
         * are applied based on humidity and rainfall.
         */

        const humidity =
            Number(
                weatherResult.humidity
            );


        const rainProbability =
            Number(
                weatherResult.rainProbability ??
                weatherResult.rainChance
            );


        let weatherRiskAdjustment = 0;


        if (
            Number.isFinite(humidity) &&
            humidity >= 85
        ) {

            weatherRiskAdjustment += 8;
        }


        if (
            Number.isFinite(rainProbability) &&
            rainProbability >= 70
        ) {

            weatherRiskAdjustment += 7;
        }


        if (
            weatherRiskAdjustment > 0
        ) {

            field.risk =
                this.clamp(
                    field.risk +
                    weatherRiskAdjustment
                );


            field.health =
                this.clamp(
                    100 -
                    field.risk
                );
        }


        field.status =
            this.getHealthStatus(
                field.health
            );


        field.updatedAt =
            new Date().toISOString();


        this.dispatchFieldEvent(
            "field:weather-updated",
            field
        );


        return {
            ...field
        };
    },


    /* -----------------------------------------------------
       Get Dashboard Fields
       ----------------------------------------------------- */

    getDashboardFields(limit = 5) {

        return this.sortFields(
            this.fields,
            "risk",
            "desc"
        )
            .slice(
                0,
                Math.max(
                    0,
                    Number(limit)
                )
            )
            .map(field => ({
                ...field
            }));
    },


    /* -----------------------------------------------------
       Get Field Chart Data
       ----------------------------------------------------- */

    getRiskChartData() {

        return {

            labels:
                this.fields.map(
                    field =>
                        field.name
                ),

            values:
                this.fields.map(
                    field =>
                        field.risk
                )
        };
    },


    /* -----------------------------------------------------
       Get Field Health Chart Data
       ----------------------------------------------------- */

    getHealthChartData() {

        return {

            labels:
                this.fields.map(
                    field =>
                        field.name
                ),

            health:
                this.fields.map(
                    field =>
                        field.health
                ),

            moisture:
                this.fields.map(
                    field =>
                        field.moisture
                )
        };
    },


    /* -----------------------------------------------------
       Refresh Derived Values
       ----------------------------------------------------- */

    refresh() {

        this.fields =
            this.fields.map(
                field => {

                    const health =
                        this.calculateHealth(
                            field
                        );

                    const risk =
                        this.calculateRisk(
                            field
                        );


                    return {

                        ...field,

                        health,

                        risk,

                        status:
                            this.getHealthStatus(
                                health
                            ),

                        updatedAt:
                            new Date().toISOString()
                    };
                }
            );


        this.dispatchFieldEvent(
            "fields:refreshed",
            this.getFields()
        );


        return this.getFields();
    },


    /* -----------------------------------------------------
       Event Dispatcher
       ----------------------------------------------------- */

    dispatchFieldEvent(
        eventName,
        detail
    ) {

        try {

            window.dispatchEvent(
                new CustomEvent(
                    eventName,
                    {
                        detail
                    }
                )
            );

        } catch (error) {

            console.warn(
                `Could not dispatch ${eventName}:`,
                error
            );
        }
    },


    /* -----------------------------------------------------
       Reset
       ----------------------------------------------------- */

    reset() {

        this.fields = [];

        this.selectedFieldId = null;

        this.initialized = false;
    }
};


/* =========================================================
   CONVENIENCE FUNCTIONS
   ========================================================= */

function initializeFields(fields = null) {

    return AgriGuardFieldEngine.initialize(
        fields
    );
}


function getFields() {

    return AgriGuardFieldEngine.getFields();
}


function getField(fieldId) {

    return AgriGuardFieldEngine.getField(
        fieldId
    );
}


function getSelectedField() {

    return AgriGuardFieldEngine.getSelectedField();
}


function selectField(fieldId) {

    return AgriGuardFieldEngine.selectField(
        fieldId
    );
}


function addField(fieldData) {

    return AgriGuardFieldEngine.addField(
        fieldData
    );
}


function updateField(
    fieldId,
    updates
) {

    return AgriGuardFieldEngine.updateField(
        fieldId,
        updates
    );
}


function removeField(fieldId) {

    return AgriGuardFieldEngine.removeField(
        fieldId
    );
}


function getFarmSummary() {

    return AgriGuardFieldEngine.getFarmSummary();
}


function getAtRiskFields() {

    return AgriGuardFieldEngine.getAtRiskFields();
}


function getHighRiskFields() {

    return AgriGuardFieldEngine.getHighRiskFields();
}


function getHealthyFields() {

    return AgriGuardFieldEngine.getHealthyFields();
}


/* =========================================================
   AUTO INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * data.js should already be loaded before this module.
         */

        try {

            AgriGuardFieldEngine.initialize();

        } catch (error) {

            console.error(
                "Field engine initialization failed:",
                error
            );
        }
    }
);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.AgriGuardFieldEngine =
    AgriGuardFieldEngine;

window.initializeFields =
    initializeFields;

window.getFields =
    getFields;

window.getField =
    getField;

window.getSelectedField =
    getSelectedField;

window.selectField =
    selectField;

window.addField =
    addField;

window.updateField =
    updateField;

window.removeField =
    removeField;

window.getFarmSummary =
    getFarmSummary;

window.getAtRiskFields =
    getAtRiskFields;

window.getHighRiskFields =
    getHighRiskFields;

window.getHealthyFields =
    getHealthyFields;
```
