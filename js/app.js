/* ============================================================
   AGRIGUARD AI
   SIH 2026 PROTOTYPE
   MAIN APPLICATION CONTROLLER
============================================================ */

/*
    MODULE LOAD ORDER EXPECTED IN index.html

    1. js/data.js
    2. js/modules/diseaseDetection.js
    3. js/modules/riskEngine.js
    4. js/modules/weatherEngine.js
    5. js/modules/soilEngine.js
    6. js/modules/recommendationEngine.js
    7. js/modules/alertEngine.js
    8. js/modules/fieldEngine.js
    9. js/charts.js
   10. js/app.js

    app.js is intentionally the final controller.
*/


/* ============================================================
   01. GLOBAL APPLICATION STATE
============================================================ */

const AGRIGUARD_APP = {

    version:
        "1.0.0",

    initialized:
        false,

    demoMode:
        true,

    currentImage:
        null,

    currentImageData:
        null,

    lastDetection:
        null,

    lastRisk:
        null,

    lastWeather:
        null,

    lastSoil:
        null,

    lastRecommendation:
        null,

    lastAlerts:
        [],

    lastDashboard:
        null,

    isProcessing:
        false,

    elements:
        {},

    settings: {

        autoRefresh:
            false,

        refreshInterval:
            300000,

        language:
            "en"
    }
};


/* ============================================================
   02. DOM HELPERS
============================================================ */

function $(selector) {

    return document.querySelector(
        selector
    );
}


function $$(selector) {

    return Array.from(
        document.querySelectorAll(
            selector
        )
    );
}


function getElement(
    ...selectors
) {

    for (
        const selector of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (
            element
        ) {

            return element;

        }
    }


    return null;
}


/* ============================================================
   03. SAFE VALUE HELPERS
============================================================ */

function appNumber(
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


function appClamp(
    value,
    min = 0,
    max = 100
) {

    return Math.min(
        max,
        Math.max(
            min,
            appNumber(
                value
            )
        )
    );
}


function appText(
    value,
    fallback = ""
) {

    if (
        value ===
        null ||
        value ===
        undefined
    ) {

        return fallback;

    }


    return String(
        value
    );
}


/* ============================================================
   04. HTML ESCAPE
============================================================ */

function escapeHTML(
    value
) {

    return appText(
        value
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


/* ============================================================
   05. FORMATTERS
============================================================ */

function formatNumber(
    value,
    decimals = 0
) {

    const number =
        appNumber(
            value
        );


    return number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits:
                decimals,

            maximumFractionDigits:
                decimals
        }
    );
}


function formatDate(
    value
) {

    if (
        !value
    ) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}


function formatRelativeTime(
    value
) {

    if (
        !value
    ) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    const difference =
        Date.now() -
        date.getTime();


    const minutes =
        Math.floor(
            difference /
            60000
        );


    if (
        minutes <
        1
    ) {

        return "Just now";

    }


    if (
        minutes <
        60
    ) {

        return `${minutes} min ago`;

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    if (
        hours <
        24
    ) {

        return `${hours} hr ago`;

    }


    const days =
        Math.floor(
            hours /
            24
        );


    return `${days} day${days > 1 ? "s" : ""} ago`;
}


/* ============================================================
   06. ELEMENT CACHE
============================================================ */

function cacheElements() {

    AGRIGUARD_APP.elements = {

        /*
            Navigation
        */

        nav:
            $$(
                "[data-section], [data-page], .nav-link"
            ),

        sections:
            $$(
                "section[id], .page-section, .dashboard-section"
            ),


        /*
            Image upload
        */

        imageInput:
            getElement(
                "#imageInput",
                "#cropImage",
                "#diseaseImage",
                "input[type='file']"
            ),

        uploadArea:
            getElement(
                "#uploadArea",
                ".upload-area",
                ".drop-zone"
            ),

        imagePreview:
            getElement(
                "#imagePreview",
                ".image-preview"
            ),

        previewImage:
            getElement(
                "#previewImage",
                ".preview-image",
                "#uploadedImage"
            ),


        /*
            Detection
        */

        detectButton:
            getElement(
                "#detectButton",
                "#analyzeButton",
                "#analyzeBtn",
                "[data-action='detect']"
            ),

        detectionResult:
            getElement(
                "#detectionResult",
                "#diseaseResult",
                ".detection-result"
            ),


        /*
            Dashboard values
        */

        healthScore:
            getElement(
                "#healthScore",
                "[data-field='health-score']"
            ),

        healthStatus:
            getElement(
                "#healthStatus",
                "[data-field='health-status']"
            ),

        riskScore:
            getElement(
                "#riskScore",
                "[data-field='risk-score']"
            ),

        riskStatus:
            getElement(
                "#riskStatus",
                "[data-field='risk-status']"
            ),

        cropName:
            getElement(
                "#cropName",
                "[data-field='crop']"
            ),

        cropStage:
            getElement(
                "#cropStage",
                "[data-field='crop-stage']"
            ),

        fieldName:
            getElement(
                "#fieldName",
                "[data-field='field-name']"
            ),

        fieldArea:
            getElement(
                "#fieldArea",
                "[data-field='field-area']"
            ),

        location:
            getElement(
                "#fieldLocation",
                "[data-field='location']"
            ),


        /*
            Soil
        */

        soilMoisture:
            getElement(
                "#soilMoisture",
                "[data-soil='moisture']"
            ),

        soilPH:
            getElement(
                "#soilPH",
                "[data-soil='ph']"
            ),

        soilFertility:
            getElement(
                "#soilFertility",
                "[data-soil='fertility']"
            ),


        /*
            Weather
        */

        temperature:
            getElement(
                "#temperature",
                "[data-weather='temperature']"
            ),

        humidity:
            getElement(
                "#humidity",
                "[data-weather='humidity']"
            ),

        rainfall:
            getElement(
                "#rainfall",
                "[data-weather='rainfall']"
            ),


        /*
            Irrigation
        */

        irrigationStatus:
            getElement(
                "#irrigationStatus",
                "[data-irrigation='status']"
            ),

        irrigationAdvice:
            getElement(
                "#irrigationAdvice",
                "[data-irrigation='advice']"
            ),


        /*
            Alerts
        */

        alertsContainer:
            getElement(
                "#alertsContainer",
                "#alertsList",
                ".alerts-container"
            ),

        alertCount:
            getElement(
                "#alertCount",
                "[data-alert-count]"
            ),


        /*
            Recommendations
        */

        recommendationsContainer:
            getElement(
                "#recommendationsContainer",
                "#recommendationsList",
                ".recommendations-container"
            ),


        /*
            Zones
        */

        zonesContainer:
            getElement(
                "#zonesContainer",
                "#fieldZones",
                ".zones-container"
            ),

        priorityZone:
            getElement(
                "#priorityZone",
                "[data-field='priority-zone']"
            ),


        /*
            Scouting
        */

        scoutingContainer:
            getElement(
                "#scoutingContainer",
                "#scoutingList",
                ".scouting-container"
            ),


        /*
            Timeline
        */

        timelineContainer:
            getElement(
                "#timelineContainer",
                "#timeline",
                ".timeline-container"
            ),


        /*
            Loading
        */

        loading:
            getElement(
                "#loading",
                "#loader",
                ".loading"
            ),

        status:
            getElement(
                "#appStatus",
                "#statusMessage",
                ".app-status"
            ),


        /*
            Demo
        */

        demoButton:
            getElement(
                "#demoButton",
                "#loadDemo",
                "[data-action='demo']"
            ),


        /*
            Reset
        */

        resetButton:
            getElement(
                "#resetButton",
                "#resetApp",
                "[data-action='reset']"
            )
    };
}


/* ============================================================
   07. UI STATUS
============================================================ */

function setAppStatus(
    message,
    type =
        "info"
) {

    const element =
        AGRIGUARD_APP.elements.status;


    if (
        !element
    ) {

        return;

    }


    element.textContent =
        message;


    element.dataset.status =
        type;
}


function showLoading(
    show = true
) {

    AGRIGUARD_APP.isProcessing =
        show;


    const element =
        AGRIGUARD_APP.elements.loading;


    if (
        !element
    ) {

        return;

    }


    element.hidden =
        !show;

    element.style.display =
        show
            ? ""
            : "none";
}


/* ============================================================
   08. ELEMENT TEXT SETTER
============================================================ */

function setText(
    element,
    value
) {

    if (
        !element
    ) {

        return;

    }


    element.textContent =
        value;
}


/* ============================================================
   09. ELEMENT HTML SETTER
============================================================ */

function setHTML(
    element,
    html
) {

    if (
        !element
    ) {

        return;

    }


    element.innerHTML =
        html;
}


/* ============================================================
   10. PROGRESS BAR HELPER
============================================================ */

function setProgress(
    element,
    value
) {

    if (
        !element
    ) {

        return;

    }


    const score =
        appClamp(
            value
        );


    element.style.width =
        `${score}%`;


    element.setAttribute(
        "aria-valuenow",
        String(
            Math.round(
                score
            )
        )
    );
}


/* ============================================================
   11. FIND PROGRESS ELEMENT
============================================================ */

function findProgressElement(
    element
) {

    if (
        !element
    ) {

        return null;

    }


    return (
        element.querySelector(
            ".progress-bar"
        ) ||

        element.querySelector(
            "[role='progressbar']"
        ) ||

        element
    );
}


/* ============================================================
   12. NAVIGATION
============================================================ */

function initializeNavigation() {

    const links =
        AGRIGUARD_APP.elements.nav;


    if (
        !links ||
        links.length ===
        0
    ) {

        return;

    }


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    const target =
                        link.dataset.section ||
                        link.dataset.page ||
                        link.getAttribute(
                            "href"
                        );


                    if (
                        !target ||
                        !target.startsWith(
                            "#"
                        )
                    ) {

                        return;

                    }


                    const section =
                        document.querySelector(
                            target
                        );


                    if (
                        !section
                    ) {

                        return;

                    }


                    event.preventDefault();


                    section.scrollIntoView(
                        {
                            behavior:
                                "smooth",

                            block:
                                "start"
                        }
                    );


                    links.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    link.classList.add(
                        "active"
                    );

                }
            );

        }
    );
}


/* ============================================================
   13. IMAGE UPLOAD INITIALIZATION
============================================================ */

function initializeImageUpload() {

    const input =
        AGRIGUARD_APP.elements.imageInput;


    if (
        !input
    ) {

        console.warn(
            "AgriGuard: image input not found."
        );

        return;

    }


    input.addEventListener(
        "change",
        handleImageSelection
    );


    const uploadArea =
        AGRIGUARD_APP.elements.uploadArea;


    if (
        uploadArea
    ) {

        uploadArea.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                uploadArea.classList.add(
                    "drag-over"
                );

            }
        );


        uploadArea.addEventListener(
            "dragleave",
            () => {

                uploadArea.classList.remove(
                    "drag-over"
                );

            }
        );


        uploadArea.addEventListener(
            "drop",
            event => {

                event.preventDefault();


                uploadArea.classList.remove(
                    "drag-over"
                );


                const files =
                    event.dataTransfer.files;


                if (
                    files &&
                    files.length >
                    0
                ) {

                    processSelectedImage(
                        files[0]
                    );

                }

            }
        );

    }
}


/* ============================================================
   14. HANDLE IMAGE SELECTION
============================================================ */

function handleImageSelection(
    event
) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (
        !file
    ) {

        return;

    }


    processSelectedImage(
        file
    );
}


/* ============================================================
   15. VALIDATE IMAGE
============================================================ */

function validateImageFile(
    file
) {

    if (
        !file
    ) {

        return {

            valid:
                false,

            message:
                "No image selected."
        };
    }


    const validTypes = [

        "image/jpeg",

        "image/jpg",

        "image/png",

        "image/webp"
    ];


    if (
        !validTypes.includes(
            file.type
        )
    ) {

        return {

            valid:
                false,

            message:
                "Please upload a JPG, PNG, or WebP image."
        };
    }


    /*
        10 MB prototype limit.
    */

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        return {

            valid:
                false,

            message:
                "Image size should be below 10 MB."
        };
    }


    return {

        valid:
            true,

        message:
            "Image accepted."
    };
}


/* ============================================================
   16. PROCESS SELECTED IMAGE
============================================================ */

function processSelectedImage(
    file
) {

    const validation =
        validateImageFile(
            file
        );


    if (
        !validation.valid
    ) {

        setAppStatus(
            validation.message,
            "error"
        );


        return;

    }


    AGRIGUARD_APP.currentImage =
        file;


    const reader =
        new FileReader();


    reader.onload =
        event => {

            AGRIGUARD_APP.currentImageData =
                event.target.result;


            displayImagePreview(
                event.target.result
            );


            setAppStatus(
                "Image uploaded. Ready for AI analysis.",
                "success"
            );


            /*
                If disease detection module exposes
                an image preparation function, use it.
            */

            if (
                typeof window.prepareDiseaseImage ===
                "function"
            ) {

                try {

                    window.prepareDiseaseImage(
                        event.target.result
                    );

                }

                catch (
                    error
                ) {

                    console.warn(
                        "Disease image preparation failed:",
                        error
                    );

                }

            }

        };


    reader.onerror =
        () => {

            setAppStatus(
                "Unable to read the selected image.",
                "error"
            );

        };


    reader.readAsDataURL(
        file
    );
}


/* ============================================================
   17. DISPLAY IMAGE PREVIEW
============================================================ */

function displayImagePreview(
    imageData
) {

    const preview =
        AGRIGUARD_APP.elements.previewImage;


    if (
        preview
    ) {

        preview.src =
            imageData;


        preview.alt =
            "Uploaded crop image";


        preview.hidden =
            false;

    }


    const container =
        AGRIGUARD_APP.elements.imagePreview;


    if (
        container
    ) {

        container.hidden =
            false;

        container.style.display =
            "";

    }
}


/* ============================================================
   18. DETECTION BUTTON
============================================================ */

function initializeDetection() {

    const button =
        AGRIGUARD_APP.elements.detectButton;


    if (
        !button
    ) {

        console.warn(
            "AgriGuard: detection button not found."
        );

        return;

    }


    button.addEventListener(
        "click",
        runDiseaseDetection
    );
}


/* ============================================================
   19. RUN DISEASE DETECTION
============================================================ */

async function runDiseaseDetection() {

    if (
        AGRIGUARD_APP.isProcessing
    ) {

        return;

    }


    if (
        !AGRIGUARD_APP.currentImage
    ) {

        setAppStatus(
            "Please upload a crop image first.",
            "warning"
        );


        /*
            Smoothly move to upload area.
        */

        if (
            AGRIGUARD_APP.elements.uploadArea
        ) {

            AGRIGUARD_APP.elements.uploadArea.scrollIntoView(
                {
                    behavior:
                        "smooth",

                    block:
                        "center"
                }
            );

        }


        return;

    }


    showLoading(
        true
    );


    setAppStatus(
        "Analyzing crop image...",
        "info"
    );


    try {

        let result =
            null;


        /*
            Try project disease engine.
        */

        if (
            typeof window.detectDisease ===
            "function"
        ) {

            result =
                await window.detectDisease(
                    AGRIGUARD_APP.currentImage
                );

        }

        else if (
            typeof window.analyzeDiseaseImage ===
            "function"
        ) {

            result =
                await window.analyzeDiseaseImage(
                    AGRIGUARD_APP.currentImage
                );

        }

        else if (
            typeof window.runDiseaseDetection ===
            "function" &&
            window.runDiseaseDetection !==
            runDiseaseDetection
        ) {

            result =
                await window.runDiseaseDetection(
                    AGRIGUARD_APP.currentImage
                );

        }


        /*
            Demo fallback.

            This ensures the prototype remains
            demonstrable even without a backend.
        */

        if (
            !result
        ) {

            result =
                generateDemoDetectionResult();

        }


        AGRIGUARD_APP.lastDetection =
            normalizeDetectionResult(
                result
            );


        renderDetectionResult(
            AGRIGUARD_APP.lastDetection
        );


        /*
            Feed detection into risk engine.
        */

        await updateIntelligenceFromDetection(
            AGRIGUARD_APP.lastDetection
        );


        setAppStatus(
            "Analysis complete.",
            "success"
        );

    }

    catch (
        error
    ) {

        console.error(
            "AgriGuard detection error:",
            error
        );


        /*
            Keep presentation usable even if
            a module has a temporary error.
        */

        AGRIGUARD_APP.lastDetection =
            generateDemoDetectionResult();


        renderDetectionResult(
            AGRIGUARD_APP.lastDetection
        );


        setAppStatus(
            "Live analysis unavailable. Showing prototype AI result.",
            "warning"
        );

    }

    finally {

        showLoading(
            false
        );

    }
}


/* ============================================================
   20. NORMALIZE DETECTION RESULT
============================================================ */

function normalizeDetectionResult(
    result
) {

    const source =
        result ||
        {};


    const disease =
        source.disease ||
        source.prediction ||
        source.label ||
        source.name ||
        "Healthy";


    const confidence =
        appClamp(
            source.confidence ??
            source.probability ??
            87
        );


    const severity =
        source.severity ||
        (
            disease
                .toLowerCase()
                .includes(
                    "healthy"
                )
                ? "None"
                : "Moderate"
        );


    const symptoms =
        Array.isArray(
            source.symptoms
        )
            ? source.symptoms
            : [];


    const causes =
        Array.isArray(
            source.causes
        )
            ? source.causes
            : [];


    return {

        disease:
            appText(
                disease,
                "Healthy"
            ),

        confidence:
            Math.round(
                confidence
            ),

        severity:
            appText(
                severity,
                "Moderate"
            ),

        symptoms,

        causes,

        treatment:
            source.treatment ||
            source.action ||
            "",

        prevention:
            source.prevention ||
            "",

        source:
            source.source ||
            "AgriGuard AI",

        timestamp:
            source.timestamp ||
            new Date()
                .toISOString()
    };
}


/* ============================================================
   21. DEMO DISEASE RESULT
============================================================ */

function generateDemoDetectionResult() {

    return {

        disease:
            "Rice Blast",

        confidence:
            93,

        severity:
            "Moderate",

        symptoms:
            [
                "Spindle-shaped leaf lesions",

                "Brown / grey spots",

                "Leaf tip drying"
            ],

        causes:
            [
                "High humidity",

                "Leaf wetness",

                "Dense crop canopy"
            ],

        treatment:
            "Isolate affected area, improve field monitoring, and follow locally approved crop-protection guidance.",

        prevention:
            "Maintain balanced nutrition, avoid excessive nitrogen, improve field ventilation, and scout regularly.",

        source:
            "AgriGuard AI Demo Model",

        timestamp:
            new Date()
                .toISOString()
    };
}


/* ============================================================
   22. RENDER DETECTION RESULT
============================================================ */

function renderDetectionResult(
    result
) {

    const container =
        AGRIGUARD_APP.elements.detectionResult;


    if (
        !container
    ) {

        return;

    }


    const healthy =
        result.disease
            .toLowerCase()
            .includes(
                "healthy"
            );


    setHTML(
        container,

        `
        <div class="detection-card">

            <div class="detection-header">

                <div>

                    <span class="result-label">
                        AI Diagnosis
                    </span>

                    <h3>
                        ${escapeHTML(
                            result.disease
                        )}
                    </h3>

                </div>

                <div class="confidence">

                    <strong>
                        ${result.confidence}%
                    </strong>

                    <span>
                        Confidence
                    </span>

                </div>

            </div>


            <div class="detection-meta">

                <span>
                    Severity:
                    <strong>
                        ${escapeHTML(
                            result.severity
                        )}
                    </strong>
                </span>

                <span>
                    Source:
                    <strong>
                        ${escapeHTML(
                            result.source
                        )}
                    </strong>
                </span>

            </div>


            ${
                result.symptoms.length
                    ? `
                    <div class="result-section">

                        <h4>
                            Observed Symptoms
                        </h4>

                        <ul>
                            ${
                                result.symptoms
                                    .map(
                                        symptom =>
                                            `
                                            <li>
                                                ${escapeHTML(
                                                    symptom
                                                )}
                                            </li>
                                            `
                                    )
                                    .join(
                                        ""
                                    )
                            }
                        </ul>

                    </div>
                    `
                    : ""
            }


            ${
                result.causes.length
                    ? `
                    <div class="result-section">

                        <h4>
                            Possible Contributing Factors
                        </h4>

                        <ul>
                            ${
                                result.causes
                                    .map(
                                        cause =>
                                            `
                                            <li>
                                                ${escapeHTML(
                                                    cause
                                                )}
                                            </li>
                                            `
                                    )
                                    .join(
                                        ""
                                    )
                            }
                        </ul>

                    </div>
                    `
                    : ""
            }


            ${
                result.treatment
                    ? `
                    <div class="result-section">

                        <h4>
                            Recommended Action
                        </h4>

                        <p>
                            ${escapeHTML(
                                result.treatment
                            )}
                        </p>

                    </div>
                    `
                    : ""
            }


            ${
                result.prevention
                    ? `
                    <div class="result-section">

                        <h4>
                            Prevention
                        </h4>

                        <p>
                            ${escapeHTML(
                                result.prevention
                            )}
                        </p>

                    </div>
                    `
                    : ""
            }


            <div class="ai-disclaimer">

                ${
                    healthy
                        ? "No major disease signal detected in this prototype analysis."
                        : "AI output is a decision-support signal. Verify symptoms with field observations and local agricultural expertise before treatment."
                }

            </div>

        </div>
        `
    );
}


/* ============================================================
   23. UPDATE INTELLIGENCE FROM DETECTION
============================================================ */

async function updateIntelligenceFromDetection(
    detection
) {

    const field =
        typeof window.getCurrentField ===
        "function"
            ? window.getCurrentField()
            : null;


    if (
        !field
    ) {

        return;

    }


    const disease =
        detection.disease
            .toLowerCase();


    const healthy =
        disease.includes(
            "healthy"
        );


    let diseaseRisk =
        healthy
            ? 8
            : detection.severity
                .toLowerCase()
                .includes(
                    "high"
                )
                ? 78
                : 55;


    /*
        Strong confidence increases
        trust in prototype signal.
    */

    if (
        detection.confidence >=
        90
    ) {

        diseaseRisk +=
            healthy
                ? 0
                : 5;

    }


    diseaseRisk =
        appClamp(
            diseaseRisk
        );


    if (
        typeof window.updateFieldFromEngines ===
        "function"
    ) {

        window.updateFieldFromEngines(

            field.id,

            {

                risk: {

                    disease:
                        diseaseRisk

                }

            }

        );

    }


    /*
        Add scouting observation.
    */

    if (
        typeof window.addScoutingRecord ===
        "function"
    ) {

        window.addScoutingRecord(

            field.id,

            {

                observer:
                    "AgriGuard AI",

                observation:
                    `${detection.disease} detected from uploaded crop image.`,

                symptoms:
                    detection.symptoms,

                severity:
                    detection.severity,

                diseaseSuspected:
                    !healthy,

                notes:
                    `AI confidence: ${detection.confidence}%`
            }

        );

    }


    await refreshIntelligence();
}


/* ============================================================
   24. REFRESH INTELLIGENCE
============================================================ */

async function refreshIntelligence() {

    const field =
        typeof window.getCurrentField ===
        "function"
            ? window.getCurrentField()
            : null;


    if (
        !field
    ) {

        return;

    }


    /*
        WEATHER
    */

    AGRIGUARD_APP.lastWeather =
        await getWeatherData(
            field
        );


    /*
        SOIL
    */

    AGRIGUARD_APP.lastSoil =
        await getSoilData(
            field
        );


    /*
        RISK
    */

    AGRIGUARD_APP.lastRisk =
        await getRiskData(
            field,
            AGRIGUARD_APP.lastWeather,
            AGRIGUARD_APP.lastSoil
        );


    /*
        RECOMMENDATIONS
    */

    AGRIGUARD_APP.lastRecommendation =
        await getRecommendationData(
            field,
            AGRIGUARD_APP.lastRisk,
            AGRIGUARD_APP.lastWeather,
            AGRIGUARD_APP.lastSoil,
            AGRIGUARD_APP.lastDetection
        );


    /*
        ALERTS
    */

    AGRIGUARD_APP.lastAlerts =
        await getAlertData(
            field,
            AGRIGUARD_APP.lastRisk,
            AGRIGUARD_APP.lastWeather,
            AGRIGUARD_APP.lastSoil
        );


    /*
        Render everything.
    */

    renderDashboard();


    return {

        field,

        weather:
            AGRIGUARD_APP.lastWeather,

        soil:
            AGRIGUARD_APP.lastSoil,

        risk:
            AGRIGUARD_APP.lastRisk,

        recommendations:
            AGRIGUARD_APP.lastRecommendation,

        alerts:
            AGRIGUARD_APP.lastAlerts
    };
}


/* ============================================================
   25. WEATHER DATA BRIDGE
============================================================ */

async function getWeatherData(
    field
) {

    try {

        if (
            typeof window.getWeatherRisk ===
            "function"
        ) {

            return await window.getWeatherRisk(
                field
            );

        }


        if (
            typeof window.calculateWeatherRisk ===
            "function"
        ) {

            return await window.calculateWeatherRisk(
                field
            );

        }


        if (
            typeof window.getWeatherData ===
            "function" &&
            window.getWeatherData !==
            getWeatherData
        ) {

            return await window.getWeatherData(
                field
            );

        }

    }

    catch (
        error
    ) {

        console.warn(
            "Weather engine unavailable:",
            error
        );

    }


    /*
        Demo fallback.
    */

    return {

        temperature:
            31.5,

        humidity:
            74,

        rainfall:
            4.2,

        rainfallProbability:
            38,

        windSpeed:
            11,

        condition:
            "Partly Cloudy",

        risk:
            31,

        riskLevel:
            "MODERATE",

        source:
            "AgriGuard Weather Demo"
    };
}


/* ============================================================
   26. SOIL DATA BRIDGE
============================================================ */

async function getSoilData(
    field
) {

    try {

        if (
            typeof window.analyzeSoil ===
            "function"
        ) {

            return await window.analyzeSoil(
                field.soil,
                field.crop
            );

        }


        if (
            typeof window.getSoilHealth ===
            "function"
        ) {

            return await window.getSoilHealth(
                field
            );

        }


        if (
            typeof window.calculateSoilRisk ===
            "function"
        ) {

            return await window.calculateSoilRisk(
                field
            );

        }

    }

    catch (
        error
    ) {

        console.warn(
            "Soil engine unavailable:",
            error
        );

    }


    return {

        moisture:
            appNumber(
                field.soil.moisture,
                58
            ),

        pH:
            appNumber(
                field.soil.pH,
                6.5
            ),

        fertility:
            appNumber(
                field.soil.fertility,
                76
            ),

        risk:
            appNumber(
                field.risk.soil,
                25
            ),

        status:
            "Healthy",

        source:
            "AgriGuard Soil Demo"
    };
}


/* ============================================================
   27. RISK DATA BRIDGE
============================================================ */

async function getRiskData(
    field,
    weather,
    soil
) {

    try {

        if (
            typeof window.calculateRisk ===
            "function"
        ) {

            const result =
                await window.calculateRisk(
                    {
                        field,

                        weather,

                        soil,

                        detection:
                            AGRIGUARD_APP.lastDetection
                    }
                );


            if (
                result
            ) {

                return normalizeRiskResult(
                    result,
                    field
                );

            }

        }


        if (
            typeof window.calculateOverallRisk ===
            "function"
        ) {

            const result =
                await window.calculateOverallRisk(
                    field
                );


            if (
                result
            ) {

                return normalizeRiskResult(
                    result,
                    field
                );

            }

        }

    }

    catch (
        error
    ) {

        console.warn(
            "Risk engine unavailable:",
            error
        );

    }


    /*
        Prototype fallback.
    */

    const risk = {

        disease:
            appNumber(
                field.risk.disease,
                30
            ),

        weather:
            appNumber(
                weather.risk,
                field.risk.weather
            ),

        soil:
            appNumber(
                soil.risk,
                field.risk.soil
            ),

        water:
            appNumber(
                field.risk.water,
                35
            ),

        pest:
            appNumber(
                field.risk.pest,
                25
            )
    };


    const overall =
        Math.round(
            (
                risk.disease * 0.30
            ) +
            (
                risk.weather * 0.15
            ) +
            (
                risk.soil * 0.20
            ) +
            (
                risk.water * 0.20
            ) +
            (
                risk.pest * 0.15
            )
        );


    return {

        ...risk,

        overall:
            appClamp(
                overall
            ),

        level:
            getRiskLevelFromScore(
                overall
            ),

        confidence:
            84,

        source:
            "AgriGuard Risk Engine"
    };
}


/* ============================================================
   28. NORMALIZE RISK
============================================================ */

function normalizeRiskResult(
    result,
    field
) {

    const risk =
        result.risk ||
        result;


    const disease =
        appClamp(
            risk.disease ??
            risk.diseaseRisk ??
            field.risk.disease
        );


    const weather =
        appClamp(
            risk.weather ??
            risk.weatherRisk ??
            field.risk.weather
        );


    const soil =
        appClamp(
            risk.soil ??
            risk.soilRisk ??
            field.risk.soil
        );


    const water =
        appClamp(
            risk.water ??
            risk.waterRisk ??
            field.risk.water
        );


    const pest =
        appClamp(
            risk.pest ??
            risk.pestRisk ??
            field.risk.pest
        );


    const overall =
        appClamp(
            risk.overall ??
            risk.total ??
            (
                disease * 0.30 +
                weather * 0.15 +
                soil * 0.20 +
                water * 0.20 +
                pest * 0.15
            )
        );


    return {

        disease:
            Math.round(
                disease
            ),

        weather:
            Math.round(
                weather
            ),

        soil:
            Math.round(
                soil
            ),

        water:
            Math.round(
                water
            ),

        pest:
            Math.round(
                pest
            ),

        overall:
            Math.round(
                overall
            ),

        level:
            risk.level ||
            getRiskLevelFromScore(
                overall
            ),

        confidence:
            appClamp(
                risk.confidence ??
                84
            ),

        source:
            risk.source ||
            "AgriGuard Risk Engine"
    };
}


/* ============================================================
   29. RISK LEVEL
============================================================ */

function getRiskLevelFromScore(
    score
) {

    const value =
        appClamp(
            score
        );


    if (
        value >=
        80
    ) {

        return "CRITICAL";

    }


    if (
        value >=
        60
    ) {

        return "HIGH";

    }


    if (
        value >=
        35
    ) {

        return "MODERATE";

    }


    return "LOW";
}


/* ============================================================
   30. RECOMMENDATION BRIDGE
============================================================ */

async function getRecommendationData(
    field,
    risk,
    weather,
    soil,
    detection
) {

    try {

        if (
            typeof window.generateRecommendations ===
            "function"
        ) {

            const result =
                await window.generateRecommendations(
                    {
                        field,

                        risk,

                        weather,

                        soil,

                        detection
                    }
                );


            if (
                result
            ) {

                return normalizeRecommendations(
                    result
                );

            }

        }


        if (
            typeof window.getRecommendations ===
            "function"
        ) {

            const result =
                await window.getRecommendations(
                    field
                );


            if (
                result
            ) {

                return normalizeRecommendations(
                    result
                );

            }

        }

    }

    catch (
        error
    ) {

        console.warn(
            "Recommendation engine unavailable:",
            error
        );

    }


    return generateDemoRecommendations(
        field,
        risk,
        detection
    );
}


/* ============================================================
   31. NORMALIZE RECOMMENDATIONS
============================================================ */

function normalizeRecommendations(
    result
) {

    const list =
        Array.isArray(
            result
        )
            ? result
            : (
                result.recommendations ||
                result.actions ||
                result.items ||
                []
            );


    return list.map(
        (
            item,
            index
        ) => ({

            id:
                item.id ||
                `REC-${index + 1}`,

            priority:
                item.priority ||
                item.level ||
                "MEDIUM",

            category:
                item.category ||
                "General",

            title:
                item.title ||
                item.name ||
                "Recommended Action",

            action:
                item.action ||
                item.description ||
                item.message ||
                "",

            reason:
                item.reason ||
                item.why ||
                "",

            timing:
                item.timing ||
                "As appropriate",

            confidence:
                appClamp(
                    item.confidence ??
                    85
                )
        })
    );
}


/* ============================================================
   32. DEMO RECOMMENDATIONS
============================================================ */

function generateDemoRecommendations(
    field,
    risk,
    detection
) {

    const recommendations = [];


    /*
        Disease recommendation.
    */

    if (
        detection &&
        !detection.disease
            .toLowerCase()
            .includes(
                "healthy"
            )
    ) {

        recommendations.push({

            id:
                "REC-DISEASE-01",

            priority:
                risk.disease >= 70
                    ? "CRITICAL"
                    : "HIGH",

            category:
                "Disease",

            title:
                "Scout the affected crop area",

            action:
                "Inspect surrounding plants and mark the affected zone for follow-up.",

            reason:
                `${detection.disease} was detected with ${detection.confidence}% confidence.`,

            timing:
                "Today",

            confidence:
                detection.confidence
        });

    }


    /*
        Water recommendation.
    */

    if (
        risk.water >=
        60
    ) {

        recommendations.push({

            id:
                "REC-WATER-01",

            priority:
                "HIGH",

            category:
                "Irrigation",

            title:
                "Review irrigation requirement",

            action:
                "Check root-zone moisture before applying irrigation.",

            reason:
                "Water-related risk is elevated.",

            timing:
                "Today",

            confidence:
                88
        });

    }

    else {

        recommendations.push({

            id:
                "REC-WATER-02",

            priority:
                "MEDIUM",

            category:
                "Irrigation",

            title:
                "Maintain current moisture monitoring",

            action:
                "Continue monitoring soil moisture and avoid unnecessary irrigation.",

            reason:
                "Current moisture appears manageable.",

            timing:
                "Next field check",

            confidence:
                89
        });

    }


    /*
        Soil recommendation.
    */

    if (
        risk.soil >=
        50
    ) {

        recommendations.push({

            id:
                "REC-SOIL-01",

            priority:
                "HIGH",

            category:
                "Soil",

            title:
                "Review soil condition",

            action:
                "Verify soil-test values and adjust nutrient management accordingly.",

            reason:
                "Soil risk is elevated.",

            timing:
                "This week",

            confidence:
                82
        });

    }


    /*
        General scouting.
    */

    recommendations.push({

        id:
            "REC-SCOUT-01",

        priority:
            "MEDIUM",

        category:
            "Scouting",

        title:
            "Perform routine field scouting",

        action:
            "Inspect crop canopy, leaf underside, stems, and field boundaries.",

        reason:
            "Early detection reduces the chance of unnoticed spread.",

        timing:
            "Every 2–3 days",

        confidence:
            91
    });


    return recommendations;
}


/* ============================================================
   33. ALERT BRIDGE
============================================================ */

async function getAlertData(
    field,
    risk,
    weather,
    soil
) {

    try {

        if (
            typeof window.generateAlerts ===
            "function"
        ) {

            const result =
                await window.generateAlerts(
                    {
                        field,

                        risk,

                        weather,

                        soil,

                        detection:
                            AGRIGUARD_APP.lastDetection
                    }
                );


            if (
                result
            ) {

                return normalizeAlerts(
                    result
                );

            }

        }


        if (
            typeof window.getAlerts ===
            "function"
        ) {

            const result =
                await window.getAlerts(
                    field
                );


            if (
                result
            ) {

                return normalizeAlerts(
                    result
                );

            }

        }

    }

    catch (
        error
    ) {

        console.warn(
            "Alert engine unavailable:",
            error
        );

    }


    return generateDemoAlerts(
        field,
        risk
    );
}


/* ============================================================
   34. NORMALIZE ALERTS
============================================================ */

function normalizeAlerts(
    result
) {

    const list =
        Array.isArray(
            result
        )
            ? result
            : (
                result.alerts ||
                result.items ||
                []
            );


    return list.map(
        (
            item,
            index
        ) => ({

            id:
                item.id ||
                `ALERT-${index + 1}`,

            category:
                item.category ||
                "General",

            level:
                String(
                    item.level ||
                    item.priority ||
                    "MEDIUM"
                )
                .toUpperCase(),

            title:
                item.title ||
                item.name ||
                "Field Alert",

            message:
                item.message ||
                item.description ||
                "",

            explanation:
                item.explanation ||
                item.reason ||
                "",

            action:
                item.action ||
                "",

            why:
                item.why ||
                "",

            timing:
                item.timing ||
                "Monitor",

            confidence:
                appClamp(
                    item.confidence ??
                    85
                ),

            timestamp:
                item.timestamp ||
                new Date()
                    .toISOString()
        })
    );
}


/* ============================================================
   35. DEMO ALERTS
============================================================ */

function generateDemoAlerts(
    field,
    risk
) {

    const alerts = [];


    /*
        Disease.
    */

    if (
        risk.disease >=
        60
    ) {

        alerts.push({

            id:
                "ALERT-DISEASE-01",

            category:
                "Disease",

            level:
                risk.disease >=
                80
                    ? "CRITICAL"
                    : "HIGH",

            title:
                "Disease Risk Elevated",

            message:
                "Disease risk requires field verification.",

            explanation:
                "The disease-risk component is elevated based on current intelligence.",

            action:
                "Scout high-risk zones and verify symptoms.",

            why:
                "Early intervention can reduce spread.",

            timing:
                "Today",

            confidence:
                89,

            timestamp:
                new Date()
                    .toISOString()
        });

    }


    /*
        Water.
    */

    if (
        risk.water >=
        60
    ) {

        alerts.push({

            id:
                "ALERT-WATER-01",

            category:
                "Water",

            level:
                "HIGH",

            title:
                "Water Stress Risk",

            message:
                "Field water condition needs attention.",

            explanation:
                "Water-related risk is elevated.",

            action:
                "Check soil moisture before irrigation.",

            why:
                "Crop water stress can affect growth.",

            timing:
                "Today",

            confidence:
                87,

            timestamp:
                new Date()
                    .toISOString()
        });

    }


    /*
        Overall risk.
    */

    if (
        risk.overall >=
        60
    ) {

        alerts.push({

            id:
                "ALERT-OVERALL-01",

            category:
                "Field",

            level:
                risk.overall >=
                80
                    ? "CRITICAL"
                    : "HIGH",

            title:
                "Overall Field Risk Elevated",

            message:
                `Current field risk score is ${Math.round(risk.overall)}/100.`,

            explanation:
                "Multiple field factors are contributing to the overall risk score.",

            action:
                "Prioritize scouting and review the recommended actions.",

            why:
                "Risk is multi-factor and should be managed proactively.",

            timing:
                "Today",

            confidence:
                86,

            timestamp:
                new Date()
                    .toISOString()
        });

    }


    /*
        If no alert exists.
    */

    if (
        alerts.length ===
        0
    ) {

        alerts.push({

            id:
                "ALERT-INFO-01",

            category:
                "System",

            level:
                "LOW",

            title:
                "No Critical Alerts",

            message:
                "No immediate high-priority field alert is active.",

            explanation:
                "Current prototype indicators are within manageable ranges.",

            action:
                "Continue routine monitoring.",

            why:
                "Continuous monitoring supports early detection.",

            timing:
                "Routine",

            confidence:
                91,

            timestamp:
                new Date()
                    .toISOString()
        });

    }


    return alerts;
}


/* ============================================================
   36. RENDER DASHBOARD
============================================================ */

function renderDashboard() {

    const field =
        typeof window.getCurrentField ===
        "function"
            ? window.getCurrentField()
            : null;


    if (
        !field
    ) {

        return;

    }


    /*
        Prefer field engine dashboard model.
    */

    let dashboard =
        null;


    if (
        typeof window.getFieldDashboardModel ===
        "function"
    ) {

        dashboard =
            window.getFieldDashboardModel(
                field
            );

    }


    AGRIGUARD_APP.lastDashboard =
        dashboard;


    renderFieldHeader(
        field
    );


    renderHealth(
        field,
        dashboard
    );


    renderRisk(
        field,
        dashboard
    );


    renderSoil(
        field,
        AGRIGUARD_APP.lastSoil
    );


    renderWeather(
        AGRIGUARD_APP.lastWeather
    );


    renderIrrigation(
        field
    );


    renderAlerts(
        AGRIGUARD_APP.lastAlerts
    );


    renderRecommendations(
        AGRIGUARD_APP.lastRecommendation
    );


    renderZones(
        field
    );


    renderScouting(
        field
    );


    renderTimeline(
        field
    );


    updateCharts();


    /*
        Emit application update event.
    */

    window.dispatchEvent(
        new CustomEvent(
            "agriguard:dashboardUpdated",
            {
                detail:
                    AGRIGUARD_APP.lastDashboard
            }
        )
    );
}


/* ============================================================
   37. RENDER FIELD HEADER
============================================================ */

function renderFieldHeader(
    field
) {

    setText(
        AGRIGUARD_APP.elements.fieldName,
        field.name
    );


    setText(
        AGRIGUARD_APP.elements.cropName,
        field.crop.name
    );


    setText(
        AGRIGUARD_APP.elements.cropStage,
        field.crop.stage
    );


    setText(
        AGRIGUARD_APP.elements.fieldArea,

        `${formatNumber(
            field.area,
            1
        )} ${field.areaUnit}`
    );


    const location =
        [
            field.location.village,

            field.location.district,

            field.location.state
        ]
        .filter(
            Boolean
        )
        .join(
            ", "
        );


    setText(
        AGRIGUARD_APP.elements.location,
        location ||
        "Location unavailable"
    );
}


/* ============================================================
   38. RENDER HEALTH
============================================================ */

function renderHealth(
    field,
    dashboard
) {

    const health =
        dashboard &&
        dashboard.health
            ? dashboard.health
            : (
                typeof window.calculateFieldHealth ===
                "function"
                    ? window.calculateFieldHealth(
                        field
                    )
                    : {
                        score:
                            field.health.score,

                        status: {

                            label:
                                field.health.status
                        }
                    }
            );


    const score =
        appClamp(
            health.score
        );


    setText(
        AGRIGUARD_APP.elements.healthScore,

        `${Math.round(
            score
        )}/100`
    );


    setText(
        AGRIGUARD_APP.elements.healthStatus,

        health.status &&
        health.status.label
            ? health.status.label
            : "—"
    );


    const healthCards =
        $$(
            "[data-health-progress]"
        );


    healthCards.forEach(
        card => {

            const key =
                card.dataset.healthProgress;


            const value =
                health.components &&
                health.components[key];


            if (
                value !==
                undefined
            ) {

                setProgress(
                    findProgressElement(
                        card
                    ),

                    value
                );

            }

        }
    );
}


/* ============================================================
   39. RENDER RISK
============================================================ */

function renderRisk(
    field,
    dashboard
) {

    const risk =
        AGRIGUARD_APP.lastRisk ||
        (
            dashboard &&
            dashboard.risk
                ? {

                    overall:
                        dashboard.risk.score,

                    level:
                        dashboard.risk.level.level

                }
                : null
        );


    if (
        !risk
    ) {

        return;

    }


    const score =
        appClamp(
            risk.overall
        );


    setText(
        AGRIGUARD_APP.elements.riskScore,

        `${Math.round(
            score
        )}/100`
    );


    setText(
        AGRIGUARD_APP.elements.riskStatus,

        risk.level ||
        getRiskLevelFromScore(
            score
        )
    );


    const riskCards =
        $$(
            "[data-risk-key]"
        );


    riskCards.forEach(
        card => {

            const key =
                card.dataset.riskKey;


            const value =
                risk[key];


            if (
                value !==
                undefined
            ) {

                setText(
                    card.querySelector(
                        "[data-value]"
                    ) ||
                    card,

                    `${Math.round(
                        value
                    )}`
                );


                setProgress(
                    findProgressElement(
                        card
                    ),

                    value
                );

            }

        }
    );
}


/* ============================================================
   40. RENDER SOIL
============================================================ */

function renderSoil(
    field,
    soil
) {

    const data =
        soil ||
        field.soil;


    setText(
        AGRIGUARD_APP.elements.soilMoisture,

        `${formatNumber(
            data.moisture,
            0
        )}%`
    );


    setText(
        AGRIGUARD_APP.elements.soilPH,

        formatNumber(
            data.pH,
            1
        )
    );


    setText(
        AGRIGUARD_APP.elements.soilFertility,

        `${formatNumber(
            data.fertility,
            0
        )}%`
    );
}


/* ============================================================
   41. RENDER WEATHER
============================================================ */

function renderWeather(
    weather
) {

    if (
        !weather
    ) {

        return;

    }


    setText(
        AGRIGUARD_APP.elements.temperature,

        weather.temperature !==
        undefined

            ? `${formatNumber(
                weather.temperature,
                1
            )}°C`

            : "—"
    );


    setText(
        AGRIGUARD_APP.elements.humidity,

        weather.humidity !==
        undefined

            ? `${formatNumber(
                weather.humidity,
                0
            )}%`

            : "—"
    );


    setText(
        AGRIGUARD_APP.elements.rainfall,

        weather.rainfall !==
        undefined

            ? `${formatNumber(
                weather.rainfall,
                1
            )} mm`

            : "—"
    );
}


/* ============================================================
   42. RENDER IRRIGATION
============================================================ */

function renderIrrigation(
    field
) {

    const waterStatus =
        typeof window.getFieldWaterStatus ===
        "function"
            ? window.getFieldWaterStatus(
                field
            )
            : null;


    if (
        waterStatus
    ) {

        setText(
            AGRIGUARD_APP.elements.irrigationStatus,

            waterStatus.status
        );


        setText(
            AGRIGUARD_APP.elements.irrigationAdvice,

            waterStatus.message
        );

    }


    /*
        Support existing irrigation engine output.
    */

    if (
        field.irrigation &&
        field.irrigation.status
    ) {

        const statusElement =
            AGRIGUARD_APP.elements.irrigationStatus;


        if (
            statusElement &&
            (
                !waterStatus ||
                waterStatus.status ===
                "Optimal"
            )
        ) {

            statusElement.textContent =
                field.irrigation.status;

        }

    }
}


/* ============================================================
   43. RENDER ALERTS
============================================================ */

function renderAlerts(
    alerts
) {

    const container =
        AGRIGUARD_APP.elements.alertsContainer;


    if (
        !container
    ) {

        return;

    }


    if (
        !alerts ||
        alerts.length ===
        0
    ) {

        setHTML(
            container,

            `
            <div class="empty-state">
                No active alerts.
            </div>
            `
        );


        setText(
            AGRIGUARD_APP.elements.alertCount,
            "0"
        );


        return;

    }


    setText(
        AGRIGUARD_APP.elements.alertCount,
        String(
            alerts.length
        )
    );


    setHTML(

        container,

        alerts
            .map(
                alert =>
                    `
                    <article
                        class="alert-card"
                        data-alert-level="${escapeHTML(
                            alert.level
                        )}"
                    >

                        <div class="alert-card-header">

                            <span class="alert-level">
                                ${escapeHTML(
                                    alert.level
                                )}
                            </span>

                            <span class="alert-category">
                                ${escapeHTML(
                                    alert.category
                                )}
                            </span>

                        </div>


                        <h4>
                            ${escapeHTML(
                                alert.title
                            )}
                        </h4>


                        <p>
                            ${escapeHTML(
                                alert.message
                            )}
                        </p>


                        ${
                            alert.explanation
                                ? `
                                <div class="alert-explanation">
                                    <strong>
                                        Why:
                                    </strong>

                                    ${escapeHTML(
                                        alert.explanation
                                    )}
                                </div>
                                `
                                : ""
                        }


                        ${
                            alert.action
                                ? `
                                <div class="alert-action">
                                    <strong>
                                        Action:
                                    </strong>

                                    ${escapeHTML(
                                        alert.action
                                    )}
                                </div>
                                `
                                : ""
                        }


                        <div class="alert-footer">

                            <span>
                                ${escapeHTML(
                                    alert.timing
                                )}
                            </span>

                            <span>
                                ${alert.confidence}% confidence
                            </span>

                        </div>

                    </article>
                    `
            )
            .join(
                ""
            )
    );
}


/* ============================================================
   44. RENDER RECOMMENDATIONS
============================================================ */

function renderRecommendations(
    recommendations
) {

    const container =
        AGRIGUARD_APP.elements.recommendationsContainer;


    if (
        !container
    ) {

        return;

    }


    if (
        !recommendations ||
        recommendations.length ===
        0
    ) {

        setHTML(
            container,

            `
            <div class="empty-state">
                No recommendations available.
            </div>
            `
        );


        return;

    }


    setHTML(

        container,

        recommendations
            .map(
                recommendation =>
                    `
                    <article class="recommendation-card">

                        <div class="recommendation-header">

                            <span class="recommendation-priority">
                                ${escapeHTML(
                                    recommendation.priority
                                )}
                            </span>

                            <span class="recommendation-category">
                                ${escapeHTML(
                                    recommendation.category
                                )}
                            </span>

                        </div>


                        <h4>
                            ${escapeHTML(
                                recommendation.title
                            )}
                        </h4>


                        <p>
                            ${escapeHTML(
                                recommendation.action
                            )}
                        </p>


                        ${
                            recommendation.reason
                                ? `
                                <div class="recommendation-reason">

                                    <strong>
                                        Why:
                                    </strong>

                                    ${escapeHTML(
                                        recommendation.reason
                                    )}

                                </div>
                                `
                                : ""
                        }


                        <div class="recommendation-footer">

                            <span>
                                ${escapeHTML(
                                    recommendation.timing
                                )}
                            </span>

                            <span>
                                ${recommendation.confidence}% confidence
                            </span>

                        </div>

                    </article>
                    `
            )
            .join(
                ""
            )
    );
}


/* ============================================================
   45. RENDER ZONES
============================================================ */

function renderZones(
    field
) {

    const container =
        AGRIGUARD_APP.elements.zonesContainer;


    if (
        !container
    ) {

        return;

    }


    const zones =
        field.zones ||
        [];


    if (
        zones.length ===
        0
    ) {

        setHTML(
            container,

            `
            <div class="empty-state">
                No field zones configured.
            </div>
            `
        );


        return;

    }


    setHTML(

        container,

        zones
            .map(
                zone => {

                    const riskLevel =
                        getRiskLevelFromScore(
                            zone.riskScore
                        );


                    return `

                    <article
                        class="zone-card"
                        data-zone-risk="${riskLevel}"
                    >

                        <div class="zone-header">

                            <h4>
                                ${escapeHTML(
                                    zone.name
                                )}
                            </h4>

                            <span>
                                ${escapeHTML(
                                    riskLevel
                                )}
                            </span>

                        </div>


                        <div class="zone-metrics">

                            <div>

                                <span>
                                    Health
                                </span>

                                <strong>
                                    ${Math.round(
                                        zone.healthScore
                                    )}/100
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Risk
                                </span>

                                <strong>
                                    ${Math.round(
                                        zone.riskScore
                                    )}/100
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Disease
                                </span>

                                <strong>
                                    ${Math.round(
                                        zone.diseaseRisk
                                    )}/100
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Water
                                </span>

                                <strong>
                                    ${Math.round(
                                        zone.waterRisk
                                    )}/100
                                </strong>

                            </div>

                        </div>


                        <div class="zone-progress">

                            <div
                                class="progress-bar"
                                style="width:${appClamp(
                                    zone.healthScore
                                )}%"
                            ></div>

                        </div>


                        <p>

                            ${escapeHTML(
                                zone.irrigationStatus
                            )}

                        </p>

                    </article>

                    `;
                }
            )
            .join(
                ""
            )
    );


    const priority =
        typeof window.getPriorityZone ===
        "function"
            ? window.getPriorityZone(
                field
            )
            : null;


    if (
        priority
    ) {

        setText(
            AGRIGUARD_APP.elements.priorityZone,

            `${priority.name} — Risk ${Math.round(
                priority.riskScore
            )}/100`
        );

    }
}


/* ============================================================
   46. RENDER SCOUTING
============================================================ */

function renderScouting(
    field
) {

    const container =
        AGRIGUARD_APP.elements.scoutingContainer;


    if (
        !container
    ) {

        return;

    }


    const records =
        typeof window.getRecentScouting ===
        "function"
            ? window.getRecentScouting(
                field.id,
                5
            )
            : [];


    if (
        records.length ===
        0
    ) {

        setHTML(
            container,

            `
            <div class="empty-state">
                No scouting observations yet.
            </div>
            `
        );


        return;

    }


    setHTML(

        container,

        records
            .map(
                record =>
                    `
                    <article class="scouting-card">

                        <div class="scouting-header">

                            <strong>
                                ${escapeHTML(
                                    record.observation
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    record.severity
                                )}
                            </span>

                        </div>


                        ${
                            record.symptoms &&
                            record.symptoms.length
                                ? `
                                <ul>

                                    ${
                                        record.symptoms
                                            .map(
                                                symptom =>
                                                    `
                                                    <li>
                                                        ${escapeHTML(
                                                            symptom
                                                        )}
                                                    </li>
                                                    `
                                            )
                                            .join(
                                                ""
                                            )
                                    }

                                </ul>
                                `
                                : ""
                        }


                        <div class="scouting-footer">

                            <span>
                                ${escapeHTML(
                                    record.observer
                                )}
                            </span>

                            <span>
                                ${formatRelativeTime(
                                    record.createdAt
                                )}
                            </span>

                        </div>

                    </article>
                    `
            )
            .join(
                ""
            )
    );
}


/* ============================================================
   47. RENDER TIMELINE
============================================================ */

function renderTimeline(
    field
) {

    const container =
        AGRIGUARD_APP.elements.timelineContainer;


    if (
        !container
    ) {

        return;

    }


    const events =
        typeof window.getFieldTimeline ===
        "function"
            ? window.getFieldTimeline(
                field.id,
                10
            )
            : [];


    if (
        events.length ===
        0
    ) {

        setHTML(
            container,

            `
            <div class="empty-state">
                No field activity recorded.
            </div>
            `
        );


        return;

    }


    setHTML(

        container,

        events
            .map(
                event =>
                    `
                    <article class="timeline-item">

                        <div class="timeline-marker">
                            ●
                        </div>


                        <div class="timeline-content">

                            <strong>
                                ${escapeHTML(
                                    event.type
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    event.message
                                )}
                            </p>

                            <time>
                                ${formatRelativeTime(
                                    event.timestamp
                                )}
                            </time>

                        </div>

                    </article>
                    `
            )
            .join(
                ""
            )
    );
}


/* ============================================================
   48. CHART BRIDGE
============================================================ */

function updateCharts() {

    const field =
        typeof window.getCurrentField ===
        "function"
            ? window.getCurrentField()
            : null;


    if (
        !field
    ) {

        return;

    }


    const risk =
        AGRIGUARD_APP.lastRisk ||
        field.risk;


    /*
        Use whichever chart API exists.
    */

    try {

        if (
            typeof window.updateRiskChart ===
            "function"
        ) {

            window.updateRiskChart(
                {
                    disease:
                        risk.disease,

                    weather:
                        risk.weather,

                    soil:
                        risk.soil,

                    water:
                        risk.water,

                    pest:
                        risk.pest
                }
            );

        }


        if (
            typeof window.renderRiskChart ===
            "function"
        ) {

            window.renderRiskChart(
                risk
            );

        }


        if (
            typeof window.updateHealthChart ===
            "function"
        ) {

            const health =
                typeof window.calculateFieldHealth ===
                "function"
                    ? window.calculateFieldHealth(
                        field
                    )
                    : null;


            if (
                health
            ) {

                window.updateHealthChart(
                    health.components
                );

            }

        }


        if (
            typeof window.updateZoneChart ===
            "function"
        ) {

            window.updateZoneChart(
                field.zones ||
                []
            );

        }

    }

    catch (
        error
    ) {

        console.warn(
            "Chart update skipped:",
            error
        );

    }
}


/* ============================================================
   49. DEMO MODE
============================================================ */

function initializeDemoMode() {

    const button =
        AGRIGUARD_APP.elements.demoButton;


    if (
        !button
    ) {

        return;

    }


    button.addEventListener(
        "click",
        loadDemoMode
    );
}


/* ============================================================
   50. LOAD DEMO MODE
============================================================ */

async function loadDemoMode() {

    showLoading(
        true
    );


    setAppStatus(
        "Loading AgriGuard AI demonstration scenario...",
        "info"
    );


    try {

        let field =
            null;


        if (
            typeof window.loadDemoField ===
            "function"
        ) {

            field =
                window.loadDemoField();

        }

        else if (
            typeof window.initializeFieldEngine ===
            "function"
        ) {

            field =
                window.initializeFieldEngine();

        }


        /*
            Ensure zones exist.
        */

        if (
            field &&
            (!field.zones ||
            field.zones.length ===
            0)
        ) {

            if (
                typeof window.createDefaultZones ===
                "function"
            ) {

                window.createDefaultZones(
                    field.id
                );

            }

        }


        /*
            Demo image result.
        */

        AGRIGUARD_APP.lastDetection =
            generateDemoDetectionResult();


        renderDetectionResult(
            AGRIGUARD_APP.lastDetection
        );


        /*
            Refresh all engines.
        */

        await refreshIntelligence();


        AGRIGUARD_APP.demoMode =
            true;


        setAppStatus(
            "Demo scenario loaded. AgriGuard AI is ready for presentation.",
            "success"
        );

    }

    catch (
        error
    ) {

        console.error(
            "Demo mode error:",
            error
        );


        setAppStatus(
            "Unable to load demonstration scenario.",
            "error"
        );

    }

    finally {

        showLoading(
            false
        );

    }
}


/* ============================================================
   51. RESET APPLICATION
============================================================ */

function initializeReset() {

    const button =
        AGRIGUARD_APP.elements.resetButton;


    if (
        !button
    ) {

        return;

    }


    button.addEventListener(
        "click",
        resetApplication
    );
}


/* ============================================================
   52. RESET APPLICATION
============================================================ */

function resetApplication() {

    if (
        typeof window.resetFieldEngine ===
        "function"
    ) {

        window.resetFieldEngine();

    }


    AGRIGUARD_APP.currentImage =
        null;


    AGRIGUARD_APP.currentImageData =
        null;


    AGRIGUARD_APP.lastDetection =
        null;


    AGRIGUARD_APP.lastRisk =
        null;


    AGRIGUARD_APP.lastWeather =
        null;


    AGRIGUARD_APP.lastSoil =
        null;


    AGRIGUARD_APP.lastRecommendation =
        null;


    AGRIGUARD_APP.lastAlerts =
        [];


    AGRIGUARD_APP.lastDashboard =
        null;


    const input =
        AGRIGUARD_APP.elements.imageInput;


    if (
        input
    ) {

        input.value =
            "";

    }


    const preview =
        AGRIGUARD_APP.elements.previewImage;


    if (
        preview
    ) {

        preview.src =
            "";

        preview.hidden =
            true;

    }


    setHTML(
        AGRIGUARD_APP.elements.detectionResult,
        ""
    );


    setHTML(
        AGRIGUARD_APP.elements.alertsContainer,
        ""
    );


    setHTML(
        AGRIGUARD_APP.elements.recommendationsContainer,
        ""
    );


    setAppStatus(
        "Application reset.",
        "info"
    );


    /*
        Reinitialize demo state.
    */

    setTimeout(
        loadDemoMode,
        100
    );
}


/* ============================================================
   53. CUSTOM EVENT LISTENERS
============================================================ */

function initializeEngineEvents() {

    window.addEventListener(
        "agriguard:fieldUpdated",
        event => {

            console.log(
                "AgriGuard field updated.",
                event.detail
            );


            renderDashboard();

        }
    );


    window.addEventListener(
        "agriguard:fieldLoaded",
        event => {

            console.log(
                "AgriGuard field loaded.",
                event.detail
            );


            renderDashboard();

        }
    );


    window.addEventListener(
        "agriguard:detectionComplete",
        event => {

            if (
                event.detail
            ) {

                AGRIGUARD_APP.lastDetection =
                    normalizeDetectionResult(
                        event.detail
                    );


                renderDetectionResult(
                    AGRIGUARD_APP.lastDetection
                );

            }

        }
    );
}


/* ============================================================
   54. KEYBOARD SHORTCUTS
============================================================ */

function initializeKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            /*
                Ctrl + Enter
                Run analysis.
            */

            if (
                event.ctrlKey &&
                event.key ===
                "Enter"
            ) {

                event.preventDefault();


                runDiseaseDetection();

            }


            /*
                Escape
                Clear processing state.
            */

            if (
                event.key ===
                "Escape"
            ) {

                showLoading(
                    false
                );

            }

        }
    );
}


/* ============================================================
   55. AUTO REFRESH
============================================================ */

function startAutoRefresh() {

    if (
        !AGRIGUARD_APP.settings.autoRefresh
    ) {

        return;

    }


    setInterval(
        () => {

            if (
                !AGRIGUARD_APP.isProcessing
            ) {

                refreshIntelligence();

            }

        },

        AGRIGUARD_APP.settings.refreshInterval
    );
}


/* ============================================================
   56. EXPORT FIELD REPORT
============================================================ */

function exportCurrentFieldReport() {

    if (
        typeof window.exportFieldJSON !==
        "function"
    ) {

        setAppStatus(
            "Field export is unavailable.",
            "warning"
        );


        return;

    }


    const json =
        window.exportFieldJSON();


    if (
        !json
    ) {

        return;

    }


    const blob =
        new Blob(
            [
                json
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;


    anchor.download =
        "agriguard-field-report.json";


    document.body.appendChild(
        anchor
    );


    anchor.click();


    anchor.remove();


    URL.revokeObjectURL(
        url
    );


    setAppStatus(
        "Field report exported.",
        "success"
    );
}


/* ============================================================
   57. EXPORT BUTTON
============================================================ */

function initializeExport() {

    const buttons =
        $$(
            "[data-action='export'], #exportReport"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                exportCurrentFieldReport
            );

        }
    );
}


/* ============================================================
   58. INITIALIZE APPLICATION
============================================================ */

async function initializeAgriGuard() {

    if (
        AGRIGUARD_APP.initialized
    ) {

        return;

    }


    console.log(
        "%c🌾 AgriGuard AI",
        "font-size:22px;font-weight:bold;"
    );


    console.log(
        "Initializing SIH 2026 prototype..."
    );


    cacheElements();


    initializeNavigation();


    initializeImageUpload();


    initializeDetection();


    initializeDemoMode();


    initializeReset();


    initializeEngineEvents();


    initializeKeyboardShortcuts();


    initializeExport();


    /*
        Initialize field engine.
    */

    if (
        typeof window.initializeFieldEngine ===
        "function"
    ) {

        try {

            window.initializeFieldEngine();

        }

        catch (
            error
        ) {

            console.warn(
                "Field engine initialization failed:",
                error
            );

        }

    }


    /*
        Load demo scenario automatically.

        This is useful for presentation day:
        the dashboard is populated immediately.
    */

    await loadDemoMode();


    startAutoRefresh();


    AGRIGUARD_APP.initialized =
        true;


    setAppStatus(
        "AgriGuard AI ready.",
        "success"
    );


    console.log(
        "AgriGuard AI initialization complete."
    );
}


/* ============================================================
   59. DOM READY
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAgriGuard
    );

}

else {

    initializeAgriGuard();

}


/* ============================================================
   60. PUBLIC API
============================================================ */

window.AGRIGUARD_APP =
    AGRIGUARD_APP;


window.runAgriGuardAnalysis =
    runDiseaseDetection;


window.loadAgriGuardDemo =
    loadDemoMode;


window.refreshAgriGuard =
    refreshIntelligence;


window.renderAgriGuardDashboard =
    renderDashboard;


window.exportAgriGuardReport =
    exportCurrentFieldReport;


/* ============================================================
   61. DEBUG API
============================================================ */

window.AgriGuardDebug = {

    state:
        AGRIGUARD_APP,

    getField:
        () =>
            typeof window.getCurrentField ===
            "function"
                ? window.getCurrentField()
                : null,

    getDashboard:
        () =>
            typeof window.getFieldDashboardModel ===
            "function"
                ? window.getFieldDashboardModel()
                : null,

    runDetection:
        runDiseaseDetection,

    refresh:
        refreshIntelligence,

    demo:
        loadDemoMode,

    reset:
        resetApplication
};


/* ============================================================
   END OF APP.JS
============================================================ */
