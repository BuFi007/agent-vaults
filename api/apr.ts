import express from 'express';
import { Router } from 'express';

const router = Router();

// Mock APR data
const mockAprData = {
  "AAVE": {
    depositApr: 4.5,
    borrowApr: 5.2,
    timestamp: new Date().toISOString()
  },
  "BALANCER": {
    depositApr: 3.8,
    borrowApr: 4.9,
    timestamp: new Date().toISOString()
  }
};

// GET /api/apr
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockAprData,
      message: "APR data retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch APR data",
      message: error.message
    });
  }
});

// GET /api/apr/:pool
router.get('/:pool', (req, res) => {
  const { pool } = req.params;
  const poolData = mockAprData[pool.toUpperCase()];

  if (!poolData) {
    return res.status(404).json({
      success: false,
      error: "Pool not found",
      message: `No APR data available for pool: ${pool}`
    });
  }

  res.json({
    success: true,
    data: poolData,
    message: `APR data for ${pool} retrieved successfully`
  });
});

export default router; 