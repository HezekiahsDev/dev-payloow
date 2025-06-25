import { Response } from 'express';
import { AuthRequest } from '../types';
import { response } from '../utils/response';
import AdminsService from '../service/Admins/elearning-views';

class AdminsController {
  async getAllRegisteredTutors(req: AuthRequest, res: Response) {
    const result = await AdminsService.getAllRegisteredTutors(req);

    res.status(result.status).json(response(result.message, result.data));
  }

  async allEnrolledStudents(req: AuthRequest, res: Response) {
    const result = await AdminsService.allEnrolledStudents(req);

    res.status(result.status).json(response(result.message, result.data));
  }

  async getAllCourses(req: AuthRequest, res: Response) {
    const result = await AdminsService.getAllCourses(req);

    res.status(result.status).json(response(result.message, result.data));
  }

  async getNumberOfRegisteredCourses(req: AuthRequest, res: Response) {
    const result = await AdminsService.getNumberOfRegisteredCourses(req);

    res.status(result.status).json(response(result.message, result.data));
  }

  async getCoursesWithTheHighestAndLowestRatings(req: AuthRequest, res: Response) {
    const result = await AdminsService.getCourseWithTheHighestAndLowestRating(req);

    res.status(result.status).json(response(result.message, result.data));
  }
}

export default new AdminsController();
