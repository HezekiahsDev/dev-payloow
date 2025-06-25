import express from 'express';
import { CONFIG } from '../config';
import auth from '../authMiddleware/authMiddleware';
import eTutorController from '../controller/e-learning';

const router = express.Router();

router
  .route('/upload-course-video-document')
  .post(auth(CONFIG.ROLES.TUTOR), eTutorController.uploadCourseVideoDocumentToS3Bucket);
router.route('/add-course-thumbnail-image').post(auth(CONFIG.ROLES.TUTOR), eTutorController.addCourseThumbnailImage);
router.route('/create-course-content').post(auth(CONFIG.ROLES.TUTOR), eTutorController.createCourseContent);
router.route('/create-course-tutor-profile').post(auth(CONFIG.ROLES.TUTOR), eTutorController.createCourseTutorProfile);
router.route('/add-tutor-image').post(auth(CONFIG.ROLES.TUTOR), eTutorController.addTutorImage);
router.route('/get-course-tutor-profile').get(auth(CONFIG.ROLES.TUTOR), eTutorController.getCourseTutorProfile);
router.route('/make-course-announcement').post(auth(CONFIG.ROLES.TUTOR), eTutorController.makeCourseAnnouncement);
router
  .route('/get-all-course-announcement/:courseId')
  .get(auth(CONFIG.ROLES.TUTOR), eTutorController.getAllCourseAnnouncement);
router
  .route('/get-course-by-id/:courseId')
  .get(auth([CONFIG.ROLES.TUTOR, CONFIG.ROLES.USER]), eTutorController.getCourseContentById);
router
  .route('/get-course-questions-by-id/:courseId')
  .get(auth(CONFIG.ROLES.TUTOR), eTutorController.getAllCourseQuestions);
router.route('/reply-course=questions/:questionId').post(auth(CONFIG.ROLES.TUTOR), eTutorController.replyToQuestions);
router
  .route('/get-course-tutor-profile-by-id/:tutorId')
  .get(auth([CONFIG.ROLES.TUTOR, CONFIG.ROLES.USER]), eTutorController.getCourseTutorProfileById);
router
  .route('/add-to-existing-lessons')
  .patch(auth(CONFIG.ROLES.TUTOR), eTutorController.addCourseToExistingSectionsAndLessons);
router.route('/update-course-content').patch(auth(CONFIG.ROLES.TUTOR), eTutorController.updateCourseContent);
router.route('/update-course-tutor-profile').patch(auth(CONFIG.ROLES.TUTOR), eTutorController.updateCourseTutorProfile);
router
  .route('/upload-course-document/:courseId')
  .post(auth(CONFIG.ROLES.TUTOR), eTutorController.uploadCourseTutorDocumentToCloudinary);
router.route('/add-course-question').post(auth(CONFIG.ROLES.TUTOR), eTutorController.setQuizQuestions);
router.route('/get-quiz-by-id/:quizId').get(auth(CONFIG.ROLES.TUTOR), eTutorController.getQuizQuestionsById);
router.route('/get-all-quiz').get(auth(CONFIG.ROLES.TUTOR), eTutorController.getAllQuizQuestions);
router.route('/update-quiz-question/:quizId').patch(auth(CONFIG.ROLES.TUTOR), eTutorController.updateQuizQuestions);
router.route('/delete-quiz-question/:quizId').delete(auth(CONFIG.ROLES.TUTOR), eTutorController.deleteQuizQuestions);

export default router;
