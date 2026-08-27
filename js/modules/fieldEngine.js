/* ============================================================
   AGRIGUARD AI
   SIH 2026 PROTOTYPE
   FIELD INTELLIGENCE ENGINE
============================================================ */

/*
    PURPOSE
    -------
    Field-level intelligence layer for AgriGuard AI.

    This module manages:

    • Field profile
    • Crop information
    • Field zones
    • GPS/location data
    • Crop growth stage
    • Field health
    • Risk distribution
    • Scouting records
    • Disease spread monitoring
    • Irrigation zones
    • Field observations
    • Sensor readings
    • Field timeline
    • Priority areas
    • Field summary
    • Demo-ready field data

    ARCHITECTURE

              FIELD
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
      CROP    ZONES    SENSORS
        │       │        │
        └───────┼────────┘
                ▼
         FIELD INTELLIGENCE
                │
       ┌────────┼─────────┐
       ▼        ▼         ▼
     HEALTH    RISK     SCOUTING
       │        │         │
       └────────┼─────────┘
                ▼
         FIELD DASHBOARD
*/


/* ============================================================
   01. ENGINE STATE
============================================================ */

const FIELD_ENGINE_STATE = {

    version:
        "1.0.0",

    initialized:
        false,

    currentFieldId:
        null,

    fields:
        [],

    currentField:
        null,

    observations:
        [],

    scoutingRecords:
        [],

    timeline:
        [],

    lastUpdated:
        null
};


/* ============================================================
   02. FIELD HEALTH LEVELS
============================================================ */

const FIELD_HEALTH_LEVELS = {

    EXCELLENT: {

        min:
            85,

        label:
            "Excellent",

        icon:
            "🟢"
    },

    GOOD: {

        min:
            70,

        label:
            "Good",

        icon:
            "🟢"
    },

    MODERATE: {

        min:
            50,

        label:
            "Moderate",

        icon:
            "🟡"
    },

    AT_RISK: {

        min:
            30,

        label:
            "At Risk",

        icon:
            "🟠"
    },

    CRITICAL: {

        min:
            0,

        label:
            "Critical",

        icon:
            "🔴"
    }
};


/* ============================================================
   03. FIELD RISK LEVELS
============================================================ */

const FIELD_RISK_LEVELS = {

    LOW:
        "LOW",

    MODERATE:
        "MODERATE",

    HIGH:
        "HIGH",

    CRITICAL:
        "CRITICAL"
};


/* ============================================================
   04. DEFAULT FIELD
============================================================ */

const DEFAULT_FIELD = {

    id:
        "FIELD-001",

    name:
        "Demo Farm",

    farmer:
        "Demo Farmer",

    location: {

        village:
            "Demo Village",

        district:
            "Demo District",

        state:
            "Andhra Pradesh",

        country:
            "India",

        latitude:
            16.5062,

        longitude:
            80.6480
    },

    area:

        2.5,

    areaUnit:
        "acres",

    crop: {

        name:
            "Paddy",

        variety:
            "Local Variety",

        season:
            "Kharif",

        stage:
            "Vegetative",

        daysAfterSowing:
            35,

        expectedHarvestDays:
            105
    },

    soil: {

        type:
            "Loamy",

        moisture:
            58,

        pH:
            6.6,

        fertility:
            76
    },

    irrigation: {

        method:
            "Drip / Surface",

        status:
            "Available",

        lastIrrigation:
            null,

        efficiency:
            82
    },

    health: {

        score:
            78,

        status:
            "Good"
    },

    risk: {

        overall:
            34,

        disease:
            28,

        weather:
            30,

        soil:
            25,

        water:
            35,

        pest:
            22
    },

    zones:
        [],

    sensors:
        [],

    notes:
        "Demo field initialized for AgriGuard AI."
};


/* ============================================================
   05. SAFE NUMBER
============================================================ */

function safeFieldNumber(
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


/* ============================================================
   06. CLAMP
============================================================ */

function clampFieldValue(
    value,
    min = 0,
    max = 100
) {

    return Math.min(
        max,
        Math.max(
            min,
            safeFieldNumber(
                value
            )
        )
    );
}


/* ============================================================
   07. GENERATE ID
============================================================ */

function generateFieldId(
    prefix =
        "FIELD"
) {

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .slice(
                2,
                7
            )
            .toUpperCase()
    );
}


/* ============================================================
   08. DEEP CLONE
============================================================ */

function cloneFieldObject(
    object
) {

    return JSON.parse(
        JSON.stringify(
            object
        )
    );
}


/* ============================================================
   09. NORMALIZE FIELD
============================================================ */

function normalizeField(
    input = {}
) {

    const field =
        cloneFieldObject(
            DEFAULT_FIELD
        );


    /*
        Basic information
    */

    field.id =
        input.id ||
        field.id;


    field.name =
        input.name ||
        field.name;


    field.farmer =
        input.farmer ||
        field.farmer;


    field.area =
        safeFieldNumber(
            input.area,
            field.area
        );


    field.areaUnit =
        input.areaUnit ||
        field.areaUnit;


    /*
        Location
    */

    field.location = {

        ...field.location,

        ...(input.location || {})
    };


    /*
        Crop
    */

    field.crop = {

        ...field.crop,

        ...(input.crop || {})
    };


    field.crop.daysAfterSowing =
        safeFieldNumber(
            field.crop.daysAfterSowing,
            0
        );


    field.crop.expectedHarvestDays =
        safeFieldNumber(
            field.crop.expectedHarvestDays,
            100
        );


    /*
        Soil
    */

    field.soil = {

        ...field.soil,

        ...(input.soil || {})
    };


    field.soil.moisture =
        clampFieldValue(
            field.soil.moisture
        );


    field.soil.pH =
        safeFieldNumber(
            field.soil.pH,
            6.5
        );


    field.soil.fertility =
        clampFieldValue(
            field.soil.fertility
        );


    /*
        Irrigation
    */

    field.irrigation = {

        ...field.irrigation,

        ...(input.irrigation || {})
    };


    field.irrigation.efficiency =
        clampFieldValue(
            field.irrigation.efficiency
        );


    /*
        Health
    */

    field.health = {

        ...field.health,

        ...(input.health || {})
    };


    field.health.score =
        clampFieldValue(
            field.health.score
        );


    field.health.status =
        getFieldHealthStatus(
            field.health.score
        )
        .label;


    /*
        Risk
    */

    field.risk = {

        ...field.risk,

        ...(input.risk || {})
    };


    Object.keys(
        field.risk
    )
    .forEach(
        key => {

            field.risk[key] =
                clampFieldValue(
                    field.risk[key]
                );

        }
    );


    /*
        Zones
    */

    field.zones =
        Array.isArray(
            input.zones
        )
            ? input.zones
            : field.zones;


    /*
        Sensors
    */

    field.sensors =
        Array.isArray(
            input.sensors
        )
            ? input.sensors
            : field.sensors;


    field.notes =
        input.notes ||
        field.notes;


    field.updatedAt =
        new Date()
            .toISOString();


    return field;
}


/* ============================================================
   10. INITIALIZE ENGINE
============================================================ */

function initializeFieldEngine(
    fields = []
) {

    FIELD_ENGINE_STATE.fields =
        [];


    if (
        Array.isArray(
            fields
        ) &&
        fields.length > 0
    ) {

        fields.forEach(
            field => {

                FIELD_ENGINE_STATE.fields.push(
                    normalizeField(
                        field
                    )
                );

            }
        );

    }

    else {

        FIELD_ENGINE_STATE.fields.push(
            normalizeField(
                DEFAULT_FIELD
            )
        );

    }


    FIELD_ENGINE_STATE.currentField =
        FIELD_ENGINE_STATE.fields[0];


    FIELD_ENGINE_STATE.currentFieldId =
        FIELD_ENGINE_STATE.currentField.id;


    FIELD_ENGINE_STATE.initialized =
        true;


    FIELD_ENGINE_STATE.lastUpdated =
        new Date()
            .toISOString();


    addFieldTimelineEvent(
        "system",
        "Field intelligence engine initialized."
    );


    return FIELD_ENGINE_STATE.currentField;
}


/* ============================================================
   11. CREATE FIELD
============================================================ */

function createField(
    input = {}
) {

    const field =
        normalizeField(
            {
                ...input,

                id:
                    input.id ||
                    generateFieldId()
            }
        );


    FIELD_ENGINE_STATE.fields.push(
        field
    );


    FIELD_ENGINE_STATE.lastUpdated =
        new Date()
            .toISOString();


    addFieldTimelineEvent(
        "field",
        `Field "${field.name}" created.`,
        field.id
    );


    return field;
}


/* ============================================================
   12. SELECT FIELD
============================================================ */

function selectField(
    fieldId
) {

    const field =
        FIELD_ENGINE_STATE.fields.find(
            item =>
                item.id ===
                fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    FIELD_ENGINE_STATE.currentField =
        field;


    FIELD_ENGINE_STATE.currentFieldId =
        field.id;


    FIELD_ENGINE_STATE.lastUpdated =
        new Date()
            .toISOString();


    addFieldTimelineEvent(
        "field",
        `Field "${field.name}" selected.`,
        field.id
    );


    return field;
}


/* ============================================================
   13. GET CURRENT FIELD
============================================================ */

function getCurrentField() {

    return (
        FIELD_ENGINE_STATE.currentField ||
        null
    );
}


/* ============================================================
   14. GET FIELD
============================================================ */

function getField(
    fieldId
) {

    return (
        FIELD_ENGINE_STATE.fields.find(
            field =>
                field.id ===
                fieldId
        ) ||
        null
    );
}


/* ============================================================
   15. UPDATE FIELD
============================================================ */

function updateField(
    fieldId,
    updates = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    const updated =
        normalizeField(
            {
                ...field,

                ...updates,

                id:
                    field.id
            }
        );


    const index =
        FIELD_ENGINE_STATE.fields
            .findIndex(
                item =>
                    item.id ===
                    fieldId
            );


    if (
        index === -1
    ) {

        return null;

    }


    FIELD_ENGINE_STATE.fields[index] =
        updated;


    if (
        FIELD_ENGINE_STATE.currentFieldId ===
        fieldId
    ) {

        FIELD_ENGINE_STATE.currentField =
            updated;

    }


    FIELD_ENGINE_STATE.lastUpdated =
        new Date()
            .toISOString();


    addFieldTimelineEvent(
        "field",
        `Field "${updated.name}" updated.`,
        fieldId
    );


    return updated;
}


/* ============================================================
   16. FIELD HEALTH STATUS
============================================================ */

function getFieldHealthStatus(
    score
) {

    const value =
        clampFieldValue(
            score
        );


    if (
        value >= 85
    ) {

        return FIELD_HEALTH_LEVELS.EXCELLENT;

    }


    if (
        value >= 70
    ) {

        return FIELD_HEALTH_LEVELS.GOOD;

    }


    if (
        value >= 50
    ) {

        return FIELD_HEALTH_LEVELS.MODERATE;

    }


    if (
        value >= 30
    ) {

        return FIELD_HEALTH_LEVELS.AT_RISK;

    }


    return FIELD_HEALTH_LEVELS.CRITICAL;
}


/* ============================================================
   17. CALCULATE FIELD HEALTH
============================================================ */

/*
    Field health is derived from multiple dimensions.

        Soil health
        +
        Water condition
        +
        Disease condition
        +
        Weather condition
        +
        Pest condition

    This prevents the dashboard from relying on
    disease detection alone.
*/

function calculateFieldHealth(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    const risk =
        field.risk ||
        {};


    const diseaseHealth =
        100 -
        safeFieldNumber(
            risk.disease,
            0
        );


    const weatherHealth =
        100 -
        safeFieldNumber(
            risk.weather,
            0
        );


    const soilHealth =
        100 -
        safeFieldNumber(
            risk.soil,
            0
        );


    const waterHealth =
        100 -
        safeFieldNumber(
            risk.water,
            0
        );


    const pestHealth =
        100 -
        safeFieldNumber(
            risk.pest,
            0
        );


    /*
        Weighted health model.
    */

    const score =
        (
            diseaseHealth * 0.30
        ) +
        (
            soilHealth * 0.20
        ) +
        (
            waterHealth * 0.20
        ) +
        (
            weatherHealth * 0.15
        ) +
        (
            pestHealth * 0.15
        );


    const rounded =
        Math.round(
            clampFieldValue(
                score
            )
        );


    return {

        score:
            rounded,

        status:
            getFieldHealthStatus(
                rounded
            ),

        components: {

            disease:
                Math.round(
                    diseaseHealth
                ),

            soil:
                Math.round(
                    soilHealth
                ),

            water:
                Math.round(
                    waterHealth
                ),

            weather:
                Math.round(
                    weatherHealth
                ),

            pest:
                Math.round(
                    pestHealth
                )
        }
    };
}


/* ============================================================
   18. UPDATE FIELD HEALTH
============================================================ */

function updateFieldHealth(
    fieldId,
    riskData = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    field.risk = {

        ...field.risk,

        ...riskData
    };


    const health =
        calculateFieldHealth(
            field
        );


    field.health.score =
        health.score;


    field.health.status =
        health.status.label;


    field.health.updatedAt =
        new Date()
            .toISOString();


    FIELD_ENGINE_STATE.lastUpdated =
        field.health.updatedAt;


    if (
        FIELD_ENGINE_STATE.currentFieldId ===
        fieldId
    ) {

        FIELD_ENGINE_STATE.currentField =
            field;

    }


    addFieldTimelineEvent(
        "health",
        `Field health updated to ${health.score}/100.`,
        fieldId
    );


    return health;
}


/* ============================================================
   19. CALCULATE OVERALL FIELD RISK
============================================================ */

function calculateOverallFieldRisk(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    const risk =
        field.risk ||
        {};


    const overall =
        (
            safeFieldNumber(
                risk.disease
            ) * 0.30
        ) +
        (
            safeFieldNumber(
                risk.weather
            ) * 0.15
        ) +
        (
            safeFieldNumber(
                risk.soil
            ) * 0.20
        ) +
        (
            safeFieldNumber(
                risk.water
            ) * 0.20
        ) +
        (
            safeFieldNumber(
                risk.pest
            ) * 0.15
        );


    return Math.round(
        clampFieldValue(
            overall
        )
    );
}


/* ============================================================
   20. GET FIELD RISK LEVEL
============================================================ */

function getFieldRiskLevel(
    riskScore
) {

    const score =
        clampFieldValue(
            riskScore
        );


    if (
        score >= 85
    ) {

        return {

            level:
                FIELD_RISK_LEVELS.CRITICAL,

            label:
                "Critical",

            icon:
                "🔴"
        };
    }


    if (
        score >= 70
    ) {

        return {

            level:
                FIELD_RISK_LEVELS.HIGH,

            label:
                "High",

            icon:
                "🟠"
        };
    }


    if (
        score >= 50
    ) {

        return {

            level:
                FIELD_RISK_LEVELS.MODERATE,

            label:
                "Moderate",

            icon:
                "🟡"
        };
    }


    return {

        level:
            FIELD_RISK_LEVELS.LOW,

        label:
            "Low",

        icon:
            "🟢"
    };
}


/* ============================================================
   21. CREATE FIELD ZONE
============================================================ */

function createFieldZone(
    fieldId,
    zoneData = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    const zone = {

        id:
            zoneData.id ||
            generateFieldId(
                "ZONE"
            ),

        name:
            zoneData.name ||
            `Zone ${field.zones.length + 1}`,

        area:
            safeFieldNumber(
                zoneData.area,
                0
            ),

        areaUnit:
            zoneData.areaUnit ||
            "acres",

        crop:
            zoneData.crop ||
            field.crop.name,

        cropStage:
            zoneData.cropStage ||
            field.crop.stage,

        healthScore:
            clampFieldValue(
                zoneData.healthScore ??
                field.health.score
            ),

        riskScore:
            clampFieldValue(
                zoneData.riskScore ??
                field.risk.overall
            ),

        diseaseRisk:
            clampFieldValue(
                zoneData.diseaseRisk ??
                field.risk.disease
            ),

        soilRisk:
            clampFieldValue(
                zoneData.soilRisk ??
                field.risk.soil
            ),

        waterRisk:
            clampFieldValue(
                zoneData.waterRisk ??
                field.risk.water
            ),

        irrigationStatus:
            zoneData.irrigationStatus ||
            "Normal",

        latitude:
            zoneData.latitude ??
            field.location.latitude,

        longitude:
            zoneData.longitude ??
            field.location.longitude,

        notes:
            zoneData.notes ||
            "",

        createdAt:
            new Date()
                .toISOString(),

        updatedAt:
            new Date()
                .toISOString()
    };


    field.zones.push(
        zone
    );


    addFieldTimelineEvent(
        "zone",
        `Zone "${zone.name}" added to field.`,
        fieldId
    );


    return zone;
}


/* ============================================================
   22. CREATE DEFAULT ZONES
============================================================ */

function createDefaultZones(
    fieldId
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return [];

    }


    /*
        Clear only if no zones exist.
    */

    if (
        field.zones.length >
        0
    ) {

        return field.zones;

    }


    const totalArea =
        safeFieldNumber(
            field.area,
            2.5
        );


    const zoneArea =
        totalArea /
        4;


    const zones = [

        {

            name:
                "North Zone",

            area:
                zoneArea,

            healthScore:
                84,

            riskScore:
                22,

            diseaseRisk:
                18,

            soilRisk:
                20,

            waterRisk:
                24
        },

        {

            name:
                "East Zone",

            area:
                zoneArea,

            healthScore:
                76,

            riskScore:
                34,

            diseaseRisk:
                30,

            soilRisk:
                29,

            waterRisk:
                38
        },

        {

            name:
                "South Zone",

            area:
                zoneArea,

            healthScore:
                62,

            riskScore:
                57,

            diseaseRisk:
                52,

            soilRisk:
                48,

            waterRisk:
                61
        },

        {

            name:
                "West Zone",

            area:
                zoneArea,

            healthScore:
                91,

            riskScore:
                14,

            diseaseRisk:
                10,

            soilRisk:
                15,

            waterRisk:
                18
        }
    ];


    zones.forEach(
        zone =>
            createFieldZone(
                fieldId,
                zone
            )
    );


    return field.zones;
}


/* ============================================================
   23. UPDATE ZONE
============================================================ */

function updateFieldZone(
    fieldId,
    zoneId,
    updates = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    const zone =
        field.zones.find(
            item =>
                item.id ===
                zoneId
        );


    if (
        !zone
    ) {

        return null;

    }


    Object.assign(
        zone,
        updates
    );


    zone.healthScore =
        clampFieldValue(
            zone.healthScore
        );


    zone.riskScore =
        clampFieldValue(
            zone.riskScore
        );


    zone.updatedAt =
        new Date()
            .toISOString();


    addFieldTimelineEvent(
        "zone",
        `Zone "${zone.name}" updated.`,
        fieldId
    );


    return zone;
}


/* ============================================================
   24. GET HIGH-RISK ZONES
============================================================ */

function getHighRiskZones(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return [];

    }


    return (
        field.zones ||
        []
    )
    .filter(
        zone =>
            zone.riskScore >=
            50
    )
    .sort(
        (
            a,
            b
        ) =>
            b.riskScore -
            a.riskScore
    );
}


/* ============================================================
   25. GET PRIORITY ZONE
============================================================ */

function getPriorityZone(
    fieldInput
) {

    const zones =
        getHighRiskZones(
            fieldInput
        );


    return (
        zones[0] ||
        null
    );
}


/* ============================================================
   26. ADD SCOUTING RECORD
============================================================ */

function addScoutingRecord(
    fieldId,
    data = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    const record = {

        id:
            generateFieldId(
                "SCOUT"
            ),

        fieldId,

        zoneId:
            data.zoneId ||
            null,

        observer:
            data.observer ||
            "Field Scout",

        crop:
            data.crop ||
            field.crop.name,

        observation:
            data.observation ||
            "",

        symptoms:
            Array.isArray(
                data.symptoms
            )
                ? data.symptoms
                : [],

        severity:
            data.severity ||
            "Low",

        diseaseSuspected:
            Boolean(
                data.diseaseSuspected
            ),

        pestObserved:
            Boolean(
                data.pestObserved
            ),

        waterIssue:
            Boolean(
                data.waterIssue
            ),

        soilIssue:
            Boolean(
                data.soilIssue
            ),

        latitude:
            data.latitude ??
            field.location.latitude,

        longitude:
            data.longitude ??
            field.location.longitude,

        image:
            data.image ||
            null,

        notes:
            data.notes ||
            "",

        createdAt:
            new Date()
                .toISOString()
    };


    FIELD_ENGINE_STATE.scoutingRecords.push(
        record
    );


    FIELD_ENGINE_STATE.observations.push(
        record
    );


    addFieldTimelineEvent(
        "scouting",
        `New scouting observation recorded for ${field.name}.`,
        fieldId
    );


    return record;
}


/* ============================================================
   27. GET SCOUTING RECORDS
============================================================ */

function getScoutingRecords(
    fieldId =
        null
) {

    return FIELD_ENGINE_STATE
        .scoutingRecords
        .filter(
            record =>
                !fieldId ||
                record.fieldId ===
                fieldId
        )
        .sort(
            (
                a,
                b
            ) =>
                new Date(
                    b.createdAt
                ) -
                new Date(
                    a.createdAt
                )
        );
}


/* ============================================================
   28. GET RECENT SCOUTING
============================================================ */

function getRecentScouting(
    fieldId,
    limit = 5
) {

    return getScoutingRecords(
        fieldId
    )
    .slice(
        0,
        limit
    );
}


/* ============================================================
   29. ADD FIELD OBSERVATION
============================================================ */

function addFieldObservation(
    fieldId,
    observation = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    const record = {

        id:
            generateFieldId(
                "OBS"
            ),

        fieldId,

        type:
            observation.type ||
            "general",

        title:
            observation.title ||
            "Field Observation",

        message:
            observation.message ||
            "",

        severity:
            observation.severity ||
            "INFO",

        value:
            observation.value ??
            null,

        unit:
            observation.unit ||
            "",

        source:
            observation.source ||
            "Farmer",

        createdAt:
            new Date()
                .toISOString()
    };


    FIELD_ENGINE_STATE.observations.push(
        record
    );


    addFieldTimelineEvent(
        "observation",
        record.message ||
        record.title,
        fieldId
    );


    return record;
}


/* ============================================================
   30. SENSOR MANAGEMENT
============================================================ */

function addSensor(
    fieldId,
    sensorData = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    const sensor = {

        id:
            sensorData.id ||
            generateFieldId(
                "SENSOR"
            ),

        name:
            sensorData.name ||
            "Field Sensor",

        type:
            sensorData.type ||
            "soil-moisture",

        unit:
            sensorData.unit ||
            "%",

        value:
            sensorData.value ??
            null,

        status:
            sensorData.status ||
            "online",

        battery:
            clampFieldValue(
                sensorData.battery ??
                100
            ),

        latitude:
            sensorData.latitude ??
            field.location.latitude,

        longitude:
            sensorData.longitude ??
            field.location.longitude,

        lastReading:
            new Date()
                .toISOString()
    };


    field.sensors.push(
        sensor
    );


    addFieldTimelineEvent(
        "sensor",
        `${sensor.name} added to field.`,
        fieldId
    );


    return sensor;
}


/* ============================================================
   31. UPDATE SENSOR
============================================================ */

function updateSensor(
    fieldId,
    sensorId,
    reading = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    const sensor =
        field.sensors.find(
            item =>
                item.id ===
                sensorId
        );


    if (
        !sensor
    ) {

        return null;

    }


    if (
        reading.value !==
        undefined
    ) {

        sensor.value =
            reading.value;

    }


    if (
        reading.status
    ) {

        sensor.status =
            reading.status;

    }


    if (
        reading.battery !==
        undefined
    ) {

        sensor.battery =
            clampFieldValue(
                reading.battery
            );

    }


    sensor.lastReading =
        new Date()
            .toISOString();


    addFieldTimelineEvent(
        "sensor",
        `${sensor.name} reading updated.`,
        fieldId
    );


    return sensor;
}


/* ============================================================
   32. GET SENSOR SUMMARY
============================================================ */

function getSensorSummary(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return {

            total:
                0,

            online:
                0,

            offline:
                0,

            lowBattery:
                0
        };
    }


    const sensors =
        field.sensors ||
        [];


    return {

        total:
            sensors.length,

        online:
            sensors.filter(
                sensor =>
                    sensor.status ===
                    "online"
            ).length,

        offline:
            sensors.filter(
                sensor =>
                    sensor.status ===
                    "offline"
            ).length,

        lowBattery:
            sensors.filter(
                sensor =>
                    sensor.battery <
                    25
            ).length
    };
}


/* ============================================================
   33. CALCULATE CROP PROGRESS
============================================================ */

function calculateCropProgress(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    const days =
        safeFieldNumber(
            field.crop.daysAfterSowing
        );


    const harvestDays =
        safeFieldNumber(
            field.crop.expectedHarvestDays,
            100
        );


    const progress =
        clampFieldValue(
            (
                days /
                harvestDays
            ) *
            100
        );


    const remaining =
        Math.max(
            0,
            harvestDays -
            days
        );


    return {

        percentage:
            Math.round(
                progress
            ),

        daysAfterSowing:
            days,

        expectedHarvestDays:
            harvestDays,

        estimatedDaysRemaining:
            remaining,

        stage:
            field.crop.stage
    };
}


/* ============================================================
   34. CROP STAGE PROGRESS
============================================================ */

function getCropStageInfo(
    stage
) {

    const normalized =
        String(
            stage ||
            ""
        )
        .toLowerCase();


    if (
        normalized.includes(
            "seed"
        )
    ) {

        return {

            key:
                "seedling",

            label:
                "Seedling",

            progress:
                15
        };
    }


    if (
        normalized.includes(
            "vegetative"
        )
    ) {

        return {

            key:
                "vegetative",

            label:
                "Vegetative",

            progress:
                40
        };
    }


    if (
        normalized.includes(
            "flower"
        )
    )
    {

        return {

            key:
                "flowering",

            label:
                "Flowering",

            progress:
                65
        };
    }


    if (
        normalized.includes(
            "fruit"
        ) ||
        normalized.includes(
            "grain"
        )
    ) {

        return {

            key:
                "fruiting",

            label:
                "Fruiting / Grain Filling",

            progress:
                80
        };
    }


    if (
        normalized.includes(
            "matur"
        )
    ) {

        return {

            key:
                "maturity",

            label:
                "Maturity",

            progress:
                95
        };
    }


    return {

        key:
            "unknown",

        label:
            stage ||
            "Unknown",

        progress:
            0
    };
}


/* ============================================================
   35. FIELD WATER STATUS
============================================================ */

function getFieldWaterStatus(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    const moisture =
        safeFieldNumber(
            field.soil.moisture
        );


    if (
        moisture < 25
    ) {

        return {

            status:
                "Critical Dry",

            level:
                "CRITICAL",

            score:
                90,

            message:
                "Root-zone moisture may be insufficient."
        };
    }


    if (
        moisture < 40
    ) {

        return {

            status:
                "Dry",

            level:
                "HIGH",

            score:
                70,

            message:
                "Monitor irrigation requirement."
        };
    }


    if (
        moisture <= 70
    ) {

        return {

            status:
                "Optimal",

            level:
                "LOW",

            score:
                20,

            message:
                "Soil moisture is within a generally suitable range."
        };
    }


    if (
        moisture <= 85
    ) {

        return {

            status:
                "Wet",

            level:
                "MODERATE",

            score:
                45,

            message:
                "Monitor drainage and rainfall."
        };
    }


    return {

        status:
            "Waterlogged Risk",

        level:
            "CRITICAL",

        score:
            90,

        message:
            "Excess soil moisture may cause root-zone stress."
    };
}


/* ============================================================
   36. FIELD CONDITION SUMMARY
============================================================ */

function generateFieldConditionSummary(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    const health =
        calculateFieldHealth(
            field
        );


    const risk =
        calculateOverallFieldRisk(
            field
        );


    const riskLevel =
        getFieldRiskLevel(
            risk
        );


    const water =
        getFieldWaterStatus(
            field
        );


    const cropProgress =
        calculateCropProgress(
            field
        );


    return {

        fieldId:
            field.id,

        fieldName:
            field.name,

        crop:
            field.crop.name,

        cropStage:
            field.crop.stage,

        area:
            field.area,

        areaUnit:
            field.areaUnit,

        healthScore:
            health.score,

        healthStatus:
            health.status,

        overallRisk:
            risk,

        riskLevel,

        waterStatus:
            water,

        cropProgress,

        zones:
            field.zones.length,

        highRiskZones:
            getHighRiskZones(
                field
            ).length,

        sensors:
            getSensorSummary(
                field
            ),

        scoutingRecords:
            getScoutingRecords(
                field.id
            ).length,

        updatedAt:
            field.updatedAt
    };
}


/* ============================================================
   37. FIELD PRIORITY ACTIONS
============================================================ */

function generateFieldPriorityActions(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return [];

    }


    const actions =
        [];


    const risk =
        field.risk;


    /*
        Disease
    */

    if (
        risk.disease >= 70
    ) {

        actions.push({

            priority:
                "CRITICAL",

            category:
                "Disease",

            title:
                "Inspect disease hotspots",

            action:
                "Scout affected plants and verify disease symptoms.",

            reason:
                "Disease risk is elevated.",

            score:
                risk.disease
        });

    }


    /*
        Water
    */

    if (
        risk.water >= 70
    ) {

        actions.push({

            priority:
                "HIGH",

            category:
                "Water",

            title:
                "Review irrigation",

            action:
                "Check root-zone moisture and irrigation requirement.",

            reason:
                "Water-related risk is elevated.",

            score:
                risk.water
        });

    }


    /*
        Soil
    */

    if (
        risk.soil >= 70
    ) {

        actions.push({

            priority:
                "HIGH",

            category:
                "Soil",

            title:
                "Review soil condition",

            action:
                "Verify soil-test values and identify the limiting factor.",

            reason:
                "Soil risk is elevated.",

            score:
                risk.soil
        });

    }


    /*
        Weather
    */

    if (
        risk.weather >= 70
    ) {

        actions.push({

            priority:
                "HIGH",

            category:
                "Weather",

            title:
                "Prepare for weather stress",

            action:
                "Monitor forecast and adjust field operations.",

            reason:
                "Weather risk is elevated.",

            score:
                risk.weather
        });

    }


    /*
        Pest
    */

    if (
        risk.pest >= 70
    ) {

        actions.push({

            priority:
                "HIGH",

            category:
                "Pest",

            title:
                "Increase pest scouting",

            action:
                "Inspect crop canopy and field boundaries for pest symptoms.",

            reason:
                "Pest risk is elevated.",

            score:
                risk.pest
        });

    }


    /*
        High-risk zones
    */

    const zones =
        getHighRiskZones(
            field
        );


    if (
        zones.length >
        0
    ) {

        actions.push({

            priority:
                "HIGH",

            category:
                "Zone",

            title:
                `Inspect ${zones.length} high-risk zone${zones.length > 1 ? "s" : ""}`,

            action:
                "Prioritize field scouting in the highest-risk zone.",

            reason:
                "Risk is not uniform across the field.",

            score:
                zones[0].riskScore
        });

    }


    /*
        Sort.
    */

    actions.sort(
        (
            a,
            b
        ) =>
            b.score -
            a.score
    );


    return actions;
}


/* ============================================================
   38. FIELD TIMELINE
============================================================ */

function addFieldTimelineEvent(
    type,
    message,
    fieldId =
        null
) {

    const event = {

        id:
            generateFieldId(
                "EVENT"
            ),

        type,

        message,

        fieldId,

        timestamp:
            new Date()
                .toISOString()
    };


    FIELD_ENGINE_STATE.timeline.unshift(
        event
    );


    /*
        Keep memory manageable.
    */

    if (
        FIELD_ENGINE_STATE.timeline.length >
        200
    ) {

        FIELD_ENGINE_STATE.timeline =
            FIELD_ENGINE_STATE.timeline.slice(
                0,
                200
            );

    }


    return event;
}


/* ============================================================
   39. GET FIELD TIMELINE
============================================================ */

function getFieldTimeline(
    fieldId =
        null,
    limit =
        20
) {

    return FIELD_ENGINE_STATE
        .timeline
        .filter(
            event =>
                !fieldId ||
                event.fieldId ===
                fieldId ||
                event.fieldId ===
                null
        )
        .slice(
            0,
            limit
        );
}


/* ============================================================
   40. FIELD RISK DISTRIBUTION
============================================================ */

function getFieldRiskDistribution(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    return {

        disease:
            field.risk.disease,

        weather:
            field.risk.weather,

        soil:
            field.risk.soil,

        water:
            field.risk.water,

        pest:
            field.risk.pest
    };
}


/* ============================================================
   41. FIELD HEALTH DISTRIBUTION
============================================================ */

function getFieldHealthDistribution(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    const risk =
        field.risk;


    return {

        diseaseHealth:
            100 -
            risk.disease,

        weatherHealth:
            100 -
            risk.weather,

        soilHealth:
            100 -
            risk.soil,

        waterHealth:
            100 -
            risk.water,

        pestHealth:
            100 -
            risk.pest
    };
}


/* ============================================================
   42. FIELD ZONE STATISTICS
============================================================ */

function getZoneStatistics(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return {

            total:
                0,

            healthy:
                0,

            moderate:
                0,

            highRisk:
                0,

            critical:
                0
        };
    }


    const zones =
        field.zones ||
        [];


    return {

        total:
            zones.length,

        healthy:
            zones.filter(
                zone =>
                    zone.riskScore <
                    30
            ).length,

        moderate:
            zones.filter(
                zone =>
                    zone.riskScore >= 30 &&
                    zone.riskScore < 50
            ).length,

        highRisk:
            zones.filter(
                zone =>
                    zone.riskScore >= 50 &&
                    zone.riskScore < 80
            ).length,

        critical:
            zones.filter(
                zone =>
                    zone.riskScore >= 80
            ).length
    };
}


/* ============================================================
   43. UPDATE FIELD FROM EXTERNAL ENGINES
============================================================ */

/*
    This function is the integration bridge.

    riskEngine
    weatherEngine
    soilEngine
    diseaseDetection

    can all feed their outputs here.
*/

function updateFieldFromEngines(
    fieldId,
    engineData = {}
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    /*
        Risk engine
    */

    if (
        engineData.risk
    ) {

        field.risk = {

            ...field.risk,

            ...engineData.risk
        };

    }


    /*
        Soil engine
    */

    if (
        engineData.soil
    ) {

        field.soil = {

            ...field.soil,

            ...engineData.soil
        };

        if (
            engineData.soil.moisture !==
            undefined
        ) {

            field.soil.moisture =
                clampFieldValue(
                    engineData.soil.moisture
                );

        }

    }


    /*
        Crop information
    */

    if (
        engineData.crop
    ) {

        field.crop = {

            ...field.crop,

            ...engineData.crop
        };

    }


    /*
        Irrigation
    */

    if (
        engineData.irrigation
    ) {

        field.irrigation = {

            ...field.irrigation,

            ...engineData.irrigation
        };

    }


    /*
        Recalculate health.
    */

    const health =
        calculateFieldHealth(
            field
        );


    field.health.score =
        health.score;


    field.health.status =
        health.status.label;


    /*
        Recalculate overall risk.
    */

    field.risk.overall =
        calculateOverallFieldRisk(
            field
        );


    field.updatedAt =
        new Date()
            .toISOString();


    FIELD_ENGINE_STATE.lastUpdated =
        field.updatedAt;


    if (
        FIELD_ENGINE_STATE.currentFieldId ===
        fieldId
    ) {

        FIELD_ENGINE_STATE.currentField =
            field;

    }


    addFieldTimelineEvent(
        "integration",
        "Field updated from AgriGuard intelligence engines.",
        fieldId
    );


    /*
        Emit event.
    */

    window.dispatchEvent(
        new CustomEvent(
            "agriguard:fieldUpdated",
            {
                detail: {

                    field,

                    summary:
                        generateFieldConditionSummary(
                            field
                        )
                }
            }
        )
    );


    return field;
}


/* ============================================================
   44. FIELD DASHBOARD MODEL
============================================================ */

function getFieldDashboardModel(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    const summary =
        generateFieldConditionSummary(
            field
        );


    const health =
        calculateFieldHealth(
            field
        );


    const risk =
        calculateOverallFieldRisk(
            field
        );


    const priorityActions =
        generateFieldPriorityActions(
            field
        );


    const priorityZone =
        getPriorityZone(
            field
        );


    return {

        header: {

            fieldName:
                field.name,

            crop:
                field.crop.name,

            variety:
                field.crop.variety,

            location:
                field.location,

            area:
                field.area,

            areaUnit:
                field.areaUnit
        },

        health: {

            score:
                health.score,

            label:
                health.status.label,

            icon:
                health.status.icon,

            components:
                health.components
        },

        risk: {

            score:
                risk,

            level:
                getFieldRiskLevel(
                    risk
                )
        },

        water:
            getFieldWaterStatus(
                field
            ),

        cropProgress:
            calculateCropProgress(
                field
            ),

        zones: {

            total:
                field.zones.length,

            statistics:
                getZoneStatistics(
                    field
                ),

            priority:
                priorityZone,

            highRisk:
                getHighRiskZones(
                    field
                )
        },

        sensors:
            getSensorSummary(
                field
            ),

        scouting:
            getRecentScouting(
                field.id,
                5
            ),

        actions:
            priorityActions,

        timeline:
            getFieldTimeline(
                field.id,
                10
            ),

        lastUpdated:
            field.updatedAt
    };
}


/* ============================================================
   45. FIELD MAP DATA
============================================================ */

/*
    Converts zones into map-friendly objects.

    A future production implementation can pass
    these coordinates directly to Leaflet / Mapbox /
    Google Maps.
*/

function getFieldMapData(
    fieldInput
) {

    const field =
        fieldInput ||
        getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    return {

        center: {

            latitude:
                field.location.latitude,

            longitude:
                field.location.longitude
        },

        field: {

            id:
                field.id,

            name:
                field.name,

            area:
                field.area
        },

        zones:
            field.zones.map(
                zone => ({

                    id:
                        zone.id,

                    name:
                        zone.name,

                    latitude:
                        zone.latitude,

                    longitude:
                        zone.longitude,

                    healthScore:
                        zone.healthScore,

                    riskScore:
                        zone.riskScore,

                    riskLevel:
                        getFieldRiskLevel(
                            zone.riskScore
                        )
                        .level
                })
            )
    };
}


/* ============================================================
   46. GEOLOCATION HELPER
============================================================ */

function requestCurrentLocation(
    callback
) {

    if (
        !navigator.geolocation
    ) {

        if (
            typeof callback ===
            "function"
        ) {

            callback(
                {
                    success:
                        false,

                    error:
                        "Geolocation is not supported by this browser."
                }
            );

        }

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            const result = {

                success:
                    true,

                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy
            };


            if (
                typeof callback ===
                "function"
            ) {

                callback(
                    result
                );

            }

        },

        error => {

            if (
                typeof callback ===
                "function"
            ) {

                callback(
                    {

                        success:
                            false,

                        error:
                            error.message
                    }
                );

            }

        },

        {

            enableHighAccuracy:
                true,

            timeout:
                10000,

            maximumAge:
                300000
        }
    );
}


/* ============================================================
   47. UPDATE FIELD LOCATION
============================================================ */

function updateFieldLocation(
    fieldId,
    latitude,
    longitude,
    accuracy =
        null
) {

    const field =
        getField(
            fieldId
        );


    if (
        !field
    ) {

        return null;

    }


    field.location.latitude =
        Number(
            latitude
        );


    field.location.longitude =
        Number(
            longitude
        );


    if (
        accuracy !==
        null
    ) {

        field.location.accuracy =
            Number(
                accuracy
            );

    }


    field.updatedAt =
        new Date()
            .toISOString();


    addFieldTimelineEvent(
        "location",
        "Field location updated.",
        fieldId
    );


    return field.location;
}


/* ============================================================
   48. FIELD SEARCH
============================================================ */

function searchFields(
    query
) {

    const search =
        String(
            query ||
            ""
        )
        .toLowerCase()
        .trim();


    if (
        !search
    ) {

        return FIELD_ENGINE_STATE.fields;

    }


    return FIELD_ENGINE_STATE.fields
        .filter(
            field =>

                String(
                    field.name
                )
                .toLowerCase()
                .includes(
                    search
                ) ||

                String(
                    field.crop.name
                )
                .toLowerCase()
                .includes(
                    search
                ) ||

                String(
                    field.location.village
                )
                .toLowerCase()
                .includes(
                    search
                ) ||

                String(
                    field.location.district
                )
                .toLowerCase()
                .includes(
                    search
                )
        );
}


/* ============================================================
   49. EXPORT FIELD DATA
============================================================ */

function exportFieldData(
    fieldId =
        null
) {

    const field =
        fieldId
            ? getField(
                fieldId
            )
            : getCurrentField();


    if (
        !field
    ) {

        return null;

    }


    return {

        exportedAt:
            new Date()
                .toISOString(),

        engineVersion:
            FIELD_ENGINE_STATE.version,

        field:
            cloneFieldObject(
                field
            ),

        dashboard:
            getFieldDashboardModel(
                field
            ),

        scouting:
            getScoutingRecords(
                field.id
            ),

        observations:
            FIELD_ENGINE_STATE.observations
                .filter(
                    observation =>
                        observation.fieldId ===
                        field.id
                ),

        timeline:
            getFieldTimeline(
                field.id
            )
    };
}


/* ============================================================
   50. EXPORT JSON STRING
============================================================ */

function exportFieldJSON(
    fieldId =
        null
) {

    const data =
        exportFieldData(
            fieldId
        );


    if (
        !data
    ) {

        return null;

    }


    return JSON.stringify(
        data,
        null,
        2
    );
}


/* ============================================================
   51. CREATE DEMO FIELD
============================================================ */

function createDemoField() {

    const field =
        normalizeField({

            id:
                "FIELD-DEMO-001",

            name:
                "AgriGuard Smart Farm",

            farmer:
                "Demo Farmer",

            area:
                5,

            areaUnit:
                "acres",

            location: {

                village:
                    "Smart Village",

                district:
                    "Demo District",

                state:
                    "Andhra Pradesh",

                country:
                    "India",

                latitude:
                    16.5062,

                longitude:
                    80.6480
            },

            crop: {

                name:
                    "Paddy",

                variety:
                    "BPT 5204",

                season:
                    "Kharif",

                stage:
                    "Vegetative",

                daysAfterSowing:
                    35,

                expectedHarvestDays:
                    120
            },

            soil: {

                type:
                    "Loamy",

                moisture:
                    58,

                pH:
                    6.5,

                fertility:
                    78
            },

            irrigation: {

                method:
                    "Drip",

                status:
                    "Available",

                efficiency:
                    84
            },

            health: {

                score:
                    76
            },

            risk: {

                overall:
                    38,

                disease:
                    42,

                weather:
                    31,

                soil:
                    28,

                water:
                    39,

                pest:
                    24
            },

            notes:
                "SIH 2026 AgriGuard AI demonstration field."
        });


    /*
        Create four zones.
    */

    field.zones = [];


    const zones = [

        {

            name:
                "North Zone",

            area:
                1.25,

            healthScore:
                88,

            riskScore:
                18,

            diseaseRisk:
                14,

            soilRisk:
                18,

            waterRisk:
                20
        },

        {

            name:
                "East Zone",

            area:
                1.25,

            healthScore:
                79,

            riskScore:
                32,

            diseaseRisk:
                28,

            soilRisk:
                30,

            waterRisk:
                35
        },

        {

            name:
                "South Zone",

            area:
                1.25,

            healthScore:
                58,

            riskScore:
                67,

            diseaseRisk:
                72,

            soilRisk:
                51,

            waterRisk:
                62
        },

        {

            name:
                "West Zone",

            area:
                1.25,

            healthScore:
                92,

            riskScore:
                12,

            diseaseRisk:
                8,

            soilRisk:
                12,

            waterRisk:
                15
        }
    ];


    zones.forEach(
        zone => {

            field.zones.push({

                id:
                    generateFieldId(
                        "ZONE"
                    ),

                ...zone,

                crop:
                    field.crop.name,

                cropStage:
                    field.crop.stage,

                irrigationStatus:
                    "Normal",

                latitude:
                    field.location.latitude,

                longitude:
                    field.location.longitude,

                notes:
                    "",

                createdAt:
                    new Date()
                        .toISOString(),

                updatedAt:
                    new Date()
                        .toISOString()
            });

        }
    );


    /*
        Demo sensors.
    */

    field.sensors = [

        {

            id:
                "SENSOR-SM-01",

            name:
                "Soil Moisture Sensor",

            type:
                "soil-moisture",

            unit:
                "%",

            value:
                58,

            status:
                "online",

            battery:
                92,

            latitude:
                field.location.latitude,

            longitude:
                field.location.longitude,

            lastReading:
                new Date()
                    .toISOString()
        },

        {

            id:
                "SENSOR-TEMP-01",

            name:
                "Temperature Sensor",

            type:
                "temperature",

            unit:
                "°C",

            value:
                31.5,

            status:
                "online",

            battery:
                86,

            latitude:
                field.location.latitude,

            longitude:
                field.location.longitude,

            lastReading:
                new Date()
                    .toISOString()
        },

        {

            id:
                "SENSOR-HUM-01",

            name:
                "Humidity Sensor",

            type:
                "humidity",

            unit:
                "%",

            value:
                74,

            status:
                "online",

            battery:
                81,

            latitude:
                field.location.latitude,

            longitude:
                field.location.longitude,

            lastReading:
                new Date()
                    .toISOString()
        }
    ];


    /*
        Demo scouting record.
    */

    FIELD_ENGINE_STATE.scoutingRecords = [];


    addScoutingRecord(
        field.id,
        {

            zoneId:
                field.zones[2].id,

            observer:
                "Demo Scout",

            observation:
                "Leaf spotting observed in South Zone.",

            symptoms:
                [
                    "Leaf spots",
                    "Yellowing"
                ],

            severity:
                "Medium",

            diseaseSuspected:
                true,

            pestObserved:
                false,

            waterIssue:
                false,

            soilIssue:
                false,

            latitude:
                field.zones[2].latitude,

            longitude:
                field.zones[2].longitude,

            notes:
                "Requires AI image verification."
        }
    );


    return field;
}


/* ============================================================
   52. LOAD DEMO DATA
============================================================ */

function loadDemoField() {

    const demoField =
        createDemoField();


    FIELD_ENGINE_STATE.fields =
        [
            demoField
        ];


    FIELD_ENGINE_STATE.currentField =
        demoField;


    FIELD_ENGINE_STATE.currentFieldId =
        demoField.id;


    FIELD_ENGINE_STATE.initialized =
        true;


    FIELD_ENGINE_STATE.lastUpdated =
        new Date()
            .toISOString();


    addFieldTimelineEvent(
        "system",
        "AgriGuard demonstration field loaded.",
        demoField.id
    );


    /*
        Notify dashboard.
    */

    window.dispatchEvent(
        new CustomEvent(
            "agriguard:fieldLoaded",
            {
                detail:
                    getFieldDashboardModel(
                        demoField
                    )
            }
        )
    );


    return demoField;
}


/* ============================================================
   53. RESET FIELD ENGINE
============================================================ */

function resetFieldEngine() {

    FIELD_ENGINE_STATE.fields =
        [];

    FIELD_ENGINE_STATE.currentField =
        null;

    FIELD_ENGINE_STATE.currentFieldId =
        null;

    FIELD_ENGINE_STATE.observations =
        [];

    FIELD_ENGINE_STATE.scoutingRecords =
        [];

    FIELD_ENGINE_STATE.timeline =
        [];

    FIELD_ENGINE_STATE.lastUpdated =
        new Date()
            .toISOString();

    FIELD_ENGINE_STATE.initialized =
        false;


    return true;
}


/* ============================================================
   54. PUBLIC API
============================================================ */

window.FIELD_ENGINE_STATE =
    FIELD_ENGINE_STATE;


window.FIELD_HEALTH_LEVELS =
    FIELD_HEALTH_LEVELS;


window.FIELD_RISK_LEVELS =
    FIELD_RISK_LEVELS;


window.DEFAULT_FIELD =
    DEFAULT_FIELD;


window.initializeFieldEngine =
    initializeFieldEngine;


window.createField =
    createField;


window.selectField =
    selectField;


window.getCurrentField =
    getCurrentField;


window.getField =
    getField;


window.updateField =
    updateField;


window.getFieldHealthStatus =
    getFieldHealthStatus;


window.calculateFieldHealth =
    calculateFieldHealth;


window.updateFieldHealth =
    updateFieldHealth;


window.calculateOverallFieldRisk =
    calculateOverallFieldRisk;


window.getFieldRiskLevel =
    getFieldRiskLevel;


window.createFieldZone =
    createFieldZone;


window.createDefaultZones =
    createDefaultZones;


window.updateFieldZone =
    updateFieldZone;


window.getHighRiskZones =
    getHighRiskZones;


window.getPriorityZone =
    getPriorityZone;


window.addScoutingRecord =
    addScoutingRecord;


window.getScoutingRecords =
    getScoutingRecords;


window.getRecentScouting =
    getRecentScouting;


window.addFieldObservation =
    addFieldObservation;


window.addSensor =
    addSensor;


window.updateSensor =
    updateSensor;


window.getSensorSummary =
    getSensorSummary;


window.calculateCropProgress =
    calculateCropProgress;


window.getCropStageInfo =
    getCropStageInfo;


window.getFieldWaterStatus =
    getFieldWaterStatus;


window.generateFieldConditionSummary =
    generateFieldConditionSummary;


window.generateFieldPriorityActions =
    generateFieldPriorityActions;


window.addFieldTimelineEvent =
    addFieldTimelineEvent;


window.getFieldTimeline =
    getFieldTimeline;


window.getFieldRiskDistribution =
    getFieldRiskDistribution;


window.getFieldHealthDistribution =
    getFieldHealthDistribution;


window.getZoneStatistics =
    getZoneStatistics;


window.updateFieldFromEngines =
    updateFieldFromEngines;


window.getFieldDashboardModel =
    getFieldDashboardModel;


window.getFieldMapData =
    getFieldMapData;


window.requestCurrentLocation =
    requestCurrentLocation;


window.updateFieldLocation =
    updateFieldLocation;


window.searchFields =
    searchFields;


window.exportFieldData =
    exportFieldData;


window.exportFieldJSON =
    exportFieldJSON;


window.createDemoField =
    createDemoField;


window.loadDemoField =
    loadDemoField;


window.resetFieldEngine =
    resetFieldEngine;


/* ============================================================
   55. AUTO INITIALIZATION
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            /*
                Only initialize if app.js has not
                already initialized the field engine.
            */

            if (
                !FIELD_ENGINE_STATE.initialized
            ) {

                initializeFieldEngine();

            }

        }
    );

}

else {

    if (
        !FIELD_ENGINE_STATE.initialized
    ) {

        initializeFieldEngine();

    }

}


/* ============================================================
   56. CONSOLE STATUS
============================================================ */

console.log(
    "%c🌾 AgriGuard AI Field Engine",
    "font-size:16px;font-weight:bold;"
);

console.log(
    "Field intelligence engine initialized."
);

console.log(
    "Version:",
    FIELD_ENGINE_STATE.version
);
