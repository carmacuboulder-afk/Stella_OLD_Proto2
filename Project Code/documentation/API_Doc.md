# STELLA External API Routes

This document outlines the customer-facing external API routes available for retrieving STELLA data.

## Base URL

Production URL is not yet assigned. Use the placeholder below for now:

`https://api.example.com/api`

---

# Table of Contents

- Authentication
  - Login: `/auth/login`
- External API
  - Get All Devices: `/external/devices`
  - Get Device by ID: `/external/devices/{id}`
  - Get All Uploads: `/external/uploads`
  - Get Upload by ID: `/external/uploads/{id}`
  - Get Full Upload Bundle: `/external/uploads/{id}/full`
  - Get Upload Data: `/external/uploads/{id}/data`
  - Get All Data Records: `/external/data`
  - Get Data Record by ID: `/external/data/{id}`
  - Get Device Data: `/external/devices/{id}/data`
- Health
  - API Health Check: `/health`

---

# Authentication

All `/external/*` routes currently require JWT Bearer authentication.

To access the external API:

1. Log in with a valid account
2. Copy the returned JWT
3. Send it in the `Authorization` header for all external requests

Header format:

`Authorization: Bearer <token>`

Tokens currently expire after **7 days**.

## Login

`POST /auth/login`

Authenticates a user and returns a JWT token.

### Request Body

```json
{
  "username": "developer1",
  "password": "your_password"
}
````

You may also log in with email instead of username:

```json
{
  "email": "developer@example.com",
  "password": "your_password"
}
```

### Request Parameters

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| username  | string | Yes*     | Username for login |
| email     | string | Yes*     | Email for login    |
| password  | string | Yes      | Account password   |

* Provide either `username` or `email`.

### Example Request

```bash
curl -X POST "https://api.example.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "developer1",
    "password": "your_password"
  }'
```

### Response (200 OK)

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "developer1",
    "email": "developer@example.com",
    "role": "user"
  }
}
```

### Response (400 Bad Request)

```json
{
  "error": "username/email and password are required"
}
```

### Response (401 Unauthorized)

```json
{
  "error": "Invalid credentials"
}
```
# Token Check

GET /auth/me

Returns the authenticated user associated with the provided JWT.

### Required Header

```Authorization: Bearer <token>```

### Example Request
```
curl "https://api.example.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
### Response (200 OK)
```
{
  "id": 1,
  "username": "developer1",
  "email": "developer@example.com",
  "role": "user",
  "created_at": "2026-03-23T00:00:00.000Z"
}
```
### Response (404 Not Found)
```
{
  "id": 1,
  "username": "developer1",
  "email": "developer@example.com",
  "role": "user",
  "created_at": "2026-03-23T00:00:00.000Z"
}
```
---

# External API

All routes below require this header:

`Authorization: Bearer <token>`

---

## Get All Devices

`GET /external/devices`

Returns all devices.

### Request Parameters

None.

### Example Request

```bash
curl "https://api.example.com/api/external/devices" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

```json
[
  {
    "id": 1,
    "device_type": "STELLA-V1",
    "name": "Field Device 1",
    "software_version": "1.0.0",
    "created_at": "2026-03-23T00:00:00.000Z",
    "battery_voltage": 3.7
  }
]
```

### Response Fields

| Field            | Type    | Description                                  |
| ---------------- | ------- | -------------------------------------------- |
| id               | integer | Unique device ID                             |
| device_type      | string  | Device model or type                         |
| name             | string  | Device name                                  |
| software_version | string  | Device software or firmware version          |
| created_at       | string  | Timestamp when the device record was created |
| battery_voltage  | number  | Battery voltage                              |

---

## Get Device by ID

`GET /external/devices/{id}`

Returns a single device by ID.

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| id        | integer | Yes      | Device ID   |

### Example Request

```bash
curl "https://api.example.com/api/external/devices/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

```json
{
  "id": 1,
  "device_type": "STELLA-V1",
  "name": "Field Device 1",
  "software_version": "1.0.0",
  "created_at": "2026-03-23T00:00:00.000Z",
  "battery_voltage": 3.7
}
```

### Response (404 Not Found)

```json
{
  "error": "Device not found"
}
```

---

## Get All Uploads

`GET /external/uploads`

Returns upload records. Supports optional filtering and pagination.

### Query Parameters

| Parameter | Type    | Required | Description                 |
| --------- | ------- | -------- | --------------------------- |
| userId    | integer | No       | Filter by user ID           |
| teamId    | integer | No       | Filter by team ID           |
| deviceId  | integer | No       | Filter by device ID         |
| limit     | integer | No       | Number of records to return |
| offset    | integer | No       | Number of records to skip   |

### Notes

* Default `limit` is `100`
* Default `offset` is `0`
* Results are ordered by `timestamp_iso8601` in descending order
* This endpoint returns an array only and does not currently return total record count metadata

### Example Request

```bash
curl "https://api.example.com/api/external/uploads?deviceId=1&limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

```json
[
  {
    "id": 10,
    "user_id": 2,
    "team_id": 1,
    "is_public": true,
    "device_id": 1,
    "upload_name": "Morning Upload",
    "latitude": 39.7392,
    "longitude": -104.9903,
    "location_label": "Denver, CO",
    "weekday": "Monday",
    "timestamp_iso8601": "2026-03-23T14:30:00.000Z",
    "created_at": "2026-03-23T14:31:00.000Z"
  }
]
```

### Response Fields

| Field             | Type    | Description                            |
| ----------------- | ------- | -------------------------------------- |
| id                | integer | Upload ID                              |
| user_id           | integer | User associated with the upload        |
| team_id           | integer | Team associated with the upload        |
| is_public         | boolean | Visibility flag stored with the upload |
| device_id         | integer | Related device ID                      |
| upload_name       | string  | Upload name or label                   |
| latitude          | number  | Latitude                               |
| longitude         | number  | Longitude                              |
| location_label    | string  | Human-readable location label          |
| weekday           | string  | Weekday associated with the upload     |
| timestamp_iso8601 | string  | Upload timestamp in ISO 8601 format    |
| created_at        | string  | Record creation timestamp              |


---

## Get Upload by ID

`GET /external/uploads/{id}`

Returns a single upload by ID.

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| id        | integer | Yes      | Upload ID   |

### Example Request

```bash
curl "https://api.example.com/api/external/uploads/10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

```json
{
  "id": 10,
  "user_id": 2,
  "team_id": 1,
  "is_public": true,
  "device_id": 1,
  "upload_name": "Morning Upload",
  "latitude": 39.7392,
  "longitude": -104.9903,
  "location_label": "Denver, CO",
  "weekday": "Monday",
  "timestamp_iso8601": "2026-03-23T14:30:00.000Z",
  "created_at": "2026-03-23T14:31:00.000Z"
}
```

### Response (404 Not Found)

```json
{
  "error": "Upload not found"
}
```

---

## Get Full Upload Bundle

`GET /external/uploads/{id}/full`

Returns the upload, its related device, and all associated data rows in a single response.

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| id        | integer | Yes      | Upload ID   |

### Example Request

```bash
curl "https://api.example.com/api/external/uploads/10/full" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

```json
{
  "upload": {
    "id": 10,
    "user_id": 2,
    "team_id": 1,
    "is_public": true,
    "device_id": 1,
    "upload_name": "Morning Upload",
    "latitude": 39.7392,
    "longitude": -104.9903,
    "location_label": "Denver, CO",
    "weekday": "Monday",
    "timestamp_iso8601": "2026-03-23T14:30:00.000Z",
    "created_at": "2026-03-23T14:31:00.000Z"
  },
  "device": {
    "id": 1,
    "device_type": "STELLA-V1",
    "name": "Field Device 1",
    "software_version": "1.0.0",
    "created_at": "2026-03-23T00:00:00.000Z",
    "battery_voltage": 3.7
  },
  "data": [
    {
      "id": 100,
      "upload_id": 10,
      "device_id": 1,
      "surface_temperature_c": 25.1,
      "air_temperature_c": 22.8,
      "relative_humidity_percent": 40.5,
      "barometric_pressure_hpa": 1013.2,
      "timestamp_iso8601": "2026-03-23T14:30:00.000Z",
      "created_at": "2026-03-23T14:31:10.000Z"
    }
  ]
}
```

### Response (404 Not Found)

```json
{
  "error": "Upload not found"
}
```

---

## Get Upload Data

`GET /external/uploads/{id}/data`

Returns all data rows associated with a specific upload.

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| id        | integer | Yes      | Upload ID   |

### Query Parameters

| Parameter | Type    | Required | Description                         |
| --------- | ------- | -------- | ----------------------------------- |
| from      | string  | No       | Lower bound for `timestamp_iso8601` |
| to        | string  | No       | Upper bound for `timestamp_iso8601` |
| limit     | integer | No       | Number of records to return         |
| offset    | integer | No       | Number of records to skip           |

### Notes

* Default `limit` is `500`
* Default `offset` is `0`
* Results are ordered by `timestamp_iso8601` in ascending order
* Timestamp filters should be provided in ISO 8601 format, for example: `2026-03-23T00:00:00.000Z`

### Example Request

```bash
curl "https://api.example.com/api/external/uploads/10/data?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

```json
[
  {
    "id": 100,
    "upload_id": 10,
    "device_id": 1,
    "surface_temperature_c": 25.1,
    "surface_temperature_uncertainty_c": 0.2,
    "air_temperature_c": 22.8,
    "air_temperature_uncertainty_c": 0.2,
    "relative_humidity_percent": 40.5,
    "relative_humidity_uncertainty_percent": 1.0,
    "barometric_pressure_hpa": 1013.2,
    "barometric_pressure_uncertainty_hpa": 0.5,
    "altitude_uncalibrated_m": 1609.3,
    "altitude_uncertainty_m": 1.1,
    "irradiance_450nm_blue_wavelength_nm": 450,
    "irradiance_450nm_blue_wavelength_uncertainty_nm": 1,
    "irradiance_450nm_blue_irradiance_uW_per_cm_squared": 12.5,
    "irradiance_450nm_blue_irradiance_uncertainty_uW_per_cm_squared": 0.4,
    "irradiance_500nm_cyan_wavelength_nm": 500,
    "irradiance_500nm_cyan_wavelength_uncertainty_nm": 1,
    "irradiance_500nm_cyan_irradiance_uW_per_cm_squared": 10.2,
    "irradiance_500nm_cyan_irradiance_uncertainty_uW_per_cm_squared": 0.4,
    "irradiance_550nm_green_wavelength_nm": 550,
    "irradiance_550nm_green_wavelength_uncertainty_nm": 1,
    "irradiance_550nm_green_irradiance_uW_per_cm_squared": 9.8,
    "irradiance_550nm_green_irradiance_uncertainty_uW_per_cm_squared": 0.4,
    "irradiance_570nm_yellow_wavelength_nm": 570,
    "irradiance_570nm_yellow_wavelength_uncertainty_nm": 1,
    "irradiance_570nm_yellow_irradiance_uW_per_cm_squared": 8.6,
    "irradiance_570nm_yellow_irradiance_uncertainty_uW_per_cm_squared": 0.4,
    "irradiance_600nm_orange_wavelength_nm": 600,
    "irradiance_600nm_orange_wavelength_uncertainty_nm": 1,
    "irradiance_600nm_orange_irradiance_uW_per_cm_squared": 7.5,
    "irradiance_600nm_orange_irradiance_uncertainty_uW_per_cm_squared": 0.4,
    "irradiance_650nm_red_wavelength_nm": 650,
    "irradiance_650nm_red_wavelength_uncertainty_nm": 1,
    "irradiance_650nm_red_irradiance_uW_per_cm_squared": 6.1,
    "irradiance_650nm_red_irradiance_uncertainty_uW_per_cm_squared": 0.3,
    "irradiance_610nm_orange_wavelength_nm": 610,
    "irradiance_610nm_orange_wavelength_uncertainty_nm": 1,
    "irradiance_610nm_orange_irradiance_uW_per_cm_squared": 7.0,
    "irradiance_610nm_orange_irradiance_uncertainty_uW_per_cm_squared": 0.3,
    "irradiance_680nm_near_infrared_wavelength_nm": 680,
    "irradiance_680nm_near_infrared_wavelength_uncertainty_nm": 1,
    "irradiance_680nm_near_infrared_irradiance_uW_per_cm_squared": 5.8,
    "irradiance_680nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared": 0.3,
    "irradiance_730nm_near_infrared_wavelength_nm": 730,
    "irradiance_730nm_near_infrared_wavelength_uncertainty_nm": 1,
    "irradiance_730nm_near_infrared_irradiance_uW_per_cm_squared": 5.4,
    "irradiance_730nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared": 0.3,
    "irradiance_760nm_near_infrared_wavelength_nm": 760,
    "irradiance_760nm_near_infrared_wavelength_uncertainty_nm": 1,
    "irradiance_760nm_near_infrared_irradiance_uW_per_cm_squared": 5.1,
    "irradiance_760nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared": 0.3,
    "irradiance_810nm_near_infrared_wavelength_nm": 810,
    "irradiance_810nm_near_infrared_wavelength_uncertainty_nm": 1,
    "irradiance_810nm_near_infrared_irradiance_uW_per_cm_squared": 4.7,
    "irradiance_810nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared": 0.3,
    "irradiance_860nm_near_infrared_wavelength_nm": 860,
    "irradiance_860nm_near_infrared_wavelength_uncertainty_nm": 1,
    "irradiance_860nm_near_infrared_irradiance_uW_per_cm_squared": 4.4,
    "irradiance_860nm_near_infrared_irradiance_uncertainty_uW_per_cm_squared": 0.3,
    "range_m": 1.2,
    "range_uncertainty_m": 0.1,
    "created_at": "2026-03-23T14:31:10.000Z",
    "timestamp_iso8601": "2026-03-23T14:30:00.000Z"
  }
]
```

---

## Get All Data Records

`GET /external/data`

Returns sensor and environmental data records. Supports filtering and pagination.

### Query Parameters

| Parameter | Type    | Required | Description                         |
| --------- | ------- | -------- | ----------------------------------- |
| uploadId  | integer | No       | Filter by upload ID                 |
| deviceId  | integer | No       | Filter by device ID                 |
| from      | string  | No       | Lower bound for `timestamp_iso8601` |
| to        | string  | No       | Upper bound for `timestamp_iso8601` |
| limit     | integer | No       | Number of records to return         |
| offset    | integer | No       | Number of records to skip           |

### Notes

* Default `limit` is `100`
* Default `offset` is `0`
* Results are ordered by `timestamp_iso8601` in descending order
* This endpoint returns an array only and does not currently return total record count metadata
* Timestamps should be provided in ISO 8601 format

### Example Request

```bash
curl "https://api.example.com/api/external/data?deviceId=1&from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z&limit=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

Returns an array of data objects in the same structure shown in the `/external/uploads/{id}/data` section.

### Core Data Fields

| Field                     | Type    | Description                              |
| ------------------------- | ------- | ---------------------------------------- |
| id                        | integer | Data record ID                           |
| upload_id                 | integer | Related upload ID                        |
| device_id                 | integer | Related device ID                        |
| surface_temperature_c     | number  | Surface temperature in Celsius           |
| air_temperature_c         | number  | Air temperature in Celsius               |
| relative_humidity_percent | number  | Relative humidity percentage             |
| barometric_pressure_hpa   | number  | Barometric pressure in hPa               |
| altitude_uncalibrated_m   | number  | Uncalibrated altitude in meters          |
| range_m                   | number  | Range measurement in meters              |
| timestamp_iso8601         | string  | Measurement timestamp in ISO 8601 format |
| created_at                | string  | Record creation timestamp                |

### Additional Data Fields

This endpoint also returns uncertainty values and wavelength/irradiance measurements for multiple spectral bands, including blue, cyan, green, yellow, orange, red, and near-infrared measurements.

---

## Get Data Record by ID

`GET /external/data/{id}`

Returns one data record by ID.

### Path Parameters

| Parameter | Type    | Required | Description    |
| --------- | ------- | -------- | -------------- |
| id        | integer | Yes      | Data record ID |

### Example Request

```bash
curl "https://api.example.com/api/external/data/100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

Returns a single data object in the same structure as the `/external/data` collection.

### Response (404 Not Found)

```json
{
  "error": "Data row not found"
}
```

---

## Get Device Data

`GET /external/devices/{id}/data`

Returns all data rows associated with a specific device.

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| id        | integer | Yes      | Device ID   |

### Query Parameters

| Parameter | Type    | Required | Description                         |
| --------- | ------- | -------- | ----------------------------------- |
| from      | string  | No       | Lower bound for `timestamp_iso8601` |
| to        | string  | No       | Upper bound for `timestamp_iso8601` |
| limit     | integer | No       | Number of records to return         |
| offset    | integer | No       | Number of records to skip           |

### Notes

* Default `limit` is `500`
* Default `offset` is `0`
* Results are ordered by `timestamp_iso8601` in ascending order
* Timestamps should be provided in ISO 8601 format

### Example Request

```bash
curl "https://api.example.com/api/external/devices/1/data?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response (200 OK)

Returns an array of data objects in the same structure shown in the `/external/uploads/{id}/data` section.

---

# Health

## API Health Check

`GET /health`

Returns a simple API and database health response.

### Example Request

```bash
curl "https://api.example.com/api/health"
```

### Response (200 OK)

```json
{
  "ok": true,
  "dbTime": "2026-03-23T15:00:00.000Z"
}
```

### Response (500 Internal Server Error)

```json
{
  "error": "Internal server error"
}
```

---

# Common Error Responses

## Missing Authorization Header

Response (`401 Unauthorized`)

```json
{
  "error": "Missing Authorization header"
}
```

## Invalid Authorization Header Format

Response (`401 Unauthorized`)

```json
{
  "error": "Authorization must be Bearer <token>"
}
```

## Invalid or Expired Token

Response (`403 Forbidden`)

```json
{
  "error": "Invalid or expired token"
}
```

## Internal Server Error

Response (`500 Internal Server Error`)

```json
{
  "error": "Internal server error"
}
```

---

# Current Behavior Notes

* All external routes currently require JWT authentication
* CORS is currently broadly enabled
* There is currently no rate limiting
* Pagination uses `limit` and `offset`
* Timestamp filtering uses `from` and `to` against `timestamp_iso8601`
* Timestamp values should be sent in ISO 8601 format
* List endpoints currently return arrays only and do not include pagination metadata such as total counts