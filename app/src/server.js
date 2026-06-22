require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const healthRouter   = require('./routes/health')
const pipelineRouter = require('./routes/pipeline')
const securityRouter = require('./routes/security')
const drRouter       = require('./routes/dr')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors())

// API routes
app.use('/api/health',   healthRouter)
app.use('/api/pipeline', pipelineRouter)
app.use('/api/security', securityRouter)
app.use('/api/dr',       drRouter)

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const staticDir = path.join(__dirname, '..', 'public')
  app.use(express.static(staticDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`FinCorp Control Plane running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
})

module.exports = app
