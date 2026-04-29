import express from 'express';
import chatRouter from './chat';
import conversationsRouter from './conversations';
import healthRouter from './health';

const router = express.Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(chatRouter);

export default router;
