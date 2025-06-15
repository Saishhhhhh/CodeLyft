const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const customRoadmapController = require('../controllers/customRoadmapController');

// Route: GET /api/custom-roadmaps
// Description: Get all custom roadmaps for the current user
router.get('/', isAuthenticated, customRoadmapController.getUserCustomRoadmaps);

// Route: GET /api/custom-roadmaps/:id
// Description: Get a specific custom roadmap by ID
router.get('/:id', isAuthenticated, customRoadmapController.getCustomRoadmap);

// Route: POST /api/custom-roadmaps
// Description: Create a new custom roadmap
router.post('/', isAuthenticated, customRoadmapController.createCustomRoadmap);

// Route: PUT /api/custom-roadmaps/:id
// Description: Update an existing custom roadmap
router.put('/:id', isAuthenticated, customRoadmapController.updateCustomRoadmap);

// Route: DELETE /api/custom-roadmaps/:id
// Description: Delete a custom roadmap
router.delete('/:id', isAuthenticated, customRoadmapController.deleteCustomRoadmap);

module.exports = router; 