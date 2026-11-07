import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import 'dotenv/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'inspire-backend-api-dev',
        configureServer(server) {
          const configFilePath = path.resolve(__dirname, 'teacher-config.json');
          const studentsFilePath = path.resolve(__dirname, 'students-data.json');
          const lessonsFilePath = path.resolve(__dirname, 'lessons-data.json');
          const materialsFilePath = path.resolve(__dirname, 'materials-data.json');

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

          server.middlewares.use(async (req, res, next) => {
            const parsedUrl = req.url ? req.url.split('?')[0] : '';

            // 0. Storage Status API (Cloudflare R2 connectivity status)
            if (parsedUrl === '/api/storage-status' && req.method === 'GET') {
              const { getR2Config } = await import('./src/server/storageHelper');
              const cfg = getR2Config();
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                cloudflareConfigured: cfg.isConfigured,
                storageType: cfg.isConfigured ? 'cloudflare-r2' : 'local-storage',
                publicBase: cfg.publicBase,
                bucketName: cfg.bucketName,
                accountId: cfg.accountId ? `${cfg.accountId.substring(0, 6)}...` : null
              }));
            }

            // 1. Cover Photo & Portrait Upload API (Supports Cloudflare R2 + Local Fallback)
            if (parsedUrl === '/api/upload-cover') {
              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                req.on('end', async () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString('utf-8');
                    const { dataUrl, scale, offsetY } = JSON.parse(rawBody);

                    if (!dataUrl || typeof dataUrl !== 'string') {
                      res.statusCode = 400;
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: false, error: 'Missing or invalid dataUrl' }));
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

                    const { uploadToR2OrLocal } = await import('./src/server/storageHelper');
                    const uploadResult = await uploadToR2OrLocal({
                      buffer: imageBuffer,
                      fileName,
                      contentType: mime,
                      subfolder: 'covers'
                    });

                    // Update teacher-config.json
                    let currentCfg: any = { scale: 100, offsetY: 0 };
                    try {
                      if (fs.existsSync(configFilePath)) {
                        currentCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
                      }
                    } catch {}

                    const updatedCfg = {
                      imageUrl: uploadResult.url,
                      scale: typeof scale === 'number' ? scale : (currentCfg.scale || 100),
                      offsetY: typeof offsetY === 'number' ? offsetY : (currentCfg.offsetY || 0)
                    };
                    fs.writeFileSync(configFilePath, JSON.stringify(updatedCfg, null, 2), 'utf-8');

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: true,
                      url: uploadResult.url,
                      storageType: uploadResult.storageType,
                      scale: updatedCfg.scale,
                      offsetY: updatedCfg.offsetY,
                      message: uploadResult.storageType === 'cloudflare-r2' 
                        ? 'Cover photo uploaded directly to Cloudflare R2.' 
                        : 'Cover photo saved to server storage.'
                    }));
                  } catch (err: any) {
                    console.error('Error in /api/upload-cover:', err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: 'Failed to process image upload' }));
                  }
                });
                return;
              } else {
                res.statusCode = 405;
                return res.end('Method Not Allowed');
              }
            }

            // 2. Documents & Tutes Upload API (Direct Cloudflare R2 / Local fallback)
            if (parsedUrl === '/api/upload-document') {
              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                req.on('end', async () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString('utf-8');
                    const { dataUrl, fileName: originalFileName, category, batch, month, title, isFree, price } = JSON.parse(rawBody);

                    if (!dataUrl || typeof dataUrl !== 'string') {
                      res.statusCode = 400;
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: false, error: 'Missing document file data' }));
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

                    const { uploadToR2OrLocal } = await import('./src/server/storageHelper');
                    const uploadResult = await uploadToR2OrLocal({
                      buffer: docBuffer,
                      fileName: finalFileName,
                      contentType: mime,
                      subfolder: 'documents'
                    });

                    // Save material entry to materials-data.json
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

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: true,
                      url: uploadResult.url,
                      storageType: uploadResult.storageType,
                      material: newMat,
                      materials: stored
                    }));
                  } catch (err: any) {
                    console.error('Error in /api/upload-document:', err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: 'Failed to upload document' }));
                  }
                });
                return;
              } else {
                res.statusCode = 405;
                return res.end('Method Not Allowed');
              }
            }

            // 3. Materials Database API (Read / Update / Delete)
            if (parsedUrl.startsWith('/api/materials')) {
              if (req.method === 'GET') {
                const materials = getStoredMaterials();
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, materials }));
              }

              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                req.on('end', () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString('utf-8');
                    const body = rawBody ? JSON.parse(rawBody) : {};
                    const materials = getStoredMaterials();
                    const action = body.action || 'save';

                    if (action === 'delete') {
                      const idToDelete = body.id || parsedUrl.split('/api/materials/')[1];
                      const updated = materials.filter((m: any) => m.id !== idToDelete);
                      saveStoredMaterials(updated);
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, materials: updated }));
                    }

                    if (body.material) {
                      const idx = materials.findIndex((m: any) => m.id === body.material.id);
                      if (idx >= 0) {
                        materials[idx] = { ...materials[idx], ...body.material };
                      } else {
                        materials.unshift(body.material);
                      }
                      saveStoredMaterials(materials);
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, materials }));
                    }

                    if (Array.isArray(body.materials)) {
                      saveStoredMaterials(body.materials);
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, materials: body.materials }));
                    }

                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, materials }));
                  } catch (err: any) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: 'Failed to process material' }));
                  }
                });
                return;
              }

              if (req.method === 'DELETE') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                req.on('end', () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString('utf-8');
                    const body = rawBody ? JSON.parse(rawBody) : {};
                    const idToDelete = body.id || parsedUrl.split('/api/materials/')[1];
                    const materials = getStoredMaterials();
                    const updated = materials.filter((m: any) => m.id !== idToDelete);
                    saveStoredMaterials(updated);
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, materials: updated }));
                  } catch {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: 'Failed to delete material' }));
                  }
                });
                return;
              }
            }

            // 4. Lessons & Sessions Database API (Read / Add / Delete / Reorder)
            if (parsedUrl.startsWith('/api/lessons')) {
              if (req.method === 'GET') {
                const lessons = getStoredLessons();
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, lessons }));
              }

              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                req.on('end', () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString('utf-8');
                    const body = rawBody ? JSON.parse(rawBody) : {};
                    const lessons = getStoredLessons();
                    const action = body.action || 'save';

                    if (action === 'create-lesson') {
                      const newLesson = body.lesson;
                      if (!newLesson || !newLesson.title) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Invalid lesson data' }));
                      }
                      lessons.unshift(newLesson);
                      saveStoredLessons(lessons);
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, lesson: newLesson, lessons }));
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
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: true, session, lessons }));
                      } else {
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Lesson not found' }));
                      }
                    }

                    if (action === 'delete-lesson') {
                      const idToDelete = body.id || body.lessonId;
                      const updated = lessons.filter((l: any) => l.id !== idToDelete);
                      saveStoredLessons(updated);
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, lessons: updated }));
                    }

                    if (action === 'delete-session') {
                      const { lessonId, sessionId } = body;
                      const targetIdx = lessons.findIndex((l: any) => l.id === lessonId);
                      if (targetIdx >= 0 && Array.isArray(lessons[targetIdx].sessions)) {
                        lessons[targetIdx].sessions = lessons[targetIdx].sessions.filter((s: any) => s.id !== sessionId);
                        saveStoredLessons(lessons);
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: true, lessons }));
                      }
                    }

                    if (action === 'save-all') {
                      if (Array.isArray(body.lessons)) {
                        saveStoredLessons(body.lessons);
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: true, lessons: body.lessons }));
                      }
                    }

                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, lessons }));
                  } catch (err: any) {
                    console.error('Error handling /api/lessons:', err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: 'Failed to process lesson operation' }));
                  }
                });
                return;
              }
            }

            // 5. Teacher Photo Config API (Read / Update)
            if (parsedUrl === '/api/teacher-photo') {
              if (req.method === 'GET') {
                let config = { imageUrl: null, scale: 100, offsetY: 0 };
                try {
                  if (fs.existsSync(configFilePath)) {
                    config = { offsetY: 0, ...JSON.parse(fs.readFileSync(configFilePath, 'utf-8')) };
                  }
                } catch {}
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, ...config }));
              } else if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                req.on('end', () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString('utf-8');
                    const data = JSON.parse(rawBody);
                    let currentCfg: any = { imageUrl: null, scale: 100, offsetY: 0 };
                    try {
                      if (fs.existsSync(configFilePath)) {
                        currentCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
                      }
                    } catch {}

                    const config = {
                      imageUrl: data.imageUrl !== undefined ? data.imageUrl : currentCfg.imageUrl,
                      scale: typeof data.scale === 'number' ? data.scale : (currentCfg.scale || 100),
                      offsetY: typeof data.offsetY === 'number' ? data.offsetY : (currentCfg.offsetY || 0)
                    };
                    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, ...config }));
                  } catch {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: 'Failed to save configuration' }));
                  }
                });
                return;
              } else {
                res.statusCode = 405;
                return res.end('Method Not Allowed');
              }
            }

            // 6. Persistent Student Accounts Storage API
            if (parsedUrl.startsWith('/api/students')) {
              if (req.method === 'GET') {
                const students = getStoredStudents();
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, students }));
              }

              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                req.on('end', () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString('utf-8');
                    const body = rawBody ? JSON.parse(rawBody) : {};
                    const students = getStoredStudents();
                    const action = body.action || (parsedUrl.split('/api/students/')[1] || 'save');

                    if (action === 'register') {
                      const newStu = body.student;
                      if (!newStu || !newStu.fullName) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: false, error: 'Invalid student registration data' }));
                      }

                      // Check if already registered
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
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, student: newStu, students }));
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
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, students: updated }));
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
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, students: updated }));
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
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, students: updated }));
                    }

                    if (action === 'delete') {
                      const idToDelete = body.id;
                      const updated = students.filter((s: any) => s.id !== idToDelete && s.indexNumber !== idToDelete);
                      saveStoredStudents(updated);
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, students: updated }));
                    }

                    if (action === 'save-all') {
                      if (Array.isArray(body.students)) {
                        saveStoredStudents(body.students);
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ success: true, students: body.students }));
                      }
                    }

                    // Default fallback: if a student object was provided
                    if (body.student) {
                      const idx = students.findIndex((s: any) => s.id === body.student.id || s.indexNumber === body.student.indexNumber);
                      if (idx >= 0) {
                        students[idx] = { ...students[idx], ...body.student };
                      } else {
                        students.unshift(body.student);
                      }
                      saveStoredStudents(students);
                      res.setHeader('Content-Type', 'application/json');
                      return res.end(JSON.stringify({ success: true, students }));
                    }

                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, students }));
                  } catch (err: any) {
                    console.error('Error handling /api/students:', err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: 'Failed to process student account operation' }));
                  }
                });
                return;
              }

              if (req.method === 'DELETE') {
                const chunks: Buffer[] = [];
                req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                req.on('end', () => {
                  try {
                    const rawBody = Buffer.concat(chunks).toString('utf-8');
                    const body = rawBody ? JSON.parse(rawBody) : {};
                    const idToDelete = body.id || parsedUrl.split('/api/students/')[1];
                    const students = getStoredStudents();
                    const updated = students.filter((s: any) => s.id !== idToDelete && s.indexNumber !== idToDelete);
                    saveStoredStudents(updated);
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, students: updated }));
                  } catch {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: 'Failed to delete student' }));
                  }
                });
                return;
              }

              res.statusCode = 405;
              return res.end('Method Not Allowed');
            }

            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
