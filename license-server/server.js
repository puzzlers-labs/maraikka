const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Test License Keys Database
const LICENSE_KEYS = [
    {
        key: 'MRKK-DEMO-FIDO-2024',
        features: ['fido'],
        type: 'demo',
        expiresAt: new Date('2025-12-31'),
        isActive: true,
        description: 'Demo license for FIDO2 features'
    },
    {
        key: 'MRKK-TEST-BULK-2024',
        features: ['bulk'],
        type: 'test',
        expiresAt: new Date('2025-12-31'),
        isActive: true,
        description: 'Test license for bulk operations'
    },
    {
        key: 'MRKK-FULL-PREM-2024',
        features: ['fido', 'bulk', 'cloud'],
        type: 'premium',
        expiresAt: new Date('2025-12-31'),
        isActive: true,
        description: 'Full premium license with all features'
    },
    {
        key: 'MRKK-EXPIRED-TEST-2023',
        features: ['fido'],
        type: 'demo',
        expiresAt: new Date('2023-12-31'),
        isActive: false,
        description: 'Expired test license'
    }
];

// Helper function to validate license key format
function isValidKeyFormat(key) {
    // Expected format: MRKK-XXXX-XXXX-XXXX
    const keyPattern = /^MRKK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return keyPattern.test(key);
}

// Helper function to generate a secure hash
function generateSecureHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get all available test keys (for development only)
app.get('/api/test-keys', (req, res) => {
    const testKeys = LICENSE_KEYS.map(license => ({
        key: license.key,
        features: license.features,
        type: license.type,
        description: license.description,
        isActive: license.isActive
    }));
    
    res.json({
        success: true,
        keys: testKeys
    });
});

// Validate license key
app.post('/api/validate-license', (req, res) => {
    try {
        const { licenseKey } = req.body;
        
        // Basic validation
        if (!licenseKey || typeof licenseKey !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'License key is required'
            });
        }

        // Format validation
        if (!isValidKeyFormat(licenseKey)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid license key format'
            });
        }

        // Find license in database
        const license = LICENSE_KEYS.find(l => l.key === licenseKey);
        
        if (!license) {
            return res.status(404).json({
                success: false,
                error: 'License key not found'
            });
        }

        // Check if license is active
        if (!license.isActive) {
            return res.status(403).json({
                success: false,
                error: 'License key is inactive'
            });
        }

        // Check if license is expired
        const now = new Date();
        if (license.expiresAt < now) {
            return res.status(403).json({
                success: false,
                error: 'License key has expired'
            });
        }

        // Generate secure token for this validation
        const validationToken = generateSecureHash(
            `${licenseKey}-${now.toISOString()}-${Math.random()}`
        );

        // Return validation success with license details
        res.json({
            success: true,
            license: {
                key: license.key,
                features: license.features,
                type: license.type,
                expiresAt: license.expiresAt,
                validatedAt: now,
                token: validationToken
            }
        });

    } catch (error) {
        console.error('License validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Check feature availability
app.post('/api/check-feature', (req, res) => {
    try {
        const { licenseKey, feature } = req.body;
        
        if (!licenseKey || !feature) {
            return res.status(400).json({
                success: false,
                error: 'License key and feature are required'
            });
        }

        const license = LICENSE_KEYS.find(l => l.key === licenseKey);
        
        if (!license || !license.isActive || license.expiresAt < new Date()) {
            return res.json({
                success: false,
                hasFeature: false,
                error: 'Invalid or expired license'
            });
        }

        const hasFeature = license.features.includes(feature);
        
        res.json({
            success: true,
            hasFeature,
            feature,
            licenseType: license.type
        });

    } catch (error) {
        console.error('Feature check error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get license info
app.post('/api/license-info', (req, res) => {
    try {
        const { licenseKey } = req.body;
        
        if (!licenseKey) {
            return res.status(400).json({
                success: false,
                error: 'License key is required'
            });
        }

        const license = LICENSE_KEYS.find(l => l.key === licenseKey);
        
        if (!license) {
            return res.status(404).json({
                success: false,
                error: 'License not found'
            });
        }

        res.json({
            success: true,
            license: {
                type: license.type,
                features: license.features,
                description: license.description,
                expiresAt: license.expiresAt,
                isActive: license.isActive,
                daysUntilExpiry: Math.ceil((license.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            }
        });

    } catch (error) {
        console.error('License info error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Maraikka License Server running on port ${PORT}`);
    console.log(`📋 Available test keys: ${LICENSE_KEYS.length}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 Test keys endpoint: http://localhost:${PORT}/api/test-keys`);
});

module.exports = app; 