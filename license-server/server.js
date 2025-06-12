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

// Banner Configuration Database
const BANNERS = [
    {
        id: 'welcome-2024',
        type: 'info',
        messages: {
            en: 'Welcome to Maraikka 2024! Experience enhanced security with our latest encryption features.',
            es: '¡Bienvenido a Maraikka 2024! Experimenta seguridad mejorada con nuestras últimas características de cifrado.',
            hi: 'Maraikka 2024 में आपका स्वागत है! हमारी नवीनतम एन्क्रिप्शन सुविधाओं के साथ बेहतर सुरक्षा का अनुभव करें।',
            ja: 'Maraikka 2024へようこそ！最新の暗号化機能で強化されたセキュリティをご体験ください。'
        },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        priority: 1,
        dismissible: true,
        targetAudience: 'all' // 'all', 'free', 'premium'
    },
    {
        id: 'security-update',
        type: 'warning',
        messages: {
            en: 'Important: Please update to the latest version for critical security improvements.',
            es: 'Importante: Por favor actualiza a la última versión para mejoras críticas de seguridad.',
            hi: 'महत्वपूर्ण: महत्वपूर्ण सुरक्षा सुधारों के लिए कृपया नवीनतम संस्करण में अपडेट करें।',
            ja: '重要：重要なセキュリティ改善のため、最新バージョンにアップデートしてください。'
        },
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        isActive: true,
        priority: 2,
        dismissible: false,
        targetAudience: 'all'
    },
    {
        id: 'premium-features',
        type: 'success',
        messages: {
            en: 'Unlock premium features like hardware authentication and bulk operations with a license key!',
            es: '¡Desbloquea características premium como autenticación de hardware y operaciones en lote con una clave de licencia!',
            hi: 'लाइसेंस कुंजी के साथ हार्डवेयर प्रमाणीकरण और बल्क ऑपरेशन जैसी प्रीमियम सुविधाओं को अनलॉक करें!',
            ja: 'ライセンスキーでハードウェア認証やバルク操作などのプレミアム機能をアンロックしましょう！'
        },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        isActive: true,
        priority: 3,
        dismissible: true,
        targetAudience: 'free'
    },
    {
        id: 'maintenance-notice',
        type: 'error',
        messages: {
            en: 'Scheduled maintenance on Feb 1-2. Some features may be temporarily unavailable.',
            es: 'Mantenimiento programado del 1-2 de febrero. Algunas características pueden estar temporalmente no disponibles.',
            hi: '1-2 फरवरी को निर्धारित रखरखाव। कुछ सुविधाएं अस्थायी रूप से अनुपलब्ध हो सकती हैं।',
            ja: '2月1-2日にメンテナンスを予定しています。一部機能が一時的に利用できない場合があります。'
        },
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-02'),
        isActive: false,
        priority: 1,
        dismissible: false,
        targetAudience: 'all'
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

// Get active banners
app.get('/api/banners', (req, res) => {
    try {
        const { userType = 'free', language = 'en' } = req.query; // 'free', 'premium', or 'all'
        const now = new Date();
        
        // Filter banners based on criteria
        const activeBanners = BANNERS.filter(banner => {
            // Check if banner is active
            if (!banner.isActive) return false;
            
            // Check date range
            if (now < banner.startDate || now > banner.endDate) return false;
            
            // Check target audience
            if (banner.targetAudience !== 'all' && banner.targetAudience !== userType) return false;
            
            return true;
        });
        
        // Sort by priority (lower number = higher priority)
        activeBanners.sort((a, b) => a.priority - b.priority);
        
        res.json({
            success: true,
            banners: activeBanners.map(banner => ({
                id: banner.id,
                type: banner.type,
                message: banner.messages[language] || banner.messages['en'], // Fallback to English
                priority: banner.priority,
                dismissible: banner.dismissible,
                targetAudience: banner.targetAudience
            }))
        });

    } catch (error) {
        console.error('Banner fetch error:', error);
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