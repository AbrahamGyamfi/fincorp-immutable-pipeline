const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.APP_VERSION || '1.0.0',
    region: process.env.AWS_REGION || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    app: 'FinCorp API',
    message: 'Immutable artifact pipeline demo',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.listen(PORT, () => {
  console.log(`FinCorp API running on port ${PORT}`);
});

module.exports = app;
