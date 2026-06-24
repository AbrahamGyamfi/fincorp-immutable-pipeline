const router = require('express').Router()
const db = require('../db')

// This route hits the real DB — no mock needed here.
// DATABASE_URL env var controls which region (primary or DR) it targets.
router.get('/', async (_req, res) => {
  const start = Date.now()
  try {
    await db.query('SELECT 1')
    res.json({
      status: 'healthy',
      db: 'connected',
      latency_ms: Date.now() - start,
      region: process.env.AWS_REGION || 'unknown',
      endpoint: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0]
        : 'not configured',
      version: process.env.APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    // Return 200 so the dashboard can read the error body.
    // CI/CD health check matches on '"status":"healthy"' — this body won't match, so deploys still fail correctly.
    res.json({
      status: 'unhealthy',
      db: 'disconnected',
      error: err.message,
      region: process.env.AWS_REGION || 'unknown',
      timestamp: new Date().toISOString(),
    })
  }
})

module.exports = router
