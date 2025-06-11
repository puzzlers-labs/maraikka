# Maraikka License Server

A Node.js backend service for validating Maraikka application licenses and managing premium features.

## Features

- **License Validation**: Validate license keys against a secure database
- **Feature Management**: Check which features are available for each license
- **Test Keys**: Provides demo license keys for development and testing
- **Security**: Secure token generation and validation
- **CORS Support**: Configured for cross-origin requests from the Electron app

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

### Get Test Keys (Development)
```
GET /api/test-keys
```
Returns all available test license keys for development.

### Validate License
```
POST /api/validate-license
Content-Type: application/json

{
  "licenseKey": "MRKK-DEMO-FIDO-2024"
}
```

### Check Feature Availability
```
POST /api/check-feature
Content-Type: application/json

{
  "licenseKey": "MRKK-DEMO-FIDO-2024",
  "feature": "fido"
}
```

### Get License Information
```
POST /api/license-info
Content-Type: application/json

{
  "licenseKey": "MRKK-DEMO-FIDO-2024"
}
```

## Test License Keys

The server includes several test license keys for development:

- `MRKK-DEMO-FIDO-2024` - Demo license for FIDO2 features
- `MRKK-TEST-BULK-2024` - Test license for bulk operations
- `MRKK-FULL-PREM-2024` - Full premium license with all features
- `MRKK-EXPIRED-TEST-2023` - Expired test license (for testing expiration)

## Features

- **fido** - FIDO2 Hardware Authentication (YubiKey, Touch ID, Windows Hello)
- **bulk** - Bulk Operations (encrypt/decrypt multiple files)
- **cloud** - Cloud Integration (encrypt files in cloud services)

## Installation

1. Navigate to the license-server directory:
```bash
cd license-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Configuration

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Security Features

- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Secure token generation using SHA-256
- License key format validation
- Expiration date checking
- Active/inactive status validation

## License Key Format

License keys follow the format: `MRKK-XXXX-XXXX-XXXX`

Where:
- `MRKK` - Product prefix
- Each `XXXX` segment contains 4 alphanumeric characters

## Development

The server is designed for development and testing purposes. In a production environment, you would:

1. Use a proper database (PostgreSQL, MongoDB, etc.)
2. Add authentication for API endpoints
3. Implement rate limiting
4. Add proper logging
5. Use environment variables for configuration
6. Add SSL/TLS termination 