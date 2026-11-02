import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support high payload limit for base64 photo uploads
app.use(express.json({ limit: '25mb' }));

const distPath = path.join(__dirname, 'dist');
const configFilePath = path.join(__dirname, 'teacher-config.json');

// In-memory cache for teacher photo configuration
let teacherConfig: { imageUrl: string | null; scale: number; offsetY: number } = {
  imageUrl: null,
  scale: 100,
  offsetY: 0
};

// Try loading persisted teacher config from file on startup
try {
  if (fs.existsSync(configFilePath)) {
    const raw = fs.readFileSync(configFilePath, 'utf-8');
    teacherConfig = { offsetY: 0, ...JSON.parse(raw) };
  }
} catch (e) {
  console.warn('Could not read teacher-config.json on startup:', e);
}

// API endpoint to get teacher photo configuration for public site
app.get('/api/teacher-photo', (_req, res) => {
  res.json({
    success: true,
    imageUrl: teacherConfig.imageUrl || null,
    scale: teacherConfig.scale || 100,
    offsetY: typeof teacherConfig.offsetY === 'number' ? teacherConfig.offsetY : 0
  });
});

// API endpoint to update teacher photo configuration from Admin Portal
app.post('/api/teacher-photo', (req, res) => {
  try {
    const { imageUrl, scale, offsetY } = req.body;
    teacherConfig = {
      imageUrl: typeof imageUrl === 'string' ? imageUrl : (imageUrl === null ? null : teacherConfig.imageUrl),
      scale: typeof scale === 'number' ? scale : (teacherConfig.scale || 100),
      offsetY: typeof offsetY === 'number' ? offsetY : (teacherConfig.offsetY || 0)
    };
    
    // Persist to disk so it stays available across server restarts
    fs.writeFileSync(configFilePath, JSON.stringify(teacherConfig, null, 2), 'utf-8');

    res.json({
      success: true,
      imageUrl: teacherConfig.imageUrl,
      scale: teacherConfig.scale,
      offsetY: teacherConfig.offsetY
    });
  } catch (err) {
    console.error('Failed to save teacher configuration:', err);
    res.status(500).json({ success: false, error: 'Failed to save teacher configuration' });
  }
});

// Serve static build assets
app.use(express.static(distPath));

// Health check endpoint for Cloud Run
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// SPA catch-all fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
