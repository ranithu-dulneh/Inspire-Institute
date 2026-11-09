import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export interface StorageUploadResult {
  success: boolean;
  url: string;
  storageType: 'cloudflare-r2' | 'local-storage';
  fileName: string;
  error?: string;
}

export function getR2Config() {
  const accountId = (
    process.env.VITE_R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    '7f20af5256805acd5508b3d4f770d521'
  ).trim();

  const accessKeyId = (
    process.env.VITE_R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    '175c190fc5c10effccd9ce3f8a202c6e'
  ).trim();

  const secretAccessKey = (
    process.env.VITE_R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    ''
  ).trim();

  const bucketName = (
    process.env.VITE_R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    'materials'
  ).trim();

  const publicBase = (
    process.env.VITE_R2_PUBLIC_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    process.env.VITE_R2_URL ||
    'https://pub-3c50a30d70944cc59a4fef93e7939680.r2.dev'
  ).trim().replace(/\/$/, '');

  const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey);

  return {
    isConfigured,
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBase
  };
}

export async function uploadToR2OrLocal(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  subfolder?: string;
}): Promise<StorageUploadResult> {
  const { buffer, fileName, contentType, subfolder } = params;
  const cfg = getR2Config();
  const key = subfolder ? `${subfolder}/${fileName}` : fileName;

  // 1. If Cloudflare R2 credentials are configured, upload straight to Cloudflare R2
  if (cfg.isConfigured) {
    try {
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: cfg.accessKeyId,
          secretAccessKey: cfg.secretAccessKey,
        },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: cfg.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const r2Url = `${cfg.publicBase}/${key}`;
      return {
        success: true,
        url: r2Url,
        storageType: 'cloudflare-r2',
        fileName,
      };
    } catch (err: any) {
      console.warn('Notice: Cloudflare R2 direct upload attempt error, falling back to persistent disk:', err?.message || err);
    }
  }

  // 2. Persistent storage fallback
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', subfolder || '');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const targetPath = path.join(uploadsDir, fileName);
  fs.writeFileSync(targetPath, buffer);

  const localUrl = `/uploads/${subfolder ? subfolder + '/' : ''}${fileName}`;
  return {
    success: true,
    url: localUrl,
    storageType: 'local-storage',
    fileName,
  };
}
