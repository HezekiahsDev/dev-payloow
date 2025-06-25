import express from 'express';
import { CONFIG } from '../config';
import AdminsController from '../controller/admins';
import auth from '../authMiddleware/authMiddleware';

const router = express.Router();

router.route('/tutors').get(auth([CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), AdminsController.getAllRegisteredTutors);
router.route('/students').get(auth([CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), AdminsController.allEnrolledStudents);
router.route('/courses').get(auth([CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), AdminsController.getNumberOfRegisteredCourses);
router.route('/all/courses').get(auth([CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), AdminsController.getAllCourses);
router
  .route('/courses/ratings')
  .get(auth([CONFIG.ROLES.ADMIN, CONFIG.ROLES.SUPERADMIN]), AdminsController.getCoursesWithTheHighestAndLowestRatings);

export default router;
