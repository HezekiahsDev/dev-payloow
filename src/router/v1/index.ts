import User from '../euser';
import Tutor from '../etutor';
import express from 'express';
import billRoute from '../bills';
import virtualTransfers from '../vtu';
import easyBuyRouter from '../easybuy';
import swapHandler from '../swap.route';
import authService from '../user.route';
import walletRouter from '../wallet.route';
import courseMessages from '../messages';
import adminHandleRoute from '../admins.route';
import investmentRouter from '../investment';
import settingsRouter from '../settings';
import webhookRouter from "../webhook.route"
const router = express.Router();

router.use('/api/v1', User);
router.use('/api/v1', Tutor);
router.use('/api/v1', billRoute);
router.use('/api/v1', swapHandler);
router.use('/api/v1', authService);
router.use('/api/v1', easyBuyRouter);
router.use('/api/v1', settingsRouter);
router.use('/api/v1', courseMessages);
router.use('/api/v1', virtualTransfers);
router.use('/api/v1', investmentRouter);
router.use('/api/v1', adminHandleRoute);
router.use('/api/v1', virtualTransfers);
router.use('/api/v1/wallet', walletRouter);
router.use("/api/v1/webhook", webhookRouter)

export default router;
