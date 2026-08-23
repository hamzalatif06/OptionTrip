import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getStats, getUsers, getActivity, deactivateUser } from '../controllers/adminController.js';
import { listBlogImageOverrides, uploadBlogImageOverride, deleteBlogImageOverride } from '../controllers/blogAdminController.js';
import { uploadBlogImage, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats',          getStats);
router.get('/users',          getUsers);
router.get('/activity',       getActivity);
router.delete('/users/:id',   deactivateUser);

router.get('/blog-images',           listBlogImageOverrides);
router.post('/blog-images',          uploadBlogImage, handleUploadError, uploadBlogImageOverride);
router.delete('/blog-images/:postId', deleteBlogImageOverride);

export default router;
