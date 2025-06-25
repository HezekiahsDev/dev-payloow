import express from 'express';
import Vtu from '../controller/Vtu';
import { CONFIG } from '../config/index';
import auth from '../authMiddleware/authMiddleware';

const router = express.Router();

router.route('/buy-data-vtu').post(auth(CONFIG.ROLES.USER), Vtu.purchaseData);
router.route('/buy-airtime-vtu').post(auth(CONFIG.ROLES.USER), Vtu.purchaseAirtime);
router.route('/buy-electricity-vtu').post(auth(CONFIG.ROLES.USER), Vtu.purchaseElectricity);
router.route('/buy-cable-subscription-vtu').get(auth(CONFIG.ROLES.USER), Vtu.purchaseCableTV);
router.route('/verify-customer-vtu').post(auth(CONFIG.ROLES.USER), Vtu.verifyCustomer);
router.route('/get-variations-vtu').get(auth(CONFIG.ROLES.USER), Vtu.getVariations);
router.route('/get-vtu-providers-wallet-balance').get(auth(), Vtu.getVTUProvidersWalletBalance);

export default router;
