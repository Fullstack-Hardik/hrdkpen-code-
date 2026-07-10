require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const aiRouter = require('./routes/ai');
const executeRouter = require('./routes/execute');
const { createRateLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT ?? 5000;

// Middleware
app.use(cors({ origin: ['http://localhost:8080', 'http://localhost:3000'] }));
app.use(express.json({ limit: '200kb' }));

// MongoDB (optional — settings persistence)
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/hrdkpen';
mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.warn('MongoDB unavailable (settings persistence disabled):', err.message);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0' });
});

// Routes with rate limiting
// AI: 20 requests per minute per IP
app.use('/api/ai', createRateLimiter(20, 60_000), aiRouter);
// Execute: 10 compilations per minute per IP
app.use('/api/execute', createRateLimiter(10, 60_000), executeRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`HRDK Pen server running on http://localhost:${PORT}`);
});
