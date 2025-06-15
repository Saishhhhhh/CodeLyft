const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const roadmapController = require('../controllers/roadmapController');

// Roadmap routes
router.get('/roadmaps', isAuthenticated, roadmapController.getUserRoadmaps);
router.get('/roadmaps/:id', isAuthenticated, roadmapController.getRoadmap);
router.post('/roadmaps', isAuthenticated, roadmapController.createRoadmap);
router.put('/roadmaps/:id', isAuthenticated, roadmapController.updateRoadmap);
router.delete('/roadmaps/:id', isAuthenticated, roadmapController.deleteRoadmap);

// Topic routes (now part of roadmap document)
router.post('/roadmaps/:id/topics', isAuthenticated, roadmapController.addTopic);
router.put('/roadmaps/:id/topics/:topicId/progress', isAuthenticated, roadmapController.updateTopicProgress);
router.post('/roadmaps/:id/topics/:topicId/resources/generate', isAuthenticated, roadmapController.generateTopicResources);

// Migration route
router.post('/roadmaps/migrate-progress', isAuthenticated, roadmapController.migrateRoadmapProgress);

// Update roadmap progress
router.put('/roadmaps/:roadmapId/progress', isAuthenticated, roadmapController.updateRoadmapProgress);

module.exports = router;
