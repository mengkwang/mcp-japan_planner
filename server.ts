import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  handleSeason,
  handleSafety,
  handleHolidays,
  handlePlaces,
  handleDining,
  handleItinerary,
  handleFeedback,
  handleHealth
} from './lib/handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '1mb' }));

  // Request logger: logs only route, status, duration, error code (no sensitive data)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const cleanPath = req.path;
      console.log(`[HTTP] ${req.method} ${cleanPath} ${res.statusCode} in ${duration}ms`);
    });
    next();
  });

  // API Routes
  app.get('/api/season', (req, res) => handleSeason(req, res));
  app.get('/api/safety', (req, res) => handleSafety(req, res));
  app.get('/api/holidays', (req, res) => handleHolidays(req, res));
  app.get('/api/places', (req, res) => handlePlaces(req, res));
  app.get('/api/dining', (req, res) => handleDining(req, res));
  app.post('/api/itinerary', (req, res) => handleItinerary(req, res));
  app.post('/api/feedback', (req, res) => handleFeedback(req, res));
  app.get('/api/health', (req, res) => handleHealth(req, res));

  // Static files or Vite dev middleware
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
