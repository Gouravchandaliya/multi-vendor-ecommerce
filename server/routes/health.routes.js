const express = require('express');
const mongoose = require('mongoose');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

/**
 * GET /api/v1/health
 * Public endpoint used to verify the server is running and the database is connected.
 * Useful for deployment health checks (Render, Railway, etc.) and frontend connectivity tests.
 */
router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;

  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.status(200).json(
    new ApiResponse(200, {
      server: 'running',
      database: dbStatusMap[dbStatus] || 'unknown',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }, 'Server is healthy')
  );
});

module.exports = router;
