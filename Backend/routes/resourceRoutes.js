const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// GET /api/resources/technology - Find resources for a specific technology
router.get('/technology', resourceController.findResourcesForTechnology);

// POST /api/resources/discover - Find resources for multiple technologies
router.post('/discover', resourceController.findResourcesForMultipleTechnologies);

// POST /api/resources/cache - Cache a resource
router.post('/cache', resourceController.cacheResource);

// POST /api/resources/cleanup - Clean up expired resources
router.post('/cleanup', resourceController.cleanupExpiredResources);

// POST /api/resources/process - Process technologies in batches
router.post('/process', resourceController.processTechnologies);

// POST /api/resources/update-shared - Update shared resources after roadmap generation
router.post('/update-shared', resourceController.updateSharedResources);

module.exports = router; 