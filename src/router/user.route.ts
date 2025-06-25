import express from 'express';
import { CONFIG } from '../config/index';
import authService from '../controller/user';
import auth from '../authMiddleware/authMiddleware';

const router = express.Router();

router.route('/register').post(authService.registerUser);
router.route('/register-super-admin').post(authService.registerSuperAdmin);
router.route('/login').post(authService.loginUser);
router
  .route('/get-current-user')
  .get(
    auth([
      CONFIG.ROLES.USER,
      CONFIG.ROLES.TUTOR,
      CONFIG.ROLES.ADMIN,
      CONFIG.ROLES.SUPERADMIN,
    ]),
    authService.getCurrentLoggedInUser
  );
router.route('/get-user-by-id/:id').get(auth([
  CONFIG.ROLES.USER,
  CONFIG.ROLES.TUTOR,
  CONFIG.ROLES.ADMIN,
  CONFIG.ROLES.SUPERADMIN,
]), authService.getUserById);

router.route('/user/dva').get(auth([
  CONFIG.ROLES.USER,
  CONFIG.ROLES.TUTOR,
  CONFIG.ROLES.ADMIN,
  CONFIG.ROLES.SUPERADMIN,
]),authService.getUserDva);

router.route('/forget-password').post(authService.forgetPassword);
router.route('/reset-password').post(authService.resetpassword);
router.route('/update-vtu-admin').patch(auth(CONFIG.ROLES.ADMIN), authService.updateVTUAdmin);
router.route('/verify-top-up').get(auth(CONFIG.ROLES.USER), authService.getTopUpAccount);
router.route('/set-transaction-pin').post(auth([CONFIG.ROLES.USER]), authService.setTransactionPin);
router
  .route('/verify-transaction-pin')
  .post(auth([CONFIG.ROLES.USER]), authService.verifyTransactionPin);
router.route('/update-transaction-pin').patch(auth(), authService.updateTransactionPin);
router.route('/get-previous-payment-reference').get(auth(CONFIG.ROLES.USER), authService.getPreviousReference);
router.route('/logout').post(authService.logout);

export default router;
