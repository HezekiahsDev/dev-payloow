import { Response } from 'express';
import { AuthRequest } from '../types';
import { response } from '../utils/response';
import eTutor from '../service/E-learning/e-tutor';

class eTutorController {
  async uploadCourseVideoDocumentToS3Bucket(req: AuthRequest, res: Response) {
    // const result = await eTutor.uploadCourseVideoDocumentToS3Bucket(req);
    const result = "Hello";

    res.status(200).json(response(result as string));
  }

  async addCourseThumbnailImage(req: AuthRequest, res: Response) {} //TODO: Implement this method

  async createCourseContent(req: AuthRequest, res: Response) {
    const result = await eTutor.createCourseContent(req);

    res.status(result?.statusCode).json(response(result.message as string, result.data));
  }

  async createCourseTutorProfile(req: AuthRequest, res: Response) {
    const result = await eTutor.createCourseTutorProfile(req);

    res.json(response(result?.message as string));
  }

  async addTutorImage(req: AuthRequest, res: Response) {} // TODO: Implement this method

  async getCourseTutorProfile(req: AuthRequest, res: Response) {
    const result = await eTutor.getCourseTutorProfile(req);

    res.json(response(result?.message as string, result.data));
  }

  async getCourseTutorProfileById(req: AuthRequest, res: Response) {
    const result = await eTutor.getCourseTutorProfileById(req);

    res.json(response(result?.message as string, result.data));
  }

  async makeCourseAnnouncement(req: AuthRequest, res: Response) {
    const result = await eTutor.createCourseAnnouncement(req);

    res.json(response(result?.message as string));
  }

  async getAllCourseAnnouncement(req: AuthRequest, res: Response) {
    const result = await eTutor.getAllAnnouncements(req);

    res.json(response(result?.message as string, result.data));
  }

  async updateCourseContent(req: AuthRequest, res: Response) {
    const result = await eTutor.updateCourseContent(req);

    res.json(response(result?.message as string, result.data));
  }
  async updateCourseTutorProfile(req: AuthRequest, res: Response) {
    const result = await eTutor.updateCourseTutorProfile(req);

    res.json(response(result?.message as string));
  }
  async uploadCourseTutorDocumentToCloudinary(req: AuthRequest, res: Response) {
    const result = await eTutor.uploadCourseTutorDocumentToCloudinary(req);

    //res.json(response(result.message as string));
  }
  async getCourseContentById(req: AuthRequest, res: Response) {
    const result = await eTutor.getCourseContent(req);

    res.json(response(result?.message as string, result.data));
  }

  async addCourseToExistingSectionsAndLessons(req: AuthRequest, res: Response) {
    const result = await eTutor.addCourseToExistingSectionsAndLessons(req);

    res.json(response(result?.message as string, result.data));
  }

  async getAllCourseQuestions(req: AuthRequest, res: Response) {
    const result = await eTutor.getAllCourseQuestions(req);

    res.json(response(result?.message as string, result.data));
  }

  async replyToQuestions(req: AuthRequest, res: Response) {
    const result = await eTutor.replyToQuestions(req);

    res.json(response(result?.message as string));
  }

  async setQuizQuestions(req: AuthRequest, res: Response) {
    const result = await eTutor.createQuizFunction(req);

    res.json(response(result?.message as string, result?.data));
  }

  async getQuizQuestionsById(req: AuthRequest, res: Response) {
    const result = await eTutor.getQuizById(req);

    res.json(response(result?.message as string, result?.data));
  }

  async getAllQuizQuestions(req: AuthRequest, res: Response) {
    const result = await eTutor.getAllQuizzes(req);

    res.json(response(result?.message as string, result?.data));
  }

  async updateQuizQuestions(req: AuthRequest, res: Response) {
    const result = await eTutor.updateQuiz(req);

    res.json(response(result?.message as string, result?.data));
  }

  async deleteQuizQuestions(req: AuthRequest, res: Response) {
    const result = await eTutor.deleteQuiz(req);

    res.json(response(result?.message as string));
  }
}

export default new eTutorController();
