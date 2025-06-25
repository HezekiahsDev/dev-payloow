import express from 'express';
import webhookController from '../controller/webhook.controller';

const router = express.Router();

// Webhook routes
router.post('/paystack', webhookController.handlePaystackWebhook);

export default router; 