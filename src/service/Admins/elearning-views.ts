import { AuthRequest } from '../../types';
import { StatusCodes } from 'http-status-codes';
import userSchema from '../../models/user.schema';
import course_enroll from '../../models/course_enroll';
import eLearningCourseSchema from '../../models/e-learning-course.schema';

class AdminsService {
  async getAllRegisteredTutors(req: AuthRequest) {
    try {
      const tutors = await userSchema
        .find({ role: 'Tutor' })
        .select('-password -bvn -notification -previousReference -Wallet -__v');
      if (tutors.length === 0) throw new Error('No registered tutors found');
      return {
        status: StatusCodes.OK,
        message: 'All registered tutors fetched successfully',
        data: tutors,
      };
    } catch (error) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: error instanceof Error ? error.message : 'An error occurred while fetching all registered tutors',
      };
    }
  }

  async allEnrolledStudents(req: AuthRequest) {
    try {
      const students = await userSchema.find({ role: 'user' });
      if (students.length === 0) throw new Error('No registered students found');

      const studentsId = students.map((student) => student._id);
      const enrolledCourses = await course_enroll
        .find({ user_id: { $in: studentsId }, status: 'completed' })
        .populate('user_id', '-password -bvn -notification -previousReference -Wallet -__v');

      if (enrolledCourses.length === 0) throw new Error('No enrolled students found');
      return {
        status: StatusCodes.OK,
        message: 'All registered students fetched successfully',
        data: enrolledCourses,
      };
    } catch (error) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: error instanceof Error ? error.message : 'An error occurred while fetching all registered students',
      };
    }
  }

  async getNumberOfRegisteredCourses(req: AuthRequest) {
    try {
      const courses = await eLearningCourseSchema.find();

      if (courses.length === 0) throw new Error('No registered courses found');
      return {
        status: StatusCodes.OK,
        message: 'Number of registered courses fetched successfully',
        data: courses.length,
      };
    } catch (error) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message:
          error instanceof Error ? error.message : 'An error occurred while fetching the number of registered courses',
      };
    }
  }

  async getAllCourses(req: AuthRequest) {
    try {
      const courses = await eLearningCourseSchema.find({});

      if (courses.length === 0) throw new Error('No registered courses found');

      return {
        status: StatusCodes.OK,
        message: 'All registered courses fetched successfully',
        data: courses,
      };
    } catch (error) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: error instanceof Error ? error.message : 'An error occurred while fetching all registered courses',
      };
    }
  }

  async getCourseWithMostAndLeastStudents(req: AuthRequest) {}

  async getCourseWithTheHighestAndLowestRating(req: AuthRequest) {
    try {
      const courses = await eLearningCourseSchema.find();

      if (courses.length === 0) throw new Error('No registered courses found');

      const courseWithHighestRating = courses.reduce((prev, current) =>
        prev.averageRating > current.averageRating ? prev : current
      );
      const courseWithLowestRating = courses.reduce((prev, current) =>
        prev.averageRating < current.averageRating ? prev : current
      );

      if (!courseWithHighestRating || !courseWithLowestRating)
        throw new Error('No course with highest or lowest rating found');

      return {
        status: StatusCodes.OK,
        message: 'Courses with highest and lowest ratings fetched successfully',
        data: {
          courseWithHighestRating,
          courseWithLowestRating,
        },
      };
    } catch (error) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message:
          error instanceof Error
            ? error.message
            : 'An error occurred while fetching courses with highest and lowest ratings',
      };
    }
  }

  //async numberOf
}

export default new AdminsService();
