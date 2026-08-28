```javascript
/* =========================================================
   AgriGuard AI - Main Application Controller
   File: js/app.js

   Purpose:
   - Connect all AgriGuard AI modules
   - Control page navigation
   - Handle crop-image upload
   - Run AI diagnosis
   - Run risk / weather / soil analysis
   - Generate recommendations
   - Manage alerts
   - Manage fields
   - Populate dashboard
   - Populate analytics
   - Update charts
   - Manage notifications, modal and toast UI

   Dependency order from index.html:

   Chart.js
       ↓
   data.js
       ↓
   charts.js
       ↓
   diseaseDetection.js
       ↓
   riskEngine.js
       ↓
   weatherEngine.js
       ↓
   soilEngine.js
       ↓
   recommendationEngine.js
       ↓
   alertEngine.js
       ↓
   fieldEngine.js
       ↓
   app.js
   ========================================================= */

"use strict";


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const AgriGuardApp = {

    currentSection: "dashboard",

    selectedFieldId: null,

    selectedImage: null,

    selectedImageURL: null,

    lastDiagnosis: null,

    lastRiskResult: null,

    lastWeatherResult: null,

    lastSoilResult: null,

    lastRecommendation: null,

    alerts: [],

    diagnosisHistory: [],

    initialized: false,


    config: {

        defaultLocation: "Andhra Pradesh",

        defaultCrop: "rice",

        maxImageSize:
            10 * 1024 * 1024,

        toastDuration: 4000
    }
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {

    return document.getElementById(id);
}


function query(selector) {

    return document.querySelector(
        selector
    );
}


function queryAll(selector) {

    return Array.from(
        document.querySelectorAll(selector)
    );
}


/* =========================================================
   SAFE VALUE HELPERS
   ========================================================= */

function numberValue(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function clamp(
    value,
    min = 0,
    max = 100
) {

    return Math.max(
        min,
        Math.min(
            max,
            numberValue(value)
        )
    );
}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DATE / TIME
   ========================================================= */

function updateCurrentDate() {

    const element =
        $("currentDate");


    if (!element) {
        return;
    }


    const now =
        new Date();


    element.textContent =
        now
            .toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            )
            .toUpperCase();
}


/* =========================================================
   TOAST SYSTEM
   ========================================================= */

function showToast(
    title = "Success",
    message = "",
    type = "success"
) {

    const toast =
        $("toast");

    const toastTitle =
        $("toastTitle");

    const toastMessage =
        $("toastMessage");

    const toastIcon =
        $("toastIcon");


    if (!toast) {
        return;
    }


    if (toastTitle) {

        toastTitle.textContent =
            title;
    }


    if (toastMessage) {

        toastMessage.textContent =
            message;
    }


    if (toastIcon) {

        const icons = {

            success: "✓",

            warning: "⚠",

            error: "×",

            info: "ℹ"
        };


        toastIcon.textContent =
            icons[type] ||
            icons.success;
    }


    toast.dataset.type =
        type;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toast._timeout
    );


    toast._timeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            AgriGuardApp.config.toastDuration
        );
}


function hideToast() {

    const toast =
        $("toast");


    if (!toast) {
        return;
    }


    toast.classList.remove(
        "show"
    );
}


/* =========================================================
   MODAL SYSTEM
   ========================================================= */

function openModal(
    title,
    content
) {

    const overlay =
        $("modalOverlay");

    const modalTitle =
        $("modalTitle");

    const modalContent =
        $("modalContent");


    if (!overlay) {
        return;
    }


    if (modalTitle) {

        modalTitle.textContent =
            title ||
            "Information";
    }


    if (modalContent) {

        modalContent.innerHTML =
            content ||
            "<p>No information available.</p>";
    }


    overlay.hidden =
        false;


    overlay.classList.add(
        "show"
    );


    document.body.classList.add(
        "modal-open"
    );
}


function closeModal() {

    const overlay =
        $("modalOverlay");


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "show"
    );


    overlay.hidden =
        true;


    document.body.classList.remove(
        "modal-open"
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

const pageTitles = {

    dashboard:
        "Farm Overview",

    diagnosis:
        "AI Crop Diagnosis",

    fields:
        "My Fields",

    analytics:
        "Crop Analytics",

    alerts:
        "Early Warning Center"
};


function navigateToSection(
    sectionName
) {

    if (!sectionName) {
        return;
    }


    const section =
        document.querySelector(
            `[data-page="${sectionName}"]`
        );


    if (!section) {

        console.warn(
            `Section "${sectionName}" was not found.`
        );

        return;
    }


    AgriGuardApp.currentSection =
        sectionName;


    queryAll(
        ".page-section"
    ).forEach(
        page => {

            page.classList.toggle(
                "active",
                page.dataset.page ===
                sectionName
            );
        }
    );


    queryAll(
        ".nav-item"
    ).forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.section ===
                sectionName
            );
        }
    );


    const title =
        $("pageTitle");


    if (title) {

        title.textContent =
            pageTitles[sectionName] ||
            "AgriGuard AI";
    }


    /*
     * Close mobile navigation.
     */

    const sidebar =
        $("sidebar");


    if (sidebar) {

        sidebar.classList.remove(
            "mobile-open"
        );
    }


    /*
     * Refresh section-specific content.
     */

    if (
        sectionName ===
        "dashboard"
    ) {

        refreshDashboard();
    }


    if (
        sectionName ===
        "fields"
    ) {

        renderFields();
        renderSelectedField();
    }


    if (
        sectionName ===
        "analytics"
    ) {

        refreshAnalytics();
    }


    if (
        sectionName ===
        "alerts"
    ) {

        renderAlerts();
    }


    /*
     * Allow charts to resize after
     * becoming visible.
     */

    setTimeout(
        () => {

            if (
                typeof resizeAllCharts ===
                "function"
            ) {

                resizeAllCharts();
            }

        },
        50
    );
}


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function toggleMobileSidebar() {

    const sidebar =
        $("sidebar");


    if (!sidebar) {
        return;
    }


    sidebar.classList.toggle(
        "mobile-open"
    );
}


/* =========================================================
   FIELD ENGINE ACCESS
   ========================================================= */

function getFieldEngine() {

    return (
        window.AgriGuardFieldEngine ||
        null
    );
}


function getAllFields() {

    const engine =
        getFieldEngine();


    if (
        engine &&
        typeof engine.getFields ===
        "function"
    ) {

        return engine.getFields();
    }


    return [];
}


/* =========================================================
   FIELD SELECTION
   ========================================================= */

function selectFieldFromUI(
    fieldId
) {

    const engine =
        getFieldEngine();


    if (!engine) {
        return null;
    }


    const field =
        engine.selectField(
            fieldId
        );


    if (!field) {
        return null;
    }


    AgriGuardApp.selectedFieldId =
        field.id;


    renderSelectedField();


    /*
     * Keep diagnosis field selector
     * synchronized.
     */

    const fieldSelect =
        $("fieldSelect");


    if (fieldSelect) {

        fieldSelect.value =
            field.id;
    }


    return field;
}


/* =========================================================
   RENDER FIELD CARDS
   ========================================================= */

function createFieldCard(
    field
) {

    const health =
        clamp(field.health);


    const risk =
        clamp(field.risk);


    let riskClass =
        "low";


    if (risk >= 75) {

        riskClass =
            "high";

    } else if (risk >= 50) {

        riskClass =
            "moderate";
    }


    return `
        <article
            class="field-card ${riskClass}"
            data-field-id="${escapeHTML(field.id)}"
        >

            <div class="field-card-header">

                <div>

                    <span class="field-card-kicker">
                        ${escapeHTML(field.stage)}
                    </span>

                    <h4>
                        ${escapeHTML(field.name)}
                    </h4>

                </div>

                <span class="field-status">
                    ${escapeHTML(field.status)}
                </span>

            </div>


            <div class="field-card-crop">

                <span>🌱</span>

                <strong>
                    ${escapeHTML(field.crop)}
                </strong>

            </div>


            <div class="field-card-metrics">

                <div>
                    <span>Health</span>
                    <strong>${health}%</strong>
                </div>

                <div>
                    <span>Risk</span>
                    <strong>${risk}%</strong>
                </div>

                <div>
                    <span>Moisture</span>
                    <strong>${clamp(field.moisture)}%</strong>
                </div>

            </div>


            <div class="progress-track">

                <div
                    class="progress-fill"
                    style="width:${health}%"
                ></div>

            </div>


            <div class="field-card-footer">

                <span>
                    ${numberValue(field.area).toFixed(1)}
                    acres
                </span>

                <button
                    class="text-button field-select-button"
                    data-field-id="${escapeHTML(field.id)}"
                    type="button"
                >
                    View details →
                </button>

            </div>

        </article>
    `;
}


function renderFields() {

    const container =
        $("fieldsGrid");


    if (!container) {
        return;
    }


    const fields =
        getAllFields();


    if (!fields.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌱</div>
                <h3>No fields added</h3>
                <p>
                    Add your first field to begin monitoring
                    crop health and disease risk.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        fields
            .map(
                field =>
                    createFieldCard(
                        field
                    )
            )
            .join("");


    /*
     * Field card interaction.
     */

    container
        .querySelectorAll(
            "[data-field-id]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    event => {

                        const button =
                            event.target.closest(
                                ".field-select-button"
                            );


                        const fieldId =
                            button?.dataset.fieldId ||
                            element.dataset.fieldId;


                        if (fieldId) {

                            selectFieldFromUI(
                                fieldId
                            );

                            navigateToSection(
                                "fields"
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   DASHBOARD FIELD LIST
   ========================================================= */

function renderDashboardFields() {

    const container =
        $("dashboardFieldList");


    if (!container) {
        return;
    }


    const engine =
        getFieldEngine();


    let fields =
        getAllFields();


    if (
        engine &&
        typeof engine.getDashboardFields ===
        "function"
    ) {

        fields =
            engine.getDashboardFields(
                5
            );
    }


    if (!fields.length) {

        container.innerHTML = `
            <div class="empty-state compact">
                <p>No field data available.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        fields
            .map(
                field => {

                    const risk =
                        clamp(
                            field.risk
                        );


                    let riskClass =
                        "low";


                    if (risk >= 75) {

                        riskClass =
                            "high";

                    } else if (
                        risk >= 50
                    ) {

                        riskClass =
                            "moderate";
                    }


                    return `
                        <button
                            class="field-row"
                            type="button"
                            data-field-id="${escapeHTML(field.id)}"
                        >

                            <span class="field-row-icon">
                                🌱
                            </span>

                            <span class="field-row-main">

                                <strong>
                                    ${escapeHTML(field.name)}
                                </strong>

                                <small>
                                    ${escapeHTML(field.crop)}
                                    ·
                                    ${escapeHTML(field.stage)}
                                </small>

                            </span>

                            <span class="field-row-health">
                                ${clamp(field.health)}%
                            </span>

                            <span
                                class="field-row-risk ${riskClass}"
                            >
                                ${risk}%
                            </span>

                        </button>
                    `;
                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-field-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectFieldFromUI(
                            button.dataset.fieldId
                        );

                        navigateToSection(
                            "fields"
                        );
                    }
                );
            }
        );
}


/* =========================================================
   SELECTED FIELD DETAILS
   ========================================================= */

function renderSelectedField() {

    const engine =
        getFieldEngine();


    if (!engine) {
        return;
    }


    let field =
        engine.getSelectedField();


    if (!field) {

        const fields =
            engine.getFields();


        if (fields.length) {

            field =
                engine.selectField(
                    fields[0].id
                );
        }
    }


    if (!field) {
        return;
    }


    AgriGuardApp.selectedFieldId =
        field.id;


    const values = {

        selectedFieldName:
            field.name,

        selectedFieldCrop:
            field.crop,

        selectedFieldArea:
            `${numberValue(field.area).toFixed(1)} acres`,

        selectedFieldStage:
            field.stage,

        selectedFieldHealth:
            `${clamp(field.health)}%`,

        selectedFieldRisk:
            `${clamp(field.risk)}%`,

        selectedFieldMoisture:
            `${clamp(field.moisture)}%`,

        fieldHealthPercent:
            `${clamp(field.health)}%`
    };


    Object.entries(
        values
    ).forEach(
        ([id, value]) => {

            const element =
                $(id);


            if (element) {

                element.textContent =
                    value;
            }
        }
    );


    const status =
        $("selectedFieldStatus");


    if (status) {

        status.textContent =
            field.status;
    }


    const healthBar =
        $("fieldHealthBar");


    if (healthBar) {

        healthBar.style.width =
            `${clamp(field.health)}%`;
    }
}


/* =========================================================
   WEATHER FORECAST
   ========================================================= */

function renderWeatherForecast(
    forecast = null
) {

    const container =
        $("weatherForecast");


    if (!container) {
        return;
    }


    let data =
        forecast;


    /*
     * Try weather engine.
     */

    if (!data) {

        const engine =
            window.AgriGuardWeatherEngine;


        if (
            engine &&
            typeof engine.getForecast ===
            "function"
        ) {

            try {

                data =
                    engine.getForecast(
                        5
                    );

            } catch (error) {

                console.warn(
                    "Could not retrieve forecast:",
                    error
                );
            }
        }
    }


    /*
     * Try data.js.
     */

    if (
        !data &&
        typeof AgriGuardData !==
        "undefined"
    ) {

        data =
            AgriGuardData.weatherForecast ||
            AgriGuardData.forecast ||
            null;
    }


    if (!Array.isArray(data)) {

        data = [
            {
                day: "Today",
                temperature: 29,
                humidity: 78,
                rainProbability: 42,
                icon: "🌦️"
            },
            {
                day: "Fri",
                temperature: 30,
                humidity: 76,
                rainProbability: 48,
                icon: "🌤️"
            },
            {
                day: "Sat",
                temperature: 28,
                humidity: 82,
                rainProbability: 64,
                icon: "🌧️"
            },
            {
                day: "Sun",
                temperature: 27,
                humidity: 85,
                rainProbability: 71,
                icon: "🌧️"
            },
            {
                day: "Mon",
                temperature: 29,
                humidity: 77,
                rainProbability: 45,
                icon: "🌤️"
            }
        ];
    }


    container.innerHTML =
        data
            .slice(0, 5)
            .map(
                item => {

                    const day =
                        item.day ||
                        item.date ||
                        "Day";


                    const temperature =
                        numberValue(
                            item.temperature ??
                            item.temp,
                            0
                        );


                    const rain =
                        numberValue(
                            item.rainProbability ??
                            item.rainChance ??
                            item.precipitationProbability,
                            0
                        );


                    return `
                        <div class="forecast-item">

                            <span class="forecast-day">
                                ${escapeHTML(day)}
                            </span>

                            <span class="forecast-icon">
                                ${item.icon || "🌤️"}
                            </span>

                            <strong>
                                ${temperature}°
                            </strong>

                            <small>
                                💧 ${clamp(rain)}%
                            </small>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   DASHBOARD KPI UPDATE
   ========================================================= */

function updateDashboardKPIs() {

    const fields =
        getAllFields();


    /*
     * Crop health.
     */

    let health = 86;

    let risk = 23;

    let moisture = 61;


    if (fields.length) {

        health =
            Math.round(
                fields.reduce(
                    (
                        sum,
                        field
                    ) =>
                        sum +
                        clamp(
                            field.health
                        ),
                    0
                ) /
                fields.length
            );


        risk =
            Math.round(
                fields.reduce(
                    (
                        sum,
                        field
                    ) =>
                        sum +
                        clamp(
                            field.risk
                        ),
                    0
                ) /
                fields.length
            );


        moisture =
            Math.round(
                fields.reduce(
                    (
                        sum,
                        field
                    ) =>
                        sum +
                        clamp(
                            field.moisture
                        ),
                    0
                ) /
                fields.length
            );
    }


    const healthValue =
        $("cropHealthValue");


    const healthProgress =
        $("cropHealthProgress");


    if (healthValue) {

        healthValue.textContent =
            health;
    }


    if (healthProgress) {

        healthProgress.style.width =
            `${health}%`;
    }


    const riskValue =
        $("diseaseRiskValue");


    const riskMeter =
        $("diseaseRiskMeter");


    if (riskValue) {

        riskValue.textContent =
            risk;
    }


    if (riskMeter) {

        riskMeter.style.width =
            `${risk}%`;
    }


    const moistureValue =
        $("soilMoistureValue");


    const moistureProgress =
        $("soilMoistureProgress");


    if (moistureValue) {

        moistureValue.textContent =
            moisture;
    }


    if (moistureProgress) {

        moistureProgress.style.width =
            `${moisture}%`;
    }


    /*
     * Current weather values.
     */

    if (
        AgriGuardApp.lastWeatherResult
    ) {

        updateWeatherKPIs(
            AgriGuardApp.lastWeatherResult
        );
    }
}


/* =========================================================
   WEATHER KPI UPDATE
   ========================================================= */

function updateWeatherKPIs(
    weather
) {

    if (!weather) {
        return;
    }


    const temperature =
        numberValue(
            weather.temperature ??
            weather.temp ??
            29
        );


    const humidity =
        clamp(
            weather.humidity ??
            78
        );


    const rainProbability =
        clamp(
            weather.rainProbability ??
            weather.rainChance ??
            42
        );


    const temperatureElement =
        $("temperatureValue");


    const humidityElement =
        $("humidityValue");


    const rainElement =
        $("rainProbabilityValue");


    if (temperatureElement) {

        temperatureElement.textContent =
            Math.round(
                temperature
            );
    }


    if (humidityElement) {

        humidityElement.textContent =
            Math.round(
                humidity
            );
    }


    if (rainElement) {

        rainElement.textContent =
            Math.round(
                rainProbability
            );
    }
}


/* =========================================================
   WEATHER ENGINE
   ========================================================= */

function getWeatherEngine() {

    return (
        window.AgriGuardWeatherEngine ||
        null
    );
}


function getCurrentWeather() {

    const engine =
        getWeatherEngine();


    if (!engine) {
        return null;
    }


    const methods = [
        "getCurrentWeather",
        "getCurrent",
        "getWeather",
        "getConditions"
    ];


    for (
        const method
        of methods
    ) {

        if (
            typeof engine[method] ===
            "function"
        ) {

            try {

                return engine[method]();

            } catch (error) {

                console.warn(
                    `Weather method ${method} failed:`,
                    error
                );
            }
        }
    }


    return null;
}


function initializeWeather() {

    const weather =
        getCurrentWeather();


    if (weather) {

        AgriGuardApp.lastWeatherResult =
            weather;

        updateWeatherKPIs(
            weather
        );
    }


    renderWeatherForecast();
}


/* =========================================================
   SOIL ENGINE
   ========================================================= */

function getSoilEngine() {

    return (
        window.AgriGuardSoilEngine ||
        null
    );
}


function getCurrentSoil() {

    const engine =
        getSoilEngine();


    if (!engine) {
        return null;
    }


    const methods = [
        "getCurrentSoil",
        "getCurrent",
        "getSoilHealth",
        "analyze"
    ];


    for (
        const method
        of methods
    ) {

        if (
            typeof engine[method] ===
            "function"
        ) {

            try {

                return engine[method]();

            } catch (error) {

                console.warn(
                    `Soil method ${method} failed:`,
                    error
                );
            }
        }
    }


    return null;
}


function initializeSoil() {

    const soil =
        getCurrentSoil();


    if (soil) {

        AgriGuardApp.lastSoilResult =
            soil;


        if (
            typeof updateSoilChart ===
            "function"
        ) {

            updateSoilChart(
                soil
            );
        }
    }
}


/* =========================================================
   DISEASE DETECTION ENGINE
   ========================================================= */

function getDiseaseEngine() {

    return (
        window.AgriGuardDiseaseDetection ||
        window.AgriGuardDiseaseEngine ||
        null
    );
}


/* =========================================================
   DISEASE IMAGE VALIDATION
   ========================================================= */

function validateImage(
    file
) {

    if (!file) {

        return {
            valid: false,
            message: "Please select a crop image."
        };
    }


    if (
        !file.type ||
        !file.type.startsWith(
            "image/"
        )
    ) {

        return {
            valid: false,
            message:
                "Please select a valid image file."
        };
    }


    if (
        file.size >
        AgriGuardApp.config.maxImageSize
    ) {

        return {
            valid: false,
            message:
                "Image size must be 10 MB or smaller."
        };
    }


    return {
        valid: true,
        message: ""
    };
}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

function showImagePreview(
    file
) {

    const preview =
        $("imagePreview");

    const placeholder =
        $("uploadPlaceholder");

    const image =
        $("previewImage");


    if (
        !preview ||
        !image
    ) {
        return;
    }


    if (
        AgriGuardApp.selectedImageURL
    ) {

        URL.revokeObjectURL(
            AgriGuardApp.selectedImageURL
        );
    }


    const url =
        URL.createObjectURL(
            file
        );


    AgriGuardApp.selectedImageURL =
        url;


    image.src =
        url;


    preview.hidden =
        false;


    if (placeholder) {

        placeholder.hidden =
            true;
    }
}


function clearImagePreview() {

    const preview =
        $("imagePreview");

    const placeholder =
        $("uploadPlaceholder");

    const image =
        $("previewImage");


    if (
        AgriGuardApp.selectedImageURL
    ) {

        URL.revokeObjectURL(
            AgriGuardApp.selectedImageURL
        );

        AgriGuardApp.selectedImageURL =
            null;
    }


    AgriGuardApp.selectedImage =
        null;


    if (image) {

        image.removeAttribute(
            "src"
        );
    }


    if (preview) {

        preview.hidden =
            true;
    }


    if (placeholder) {

        placeholder.hidden =
            false;
    }


    const input =
        $("cropImageInput");


    if (input) {

        input.value =
            "";
    }
}


/* =========================================================
   IMAGE FILE HANDLER
   ========================================================= */

function handleImageFile(
    file
) {

    const validation =
        validateImage(
            file
        );


    if (!validation.valid) {

        showToast(
            "Invalid Image",
            validation.message,
            "error"
        );

        return false;
    }


    AgriGuardApp.selectedImage =
        file;


    showImagePreview(
        file
    );


    showToast(
        "Image Ready",
        "Crop image is ready for AI analysis.",
        "success"
    );


    return true;
}


/* =========================================================
   DIAGNOSIS CONTEXT
   ========================================================= */

function getDiagnosisContext() {

    const cropSelect =
        $("cropSelect");

    const fieldSelect =
        $("fieldSelect");

    const growthStage =
        $("growthStage");

    const soilCondition =
        $("soilCondition");


    const field =
        getFieldEngine()
            ?.getField(
                fieldSelect?.value
            );


    return {

        crop:
            cropSelect?.value ||
            field?.crop ||
            "rice",

        fieldId:
            fieldSelect?.value ||
            field?.id ||
            null,

        field:
            field ||
            null,

        growthStage:
            growthStage?.value ||
            field?.stage ||
            "Vegetative",

        soilCondition:
            soilCondition?.value ||
            "Normal",

        weather:
            AgriGuardApp.lastWeatherResult,

        soil:
            AgriGuardApp.lastSoilResult
    };
}


/* =========================================================
   ENGINE METHOD RESOLVER
   ========================================================= */

function callEngineMethod(
    engine,
    methodNames,
    payload
) {

    if (!engine) {
        return null;
    }


    for (
        const methodName
        of methodNames
    ) {

        if (
            typeof engine[methodName] ===
            "function"
        ) {

            try {

                return engine[methodName](
                    payload
                );

            } catch (error) {

                console.warn(
                    `Engine method ${methodName} failed:`,
                    error
                );
            }
        }
    }


    return null;
}


/* =========================================================
   RUN DISEASE DETECTION
   ========================================================= */

async function runDiseaseDetection() {

    const file =
        AgriGuardApp.selectedImage;


    if (!file) {

        showToast(
            "Image Required",
            "Upload a crop image before starting diagnosis.",
            "warning"
        );

        return null;
    }


    const engine =
        getDiseaseEngine();


    if (!engine) {

        showToast(
            "AI Engine Unavailable",
            "The disease detection engine is not available.",
            "error"
        );

        return null;
    }


    const context =
        getDiagnosisContext();


    const payload = {

        image:
            file,

        file,

        crop:
            context.crop,

        field:
            context.field,

        fieldId:
            context.fieldId,

        growthStage:
            context.growthStage,

        soilCondition:
            context.soilCondition,

        weather:
            context.weather,

        soil:
            context.soil
    };


    /*
     * Support multiple engine API designs.
     */

    let result =
        callEngineMethod(
            engine,
            [
                "analyzeImage",
                "detectDisease",
                "analyze",
                "predict",
                "diagnose"
            ],
            payload
        );


    /*
     * Handle asynchronous engines.
     */

    if (
        result &&
        typeof result.then ===
        "function"
    ) {

        result =
            await result;
    }


    /*
     * If the engine returned nothing,
     * do not fabricate a diagnosis.
     */

    if (!result) {

        showToast(
            "Diagnosis Failed",
            "The AI engine did not return a diagnosis.",
            "error"
        );

        return null;
    }


    return result;
}


/* =========================================================
   NORMALIZE DIAGNOSIS RESULT
   ========================================================= */

function normalizeDiagnosisResult(
    result,
    context
) {

    const disease =
        result.disease ||
        result.diseaseName ||
        result.prediction ||
        result.label ||
        "Unknown";


    const confidence =
        clamp(
            result.confidence ??
            result.confidenceScore ??
            result.probability ??
            0
        );


    const severity =
        result.severity ||
        "Moderate";


    const risk =
        result.risk ||
        result.riskLevel ||
        (
            numberValue(
                result.riskScore,
                0
            ) >= 75
                ? "High"
                : numberValue(
                    result.riskScore,
                    0
                ) >= 50
                    ? "Moderate"
                    : "Low"
        );


    const riskScore =
        clamp(
            result.riskScore ??
            (
                risk === "High"
                    ? 80
                    : risk === "Moderate"
                        ? 55
                        : 25
            )
        );


    return {

        ...result,

        disease,

        diseaseName:
            disease,

        confidence,

        severity,

        risk,

        riskLevel:
            risk,

        riskScore,

        crop:
            result.crop ||
            context.crop,

        fieldId:
            result.fieldId ||
            context.fieldId,

        growthStage:
            result.growthStage ||
            context.growthStage,

        affectedArea:
            result.affectedArea ||
            result.area ||
            "Leaf",

        description:
            result.description ||
            "Disease indicators detected on the crop.",

        timestamp:
            result.timestamp ||
            new Date().toISOString()
    };
}


/* =========================================================
   DIAGNOSIS UI
   ========================================================= */

function renderDiagnosisResult(
    result
) {

    const resultPanel =
        $("diagnosisResult");


    if (!resultPanel) {
        return;
    }


    const disease =
        $("diagnosisDisease");


    const description =
        $("diagnosisDescription");


    const severity =
        $("diagnosisSeverity");


    const risk =
        $("diagnosisRisk");


    const area =
        $("diagnosisArea");


    const stage =
        $("diagnosisStage");


    const confidence =
        $("confidenceScore");


    if (disease) {

        disease.textContent =
            result.disease;
    }


    if (description) {

        description.textContent =
            result.description;
    }


    if (severity) {

        severity.textContent =
            result.severity;


        severity.className =
            `severity-${String(
                result.severity
            )
                .toLowerCase()
                .replace(/\s+/g, "-")}`;
    }


    if (risk) {

        risk.textContent =
            result.risk;


        risk.className =
            `risk-${String(
                result.risk
            )
                .toLowerCase()
                .replace(/\s+/g, "-")}`;
    }


    if (area) {

        area.textContent =
            result.affectedArea;
    }


    if (stage) {

        stage.textContent =
            result.growthStage;
    }


    if (confidence) {

        confidence.innerHTML =
            `<span>${Number(
                result.confidence
            ).toFixed(1)}%</span>`;


        confidence.style.setProperty(
            "--confidence",
            `${result.confidence}%`
        );
    }


    const timestamp =
        query(
            ".result-timestamp"
        );


    if (timestamp) {

        timestamp.textContent =
            "Just now";
    }


    resultPanel.hidden =
        false;


    resultPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   RECOMMENDATION ENGINE
   ========================================================= */

function getRecommendationEngine() {

    return (
        window.AgriGuardRecommendationEngine ||
        null
    );
}


async function generateRecommendation(
    diagnosis
) {

    const engine =
        getRecommendationEngine();


    if (!engine) {

        return {
            immediateActions: [],
            preventiveActions: [],
            treatmentActions: []
        };
    }


    const payload = {

        diagnosis,

        disease:
            diagnosis.disease,

        crop:
            diagnosis.crop,

        severity:
            diagnosis.severity,

        risk:
            diagnosis.risk,

        riskScore:
            diagnosis.riskScore,

        fieldId:
            diagnosis.fieldId,

        growthStage:
            diagnosis.growthStage,

        weather:
            AgriGuardApp.lastWeatherResult,

        soil:
            AgriGuardApp.lastSoilResult
    };


    let result =
        callEngineMethod(
            engine,
            [
                "generateRecommendations",
                "getRecommendations",
                "recommend",
                "generate"
            ],
            payload
        );


    if (
        result &&
        typeof result.then ===
        "function"
    ) {

        result =
            await result;
    }


    return result || {};
}


/* =========================================================
   RECOMMENDATION UI
   ========================================================= */

function renderList(
    elementId,
    items,
    fallback
) {

    const element =
        $(elementId);


    if (!element) {
        return;
    }


    const list =
        Array.isArray(items) &&
        items.length
            ? items
            : [fallback];


    element.innerHTML =
        list
            .map(
                item =>
                    `<li>${escapeHTML(item)}</li>`
            )
            .join("");
}


function renderRecommendation(
    recommendation
) {

    if (!recommendation) {
        return;
    }


    renderList(
        "immediateActions",
        recommendation.immediateActions ||
        recommendation.immediate ||
        recommendation.actions,
        "Inspect affected plants"
    );


    renderList(
        "preventiveActions",
        recommendation.preventiveActions ||
        recommendation.preventive ||
        recommendation.prevention,
        "Monitor field conditions regularly"
    );


    renderList(
        "treatmentActions",
        recommendation.treatmentActions ||
        recommendation.treatment ||
        recommendation.treatments,
        "Follow locally approved treatment recommendations"
    );


    const panel =
        $("recommendationPanel");


    if (panel) {

        panel.hidden =
            false;
    }
}


/* =========================================================
   RUN COMPLETE DIAGNOSIS PIPELINE
   ========================================================= */

async function runDiagnosis() {

    const button =
        $("diagnoseButton");


    if (
        button &&
        button.disabled
    ) {
        return;
    }


    if (!AgriGuardApp.selectedImage) {

        showToast(
            "Image Required",
            "Upload a crop image first.",
            "warning"
        );

        return;
    }


    if (button) {

        button.disabled =
            true;

        button.dataset.originalText =
            button.textContent;

        button.innerHTML =
            "<span>⟳</span> Analyzing...";
    }


    try {

        const context =
            getDiagnosisContext();


        /*
         * 1. Disease detection.
         */

        const rawDiagnosis =
            await runDiseaseDetection();


        if (!rawDiagnosis) {
            return;
        }


        const diagnosis =
            normalizeDiagnosisResult(
                rawDiagnosis,
                context
            );


        AgriGuardApp.lastDiagnosis =
            diagnosis;


        /*
         * 2. Risk engine.
         */

        const riskEngine =
            window.AgriGuardRiskEngine;


        if (riskEngine) {

            let riskResult =
                callEngineMethod(
                    riskEngine,
                    [
                        "calculateRisk",
                        "calculate",
                        "assessRisk",
                        "evaluate"
                    ],
                    {
                        ...diagnosis,

                        diagnosis,

                        weather:
                            AgriGuardApp.lastWeatherResult,

                        soil:
                            AgriGuardApp.lastSoilResult,

                        field:
                            context.field
                    }
                );


            if (
                riskResult &&
                typeof riskResult.then ===
                "function"
            ) {

                riskResult =
                    await riskResult;
            }


            if (riskResult) {

                AgriGuardApp.lastRiskResult =
                    riskResult;


                diagnosis.riskScore =
                    clamp(
                        riskResult.riskScore ??
                        riskResult.score ??
                        diagnosis.riskScore
                    );


                diagnosis.risk =
                    riskResult.riskLevel ??
                    riskResult.risk ??
                    diagnosis.risk;
            }
        }


        /*
         * 3. Update field with diagnosis.
         */

        const fieldEngine =
            getFieldEngine();


        if (
            fieldEngine &&
            diagnosis.fieldId &&
            typeof fieldEngine.updateFromDiagnosis ===
            "function"
        ) {

            fieldEngine.updateFromDiagnosis(
                diagnosis.fieldId,
                diagnosis
            );
        }


        /*
         * 4. Generate recommendations.
         */

        const recommendation =
            await generateRecommendation(
                diagnosis
            );


        AgriGuardApp.lastRecommendation =
            recommendation;


        /*
         * 5. Update UI.
         */

        renderDiagnosisResult(
            diagnosis
        );


        renderRecommendation(
            recommendation
        );


        /*
         * 6. Create alert if appropriate.
         */

        updateAlertsFromDiagnosis(
            diagnosis
        );


        /*
         * 7. Save diagnosis history.
         */

        addDiagnosisHistory(
            diagnosis
        );


        /*
         * 8. Update dashboard charts.
         */

        if (
            typeof updateRiskChartFromResult ===
            "function"
        ) {

            updateRiskChartFromResult(
                diagnosis
            );
        }


        /*
         * 9. Refresh field UI.
         */

        renderFields();

        renderSelectedField();

        renderDashboardFields();

        updateDashboardKPIs();


        showToast(
            "Diagnosis Complete",
            `${diagnosis.disease} detected with ${Number(
                diagnosis.confidence
            ).toFixed(1)}% confidence.`,
            "success"
        );

    } catch (error) {

        console.error(
            "Diagnosis pipeline failed:",
            error
        );


        showToast(
            "Diagnosis Error",
            "Unable to complete the crop diagnosis.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                button.dataset.originalText ||
                "<span>✦</span> Analyze Crop with AI";
        }
    }
}


/* =========================================================
   DIAGNOSIS HISTORY
   ========================================================= */

function loadDiagnosisHistory() {

    let history = [];


    if (
        typeof AgriGuardData !==
        "undefined"
    ) {

        history =
            AgriGuardData.diagnosisHistory ||
            AgriGuardData.history ||
            [];
    }


    if (
        !Array.isArray(history)
    ) {

        history = [];
    }


    AgriGuardApp.diagnosisHistory =
        [...history];


    renderDiagnosisHistory();
}


function addDiagnosisHistory(
    diagnosis
) {

    if (!diagnosis) {
        return;
    }


    const field =
        getFieldEngine()
            ?.getField(
                diagnosis.fieldId
            );


    AgriGuardApp.diagnosisHistory.unshift({

        date:
            new Date()
                .toLocaleDateString(
                    "en-IN"
                ),

        field:
            field?.name ||
            diagnosis.fieldId ||
            "Unknown Field",

        crop:
            diagnosis.crop ||
            "Unknown",

        disease:
            diagnosis.disease ||
            "Unknown",

        confidence:
            diagnosis.confidence,

        risk:
            diagnosis.risk
    });


    /*
     * Keep browser memory bounded.
     */

    if (
        AgriGuardApp.diagnosisHistory.length >
        100
    ) {

        AgriGuardApp.diagnosisHistory =
            AgriGuardApp.diagnosisHistory.slice(
                0,
                100
            );
    }


    renderDiagnosisHistory();
}


function renderDiagnosisHistory() {

    const tbody =
        $("diagnosisHistoryTable");


    if (!tbody) {
        return;
    }


    const history =
        AgriGuardApp.diagnosisHistory;


    if (!history.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    No diagnosis history available.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        history
            .slice(0, 20)
            .map(
                item => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                item.date
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.field
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.crop
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.disease
                            )}
                        </td>

                        <td>
                            ${numberValue(
                                item.confidence
                            ).toFixed(1)}%
                        </td>

                        <td>
                            ${escapeHTML(
                                item.risk
                            )}
                        </td>

                    </tr>
                `
            )
            .join("");
}


/* =========================================================
   ALERT ENGINE
   ========================================================= */

function getAlertEngine() {

    return (
        window.AgriGuardAlertEngine ||
        null
    );
}


function loadAlerts() {

    const engine =
        getAlertEngine();


    if (
        engine &&
        typeof engine.getAlerts ===
        "function"
    ) {

        try {

            const alerts =
                engine.getAlerts();


            if (Array.isArray(alerts)) {

                AgriGuardApp.alerts =
                    alerts;

                renderAlerts();

                updateAlertCounts();

                return;
            }

        } catch (error) {

            console.warn(
                "Could not load alerts:",
                error
            );
        }
    }


    if (
        typeof AgriGuardData !==
        "undefined"
    ) {

        const alerts =
            AgriGuardData.alerts ||
            AgriGuardData.earlyWarnings ||
            [];


        if (Array.isArray(alerts)) {

            AgriGuardApp.alerts =
                alerts;
        }
    }


    renderAlerts();

    updateAlertCounts();
}


function updateAlertsFromDiagnosis(
    diagnosis
) {

    if (!diagnosis) {
        return;
    }


    const riskScore =
        clamp(
            diagnosis.riskScore
        );


    if (riskScore < 50) {
        return;
    }


    const field =
        getFieldEngine()
            ?.getField(
                diagnosis.fieldId
            );


    const alert = {

        id:
            `diagnosis-${Date.now()}`,

        severity:
            riskScore >= 75
                ? "High"
                : "Moderate",

        title:
            `${diagnosis.disease} risk detected`,

        message:
            `${field?.name || "Selected field"} requires attention.`,

        field:
            field?.name ||
            diagnosis.fieldId ||
            "Unknown Field",

        crop:
            diagnosis.crop,

        risk:
            riskScore,

        timestamp:
            new Date().toISOString(),

        status:
            "active"
    };


    AgriGuardApp.alerts.unshift(
        alert
    );


    /*
     * Avoid unlimited alert growth.
     */

    if (
        AgriGuardApp.alerts.length >
        50
    ) {

        AgriGuardApp.alerts =
            AgriGuardApp.alerts.slice(
                0,
                50
            );
    }


    renderAlerts();

    updateAlertCounts();
}


function renderAlerts() {

    const container =
        $("alertsList");


    if (!container) {
        return;
    }


    const alerts =
        AgriGuardApp.alerts
            .filter(
                alert =>
                    alert.status !==
                    "resolved"
            );


    if (!alerts.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    ✓
                </div>

                <h3>
                    No active warnings
                </h3>

                <p>
                    Your monitored fields currently
                    have no active alerts.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        alerts
            .map(
                alert => {

                    const severity =
                        String(
                            alert.severity ||
                            "Moderate"
                        );


                    const risk =
                        clamp(
                            alert.risk ??
                            alert.riskScore ??
                            0
                        );


                    return `
                        <article
                            class="alert-card ${severity
                                .toLowerCase()} "
                            data-alert-id="${escapeHTML(
                                alert.id ||
                                ""
                            )}"
                        >

                            <div class="alert-card-icon">
                                ⚠
                            </div>

                            <div class="alert-card-content">

                                <div class="alert-card-header">

                                    <span class="severity-label">
                                        ${escapeHTML(
                                            severity
                                        )} RISK
                                    </span>

                                    <small>
                                        ${escapeHTML(
                                            alert.field ||
                                            "Field"
                                        )}
                                    </small>

                                </div>

                                <h3>
                                    ${escapeHTML(
                                        alert.title ||
                                        "Crop Risk Warning"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        alert.message ||
                                        "Changing field conditions require attention."
                                    )}
                                </p>

                                <div class="alert-card-metrics">

                                    <span>
                                        Risk:
                                        <strong>
                                            ${risk}%
                                        </strong>
                                    </span>

                                    <span>
                                        Crop:
                                        <strong>
                                            ${escapeHTML(
                                                alert.crop ||
                                                "—"
                                            )}
                                        </strong>
                                    </span>

                                </div>

                            </div>

                        </article>
                    `;
                }
            )
            .join("");
}


function updateAlertCounts() {

    const activeAlerts =
        AgriGuardApp.alerts
            .filter(
                alert =>
                    alert.status !==
                    "resolved"
            );


    const count =
        activeAlerts.length;


    const sidebarCount =
        $("sidebarAlertCount");


    const notificationCount =
        $("notificationCount");


    const activeAlertCount =
        $("activeAlertCount");


    if (sidebarCount) {

        sidebarCount.textContent =
            count;
    }


    if (notificationCount) {

        notificationCount.textContent =
            count;
    }


    if (activeAlertCount) {

        activeAlertCount.textContent =
            count;
    }


    const warningCount =
        query(
            ".warning-count"
        );


    if (warningCount) {

        warningCount.textContent =
            count;
    }
}


/* =========================================================
   ANALYTICS
   ========================================================= */

function refreshAnalytics() {

    renderDiagnosisHistory();


    /*
     * Update field health/risk chart
     * using current field engine data.
     */

    const engine =
        getFieldEngine();


    if (!engine) {
        return;
    }


    if (
        typeof createFieldRiskChart ===
        "function"
    ) {

        const riskData =
            engine.getRiskChartData?.();


        if (riskData) {

            createFieldRiskChart(
                "fieldRiskChart",
                riskData
            );
        }
    }


    if (
        typeof createFieldHealthChart ===
        "function"
    ) {

        const healthData =
            engine.getHealthChartData?.();


        if (healthData) {

            createFieldHealthChart(
                "fieldHealthChart",
                healthData
            );
        }
    }
}


/* =========================================================
   DASHBOARD REFRESH
   ========================================================= */

function refreshDashboard() {

    renderDashboardFields();

    renderWeatherForecast();

    updateDashboardKPIs();

    updateAlertCounts();
}


/* =========================================================
   CHART INITIALIZATION
   ========================================================= */

function initializeCharts() {

    if (
        typeof initializeDashboardCharts !==
        "function"
    ) {

        console.warn(
            "Chart initialization function is unavailable."
        );

        return;
    }


    try {

        initializeDashboardCharts();

    } catch (error) {

        console.error(
            "Could not initialize charts:",
            error
        );
    }
}


/* =========================================================
   ADD FIELD
   ========================================================= */

function handleAddField() {

    const engine =
        getFieldEngine();


    if (!engine) {

        showToast(
            "Field Engine Unavailable",
            "Field management is not available.",
            "error"
        );

        return;
    }


    openModal(
        "Add New Field",
        `
            <form
                id="addFieldForm"
                class="modal-form"
            >

                <div class="form-group">

                    <label for="newFieldName">
                        Field Name
                    </label>

                    <input
                        id="newFieldName"
                        class="input-control"
                        type="text"
                        placeholder="Field E"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="newFieldCrop">
                        Crop
                    </label>

                    <select
                        id="newFieldCrop"
                        class="input-control"
                    >

                        <option value="Rice">
                            Rice
                        </option>

                        <option value="Cotton">
                            Cotton
                        </option>

                        <option value="Chilli">
                            Chilli
                        </option>

                        <option value="Tomato">
                            Tomato
                        </option>

                        <option value="Maize">
                            Maize
                        </option>

                        <option value="Groundnut">
                            Groundnut
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label for="newFieldArea">
                        Area (acres)
                    </label>

                    <input
                        id="newFieldArea"
                        class="input-control"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value="2"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="newFieldStage">
                        Growth Stage
                    </label>

                    <select
                        id="newFieldStage"
                        class="input-control"
                    >

                        <option>
                            Seedling
                        </option>

                        <option selected>
                            Vegetative
                        </option>

                        <option>
                            Flowering
                        </option>

                        <option>
                            Fruiting
                        </option>

                        <option>
                            Maturity
                        </option>

                    </select>

                </div>


                <button
                    class="primary-button full-width"
                    type="submit"
                >
                    Add Field
                </button>

            </form>
        `
    );


    const form =
        $("addFieldForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                $("newFieldName")
                    ?.value
                    .trim();


            const crop =
                $("newFieldCrop")
                    ?.value ||
                "Rice";


            const area =
                numberValue(
                    $("newFieldArea")
                        ?.value,
                    1
                );


            const stage =
                $("newFieldStage")
                    ?.value ||
                "Vegetative";


            if (!name) {

                showToast(
                    "Field Name Required",
                    "Enter a name for the field.",
                    "warning"
                );

                return;
            }


            const field =
                engine.addField({

                    name,

                    crop,

                    area,

                    stage,

                    health: 80,

                    risk: 20,

                    moisture: 60,

                    location:
                        $("locationName")
                            ?.textContent ||
                        "Andhra Pradesh"
                });


            if (field) {

                engine.selectField(
                    field.id
                );


                AgriGuardApp.selectedFieldId =
                    field.id;


                closeModal();


                renderFields();

                renderSelectedField();

                renderDashboardFields();

                updateDashboardKPIs();


                showToast(
                    "Field Added",
                    `${field.name} has been added successfully.`,
                    "success"
                );
            }
        }
    );
}


/* =========================================================
   LOCATION
   ========================================================= */

function handleLocationButton() {

    openModal(
        "Farm Location",
        `
            <p>
                Current monitoring region:
            </p>

            <strong>
                Andhra Pradesh, India
            </strong>

            <p style="margin-top:12px;">
                Weather and field intelligence can be
                associated with this monitoring location.
            </p>
        `
    );
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function handleNotifications() {

    if (
        AgriGuardApp.alerts.length
    ) {

        navigateToSection(
            "alerts"
        );

        return;
    }


    showToast(
        "No Alerts",
        "There are currently no active notifications.",
        "info"
    );
}


/* =========================================================
   HELP
   ========================================================= */

function handleHelp() {

    openModal(
        "AgriGuard AI Help",
        `
            <h4>
                How AgriGuard AI works
            </h4>

            <p>
                Upload a crop image to begin an AI-assisted
                disease diagnosis.
            </p>

            <p>
                The system can combine visual diagnosis with
                crop stage, soil conditions, weather and field
                information to assess disease risk.
            </p>

            <p>
                Use <strong>My Fields</strong> to monitor
                individual fields, <strong>Analytics</strong>
                to review trends, and <strong>Early Warnings</strong>
                to inspect active risks.
            </p>

            <div class="recommendation-note">
                <span>💡</span>

                <p>
                    Treatment recommendations are decision-support
                    guidance. Follow local agricultural authority
                    guidance and product-label instructions.
                </p>
            </div>
        `
    );
}


/* =========================================================
   ACTION ROUTER
   ========================================================= */

function handleAction(
    action
) {

    switch (action) {

        case "open-diagnosis":

            navigateToSection(
                "diagnosis"
            );

            break;


        case "open-alerts":

            navigateToSection(
                "alerts"
            );

            break;


        case "open-fields":

            navigateToSection(
                "fields"
            );

            break;


        case "open-diagnosis-recommendation":

            const recommendationPanel =
                $("recommendationPanel");


            if (recommendationPanel) {

                recommendationPanel.hidden =
                    false;


                recommendationPanel.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

            break;


        default:

            console.warn(
                `Unknown action: ${action}`
            );
    }
}


/* =========================================================
   EVENT BINDINGS
   ========================================================= */

function bindNavigationEvents() {

    queryAll(
        ".nav-item"
    ).forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    navigateToSection(
                        item.dataset.section
                    );
                }
            );
        }
    );


    queryAll(
        "[data-action]"
    ).forEach(
        element => {

            element.addEventListener(
                "click",
                () => {

                    handleAction(
                        element.dataset.action
                    );
                }
            );
        }
    );
}


function bindUploadEvents() {

    const zone =
        $("uploadZone");

    const input =
        $("cropImageInput");

    const removeButton =
        $("removeImageButton");


    if (!zone || !input) {
        return;
    }


    zone.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "#removeImageButton"
                )
            ) {
                return;
            }


            input.click();
        }
    );


    zone.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter" ||
                event.key ===
                " "
            ) {

                event.preventDefault();

                input.click();
            }
        }
    );


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];


            if (file) {

                handleImageFile(
                    file
                );
            }
        }
    );


    zone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            zone.classList.add(
                "dragover"
            );
        }
    );


    zone.addEventListener(
        "dragleave",
        () => {

            zone.classList.remove(
                "dragover"
            );
        }
    );


    zone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            zone.classList.remove(
                "dragover"
            );


            const file =
                event.dataTransfer
                    ?.files?.[0];


            if (file) {

                handleImageFile(
                    file
                );
            }
        }
    );


    if (removeButton) {

        removeButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                clearImagePreview();
            }
        );
    }
}


function bindUIEvents() {

    const menuButton =
        $("mobileMenuButton");


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            toggleMobileSidebar
        );
    }


    const locationButton =
        $("locationButton");


    if (locationButton) {

        locationButton.addEventListener(
            "click",
            handleLocationButton
        );
    }


    const notificationButton =
        $("notificationButton");


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            handleNotifications
        );
    }


    const helpButton =
        $("helpButton");


    if (helpButton) {

        helpButton.addEventListener(
            "click",
            handleHelp
        );
    }


    const toastClose =
        $("toastClose");


    if (toastClose) {

        toastClose.addEventListener(
            "click",
            hideToast
        );
    }


    const modalClose =
        $("modalClose");


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closeModal
        );
    }


    const modalOverlay =
        $("modalOverlay");


    if (modalOverlay) {

        modalOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modalOverlay
                ) {

                    closeModal();
                }
            }
        );
    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();

                hideToast();
            }
        }
    );


    const diagnoseButton =
        $("diagnoseButton");


    if (diagnoseButton) {

        diagnoseButton.addEventListener(
            "click",
            runDiagnosis
        );
    }


    const addFieldButton =
        $("addFieldButton");


    if (addFieldButton) {

        addFieldButton.addEventListener(
            "click",
            handleAddField
        );
    }


    const riskRange =
        $("riskChartRange");


    if (riskRange) {

        riskRange.addEventListener(
            "change",
            () => {

                /*
                 * The current frontend chart uses
                 * its available dataset. If data.js
                 * supplies historical ranges, rebuild
                 * the chart using those values.
                 */

                const range =
                    Number(
                        riskRange.value
                    );


                if (
                    typeof createRiskTrendChart !==
                    "function"
                ) {
                    return;
                }


                let riskData = null;


                if (
                    typeof AgriGuardData !==
                    "undefined"
                ) {

                    const source =
                        AgriGuardData.riskTrend ||
                        AgriGuardData.riskHistory;


                    if (
                        source &&
                        source[String(range)]
                    ) {

                        riskData =
                            source[String(range)];
                    }
                }


                if (riskData) {

                    createRiskTrendChart(
                        "riskTrendChart",
                        riskData
                    );
                }
            }
        );
    }


    /*
     * Crop selector can synchronize the field.
     */

    const cropSelect =
        $("cropSelect");


    const fieldSelect =
        $("fieldSelect");


    if (fieldSelect) {

        fieldSelect.addEventListener(
            "change",
            () => {

                const fieldId =
                    fieldSelect.value;


                const field =
                    selectFieldFromUI(
                        fieldId
                    );


                if (
                    field &&
                    cropSelect
                ) {

                    const crop =
                        String(
                            field.crop
                        )
                            .toLowerCase();


                    const option =
                        Array.from(
                            cropSelect.options
                        )
                            .find(
                                item =>
                                    item.value
                                        .toLowerCase() ===
                                    crop
                            );


                    if (option) {

                        cropSelect.value =
                            option.value;
                    }
                }
            }
        );
    }
}


/* =========================================================
   INITIALIZE FIELD SELECTOR
   ========================================================= */

function populateFieldSelector() {

    const select =
        $("fieldSelect");


    if (!select) {
        return;
    }


    const fields =
        getAllFields();


    if (!fields.length) {
        return;
    }


    select.innerHTML =
        fields
            .map(
                field => `
                    <option
                        value="${escapeHTML(field.id)}"
                    >
                        ${escapeHTML(field.name)}
                        —
                        ${escapeHTML(field.crop)}
                    </option>
                `
            )
            .join("");


    const selected =
        AgriGuardApp.selectedFieldId;


    if (selected) {

        select.value =
            selected;
    }
}


/* =========================================================
   SYNCHRONIZE ENGINES
   ========================================================= */

function synchronizeEngines() {

    const fieldEngine =
        getFieldEngine();


    const selectedField =
        fieldEngine
            ?.getSelectedField();


    if (
        selectedField
    ) {

        AgriGuardApp.selectedFieldId =
            selectedField.id;
    }


    /*
     * Apply current weather to selected field
     * when supported by the field engine.
     */

    if (
        selectedField &&
        AgriGuardApp.lastWeatherResult &&
        typeof fieldEngine.updateFromWeather ===
        "function"
    ) {

        try {

            fieldEngine.updateFromWeather(
                selectedField.id,
                AgriGuardApp.lastWeatherResult
            );

        } catch (error) {

            console.warn(
                "Field/weather synchronization failed:",
                error
            );
        }
    }


    /*
     * Apply current soil result.
     */

    if (
        selectedField &&
        AgriGuardApp.lastSoilResult &&
        typeof fieldEngine.updateFromSoil ===
        "function"
    ) {

        try {

            fieldEngine.updateFromSoil(
                selectedField.id,
                AgriGuardApp.lastSoilResult
            );

        } catch (error) {

            console.warn(
                "Field/soil synchronization failed:",
                error
            );
        }
    }
}


/* =========================================================
   APPLICATION INITIALIZATION
   ========================================================= */

async function initializeApplication() {

    if (
        AgriGuardApp.initialized
    ) {
        return;
    }


    try {

        /*
         * Date.
         */

        updateCurrentDate();


        /*
         * Field engine.
         */

        const fieldEngine =
            getFieldEngine();


        if (
            fieldEngine &&
            !fieldEngine.initialized
        ) {

            fieldEngine.initialize();
        }


        /*
         * Select first field if necessary.
         */

        const fields =
            getAllFields();


        if (
            fields.length &&
            !AgriGuardApp.selectedFieldId
        ) {

            const selected =
                fieldEngine
                    ?.getSelectedField();


            if (selected) {

                AgriGuardApp.selectedFieldId =
                    selected.id;

            } else {

                AgriGuardApp.selectedFieldId =
                    fields[0].id;
            }
        }


        if (
            fieldEngine &&
            AgriGuardApp.selectedFieldId
        ) {

            fieldEngine.selectField(
                AgriGuardApp.selectedFieldId
            );
        }


        /*
         * Populate field UI.
         */

        populateFieldSelector();

        renderFields();

        renderSelectedField();

        renderDashboardFields();


        /*
         * Weather and soil.
         */

        initializeWeather();

        initializeSoil();


        /*
         * Diagnosis history.
         */

        loadDiagnosisHistory();


        /*
         * Alerts.
         */

        loadAlerts();


        /*
         * Charts.
         */

        initializeCharts();


        /*
         * Dashboard KPIs.
         */

        updateDashboardKPIs();


        /*
         * Synchronize available engine state.
         */

        synchronizeEngines();


        /*
         * Event handlers.
         */

        bindNavigationEvents();

        bindUploadEvents();

        bindUIEvents();


        /*
         * Start on dashboard.
         */

        navigateToSection(
            "dashboard"
        );


        AgriGuardApp.initialized =
            true;


        console.info(
            "AgriGuard AI initialized successfully."
        );

    } catch (error) {

        console.error(
            "AgriGuard AI initialization failed:",
            error
        );


        showToast(
            "Initialization Error",
            "Some application features could not be initialized.",
            "warning"
        );
    }
}


/* =========================================================
   GLOBAL REFRESH
   ========================================================= */

function refreshAgriGuardApp() {

    try {

        refreshDashboard();

        renderFields();

        renderSelectedField();

        renderAlerts();

        refreshAnalytics();

    } catch (error) {

        console.error(
            "Application refresh failed:",
            error
        );
    }
}


/* =========================================================
   ENGINE EVENT LISTENERS
   ========================================================= */

window.addEventListener(
    "field:selected",
    event => {

        const field =
            event.detail;


        if (!field) {
            return;
        }


        AgriGuardApp.selectedFieldId =
            field.id;


        renderSelectedField();

        populateFieldSelector();

        refreshDashboard();
    }
);


window.addEventListener(
    "field:added",
    () => {

        populateFieldSelector();

        renderFields();

        renderDashboardFields();

        updateDashboardKPIs();
    }
);


window.addEventListener(
    "field:updated",
    () => {

        renderFields();

        renderSelectedField();

        renderDashboardFields();

        updateDashboardKPIs();
    }
);


window.addEventListener(
    "field:removed",
    () => {

        populateFieldSelector();

        renderFields();

        renderSelectedField();

        renderDashboardFields();

        updateDashboardKPIs();
    }
);


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * A small delay ensures that every dependency
         * loaded before app.js has completed initialization.
         */

        setTimeout(
            initializeApplication,
            50
        );
    }
);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.AgriGuardApp =
    AgriGuardApp;

window.navigateToSection =
    navigateToSection;

window.showToast =
    showToast;

window.hideToast =
    hideToast;

window.openModal =
    openModal;

window.closeModal =
    closeModal;

window.runDiagnosis =
    runDiagnosis;

window.handleImageFile =
    handleImageFile;

window.clearImagePreview =
    clearImagePreview;

window.renderFields =
    renderFields;

window.renderSelectedField =
    renderSelectedField;

window.renderDashboardFields =
    renderDashboardFields;

window.renderAlerts =
    renderAlerts;

window.refreshDashboard =
    refreshDashboard;

window.refreshAnalytics =
    refreshAnalytics;

window.refreshAgriGuardApp =
    refreshAgriGuardApp;

window.updateDashboardKPIs =
    updateDashboardKPIs;

window.initializeApplication =
    initializeApplication;
```
