const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const noteController = require('../controllers/noteController');

// Note routes - all routes require authentication
router.get('/roadmaps/:roadmapId/notes', isAuthenticated, noteController.getNotes);
router.post('/roadmaps/:roadmapId/notes', isAuthenticated, noteController.saveNote);
router.delete('/roadmaps/:roadmapId/notes/:videoId', isAuthenticated, noteController.deleteNote);

module.exports = router;