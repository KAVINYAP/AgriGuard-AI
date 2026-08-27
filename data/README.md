# AgriGuard AI Data

This directory contains local JSON datasets used by the AgriGuard AI frontend.

## Files

### crops.json

Contains crop information including:

- Crop ID
- Crop name
- Scientific name
- Crop category
- Common diseases

### diseases.json

Contains disease information including:

- Disease name
- Associated crop
- Severity
- Symptoms
- Causes
- Management recommendations

### weather.json

Contains default weather data used for frontend development and testing.

The production application should obtain live weather information through the weather engine/API.

### soil.json

Contains default soil-health values and interpretation thresholds.

### fields.json

Contains example field-level information such as:

- Crop
- Area
- Crop health
- Disease risk
- Soil moisture
- NDVI
- Field status

## Important

The values in these files are development/demo data.

They should not be treated as real-time agricultural measurements.

Production data should come from validated sensors, APIs, field observations, or other trusted sources.
