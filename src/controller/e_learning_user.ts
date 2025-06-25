import { Request, Response } from 'express';
import { response } from '../utils/response';
import E_User from '../service/E-learning/e-user';
import coursePayment from '../service/E-learning/course-payment';
class LearningUser {
  async enrollCourse(req: Request, res: Response) {
    const result = await E_User.enrollCourse(req);
    res.status(result.statusCode).json(response(result.message as string));
  }

  async getCourseInCart(req: Request, res: Response) {
    const result = await E_User.getAllCourseFromCart(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async getAllCourses(req: Request, res: Response) {
    const result = await E_User.getAllCourses(req);

    res.status(result?.statusCode).json(response(result.message as string, result.data));
  }

  async getAllUploadedByCourseTutor(req: Request, res: Response) {
    const result = await E_User.getCoursesUploadedByTutor(req);

    res.status(result?.statusCode).json(response(result.message as string, result.data));
  }

  async getSingeCourseInCart(req: Request, res: Response) {
    const result = await E_User.getSingleCartCourse(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async deleteCourseInCart(req: Request, res: Response) {
    const result = await E_User.deleteCourseFromCart(req);
    res.status(result.statusCode).json(response(result.message as string));
  }

  async deleteAllCourseInCart(req: Request, res: Response) {
    const result = await E_User.deleteAllCourseFromCart(req);
    res.status(result.statusCode).json(response(result.message as string));
  }

  async paymentForCourse(req: Request, res: Response) {
    const result = await coursePayment.createCoursePaymentIntent(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async getCourseEnrolled(req: Request, res: Response) {
    const result = await E_User.getAllEnrolledCourses(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async getCourseContent(req: Request, res: Response) {
    const result = await E_User.getCourseContent(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async getAllEnrolledCourses(req: Request, res: Response) {
    const result = await E_User.getAllEnrolledCourses(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async getCourseEnrolledById(req: Request, res: Response) {
    const result = await E_User.getSingleEnrolledCourse(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async courseAnnouncement(req: Request, res: Response) {
    const result = await E_User.getCourseAnnouncement(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async completedLessons(req: Request, res: Response) {
    const result = await E_User.completeLesson(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async getCourseProgress(req: Request, res: Response) {
    const result = await E_User.getCourseProgress(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async addCourseRating(req: Request, res: Response) {
    const result = await E_User.addCourseRating(req);
    res.status(result.statusCode).json(response(result.message as string));
  }

  async getCourseRating(req: Request, res: Response) {
    const result = await E_User.getCourseRating(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async updateCourseRatingById(req: Request, res: Response) {
    const result = await E_User.updateCourseRating(req);
    res.status(result.statusCode).json(response(result.message as string));
  }

  async deleteCourseRatingById(req: Request, res: Response) {
    const result = await E_User.deleteCourseRating(req);
    res.status(result.statusCode).json(response(result.message as string));
  }

  async submitQuiz(req: Request, res: Response) {
    const result = await E_User.submitQuiz(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }
  async getAllQuizAttempted(req: Request, res: Response) {
    const result = await E_User.getAllQuizAttempted(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async getCourseQuiz(req: Request, res: Response) {
    const result = await E_User.getCourseQuiz(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }

  async getQuizResult(req: Request, res: Response) {
    const result = await E_User.getQuizResult(req);
    res.status(result.statusCode).json(response(result.message as string, result.data));
  }
}

export default new LearningUser();
