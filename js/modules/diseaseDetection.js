/* ============================================================
   AGRIGUARD AI
   SIH 2026 PROTOTYPE
   DISEASE DETECTION MODULE
============================================================ */

/*
    PURPOSE
    -------
    This module handles the complete crop-image diagnosis workflow:

        Image Upload
             ↓
        Image Validation
             ↓
        Image Preview
             ↓
        Crop Selection
             ↓
        AI Analysis Simulation
             ↓
        Disease Prediction
             ↓
        Confidence Score
             ↓
        Severity
             ↓
        Disease Risk
             ↓
        Explanation
             ↓
        Recommendations
             ↓
        Alert Generation

    IMPORTANT
    ----------
    This is the FRONTEND prototype layer.

    For the SIH demo, it provides a realistic AI workflow
    without requiring an external ML server.

    Later, the function runRealModel() can be connected to:
        - TensorFlow
        - PyTorch
        - FastAPI
        - Flask
        - Node.js
        - Roboflow
        - Custom CNN / EfficientNet / YOLO model
*/


/* ============================================================
   01. MODULE STATE
============================================================ */

const DISEASE_DETECTION_STATE = {

    selectedFile: null,

    imageURL: null,

    selectedCrop: "rice",

    analyzing: false,

    result: null,

    confidence: 0,

    imageQuality: 0,

    analysisStartedAt: null,

    analysisCompletedAt: null
};


/* ============================================================
   02. IMAGE VALIDATION
============================================================ */

function validateCropImage(file) {

    if (!file) {

        return {
            valid: false,
            message: "Please select a crop image."
        };

    }


    /* Check file type */

    const supportedTypes =
        AGRIGUARD_CONFIG.supportedImageTypes;


    if (
        !supportedTypes.includes(
            file.type
        )
    ) {

        return {
            valid: false,
            message:
                "Unsupported image format. Please upload JPG, PNG or WEBP."
        };

    }


    /* Check file size */

    const maxSize =
        AGRIGUARD_CONFIG.maxImageSizeMB *
        1024 *
        1024;


    if (
        file.size > maxSize
    ) {

        return {
            valid: false,
            message:
                `Image size must be below ${AGRIGUARD_CONFIG.maxImageSizeMB} MB.`
        };

    }


    return {
        valid: true,
        message: "Image accepted."
    };
}


/* ============================================================
   03. IMAGE QUALITY ESTIMATION
============================================================ */

/*
    This is a lightweight browser-side quality estimator.

    It does NOT claim to replace a real computer-vision
    quality model.

    It checks:
        - resolution
        - aspect ratio
        - brightness
        - basic image readability
*/

async function estimateImageQuality(file) {

    return new Promise(
        resolve => {

            const image =
                new Image();


            const url =
                URL.createObjectURL(
                    file
                );


            image.onload = function () {

                let score = 100;


                /* Resolution */

                const pixels =
                    image.width *
                    image.height;


                if (
                    pixels < 300000
                ) {

                    score -= 25;

                } else if (
                    pixels < 600000
                ) {

                    score -= 10;

                }


                /* Very small dimensions */

                if (
                    image.width < 500 ||
                    image.height < 500
                ) {

                    score -= 15;

                }


                /* Extreme aspect ratio */

                const ratio =
                    image.width /
                    image.height;


                if (
                    ratio > 3 ||
                    ratio < 0.33
                ) {

                    score -= 10;

                }


                URL.revokeObjectURL(
                    url
                );


                resolve(
                    Math.max(
                        0,
                        Math.min(
                            100,
                            score
                        )
                    )
                );

            };


            image.onerror = function () {

                URL.revokeObjectURL(
                    url
                );

                resolve(50);

            };


            image.src = url;

        }
    );
}


/* ============================================================
   04. LOAD IMAGE
============================================================ */

async function loadCropImage(file) {

    const validation =
        validateCropImage(
            file
        );


    if (!validation.valid) {

        throw new Error(
            validation.message
        );

    }


    /* Store file */

    DISEASE_DETECTION_STATE.selectedFile =
        file;


    /* Create preview URL */

    if (
        DISEASE_DETECTION_STATE.imageURL
    ) {

        URL.revokeObjectURL(
            DISEASE_DETECTION_STATE.imageURL
        );

    }


    DISEASE_DETECTION_STATE.imageURL =
        URL.createObjectURL(
            file
        );


    /* Estimate quality */

    DISEASE_DETECTION_STATE.imageQuality =
        await estimateImageQuality(
            file
        );


    return {

        file,

        url:
            DISEASE_DETECTION_STATE.imageURL,

        quality:
            DISEASE_DETECTION_STATE.imageQuality,

        name:
            file.name,

        size:
            file.size,

        type:
            file.type
    };
}


/* ============================================================
   05. CROP SELECTION
============================================================ */

function setDetectionCrop(cropId) {

    const crop =
        getCropById(
            cropId
        );


    if (!crop) {

        console.warn(
            "Unknown crop:",
            cropId
        );

        return false;

    }


    DISEASE_DETECTION_STATE.selectedCrop =
        cropId;


    APP_STATE.selectedCropId =
        cropId;


    return true;
}


/* ============================================================
   06. IMAGE PREPROCESSING SIMULATION
============================================================ */

/*
    A real ML pipeline would perform operations such as:

        resize
        normalization
        color-space conversion
        augmentation
        tensor conversion

    We simulate the pipeline for the prototype UI.
*/

async function preprocessImage() {

    if (
        !DISEASE_DETECTION_STATE.selectedFile
    ) {

        throw new Error(
            "No image selected."
        );

    }


    await delay(
        350
    );


    return {

        processed: true,

        resize:
            "224 × 224",

        normalized: true,

        colorSpace:
            "RGB",

        tensorReady: true
    };
}


/* ============================================================
   07. AI MODEL SIMULATION
============================================================ */

/*
    This function simulates a model prediction.

    The prototype intentionally produces deterministic
    results based on the selected crop so the presentation
    remains reliable.

    During the final presentation, you don't want the
    demonstration to randomly fail.
*/

async function runDemoModel(
    cropId
) {

    await delay(
        700
    );


    const crop =
        getCropById(
            cropId
        );


    if (!crop) {

        throw new Error(
            "Crop not supported."
        );

    }


    /*
        Select a representative disease for
        demonstration.

        The first disease is used because it produces
        a predictable presentation flow.
    */

    const diseaseId =
        crop.commonDiseases[0];


    const disease =
        getDiseaseById(
            diseaseId
        );


    if (!disease) {

        return {

            diseaseId: null,

            diseaseName:
                "Healthy Crop",

            confidence:
                96.4,

            severity:
                "None",

            riskScore:
                15,

            explanation:
                "No significant disease indicators were detected."
        };

    }


    const response =
        DEMO_DIAGNOSIS_RESPONSES[
            cropId
        ];


    if (
        response &&
        response[diseaseId]
    ) {

        return {
            ...response[diseaseId]
        };

    }


    return {

        diseaseId,

        diseaseName:
            disease.name,

        confidence:
            disease.confidenceBaseline,

        severity:
            disease.severity,

        riskScore:
            disease.severity === "Critical"
                ? 90
                : disease.severity === "High"
                    ? 78
                    : 55,

        explanation:
            disease.description
    };
}


/* ============================================================
   08. REAL MODEL API PLACEHOLDER
============================================================ */

/*
    FUTURE BACKEND INTEGRATION

    Example architecture:

        Frontend
           ↓
        /api/predict
           ↓
        FastAPI / Flask
           ↓
        CNN / EfficientNet / YOLO
           ↓
        Prediction JSON

    Expected response:

    {
        diseaseId: "rice_blast",
        confidence: 94.7,
        severity: "High"
    }

    This function is intentionally kept separate from
    runDemoModel() so the frontend can later switch from
    demo mode to the actual ML model.
*/

async function runRealModel(
    imageFile,
    cropId
) {

    /*
        Replace this section with your real backend URL.

        Example:

        const formData = new FormData();

        formData.append(
            "image",
            imageFile
        );

        formData.append(
            "crop",
            cropId
        );

        const response = await fetch(
            "/api/predict",
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(
                "AI service unavailable."
            );
        }

        return await response.json();
    */


    console.warn(
        "Real ML API is not connected. Using demo model."
    );


    return runDemoModel(
        cropId
    );
}


/* ============================================================
   09. CONFIDENCE ADJUSTMENT
============================================================ */

function adjustConfidence(
    confidence,
    imageQuality
) {

    /*
        High-quality image:
        preserve confidence.

        Poor-quality image:
        slightly reduce confidence.
    */

    let adjusted =
        confidence;


    if (
        imageQuality < 50
    ) {

        adjusted -= 10;

    } else if (
        imageQuality < 70
    ) {

        adjusted -= 5;

    }


    return Number(
        Math.max(
            0,
            Math.min(
                99.9,
                adjusted
            )
        ).toFixed(1)
    );
}


/* ============================================================
   10. BUILD COMPLETE DIAGNOSIS
============================================================ */

function buildCompleteDiagnosis(
    prediction
) {

    const disease =
        prediction.diseaseId
            ? getDiseaseById(
                prediction.diseaseId
            )
            : null;


    const crop =
        getCropById(
            DISEASE_DETECTION_STATE.selectedCrop
        );


    const recommendation =
        prediction.diseaseId
            ? getRecommendationForDisease(
                prediction.diseaseId
            )
            : null;


    const risk =
        classifyRisk(
            prediction.riskScore
        );


    const confidence =
        adjustConfidence(
            prediction.confidence,
            DISEASE_DETECTION_STATE.imageQuality
        );


    /*
        Confidence warning
    */

    let confidenceStatus =
        "High Confidence";


    if (
        confidence < 70
    ) {

        confidenceStatus =
            "Low Confidence";

    } else if (
        confidence < 85
    ) {

        confidenceStatus =
            "Moderate Confidence";

    }


    return {

        id:
            `DX-${Date.now()}`,

        cropId:
            crop?.id || null,

        cropName:
            crop?.name || "Unknown Crop",

        diseaseId:
            prediction.diseaseId || null,

        diseaseName:
            prediction.diseaseName,

        scientificName:
            disease?.scientificName || null,

        category:
            disease?.category || "None",

        confidence,

        confidenceStatus,

        imageQuality:
            DISEASE_DETECTION_STATE.imageQuality,

        severity:
            prediction.severity,

        riskScore:
            prediction.riskScore,

        riskLevel:
            risk.label,

        explanation:
            prediction.explanation,

        symptoms:
            disease?.symptoms || [],

        riskFactors:
            disease?.riskFactors || [],

        favorableConditions:
            disease?.favorableConditions || {},

        prevention:
            disease?.prevention || [],

        management:
            disease?.management || [],

        recommendations:
            recommendation,

        image:
            DISEASE_DETECTION_STATE.imageURL,

        timestamp:
            new Date().toISOString()
    };
}


/* ============================================================
   11. MAIN AI DIAGNOSIS PIPELINE
============================================================ */

async function analyzeCropImage(
    file = null,
    cropId = null,
    options = {}
) {

    /*
        Use currently selected image
        if a new file is not supplied.
    */

    if (file) {

        await loadCropImage(
            file
        );

    }


    if (
        cropId
    ) {

        setDetectionCrop(
            cropId
        );

    }


    if (
        !DISEASE_DETECTION_STATE.selectedFile
    ) {

        throw new Error(
            "Please upload a crop image first."
        );

    }


    if (
        DISEASE_DETECTION_STATE.analyzing
    ) {

        return null;

    }


    DISEASE_DETECTION_STATE.analyzing =
        true;


    DISEASE_DETECTION_STATE.analysisStartedAt =
        new Date().toISOString();


    try {

        /*
            STEP 1
            ------
            Image preprocessing
        */

        await preprocessImage();


        /*
            STEP 2
            ------
            AI prediction
        */

        let prediction;


        if (
            options.useRealModel === true
        ) {

            prediction =
                await runRealModel(
                    DISEASE_DETECTION_STATE.selectedFile,
                    DISEASE_DETECTION_STATE.selectedCrop
                );

        } else {

            prediction =
                await runDemoModel(
                    DISEASE_DETECTION_STATE.selectedCrop
                );

        }


        /*
            STEP 3
            ------
            Build complete result
        */

        const result =
            buildCompleteDiagnosis(
                prediction
            );


        /*
            STEP 4
            ------
            Save result
        */

        DISEASE_DETECTION_STATE.result =
            result;


        DISEASE_DETECTION_STATE.confidence =
            result.confidence;


        DISEASE_DETECTION_STATE.analysisCompletedAt =
            new Date().toISOString();


        APP_STATE.selectedDiagnosis =
            result;


        /*
            STEP 5
            ------
            Add to diagnosis history
        */

        addDiagnosisToHistory(
            result
        );


        /*
            STEP 6
            ------
            Generate alert when necessary
        */

        if (
            result.riskScore >=
            AGRIGUARD_CONFIG.thresholds.highDiseaseRisk
        ) {

            createDiagnosisAlert(
                result
            );

        }


        /*
            STEP 7
            ------
            Dispatch event to the application
        */

        dispatchDiagnosisEvent(
            result
        );


        return result;

    } catch (error) {

        console.error(
            "Disease analysis failed:",
            error
        );

        throw error;

    } finally {

        DISEASE_DETECTION_STATE.analyzing =
            false;

    }
}


/* ============================================================
   12. ADD DIAGNOSIS TO HISTORY
============================================================ */

function addDiagnosisToHistory(
    result
) {

    if (!result) {
        return;
    }


    const entry = {

        id:
            result.id,

        fieldId:
            APP_STATE.selectedFieldId,

        cropId:
            result.cropId,

        diseaseId:
            result.diseaseId,

        diseaseName:
            result.diseaseName,

        confidence:
            result.confidence,

        severity:
            result.severity,

        riskScore:
            result.riskScore,

        imageQuality:
            result.imageQuality,

        date:
            new Date().toISOString()
                .split("T")[0],

        time:
            new Date()
                .toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                ),

        status:
            result.diseaseId
                ? (
                    result.confidence >= 85
                        ? "confirmed"
                        : "suspected"
                )
                : "healthy"
    };


    /*
        Add newest diagnosis at top.
    */

    DIAGNOSIS_HISTORY.unshift(
        entry
    );


    /*
        Keep demo history manageable.
    */

    if (
        DIAGNOSIS_HISTORY.length > 50
    ) {

        DIAGNOSIS_HISTORY.pop();

    }


    return entry;
}


/* ============================================================
   13. CREATE ALERT
============================================================ */

function createDiagnosisAlert(
    result
) {

    if (!result) {
        return;
    }


    /*
        Avoid duplicate active alerts
        for the same disease.
    */

    const duplicate =
        ALERTS.some(
            alert =>
                alert.fieldId ===
                    APP_STATE.selectedFieldId &&
                alert.type ===
                    "Disease Detection" &&
                alert.status ===
                    "active" &&
                alert.title.includes(
                    result.diseaseName
                )
        );


    if (duplicate) {

        return;

    }


    const alert = {

        id:
            `ALT-${Date.now()}`,

        severity:
            result.riskScore >= 85
                ? "critical"
                : "high",

        type:
            "Disease Detection",

        title:
            `${result.diseaseName} Detected`,

        fieldId:
            APP_STATE.selectedFieldId,

        fieldName:
            getFieldById(
                APP_STATE.selectedFieldId
            )?.name ||
            "Selected Field",

        message:
            `AI analysis detected ${result.diseaseName} with ${result.confidence}% confidence.`,

        riskScore:
            result.riskScore,

        createdAt:
            new Date().toLocaleString(
                "en-IN"
            ),

        status:
            "active",

        reasons: [
            `AI confidence ${result.confidence}%`,
            `Disease risk ${result.riskScore}%`,
            `Image quality ${result.imageQuality}%`
        ],

        recommendedAction:
            result.recommendations?.escalation ||
            "Inspect the affected crop and follow locally approved agricultural guidance."
    };


    ALERTS.unshift(
        alert
    );


    APP_STATE.notificationCount =
        ALERTS.filter(
            item =>
                item.status === "active"
        ).length;


    return alert;
}


/* ============================================================
   14. DIAGNOSIS EVENT
============================================================ */

function dispatchDiagnosisEvent(
    result
) {

    const event =
        new CustomEvent(
            "agriguard:diagnosisComplete",
            {
                detail: result
            }
        );


    window.dispatchEvent(
        event
    );
}


/* ============================================================
   15. RESET DETECTION
============================================================ */

function resetDiseaseDetection() {

    if (
        DISEASE_DETECTION_STATE.imageURL
    ) {

        URL.revokeObjectURL(
            DISEASE_DETECTION_STATE.imageURL
        );

    }


    DISEASE_DETECTION_STATE.selectedFile =
        null;

    DISEASE_DETECTION_STATE.imageURL =
        null;

    DISEASE_DETECTION_STATE.analyzing =
        false;

    DISEASE_DETECTION_STATE.result =
        null;

    DISEASE_DETECTION_STATE.confidence =
        0;

    DISEASE_DETECTION_STATE.imageQuality =
        0;

    DISEASE_DETECTION_STATE.analysisStartedAt =
        null;

    DISEASE_DETECTION_STATE.analysisCompletedAt =
        null;


    APP_STATE.selectedDiagnosis =
        null;


    dispatchDiagnosisEvent(
        null
    );
}


/* ============================================================
   16. GET CURRENT RESULT
============================================================ */

function getCurrentDiagnosis() {

    return (
        DISEASE_DETECTION_STATE.result
        || null
    );
}


/* ============================================================
   17. GET DETECTION STATUS
============================================================ */

function getDetectionStatus() {

    if (
        DISEASE_DETECTION_STATE.analyzing
    ) {

        return "analyzing";

    }


    if (
        DISEASE_DETECTION_STATE.result
    ) {

        return "completed";

    }


    if (
        DISEASE_DETECTION_STATE.selectedFile
    ) {

        return "ready";

    }


    return "idle";
}


/* ============================================================
   18. FORMAT CONFIDENCE
============================================================ */

function formatConfidence(
    confidence
) {

    return `${Number(
        confidence || 0
    ).toFixed(1)}%`;
}


/* ============================================================
   19. GET DISEASE STATUS MESSAGE
============================================================ */

function getDiseaseStatusMessage(
    result
) {

    if (!result) {

        return {
            title: "No Diagnosis",
            message: "Upload a crop image to begin."
        };

    }


    if (
        !result.diseaseId
    ) {

        return {

            title:
                "Crop Appears Healthy",

            message:
                "No significant supported disease indicators were detected."
        };

    }


    if (
        result.confidence < 70
    ) {

        return {

            title:
                "Low Confidence Detection",

            message:
                "The image may not contain enough visual information. Capture a clearer image and scan again."
        };

    }


    if (
        result.riskScore >= 85
    ) {

        return {

            title:
                "Critical Attention Required",

            message:
                "The detected condition has a high potential impact. Inspect the field promptly."
        };

    }


    if (
        result.riskScore >= 70
    ) {

        return {

            title:
                "High Risk Detected",

            message:
                "Early intervention and close monitoring are recommended."
        };

    }


    return {

        title:
            "Disease Detected",

        message:
            "Follow the recommended management and monitoring steps."
    };
}


/* ============================================================
   20. UTILITY DELAY
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
   21. DRAG & DROP SUPPORT
============================================================ */

function setupImageDropZone(
    dropZone,
    fileInput
) {

    if (
        !dropZone ||
        !fileInput
    ) {

        return;

    }


    /*
        Prevent browser default behavior.
    */

    [
        "dragenter",
        "dragover",
        "dragleave",
        "drop"
    ].forEach(
        eventName => {

            dropZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                }
            );

        }
    );


    /*
        Visual state
    */

    [
        "dragenter",
        "dragover"
    ].forEach(
        eventName => {

            dropZone.addEventListener(
                eventName,
                () => {

                    dropZone.classList.add(
                        "drag-active"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        eventName => {

            dropZone.addEventListener(
                eventName,
                () => {

                    dropZone.classList.remove(
                        "drag-active"
                    );

                }
            );

        }
    );


    /*
        Handle dropped file
    */

    dropZone.addEventListener(
        "drop",
        async event => {

            const files =
                event.dataTransfer.files;


            if (
                files &&
                files.length > 0
            ) {

                const file =
                    files[0];


                try {

                    await loadCropImage(
                        file
                    );


                    fileInput.dispatchEvent(
                        new CustomEvent(
                            "agriguard:imageLoaded",
                            {
                                detail: {
                                    file,
                                    state:
                                        DISEASE_DETECTION_STATE
                                }
                            }
                        )
                    );

                } catch (
                    error
                ) {

                    console.error(
                        error
                    );

                }

            }

        }
    );
}


/* ============================================================
   22. FILE INPUT SETUP
============================================================ */

function setupImageInput(
    input
) {

    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files?.[0];


            if (!file) {
                return;
            }


            try {

                const result =
                    await loadCropImage(
                        file
                    );


                input.dispatchEvent(
                    new CustomEvent(
                        "agriguard:imageLoaded",
                        {
                            detail: result
                        }
                    )
                );


            } catch (
                error
            ) {

                console.error(
                    "Image upload error:",
                    error
                );


                input.dispatchEvent(
                    new CustomEvent(
                        "agriguard:imageError",
                        {
                            detail: {
                                message:
                                    error.message
                            }
                        }
                    )
                );

            }

        }
    );
}


/* ============================================================
   23. PUBLIC API
============================================================ */

window.DISEASE_DETECTION_STATE =
    DISEASE_DETECTION_STATE;


window.validateCropImage =
    validateCropImage;


window.estimateImageQuality =
    estimateImageQuality;


window.loadCropImage =
    loadCropImage;


window.setDetectionCrop =
    setDetectionCrop;


window.preprocessImage =
    preprocessImage;


window.runDemoModel =
    runDemoModel;


window.runRealModel =
    runRealModel;


window.analyzeCropImage =
    analyzeCropImage;


window.buildCompleteDiagnosis =
    buildCompleteDiagnosis;


window.addDiagnosisToHistory =
    addDiagnosisToHistory;


window.createDiagnosisAlert =
    createDiagnosisAlert;


window.resetDiseaseDetection =
    resetDiseaseDetection;


window.getCurrentDiagnosis =
    getCurrentDiagnosis;


window.getDetectionStatus =
    getDetectionStatus;


window.formatConfidence =
    formatConfidence;


window.getDiseaseStatusMessage =
    getDiseaseStatusMessage;


window.setupImageDropZone =
    setupImageDropZone;


window.setupImageInput =
    setupImageInput;


/* ============================================================
   24. INITIALIZATION
============================================================ */

console.log(
    "%c🔬 Disease Detection Module",
    "font-size:16px;font-weight:bold;"
);

console.log(
    "AI image-diagnosis pipeline ready."
);

console.log(
    "Supported crops:",
    CROPS.map(
        crop => crop.name
    ).join(", ")
);
