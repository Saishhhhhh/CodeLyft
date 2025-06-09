const Note = require('../models/Note');
const mongoose = require('mongoose');

// Get all notes for a roadmap
exports.getNotes = async (req, res) => {
  try {
    const roadmapId = req.params.roadmapId;
    const userId = req.user.id;

    // Validate roadmapId
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roadmap ID format'
      });
    }

    // Find all notes for this roadmap and user
    const notes = await Note.find({ 
      roadmapId, 
      userId 
    }).sort({ timestamp: -1 });
    
    // Transform notes array into an object with videoId as key
    const notesObject = {};
    const timestampsObject = {};
    
    notes.forEach(note => {
      notesObject[note.videoId] = note.notes;
      timestampsObject[note.videoId] = note.timestamp;
    });

    return res.status(200).json({
      success: true,
      data: {
        notes: notesObject,
        timestamps: timestampsObject
      }
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Save or update note for a video in a roadmap
exports.saveNote = async (req, res) => {
  try {
    const roadmapId = req.params.roadmapId;
    const userId = req.user.id;
    const { videoId, notes, timestamp } = req.body;

    // Validate required fields
    if (!videoId || !roadmapId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID and roadmap ID are required'
      });
    }
    
    // Validate roadmapId
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roadmap ID format'
      });
    }

    // Find and update note if exists, otherwise create new one
    const note = await Note.findOneAndUpdate(
      { roadmapId, userId, videoId },
      { 
        notes, 
        timestamp: timestamp || new Date()
      },
      { 
        new: true, 
        upsert: true, 
        setDefaultsOnInsert: true 
      }
    );

    return res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error saving note:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a note
exports.deleteNote = async (req, res) => {
  try {
    const roadmapId = req.params.roadmapId;
    const videoId = req.params.videoId;
    const userId = req.user.id;

    // Validate roadmapId
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roadmap ID format'
      });
    }

    // Find and delete the note
    const result = await Note.findOneAndDelete({ 
      roadmapId, 
      userId, 
      videoId 
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
 