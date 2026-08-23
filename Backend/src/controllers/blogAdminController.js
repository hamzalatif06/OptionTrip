import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import BlogImageOverride from '../models/BlogImageOverride.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const blogImagesDir = path.join(__dirname, '../../uploads/blog-images');

const buildImageUrl = (filename) => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/blog-images/${filename}`;
};

const deleteLocalFile = (imageUrl) => {
  if (!imageUrl) return;
  const filename = imageUrl.split('/uploads/blog-images/')[1];
  if (!filename) return;
  const filePath = path.join(blogImagesDir, filename);
  fs.unlink(filePath, () => {});
};

export const listBlogImageOverrides = async (req, res) => {
  try {
    const overrides = await BlogImageOverride.find().sort({ updatedAt: -1 });
    res.json({ success: true, data: { overrides } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadBlogImageOverride = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const postId = Number(req.body.postId);
    if (!postId) {
      deleteLocalFile(buildImageUrl(req.file.filename));
      return res.status(400).json({ success: false, message: 'postId is required' });
    }

    const imageUrl = buildImageUrl(req.file.filename);
    const { slug = '', title = '' } = req.body;

    const existing = await BlogImageOverride.findOne({ postId });
    if (existing) deleteLocalFile(existing.imageUrl);

    const override = await BlogImageOverride.findOneAndUpdate(
      { postId },
      { postId, slug, title, imageUrl, uploadedBy: req.user._id },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: { override } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteBlogImageOverride = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const override = await BlogImageOverride.findOneAndDelete({ postId });
    if (!override) return res.status(404).json({ success: false, message: 'No override found for this post' });

    deleteLocalFile(override.imageUrl);
    res.json({ success: true, data: { postId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
