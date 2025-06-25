import express from 'express';
import { CONFIG } from '../config/index';
import auth from '../authMiddleware/authMiddleware';
import LearningUser from '../controller/e_learning_user';

const router = express.Router();

router.route('/enroll-course').post(auth(CONFIG.ROLES.USER), LearningUser.enrollCourse);
router.route('/get-all-courses').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.TUTOR]), LearningUser.getAllCourses);
router.route('/get-course-enrolled').get(auth(CONFIG.ROLES.USER), LearningUser.getCourseEnrolled);
router.route('/get-courses-tutor/:tutor_id').get(auth(CONFIG.ROLES.USER), LearningUser.getAllUploadedByCourseTutor);
router.route('/get-course-content/:courseId').get(auth(CONFIG.ROLES.USER), LearningUser.getCourseContent);
router.route('/get-all-enrolled-courses').get(auth(CONFIG.ROLES.USER), LearningUser.getAllEnrolledCourses);
router.route('/get-course-enrolled-by-id/:courseId').get(auth(CONFIG.ROLES.USER), LearningUser.getCourseEnrolledById);
router.route('/get-course-in-cart').get(auth(CONFIG.ROLES.USER), LearningUser.getCourseInCart);
router.route('/get-single-course-in-cart/:courseId').get(auth(CONFIG.ROLES.USER), LearningUser.getSingeCourseInCart);
router.route('/delete-course-in-cart/:courseId').delete(auth(CONFIG.ROLES.USER), LearningUser.deleteCourseInCart);
router.route('/delete-all-course-in-cart').delete(auth(CONFIG.ROLES.USER), LearningUser.deleteAllCourseInCart);
router.route('/course-announcement/:courseId').get(auth(CONFIG.ROLES.USER), LearningUser.courseAnnouncement);
router.route('/completed-lessons').post(auth(CONFIG.ROLES.USER), LearningUser.completedLessons);
router.route('/get-course-progress').get(auth(CONFIG.ROLES.USER), LearningUser.getCourseProgress);
router.route('/add-course-rating').post(auth(CONFIG.ROLES.USER), LearningUser.addCourseRating);
router.route('/update-course-rating').put(auth(CONFIG.ROLES.USER), LearningUser.updateCourseRatingById);
router.route('/delete-course-rating').delete(auth(CONFIG.ROLES.USER), LearningUser.deleteCourseRatingById);
router.route('/get-course-rating').get(auth(CONFIG.ROLES.USER), LearningUser.getCourseRating);
router.route('/get-quiz-attempt').get(auth(CONFIG.ROLES.USER), LearningUser.getAllQuizAttempted);
router.route('/submit-quiz').post(auth(CONFIG.ROLES.USER), LearningUser.submitQuiz);
router.route('/get-quiz-result').get(auth(CONFIG.ROLES.USER), LearningUser.getQuizResult);
router.route('/get-course-quiz/:courseId').get(auth(CONFIG.ROLES.USER), LearningUser.getCourseQuiz);
router.route('/course/payment').post(auth(CONFIG.ROLES.USER), LearningUser.paymentForCourse);

export default router;
