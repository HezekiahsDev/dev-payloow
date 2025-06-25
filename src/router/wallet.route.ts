import express from 'express';
import { CONFIG } from '../config/index';
import WalletController from '../controller/wallet.controller';
import auth from '../authMiddleware/authMiddleware';

const router = express.Router();

router.route('/deposit').post(auth(CONFIG.ROLES.USER), WalletController.deposit);
router.route('/verify-bvn').post(auth(CONFIG.ROLES.USER), WalletController.verifyBvn);
router.route('/withdraw').post(auth(CONFIG.ROLES.USER), WalletController.withdraw);
router.route('/get-wallet-balance').get(auth(CONFIG.ROLES.USER), WalletController.getWalletBalance);
// router.route('/get-bank-codes').get(auth(CONFIG.ROLES.USER), fundWallet.getAllBanks);
// router.route('/transfer').post(auth(CONFIG.ROLES.USER), fundWallet.transferFromWallet);

export default router;
