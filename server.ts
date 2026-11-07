import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support high payload limit for base64 photo and tute document uploads
app.use(express.json({ limit: '100mb' }));

import { uploadToR2OrLocal, getR2Config } from './src/server/storageHelper';

const distPath = path.join(__dirname, 'dist');
const configFilePath = path.join(__dirname, 'teacher-config.json');
const studentsFilePath = path.join(__dirname, 'students-data.json');
const lessonsFilePath = path.join(__dirname, 'lessons-data.json');
const materialsFilePath = path.join(__dirname, 'materials-data.json');
const uploadsDir = path.join(__dirname, 'public', 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch {}
}

const getStoredStudents = () => {
  try {
    if (fs.existsSync(studentsFilePath)) {
      return JSON.parse(fs.readFileSync(studentsFilePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error reading students-data.json:', e);
  }
  return [];
};

const saveStoredStudents = (list: any[]) => {
  try {
    fs.writeFileSync(studentsFilePath, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing students-data.json:', e);
    return false;
  }
};

const getStoredLessons = () => {
  try {
    if (fs.existsSync(lessonsFilePath)) {
      return JSON.parse(fs.readFileSync(lessonsFilePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error reading lessons-data.json:', e);
  }
  return [];
};

const saveStoredLessons = (list: any[]) => {
  try {
    fs.writeFileSync(lessonsFilePath, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing lessons-data.json:', e);
    return false;
  }
};

const getStoredMaterials = () => {
  try {
    if (fs.existsSync(materialsFilePath)) {
      return JSON.parse(fs.readFileSync(materialsFilePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error reading materials-data.json:', e);
  }
  return [];
};

const saveStoredMaterials = (list: any[]) => {
  try {
    fs.writeFileSync(materialsFilePath, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing materials-data.json:', e);
    return false;
  }
};

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

// 0. Storage Status API (Cloudflare R2 connectivity status)
app.get('/api/storage-status', (_req, res) => {
  const cfg = getR2Config();
  res.json({
    success: true,
    cloudflareConfigured: cfg.isConfigured,
    storageType: cfg.isConfigured ? 'cloudflare-r2' : 'local-storage',
    publicBase: cfg.publicBase,
    bucketName: cfg.bucketName,
    accountId: cfg.accountId ? `${cfg.accountId.substring(0, 6)}...` : null
  });
});

// 1. Cover Photo & Portrait Upload API (Supports Cloudflare R2 + Local Fallback)
app.post('/api/upload-cover', async (req, res) => {
  try {
    const { dataUrl, scale, offsetY } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid dataUrl' });
    }

    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let ext = 'png';
    let base64Data = dataUrl;
    let mime = 'image/png';

    if (match) {
      ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      mime = `image/${match[1]}`;
      base64Data = match[2];
    }

    const fileName = `faculty-cover-${Date.now()}.${ext}`;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const uploadResult = await uploadToR2OrLocal({
      buffer: imageBuffer,
      fileName,
      contentType: mime,
      subfolder: 'covers'
    });

    teacherConfig = {
      imageUrl: uploadResult.url,
      scale: typeof scale === 'number' ? scale : (teacherConfig.scale || 100),
      offsetY: typeof offsetY === 'number' ? offsetY : (teacherConfig.offsetY || 0)
    };
    fs.writeFileSync(configFilePath, JSON.stringify(teacherConfig, null, 2), 'utf-8');

    res.json({
      success: true,
      url: uploadResult.url,
      storageType: uploadResult.storageType,
      scale: teacherConfig.scale,
      offsetY: teacherConfig.offsetY,
      message: uploadResult.storageType === 'cloudflare-r2' 
        ? 'Cover photo uploaded directly to Cloudflare R2.' 
        : 'Cover photo saved to server storage.'
    });
  } catch (err: any) {
    console.error('Error saving uploaded cover image:', err);
    res.status(500).json({ success: false, error: 'Failed to process image upload' });
  }
});

// 2. Documents & Tutes Upload API (Direct Cloudflare R2 / Local fallback)
app.post('/api/upload-document', async (req, res) => {
  try {
    const { dataUrl, fileName: originalFileName, category, batch, month, title, isFree, price } = req.body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing document file data' });
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    let mime = 'application/pdf';
    let base64Data = dataUrl;
    let ext = 'pdf';

    if (match) {
      mime = match[1];
      base64Data = match[2];
      if (mime.includes('pdf')) ext = 'pdf';
      else if (mime.includes('image/png')) ext = 'png';
      else if (mime.includes('image/jpeg')) ext = 'jpg';
      else if (mime.includes('word') || mime.includes('docx')) ext = 'docx';
    }

    const cleanName = (originalFileName || `document-${Date.now()}.${ext}`).replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFileName = `${Date.now()}-${cleanName}`;
    const docBuffer = Buffer.from(base64Data, 'base64');
    const sizeMB = (docBuffer.length / (1024 * 1024)).toFixed(1) + ' MB';

    const uploadResult = await uploadToR2OrLocal({
      buffer: docBuffer,
      fileName: finalFileName,
      contentType: mime,
      subfolder: 'documents'
    });

    const newMat = {
      id: `cat-mat-${Date.now()}`,
      title: title || cleanName,
      category: category || 'tute',
      batch: batch || 'A/L 2026',
      month: month || 'August',
      isFree: Boolean(isFree),
      price: Number(price) || 0,
      fileUrl: uploadResult.url,
      fileSize: sizeMB,
      createdAt: new Date().toISOString()
    };

    const stored = getStoredMaterials();
    stored.unshift(newMat);
    saveStoredMaterials(stored);

    res.json({
      success: true,
      url: uploadResult.url,
      storageType: uploadResult.storageType,
      material: newMat,
      materials: stored
    });
  } catch (err: any) {
    console.error('Error in POST /api/upload-document:', err);
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
});

// 3. Materials Database API
app.get('/api/materials', (_req, res) => {
  const materials = getStoredMaterials();
  res.json({ success: true, materials });
});

app.post('/api/materials', (req, res) => {
  try {
    const body = req.body || {};
    const materials = getStoredMaterials();
    const action = body.action || 'save';

    if (action === 'delete') {
      const idToDelete = body.id;
      const updated = materials.filter((m: any) => m.id !== idToDelete);
      saveStoredMaterials(updated);
      return res.json({ success: true, materials: updated });
    }

    if (body.material) {
      const idx = materials.findIndex((m: any) => m.id === body.material.id);
      if (idx >= 0) {
        materials[idx] = { ...materials[idx], ...body.material };
      } else {
        materials.unshift(body.material);
      }
      saveStoredMaterials(materials);
      return res.json({ success: true, materials });
    }

    if (Array.isArray(body.materials)) {
      saveStoredMaterials(body.materials);
      return res.json({ success: true, materials: body.materials });
    }

    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to process material' });
  }
});

app.delete('/api/materials/:id?', (req, res) => {
  try {
    const idToDelete = req.params.id || req.body?.id;
    const materials = getStoredMaterials();
    const updated = materials.filter((m: any) => m.id !== idToDelete);
    saveStoredMaterials(updated);
    res.json({ success: true, materials: updated });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete material' });
  }
});

// 4. Lessons & Sessions Database API
app.get('/api/lessons', (_req, res) => {
  const lessons = getStoredLessons();
  res.json({ success: true, lessons });
});

app.post('/api/lessons', (req, res) => {
  try {
    const body = req.body || {};
    const lessons = getStoredLessons();
    const action = body.action || 'save';

    if (action === 'create-lesson') {
      const newLesson = body.lesson;
      if (!newLesson || !newLesson.title) {
        return res.status(400).json({ success: false, error: 'Invalid lesson data' });
      }
      lessons.unshift(newLesson);
      saveStoredLessons(lessons);
      return res.json({ success: true, lesson: newLesson, lessons });
    }

    if (action === 'add-session') {
      const { lessonId, session } = body;
      const targetIdx = lessons.findIndex((l: any) => l.id === lessonId);
      if (targetIdx >= 0) {
        if (!Array.isArray(lessons[targetIdx].sessions)) {
          lessons[targetIdx].sessions = [];
        }
        lessons[targetIdx].sessions.push(session);
        saveStoredLessons(lessons);
        return res.json({ success: true, session, lessons });
      } else {
        return res.status(404).json({ success: false, error: 'Lesson not found' });
      }
    }

    if (action === 'delete-lesson') {
      const idToDelete = body.id || body.lessonId;
      const updated = lessons.filter((l: any) => l.id !== idToDelete);
      saveStoredLessons(updated);
      return res.json({ success: true, lessons: updated });
    }

    if (action === 'delete-session') {
      const { lessonId, sessionId } = body;
      const targetIdx = lessons.findIndex((l: any) => l.id === lessonId);
      if (targetIdx >= 0 && Array.isArray(lessons[targetIdx].sessions)) {
        lessons[targetIdx].sessions = lessons[targetIdx].sessions.filter((s: any) => s.id !== sessionId);
        saveStoredLessons(lessons);
        return res.json({ success: true, lessons });
      }
    }

    if (action === 'save-all') {
      if (Array.isArray(body.lessons)) {
        saveStoredLessons(body.lessons);
        return res.json({ success: true, lessons: body.lessons });
      }
    }

    res.json({ success: true, lessons });
  } catch (err: any) {
    console.error('Error handling POST /api/lessons:', err);
    res.status(500).json({ success: false, error: 'Failed to process lesson operation' });
  }
});

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

// 2. Persistent Student Accounts Storage API
app.get('/api/students', (_req, res) => {
  const students = getStoredStudents();
  res.json({ success: true, students });
});

app.post('/api/students', (req, res) => {
  try {
    const body = req.body || {};
    const students = getStoredStudents();
    const action = body.action || 'save';

    if (action === 'register') {
      const newStu = body.student;
      if (!newStu || !newStu.fullName) {
        return res.status(400).json({ success: false, error: 'Invalid student registration data' });
      }

      const existingIdx = students.findIndex((s: any) => 
        (s.email && s.email.toLowerCase() === newStu.email?.toLowerCase()) ||
        (s.indexNumber && s.indexNumber.toUpperCase() === newStu.indexNumber?.toUpperCase())
      );

      if (existingIdx >= 0) {
        students[existingIdx] = { ...students[existingIdx], ...newStu };
      } else {
        students.unshift(newStu);
      }

      saveStoredStudents(students);
      return res.json({ success: true, student: newStu, students });
    }

    if (action === 'approve') {
      const idToApprove = body.id;
      const updated = students.map((s: any) => {
        if (s.id === idToApprove || s.indexNumber === idToApprove) {
          return { ...s, status: 'Verified', isApproved: true, modulesAccessible: 8 };
        }
        return s;
      });
      saveStoredStudents(updated);
      return res.json({ success: true, students: updated });
    }

    if (action === 'device-limit') {
      const { id, maxDevices } = body;
      const updated = students.map((s: any) => {
        if (s.id === id || s.indexNumber === id) {
          return { ...s, maxDevices };
        }
        return s;
      });
      saveStoredStudents(updated);
      return res.json({ success: true, students: updated });
    }

    if (action === 'status') {
      const { id, status } = body;
      const updated = students.map((s: any) => {
        if (s.id === id || s.indexNumber === id) {
          return { ...s, status, isApproved: status === 'Verified' };
        }
        return s;
      });
      saveStoredStudents(updated);
      return res.json({ success: true, students: updated });
    }

    if (action === 'delete') {
      const idToDelete = body.id;
      const updated = students.filter((s: any) => s.id !== idToDelete && s.indexNumber !== idToDelete);
      saveStoredStudents(updated);
      return res.json({ success: true, students: updated });
    }

    if (action === 'save-all') {
      if (Array.isArray(body.students)) {
        saveStoredStudents(body.students);
        return res.json({ success: true, students: body.students });
      }
    }

    if (body.student) {
      const idx = students.findIndex((s: any) => s.id === body.student.id || s.indexNumber === body.student.indexNumber);
      if (idx >= 0) {
        students[idx] = { ...students[idx], ...body.student };
      } else {
        students.unshift(body.student);
      }
      saveStoredStudents(students);
      return res.json({ success: true, students });
    }

    return res.json({ success: true, students });
  } catch (err: any) {
    console.error('Error in POST /api/students:', err);
    res.status(500).json({ success: false, error: 'Failed to process student operation' });
  }
});

app.delete('/api/students/:id?', (req, res) => {
  try {
    const idToDelete = req.params.id || req.body?.id;
    const students = getStoredStudents();
    const updated = students.filter((s: any) => s.id !== idToDelete && s.indexNumber !== idToDelete);
    saveStoredStudents(updated);
    res.json({ success: true, students: updated });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
});

// Serve persistent uploads
app.use('/uploads', express.static(uploadsDir));

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
