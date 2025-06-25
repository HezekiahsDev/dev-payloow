import express from 'express';
import { CONFIG } from '..//config';
import settingService from '../controller/settings';
import auth from '../authMiddleware/authMiddleware';

const router = express.Router();

router.route('/change-email').patch(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN]), settingService.changeEmail);
router.route('/update-profile').patch(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN]), settingService.updateProfile);
router.route('/change-password').patch(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN]), settingService.changePassword);
router.route('/add-profile-picture').post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.ADMIN]), settingService.addProfilePicture);

export default router;
