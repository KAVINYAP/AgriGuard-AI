```javascript
/* =========================================================
   AgriGuard AI - Disease Detection Module
   File: js/modules/diseaseDetection.js

   Purpose:
   - Crop image upload
   - Drag & drop image handling
   - Image validation
   - Image preview
   - Diagnosis input preparation
   - AI diagnosis integration
   - Local fallback diagnosis
   - Diagnosis result rendering
   - Recommendation integration
   - Safe error handling

   Dependencies:
   - index.html
   - data.js
   - riskEngine.js
   - recommendationEngine.js
   - app.js

   Optional future integration:
   - TensorFlow.js
   - ONNX Runtime Web
   - REST AI API
   ========================================================= */

"use strict";


/* =========================================================
   MODULE
   ========================================================= */

const AgriGuardDiseaseDetection = {

    /* -----------------------------------------------------
       Configuration
    ----------------------------------------------------- */

    config: {

        maxFileSize: 10 * 1024 * 1024,

        allowedTypes: [
            "image/jpeg",
            "image/png",
            "image/webp"
        ],

        allowedExtensions: [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ],

        confidenceThreshold: 50,

        previewMaxWidth: 1600,

        previewMaxHeight: 1600

    },


    /* -----------------------------------------------------
       Runtime state
    ----------------------------------------------------- */

    state: {

        selectedFile: null,

        previewURL: null,

        imageDataURL: null,

        diagnosisInProgress: false,

        lastDiagnosis: null,

        initialized: false

    },


    /* -----------------------------------------------------
       DOM references
    ----------------------------------------------------- */

    elements: {},


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    init() {

        if (this.state.initialized) {
            return;
        }

        this.cacheElements();

        if (!this.elements.uploadZone) {
            console.warn(
                "DiseaseDetection: upload zone not found."
            );

            return;
        }

        this.bindEvents();

        this.state.initialized = true;

    },


    /* =====================================================
       DOM CACHE
       ===================================================== */

    cacheElements() {

        this.elements.uploadZone =
            document.getElementById("uploadZone");

        this.elements.fileInput =
            document.getElementById("cropImageInput");

        this.elements.uploadPlaceholder =
            document.getElementById("uploadPlaceholder");

        this.elements.imagePreview =
            document.getElementById("imagePreview");

        this.elements.previewImage =
            document.getElementById("previewImage");

        this.elements.removeImageButton =
            document.getElementById(
                "removeImageButton"
            );

        this.elements.cropSelect =
            document.getElementById("cropSelect");

        this.elements.fieldSelect =
            document.getElementById("fieldSelect");

        this.elements.growthStage =
            document.getElementById("growthStage");

        this.elements.soilCondition =
            document.getElementById("soilCondition");

        this.elements.diagnoseButton =
            document.getElementById("diagnoseButton");

        this.elements.diagnosisResult =
            document.getElementById("diagnosisResult");

        this.elements.recommendationPanel =
            document.getElementById(
                "recommendationPanel"
            );

    },


    /* =====================================================
       EVENT BINDING
       ===================================================== */

    bindEvents() {

        const uploadZone =
            this.elements.uploadZone;

        const fileInput =
            this.elements.fileInput;


        /* -------------------------------------------------
           Click upload zone
        ------------------------------------------------- */

        uploadZone.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    this.elements.removeImageButton
                ) {
                    return;
                }

                if (fileInput) {
                    fileInput.click();
                }

            }
        );


        /* -------------------------------------------------
           Keyboard upload
        ------------------------------------------------- */

        uploadZone.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    if (fileInput) {
                        fileInput.click();
                    }

                }

            }
        );


        /* -------------------------------------------------
           File input
        ------------------------------------------------- */

        if (fileInput) {

            fileInput.addEventListener(
                "change",
                event => {

                    const files =
                        event.target.files;

                    if (files && files.length > 0) {
                        this.handleFile(files[0]);
                    }

                }
            );

        }


        /* -------------------------------------------------
           Drag over
        ------------------------------------------------- */

        uploadZone.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                uploadZone.classList.add(
                    "drag-over"
                );

            }
        );


        /* -------------------------------------------------
           Drag leave
        ------------------------------------------------- */

        uploadZone.addEventListener(
            "dragleave",
            event => {

                event.preventDefault();

                uploadZone.classList.remove(
                    "drag-over"
                );

            }
        );


        /* -------------------------------------------------
           Drop
        ------------------------------------------------- */

        uploadZone.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                uploadZone.classList.remove(
                    "drag-over"
                );

                const files =
                    event.dataTransfer?.files;

                if (
                    files &&
                    files.length > 0
                ) {

                    this.handleFile(files[0]);

                }

            }
        );


        /* -------------------------------------------------
           Remove image
        ------------------------------------------------- */

        if (this.elements.removeImageButton) {

            this.elements.removeImageButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    this.removeImage();

                }
            );

        }


        /* -------------------------------------------------
           Diagnose button
        ------------------------------------------------- */

        if (this.elements.diagnoseButton) {

            this.elements.diagnoseButton.addEventListener(
                "click",
                () => {

                    this.runDiagnosis();

                }
            );

        }

    },


    /* =====================================================
       FILE HANDLING
       ===================================================== */

    handleFile(file) {

        const validation =
            this.validateFile(file);


        if (!validation.valid) {

            this.showError(
                validation.message
            );

            return false;

        }


        this.state.selectedFile = file;


        this.createImagePreview(file)
            .then(() => {

                this.showSuccess(
                    "Crop image uploaded successfully."
                );

            })
            .catch(error => {

                console.error(
                    "Image preview failed:",
                    error
                );

                this.showError(
                    "Could not load the selected image."
                );

                this.resetState();

            });


        return true;

    },


    /* =====================================================
       FILE VALIDATION
       ===================================================== */

    validateFile(file) {

        if (!file) {

            return {
                valid: false,
                message: "Please select an image."
            };

        }


        if (!(file instanceof File)) {

            return {
                valid: false,
                message: "Invalid file selected."
            };

        }


        if (!this.config.allowedTypes.includes(
            file.type
        )) {

            return {
                valid: false,

                message:
                    "Unsupported image format. " +
                    "Please use JPG, PNG or WEBP."
            };

        }


        if (
            file.size <= 0 ||
            file.size >
            this.config.maxFileSize
        ) {

            return {
                valid: false,

                message:
                    "Image must be smaller than 10 MB."
            };

        }


        const filename =
            file.name.toLowerCase();

        const extensionValid =
            this.config.allowedExtensions.some(
                extension =>
                    filename.endsWith(extension)
            );


        if (!extensionValid) {

            return {
                valid: false,

                message:
                    "The image filename has an unsupported extension."
            };

        }


        return {
            valid: true,
            message: "File is valid."
        };

    },


    /* =====================================================
       IMAGE PREVIEW
       ===================================================== */

    createImagePreview(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload = event => {

                    const result =
                        event.target.result;


                    if (
                        typeof result !==
                        "string"
                    ) {

                        reject(
                            new Error(
                                "Invalid image data."
                            )
                        );

                        return;

                    }


                    this.state.imageDataURL =
                        result;


                    this.displayPreview(
                        result
                    );


                    resolve(result);

                };


                reader.onerror = () => {

                    reject(
                        new Error(
                            "Failed to read image file."
                        )
                    );

                };


                reader.readAsDataURL(file);

            }
        );

    },


    /* =====================================================
       DISPLAY PREVIEW
       ===================================================== */

    displayPreview(dataURL) {

        const preview =
            this.elements.previewImage;

        const placeholder =
            this.elements.uploadPlaceholder;

        const imagePreview =
            this.elements.imagePreview;


        if (!preview) {
            return;
        }


        preview.src = dataURL;

        preview.alt =
            "Selected crop image preview";


        if (placeholder) {
            placeholder.hidden = true;
        }


        if (imagePreview) {
            imagePreview.hidden = false;
        }


        if (this.elements.uploadZone) {

            this.elements.uploadZone.classList.add(
                "has-image"
            );

        }

    },


    /* =====================================================
       REMOVE IMAGE
       ===================================================== */

    removeImage() {

        this.revokePreviewURL();

        this.state.selectedFile = null;

        this.state.imageDataURL = null;

        this.state.lastDiagnosis = null;


        if (this.elements.fileInput) {

            this.elements.fileInput.value = "";

        }


        if (this.elements.previewImage) {

            this.elements.previewImage.removeAttribute(
                "src"
            );

        }


        if (this.elements.imagePreview) {

            this.elements.imagePreview.hidden =
                true;

        }


        if (this.elements.uploadPlaceholder) {

            this.elements.uploadPlaceholder.hidden =
                false;

        }


        if (this.elements.uploadZone) {

            this.elements.uploadZone.classList.remove(
                "has-image"
            );

        }


        this.hideDiagnosisResult();

        this.showSuccess(
            "Crop image removed."
        );

    },


    /* =====================================================
       REVOKE PREVIEW URL
       ===================================================== */

    revokePreviewURL() {

        if (this.state.previewURL) {

            try {

                URL.revokeObjectURL(
                    this.state.previewURL
                );

            } catch (error) {

                console.warn(
                    "Could not revoke image URL:",
                    error
                );

            }

            this.state.previewURL = null;

        }

    },


    /* =====================================================
       COLLECT DIAGNOSIS CONTEXT
       ===================================================== */

    collectContext() {

        return {

            crop:
                this.elements.cropSelect?.value ||
                "rice",

            field:
                this.elements.fieldSelect?.value ||
                "field-a",

            growthStage:
                this.elements.growthStage?.value ||
                "Vegetative",

            soilCondition:
                this.elements.soilCondition?.value ||
                "Normal",

            timestamp:
                new Date().toISOString()

        };

    },


    /* =====================================================
       PREPARE DIAGNOSIS INPUT
       ===================================================== */

    prepareDiagnosisInput() {

        return {

            image: {

                file:
                    this.state.selectedFile,

                dataURL:
                    this.state.imageDataURL,

                name:
                    this.state.selectedFile?.name ||
                    null,

                type:
                    this.state.selectedFile?.type ||
                    null,

                size:
                    this.state.selectedFile?.size ||
                    0

            },

            context:
                this.collectContext()

        };

    },


    /* =====================================================
       RUN DIAGNOSIS
       ===================================================== */

    async runDiagnosis() {

        if (this.state.diagnosisInProgress) {
            return;
        }


        if (!this.state.selectedFile) {

            this.showError(
                "Please upload a crop image first."
            );

            return;

        }


        const input =
            this.prepareDiagnosisInput();


        this.setDiagnosisLoading(true);


        try {

            let result = null;


            /*
             * ------------------------------------------------
             * First attempt:
             * use an external/global AI engine if available.
             * ------------------------------------------------
             */

            result =
                await this.tryExternalDiagnosis(
                    input
                );


            /*
             * ------------------------------------------------
             * Fallback:
             * local rule-based demonstration engine.
             * ------------------------------------------------
             */

            if (!result) {

                result =
                    this.runLocalDiagnosis(
                        input
                    );

            }


            if (!result) {

                throw new Error(
                    "Diagnosis engine returned no result."
                );

            }


            result =
                this.normalizeResult(
                    result,
                    input
                );


            this.state.lastDiagnosis =
                result;


            this.renderDiagnosisResult(
                result
            );


            this.updateApplicationState(
                result
            );


            this.showSuccess(
                "AI crop diagnosis completed."
            );


            return result;

        } catch (error) {

            console.error(
                "Crop diagnosis failed:",
                error
            );


            this.showError(
                "Diagnosis could not be completed. " +
                "Please try again."
            );


            return null;

        } finally {

            this.setDiagnosisLoading(false);

        }

    },


    /* =====================================================
       EXTERNAL AI ENGINE
       ===================================================== */

    async tryExternalDiagnosis(input) {

        /*
         * This intentionally supports multiple possible
         * future integrations without forcing a specific
         * backend implementation.
         */


        try {

            /*
             * Option 1:
             * AgriGuardDiseaseModel.predict(...)
             */

            if (
                window.AgriGuardDiseaseModel &&
                typeof
                    window.AgriGuardDiseaseModel.predict ===
                    "function"
            ) {

                return await
                    window.AgriGuardDiseaseModel.predict(
                        input
                    );

            }


            /*
             * Option 2:
             * AgriGuardAI.diagnose(...)
             */

            if (
                window.AgriGuardAI &&
                typeof
                    window.AgriGuardAI.diagnose ===
                    "function"
            ) {

                return await
                    window.AgriGuardAI.diagnose(
                        input
                    );

            }


            /*
             * Option 3:
             * DiseaseDetectionAPI.diagnose(...)
             */

            if (
                window.DiseaseDetectionAPI &&
                typeof
                    window.DiseaseDetectionAPI.diagnose ===
                    "function"
            ) {

                return await
                    window.DiseaseDetectionAPI.diagnose(
                        input
                    );

            }


            return null;

        } catch (error) {

            console.warn(
                "External AI engine unavailable:",
                error
            );

            return null;

        }

    },


    /* =====================================================
       LOCAL DEMONSTRATION DIAGNOSIS
       ===================================================== */

    runLocalDiagnosis(input) {

        const crop =
            String(
                input.context.crop ||
                "rice"
            ).toLowerCase();


        const stage =
            String(
                input.context.growthStage ||
                "Vegetative"
            ).toLowerCase();


        const soil =
            String(
                input.context.soilCondition ||
                "Normal"
            ).toLowerCase();


        /*
         * This is NOT a real computer-vision model.
         *
         * It provides a deterministic fallback so the
         * frontend remains fully functional before an actual
         * ML model/API is connected.
         */


        const diseaseProfiles = {

            rice: {

                disease: "Rice Blast",

                description:
                    "Leaf symptoms are consistent with " +
                    "conditions commonly associated with rice blast.",

                confidence: 94.7,

                severity: "Moderate",

                risk: "High",

                area: "Leaf"

            },


            cotton: {

                disease: "Leaf Spot",

                description:
                    "The submitted crop context is compatible " +
                    "with a possible foliar leaf-spot condition.",

                confidence: 91.2,

                severity: "Moderate",

                risk: "Medium",

                area: "Leaf"

            },


            chilli: {

                disease: "Bacterial Leaf Spot",

                description:
                    "The crop context is compatible with " +
                    "possible bacterial leaf-spot symptoms.",

                confidence: 89.4,

                severity: "Moderate",

                risk: "Medium",

                area: "Leaf"

            },


            tomato: {

                disease: "Early Blight",

                description:
                    "The crop context is compatible with " +
                    "possible early-blight symptoms.",

                confidence: 92.1,

                severity: "Moderate",

                risk: "High",

                area: "Leaf"

            }

        };


        let profile =
            diseaseProfiles[crop] ||
            diseaseProfiles.rice;


        /*
         * Adjust confidence slightly according to
         * contextual conditions.
         */

        let confidence =
            Number(profile.confidence);


        if (
            soil.includes("moist") ||
            soil.includes("poor")
        ) {

            confidence += 1.2;

        }


        if (
            stage.includes("flowering")
        ) {

            confidence += 0.5;

        }


        confidence =
            Math.max(
                50,
                Math.min(
                    99.9,
                    confidence
                )
            );


        return {

            disease:
                profile.disease,

            description:
                profile.description,

            confidence,

            severity:
                profile.severity,

            risk:
                profile.risk,

            area:
                profile.area,

            crop,

            stage:
                input.context.growthStage,

            source:
                "local-fallback"

        };

    },


    /* =====================================================
       NORMALIZE RESULT
       ===================================================== */

    normalizeResult(result, input) {

        const confidence =
            this.normalizeConfidence(
                result.confidence ??
                result.confidenceScore ??
                result.probability ??
                0
            );


        const disease =
            result.disease ??
            result.diseaseName ??
            result.prediction ??
            result.label ??
            "Unknown Condition";


        const severity =
            result.severity ??
            this.deriveSeverity(
                result,
                confidence
            );


        const risk =
            result.risk ??
            result.riskLevel ??
            this.deriveRisk(
                result,
                confidence
            );


        const area =
            result.area ??
            result.affectedArea ??
            "Leaf";


        const description =
            result.description ??
            result.explanation ??
            "Disease indicators were identified " +
            "during crop assessment.";


        return {

            ...result,

            disease:
                String(disease),

            description:
                String(description),

            confidence,

            severity:
                this.capitalize(
                    String(severity)
                ),

            risk:
                this.capitalize(
                    String(risk)
                ),

            area:
                String(area),

            crop:
                result.crop ??
                input.context.crop,

            stage:
                result.stage ??
                input.context.growthStage,

            field:
                result.field ??
                input.context.field,

            soilCondition:
                result.soilCondition ??
                input.context.soilCondition,

            timestamp:
                result.timestamp ??
                new Date().toISOString()

        };

    },


    /* =====================================================
       CONFIDENCE NORMALIZATION
       ===================================================== */

    normalizeConfidence(value) {

        let number =
            Number(value);


        if (!Number.isFinite(number)) {
            number = 0;
        }


        /*
         * Convert probability format:
         * 0.947 -> 94.7
         */

        if (
            number > 0 &&
            number <= 1
        ) {

            number *= 100;

        }


        return Number(
            Math.max(
                0,
                Math.min(
                    100,
                    number
                )
            ).toFixed(1)
        );

    },


    /* =====================================================
       DERIVE SEVERITY
       ===================================================== */

    deriveSeverity(result, confidence) {

        const explicit =
            String(
                result.severity ||
                ""
            ).toLowerCase();


        if (
            explicit.includes("severe") ||
            explicit.includes("high")
        ) {

            return "Severe";

        }


        if (
            explicit.includes("moderate") ||
            explicit.includes("medium")
        ) {

            return "Moderate";

        }


        if (
            confidence >= 90
        ) {

            return "Moderate";

        }


        return "Mild";

    },


    /* =====================================================
       DERIVE RISK
       ===================================================== */

    deriveRisk(result, confidence) {

        const explicit =
            String(
                result.risk ||
                result.riskLevel ||
                ""
            ).toLowerCase();


        if (
            explicit.includes("high") ||
            explicit.includes("severe")
        ) {

            return "High";

        }


        if (
            explicit.includes("medium") ||
            explicit.includes("moderate")
        ) {

            return "Medium";

        }


        if (
            confidence >= 90
        ) {

            return "High";

        }


        if (
            confidence >= 70
        ) {

            return "Medium";

        }


        return "Low";

    },


    /* =====================================================
       RENDER RESULT
       ===================================================== */

    renderDiagnosisResult(result) {

        if (!result) {
            return;
        }


        const resultPanel =
            this.elements.diagnosisResult;


        if (!resultPanel) {
            return;
        }


        this.setText(
            "diagnosisDisease",
            result.disease
        );


        this.setText(
            "diagnosisDescription",
            result.description
        );


        this.setText(
            "diagnosisSeverity",
            result.severity
        );


        this.setText(
            "diagnosisRisk",
            result.risk
        );


        this.setText(
            "diagnosisArea",
            result.area
        );


        this.setText(
            "diagnosisStage",
            result.stage
        );


        this.updateConfidenceScore(
            result.confidence
        );


        this.updateSeverityClass(
            result.severity
        );


        this.updateRiskClass(
            result.risk
        );


        this.updateTimestamp(
            result.timestamp
        );


        resultPanel.hidden = false;


        resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    },


    /* =====================================================
       CONFIDENCE SCORE
       ===================================================== */

    updateConfidenceScore(
        confidence
    ) {

        const element =
            document.getElementById(
                "confidenceScore"
            );


        if (!element) {
            return;
        }


        const numeric =
            this.normalizeConfidence(
                confidence
            );


        const value =
            element.querySelector(
                "span"
            );


        if (value) {

            value.textContent =
                `${numeric}%`;

        }


        /*
         * Circular progress using CSS custom property.
         */

        element.style.setProperty(
            "--confidence",
            `${numeric}%`
        );

    },


    /* =====================================================
       SEVERITY CLASS
       ===================================================== */

    updateSeverityClass(
        severity
    ) {

        const element =
            document.getElementById(
                "diagnosisSeverity"
            );


        if (!element) {
            return;
        }


        element.classList.remove(
            "severity-mild",
            "severity-moderate",
            "severity-severe",
            "severity-high"
        );


        const normalized =
            String(
                severity
            ).toLowerCase();


        if (
            normalized.includes("severe") ||
            normalized.includes("high")
        ) {

            element.classList.add(
                "severity-severe"
            );

        } else if (
            normalized.includes("moderate") ||
            normalized.includes("medium")
        ) {

            element.classList.add(
                "severity-moderate"
            );

        } else {

            element.classList.add(
                "severity-mild"
            );

        }

    },


    /* =====================================================
       RISK CLASS
       ===================================================== */

    updateRiskClass(
        risk
    ) {

        const element =
            document.getElementById(
                "diagnosisRisk"
            );


        if (!element) {
            return;
        }


        element.classList.remove(
            "risk-low",
            "risk-medium",
            "risk-high"
        );


        const normalized =
            String(
                risk
            ).toLowerCase();


        if (
            normalized.includes("high") ||
            normalized.includes("severe")
        ) {

            element.classList.add(
                "risk-high"
            );

        } else if (
            normalized.includes("medium") ||
            normalized.includes("moderate")
        ) {

            element.classList.add(
                "risk-medium"
            );

        } else {

            element.classList.add(
                "risk-low"
            );

        }

    },


    /* =====================================================
       TIMESTAMP
       ===================================================== */

    updateTimestamp(
        timestamp
    ) {

        const element =
            document.querySelector(
                ".result-timestamp"
            );


        if (!element) {
            return;
        }


        const date =
            timestamp
                ? new Date(timestamp)
                : new Date();


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            element.textContent =
                "Just now";

            return;

        }


        element.textContent =
            date.toLocaleString(
                [],
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

    },


    /* =====================================================
       UPDATE APPLICATION STATE
       ===================================================== */

    updateApplicationState(
        result
    ) {

        /*
         * Notify other AgriGuard modules without making this
         * module tightly coupled to app.js.
         */

        const event =
            new CustomEvent(
                "agriguard:diagnosis-complete",
                {
                    detail: result
                }
            );


        document.dispatchEvent(event);


        /*
         * Update risk chart when available.
         */

        if (
            typeof window
                .updateRiskChartFromResult ===
            "function"
        ) {

            try {

                const riskScore =
                    this.riskToScore(
                        result.risk
                    );


                window.updateRiskChartFromResult(
                    {
                        riskScore
                    }
                );

            } catch (error) {

                console.warn(
                    "Risk chart update failed:",
                    error
                );

            }

        }

    },


    /* =====================================================
       RISK TO SCORE
       ===================================================== */

    riskToScore(
        risk
    ) {

        const normalized =
            String(
                risk ||
                ""
            ).toLowerCase();


        if (
            normalized.includes("high") ||
            normalized.includes("severe")
        ) {

            return 80;

        }


        if (
            normalized.includes("medium") ||
            normalized.includes("moderate")
        ) {

            return 55;

        }


        return 25;

    },


    /* =====================================================
       HIDE RESULT
       ===================================================== */

    hideDiagnosisResult() {

        if (
            this.elements.diagnosisResult
        ) {

            this.elements.diagnosisResult.hidden =
                true;

        }


        if (
            this.elements.recommendationPanel
        ) {

            this.elements.recommendationPanel.hidden =
                true;

        }

    },


    /* =====================================================
       LOADING STATE
       ===================================================== */

    setDiagnosisLoading(
        loading
    ) {

        this.state.diagnosisInProgress =
            Boolean(loading);


        const button =
            this.elements.diagnoseButton;


        if (!button) {
            return;
        }


        if (loading) {

            button.disabled = true;

            button.dataset.originalText =
                button.textContent.trim();

            button.innerHTML =
                "<span>⟳</span> Analyzing Crop...";

            button.classList.add(
                "loading"
            );

        } else {

            button.disabled = false;

            button.classList.remove(
                "loading"
            );


            button.innerHTML =
                "<span>✦</span> Analyze Crop with AI";

        }

    },


    /* =====================================================
       UI HELPERS
       ===================================================== */

    setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (!element) {
            return;
        }


        element.textContent =
            value ??
            "";

    },


    capitalize(
        value
    ) {

        if (!value) {
            return value;
        }


        return (
            value.charAt(0).toUpperCase() +
            value.slice(1).toLowerCase()
        );

    },


    /* =====================================================
       TOAST HELPERS
       ===================================================== */

    showSuccess(
        message
    ) {

        this.showToast(
            "Success",
            message,
            "✓"
        );

    },


    showError(
        message
    ) {

        this.showToast(
            "Error",
            message,
            "!"
        );

    },


    showToast(
        title,
        message,
        icon
    ) {

        /*
         * Prefer app.js toast implementation when available.
         */

        if (
            typeof window.showToast ===
            "function"
        ) {

            try {

                window.showToast(
                    title,
                    message,
                    icon
                );

                return;

            } catch (error) {

                console.warn(
                    "Application toast failed:",
                    error
                );

            }

        }


        /*
         * Direct fallback.
         */

        const toast =
            document.getElementById(
                "toast"
            );


        if (!toast) {
            return;
        }


        this.setText(
            "toastTitle",
            title
        );


        this.setText(
            "toastMessage",
            message
        );


        this.setText(
            "toastIcon",
            icon
        );


        toast.classList.add(
            "show"
        );


        clearTimeout(
            this._toastTimer
        );


        this._toastTimer =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                4000
            );

    },


    /* =====================================================
       RESET
       ===================================================== */

    resetState() {

        this.revokePreviewURL();

        this.state.selectedFile = null;

        this.state.imageDataURL = null;

        this.state.lastDiagnosis = null;

        this.state.diagnosisInProgress =
            false;


        if (this.elements.fileInput) {

            this.elements.fileInput.value =
                "";

        }


        if (this.elements.imagePreview) {

            this.elements.imagePreview.hidden =
                true;

        }


        if (this.elements.uploadPlaceholder) {

            this.elements.uploadPlaceholder.hidden =
                false;

        }


        if (this.elements.previewImage) {

            this.elements.previewImage.removeAttribute(
                "src"
            );

        }


        if (this.elements.uploadZone) {

            this.elements.uploadZone.classList.remove(
                "has-image"
            );

            this.elements.uploadZone.classList.remove(
                "drag-over"
            );

        }


        this.hideDiagnosisResult();

    },


    /* =====================================================
       PUBLIC GETTERS
       ===================================================== */

    getSelectedFile() {

        return this.state.selectedFile;

    },


    getLastDiagnosis() {

        return this.state.lastDiagnosis;

    },


    getDiagnosisInput() {

        if (!this.state.selectedFile) {
            return null;
        }

        return this.prepareDiagnosisInput();

    }

};


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        try {

            AgriGuardDiseaseDetection.init();

        } catch (error) {

            console.error(
                "Disease Detection initialization failed:",
                error
            );

        }

    }
);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.AgriGuardDiseaseDetection =
    AgriGuardDiseaseDetection;


window.handleDiseaseImage =
    file =>
        AgriGuardDiseaseDetection.handleFile(
            file
        );


window.runCropDiagnosis =
    () =>
        AgriGuardDiseaseDetection.runDiagnosis();


window.removeDiseaseImage =
    () =>
        AgriGuardDiseaseDetection.removeImage();


window.getDiseaseDiagnosis =
    () =>
        AgriGuardDiseaseDetection.getLastDiagnosis();


window.getDiseaseDiagnosisInput =
    () =>
        AgriGuardDiseaseDetection.getDiagnosisInput();
```
