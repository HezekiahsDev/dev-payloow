import express from 'express';
import { CONFIG } from '../config';
import auth from '../authMiddleware/authMiddleware';
import InvestmentController from '../controller/investment.controller';

const router = express.Router();

router.route('/investment/admin/debtors').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), InvestmentController.getAllDebtors);
router.route('/investment/admin/debtors/:debtorId').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), InvestmentController.getDebtorById);
router.route('/investment/admin/debtors/:debtorId/business').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), InvestmentController.getDebtorBusinesses);


router.route('/investment/admin/investors').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), InvestmentController.getAllInvestors);
router.route('/investment/admin/investors/:investorId').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), InvestmentController.getInvestorById);

router.route('/investment/admin/businesses').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), InvestmentController.getAllBusinesses);
router.route('/investment/admin/businesses/:businessId').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), InvestmentController.getBusinessById);

export default router;
