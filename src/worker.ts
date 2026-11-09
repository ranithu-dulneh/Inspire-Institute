export interface Env {
  ASSETS?: Fetcher;
  R2_BUCKET?: R2Bucket;
  R2_PUBLIC_URL?: string;
  VITE_R2_PUBLIC_URL?: string;
  CLOUDFLARE_R2_PUBLIC_URL?: string;
}

const DEFAULT_R2_PUBLIC = 'https://pub-3c50a30d70944cc59a4fef93e7939680.r2.dev';

function corsHeaders(request: Request): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
}

function jsonResponse(data: any, status = 200, request?: Request): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(request ? corsHeaders(request) : { 'Access-Control-Allow-Origin': '*' }),
  });
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request)
      });
    }

    const publicBase = (
      env.R2_PUBLIC_URL ||
      env.VITE_R2_PUBLIC_URL ||
      env.CLOUDFLARE_R2_PUBLIC_URL ||
      DEFAULT_R2_PUBLIC
    ).trim().replace(/\/$/, '');

    // 0. Storage Status API
    if (url.pathname === '/api/storage-status' && request.method === 'GET') {
      return jsonResponse({
        success: true,
        cloudflareConfigured: Boolean(env.R2_BUCKET),
        storageType: env.R2_BUCKET ? 'cloudflare-r2' : 'local-storage',
        publicBase,
        bucketName: 'materials'
      }, 200, request);
    }

    // 1. Cover Photo & Faculty Portrait Upload API
    if (url.pathname === '/api/upload-cover' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const dataUrl = body?.dataUrl;
        if (!dataUrl || typeof dataUrl !== 'string') {
          return jsonResponse({ success: false, error: 'Missing or invalid dataUrl' }, 400, request);
        }

        const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        const ext = match ? (match[1] === 'jpeg' ? 'jpg' : match[1]) : 'png';
        const mime = match ? `image/${match[1]}` : 'image/png';
        const base64Data = match ? match[2] : dataUrl;

        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const fileName = `covers/faculty-cover-${Date.now()}.${ext}`;

        if (env.R2_BUCKET) {
          await env.R2_BUCKET.put(fileName, bytes, {
            httpMetadata: { contentType: mime }
          });
        }

        const fileUrl = `${publicBase}/${fileName}`;

        // Also update teacher photo config in R2
        const teacherConfig = {
          imageUrl: fileUrl,
          scale: typeof body.scale === 'number' ? body.scale : 100,
          offsetY: typeof body.offsetY === 'number' ? body.offsetY : 0
        };

        if (env.R2_BUCKET) {
          await env.R2_BUCKET.put('config/teacher-config.json', JSON.stringify(teacherConfig), {
            httpMetadata: { contentType: 'application/json' }
          });
        }

        return jsonResponse({
          success: true,
          url: fileUrl,
          storageType: 'cloudflare-r2',
          scale: teacherConfig.scale,
          offsetY: teacherConfig.offsetY,
          message: 'Cover photo uploaded directly to Cloudflare R2.'
        }, 200, request);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err.message || 'Upload failed' }, 500, request);
      }
    }

    // 2. Teacher Photo Config API (GET / POST)
    if (url.pathname === '/api/teacher-photo') {
      if (request.method === 'GET') {
        try {
          if (env.R2_BUCKET) {
            const obj = await env.R2_BUCKET.get('config/teacher-config.json');
            if (obj) {
              const text = await obj.text();
              const cfg = JSON.parse(text);
              return jsonResponse({ success: true, ...cfg }, 200, request);
            }
          }
        } catch {}
        return jsonResponse({
          success: true,
          imageUrl: null,
          scale: 100,
          offsetY: 0
        }, 200, request);
      }

      if (request.method === 'POST') {
        try {
          const body: any = await request.json().catch(() => ({}));
          const teacherConfig = {
            imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : null,
            scale: typeof body.scale === 'number' ? body.scale : 100,
            offsetY: typeof body.offsetY === 'number' ? body.offsetY : 0
          };

          if (env.R2_BUCKET) {
            await env.R2_BUCKET.put('config/teacher-config.json', JSON.stringify(teacherConfig), {
              httpMetadata: { contentType: 'application/json' }
            });
          }

          return jsonResponse({
            success: true,
            ...teacherConfig
          }, 200, request);
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 500, request);
        }
      }
    }

    // 3. Documents & Tutes Upload API
    if (url.pathname === '/api/upload-document' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const { dataUrl, fileName: originalFileName, category, batch, month, title, isFree, price } = body;

        if (!dataUrl || typeof dataUrl !== 'string') {
          return jsonResponse({ success: false, error: 'Missing document file data' }, 400, request);
        }

        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        let mime = match ? match[1] : 'application/pdf';
        let base64Data = match ? match[2] : dataUrl;
        let ext = 'pdf';
        if (mime.includes('image/png')) ext = 'png';
        else if (mime.includes('image/jpeg')) ext = 'jpg';
        else if (mime.includes('word') || mime.includes('docx')) ext = 'docx';

        const cleanName = (originalFileName || `document-${Date.now()}.${ext}`).replace(/[^a-zA-Z0-9.-]/g, '_');
        const finalKey = `documents/${Date.now()}-${cleanName}`;

        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        if (env.R2_BUCKET) {
          await env.R2_BUCKET.put(finalKey, bytes, {
            httpMetadata: { contentType: mime }
          });
        }

        const fileUrl = `${publicBase}/${finalKey}`;
        const sizeMB = `${(bytes.length / (1024 * 1024)).toFixed(1)} MB`;

        return jsonResponse({
          success: true,
          url: fileUrl,
          storageType: 'cloudflare-r2',
          material: {
            id: `cat-mat-${Date.now()}`,
            title: title || cleanName,
            category: category || 'tute',
            batch: batch || 'A/L 2026',
            month: month || 'August',
            isFree: Boolean(isFree),
            price: Number(price) || 0,
            fileUrl,
            fileSize: sizeMB,
            createdAt: new Date().toISOString()
          }
        }, 200, request);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err.message || 'Upload failed' }, 500, request);
      }
    }

    // 4. Fallback to Cloudflare Pages / Workers static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
