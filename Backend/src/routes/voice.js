import { File as NodeFile } from 'node:buffer';
if (!globalThis.File) globalThis.File = NodeFile;

import express from 'express';
import multer from 'multer';
import OpenAI, { toFile } from 'openai';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

let openai = null;
const getClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(503).json({ success: false, message: 'Voice service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file provided' });
    }

    const ext = getExtension(req.file.mimetype);
    const audioFile = await toFile(req.file.buffer, `audio.${ext}`, { type: req.file.mimetype });

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: req.body.language || 'en',
      response_format: 'text',
    });

    res.json({ success: true, text: transcription.trim() });

  } catch (err) {
    console.error('Whisper transcription error:', err);
    res.status(500).json({ success: false, message: 'Transcription failed. Please try again.' });
  }
});

router.post('/speak', async (req, res) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(503).json({ success: false, message: 'Voice service not configured' });
    }

    const { text, voice = 'nova' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'No text provided' });
    }

    const truncatedText = text.trim().slice(0, 4096);

    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice,
      input: truncatedText,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });

    res.send(buffer);

  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ success: false, message: 'Text-to-speech failed. Please try again.' });
  }
});

const mimeToExt = {
  'audio/webm': 'webm',
  'audio/webm;codecs=opus': 'webm',
  'audio/ogg': 'ogg',
  'audio/ogg;codecs=opus': 'ogg',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
};

const getExtension = (mime = '') => {
  const base = mime.split(';')[0].trim().toLowerCase();
  return mimeToExt[base] || mimeToExt[mime.toLowerCase()] || 'webm';
};

export default router;
