// backend/routes/contestRoutes.js
const express = require('express');
const router = express.Router();
const Contest = require('../models/contest.js');

// Correctly import the 'authenticateToken' middleware function
const { authenticateToken } = require('../middleware/authMiddleware.js'); // Changed from 'protect'

// Get all upcoming contests (public route)
router.get('/', async (req, res) => {
    try {
        const contests = await Contest.find().sort({ startTime: 1 });
        res.json(contests);
    } catch (error) {
        console.error('Error fetching contests:', error);
        res.status(500).json({ message: 'Error fetching contests' });
    }
});

// Example: Route to add a contest (protected)
router.post('/', authenticateToken, async (req, res) => { // Changed from 'protect'
    const { name, platform, url, date, durationHours, type } = req.body;
    if (!name || !platform || !url || !date) {
        return res.status(400).json({ message: 'Please provide name, platform, url, and date for the contest.' });
    }
    try {
        const newContest = new Contest({ name, platform, url, date, durationHours, type });
        await newContest.save();
        res.status(201).json(newContest);
    } catch (error) {
        console.error('Error creating contest:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error creating contest' });
    }
});

// Example: Get a single contest by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }
        res.json(contest);
    } catch (error) {
        console.error('Error fetching contest by ID:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid contest ID format' });
        }
        res.status(500).json({ message: 'Error fetching contest' });
    }
});

// Example: Update a contest (protected)
router.put('/:id', authenticateToken, async (req, res) => { // Changed from 'protect'
    try {
        const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true,
        });
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found to update' });
        }
        res.json(contest);
    } catch (error) {
        console.error('Error updating contest:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid contest ID format' });
        }
        res.status(500).json({ message: 'Error updating contest' });
    }
});

// Example: Delete a contest (protected)
router.delete('/:id', authenticateToken, async (req, res) => { // Changed from 'protect'
    try {
        const contest = await Contest.findByIdAndDelete(req.params.id);
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found to delete' });
        }
        res.json({ message: 'Contest deleted successfully' });
    } catch (error) {
        console.error('Error deleting contest:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid contest ID format' });
        }
        res.status(500).json({ message: 'Error deleting contest' });
    }
});

module.exports = router;