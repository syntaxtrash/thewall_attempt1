import express from 'express';
import { showWall, createPost, deletePost, updatePost, createComment, deleteComment, updateComment, createReply } from '../controllers/wall.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/wall', auth, showWall);
router.post('/posts', auth, createPost);
router.delete('/posts/:id', auth, deletePost);
router.put('/posts/:id', auth, updatePost);
router.post('/posts/:postId/comments', auth, createComment);
router.delete('/comments/:id', auth, deleteComment);
router.put('/comments/:id', auth, updateComment);
router.post('/comments/:commentId/replies', auth, createReply);

export default router; 