import express, { type Request, type Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { buildResultFileName } from './server-utils.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MEDIAFILE_API_URL = process.env.MEDIAFILE_API_URL;

if (!MEDIAFILE_API_URL) {
  console.error('MEDIAFILE_API_URL environment variable is required');
  process.exit(1);
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultPath = path.resolve(__dirname, '../result');

if (!fs.existsSync(resultPath)) {
  fs.mkdirSync(resultPath, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.post(
  '/files/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(
      `${MEDIAFILE_API_URL}/files/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'accept': '*/*',
        },
      }
    );

    const { id, size, variants } = response.data;
    const formattedData = { ...variants, original: { id, size } };

    const jsonFileName = buildResultFileName(req.file.originalname, id);
    const jsonFilePath = path.join(resultPath, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(formattedData, null, 2), 'utf-8');

    console.log(`Saved JSON for ${req.file.originalname} to ${jsonFilePath}`);

    res.json(formattedData);
  } catch (error) {
    console.error('Upload error:', error);
    
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({
        message: error.response?.data?.message || 'Upload failed',
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  },
);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Proxying to MediaFile API: ${MEDIAFILE_API_URL}`);
});
