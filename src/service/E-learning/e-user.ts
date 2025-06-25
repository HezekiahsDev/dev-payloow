import Joi from 'joi';
import { AuthRequest } from '../../types';
import { StatusCodes } from 'http-status-codes';
import quizSchema from '../../models/quiz.schema';
import userSchema from '../../models/user.schema';
import course_cart from '../../models/course_cart';
import customError from '../../utils/custom.errors';
import ratingSchema from '../../models/rating.schema';
import course_enroll from '../../models/course_enroll';
import quiz_attempts from '../../models/quiz_attempts';
import answersSchema from '../../models/answers.schema';
import course_announcement from '../../models/course_announcement';
import quiz_questionsSchema from '../../models/quiz_questions.schema';
import students_progressSchema from '../../models/students_progress.schema';
import { default as courseSchema, default as eLearningCourseSchema } from '../../models/e-learning-course.schema';
class EUser {
  async getCourseContent(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate({ courseId: req.params.courseId });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const course = await courseSchema
        .findOne({ _id: data.courseId })
        .populate({ path: 'sections', populate: { path: 'lessons' } });

      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Course retrieved successfully',
        data: course,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getAllCourses(req: AuthRequest) {
    try {
      const courses = await courseSchema
        .find()
        .populate({ path: 'sections', populate: { path: 'lessons' } })
        .exec();

      return {
        statusCode: StatusCodes.OK,
        message: 'Course retrieved successfully',
        data: courses,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getCoursesUploadedByTutor(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      tutor_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const checkUser = await courseSchema.find({ tutor_id: data.tutor_id });

      if (checkUser.length === 0) throw new customError('courses not found for tutor');

      return {
        statusCode: StatusCodes.OK,
        message: 'Course retrieved successfully',
        data: checkUser,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async enrollCourse(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await eLearningCourseSchema.findById(data.course_id);

      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      const enrolled = await course_enroll.findOne({
        user_id: user._id,
        course_id: data.course_id,
      });

      if (enrolled) throw new customError('You have already enrolled in this course', StatusCodes.BAD_REQUEST);

      await course_enroll.create({
        user_id: user._id,
        course_id: data.course_id,
      });

      await course_cart.create({
        user_id: user._id,
        course_id: data.course_id,
      });

      await eLearningCourseSchema.findByIdAndUpdate(data.course_id, { $inc: { students_enrolled: 1 } }, { new: true });

      return {
        statusCode: StatusCodes.OK,
        message: 'Course enrolled successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getAllCourseFromCart(req: AuthRequest) {
    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const cart = await course_cart.find({ user_id: user._id, PaymentStatus: 'pending' }).populate('course_id');

      if (cart.length === 0) throw new customError('No courses found in cart', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Courses fetched successfully',
        data: cart,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getSingleCartCourse(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate({ courseId: req.params.courseId });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const cart = await course_cart
        .findOne({ user_id: user._id, course_id: req.params.courseId })
        .populate('course_id');

      if (!cart) throw new customError('Course not found in cart', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Course fetched successfully',
        data: cart,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async deleteCourseFromCart(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const cart = await course_cart.findOne({
        user_id: user._id,
        course_id: data.courseId,
      });

      if (!cart) throw new customError('Course not found in cart', StatusCodes.NOT_FOUND);

      await course_cart.findByIdAndDelete(cart._id);

      const enrolled = await course_enroll.findOne({
        user_id: user._id,
        course_id: data.courseId,
      });

      if (!enrolled) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      await course_enroll.findByIdAndDelete(enrolled._id);

      await eLearningCourseSchema.findByIdAndUpdate(data.courseId, { students_enrolled: -1 });

      return {
        statusCode: StatusCodes.OK,
        message: 'Course deleted successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async deleteAllCourseFromCart(req: AuthRequest) {
    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      await course_cart.deleteMany({ user_id: user._id });

      return {
        statusCode: StatusCodes.OK,
        message: 'All courses deleted successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getAllEnrolledCourses(req: AuthRequest) {
    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const enrolled = await course_enroll.find({ user_id: user._id }).populate('course_id');

      if (enrolled.length === 0) throw new customError('No courses found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Courses fetched successfully',
        data: enrolled,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getSingleEnrolledCourse(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const enrolled = await course_enroll
        .findOne({ user_id: user._id, course_id: data.courseId })
        .populate('course_id');

      if (!enrolled) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Course fetched successfully',
        data: enrolled,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getCourseAnnouncement(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    try {
      const user = await userSchema.findById(req.user?._id);
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await eLearningCourseSchema.findById(data.courseId);

      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      const announcement = await course_announcement.find({
        course_id: data.courseId,
      });

      if (announcement.length === 0)
        throw new customError('No announcement found for this course', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Announcement fetched successfully',
        data: announcement,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async completeLesson(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
      lessonId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const progress = await students_progressSchema.findOne({
        user_id: user._id,
        course_id: data.course_id,
      });

      if (!progress) throw new customError('Course progress not found', StatusCodes.NOT_FOUND);

      await progress.markLessonCompleted(data.lesson_id);

      return {
        statusCode: StatusCodes.OK,
        message: 'Lesson completed and progress updated',
        data: { progressPercentage: progress.progressPercentage },
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);
      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getCourseProgress(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
    try {
      const user = await userSchema.findById(req.user?._id);
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const progress = await students_progressSchema.findOne({
        user_id: user._id,
        course_id: data.course_id,
      });

      if (!progress) throw new customError('Course progress not found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Course progress fetched successfully',
        data: progress,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);
      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async addCourseRating(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
      rating: Joi.number().required().min(1).max(5),
      comment: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await eLearningCourseSchema.findById(data.course_id);

      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      const rated = await ratingSchema.findOne({
        student_id: user._id,
        course_id: data.course_id,
      });

      if (rated) throw new customError('You have already rated this course', StatusCodes.BAD_REQUEST);

      await ratingSchema.create({
        student_id: user._id,
        course_id: data.course_id,
        rating: data.rating,
        comment: data.comment,
      });
      return {
        statusCode: StatusCodes.OK,
        message: 'Course rated successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);
      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async updateCourseRating(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
      rating: Joi.number().required().min(1).max(5),
      comment: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await eLearningCourseSchema.findById(data.course_id);

      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      const rated = await ratingSchema.findOne({
        student_id: user._id,
        course_id: data.course_id,
      });

      if (!rated) throw new customError('You have not rated this course', StatusCodes.BAD_REQUEST);

      await ratingSchema.findByIdAndUpdate(rated._id, {
        rating: data.rating,
        comment: data.comment,
      });

      return {
        statusCode: StatusCodes.OK,
        message: 'Course rating updated successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getCourseRating(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const course = await eLearningCourseSchema.findById(data.course_id);

      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      const ratings = await ratingSchema.findOne({ course_id: data.course_id });

      return {
        statusCode: StatusCodes.OK,
        message: 'Course ratings fetched successfully',
        data: ratings,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async deleteCourseRating(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await eLearningCourseSchema.findById(data.course_id);

      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      const rated = await ratingSchema.findOne({
        student_id: user._id,
        course_id: data.course_id,
      });

      if (!rated) throw new customError('You have not rated this course', StatusCodes.BAD_REQUEST);

      await ratingSchema.findByIdAndDelete(rated._id);

      return {
        statusCode: StatusCodes.OK,
        message: 'Course rating deleted successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getCourseQuiz(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await eLearningCourseSchema.findById(data.courseId);

      if (!course) throw new customError('Course quiz not found', StatusCodes.NOT_FOUND);

      const quiz = await quizSchema.find({ course_id: data.courseId }).sort({ created_at: -1 });

      if (!quiz) throw new customError('Quiz not found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Quiz fetched successfully',
        data: quiz,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async submitQuiz(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
      quiz_id: Joi.string().required(),
      answers: Joi.array()
        .items(
          Joi.object({
            question_id: Joi.string().required(),
            selected_option: Joi.string().required(),
          })
        )
        .required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await eLearningCourseSchema.findById(data.course_id);

      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      const quiz = await quiz_questionsSchema.findById(data.quiz_id);

      if (!quiz) throw new customError('Quiz not found', StatusCodes.NOT_FOUND);

      const answers = await answersSchema.find({ quiz_id: data.quiz_id });

      if (!answers) throw new customError('Answers not found', StatusCodes.NOT_FOUND);

      let score = 0;

      for (let i = 0; i < data.answers.length; i++) {
        const answer = await answersSchema.findById(data.answers[i].question_id);

        if (!answer) throw new customError('Answer not found', StatusCodes.NOT_FOUND);

        if (answer.is_correct === data.answers[i].selected_option) {
          score++;
        }
      }

      const max_score = answers.length;

      const percentage = (score / max_score) * 100;

      const passed = percentage >= 50 ? true : false;

      await quiz_attempts.create({
        user_id: user._id,
        quiz_id: data.quiz_id,
        score,
        max_score,
        passed,
      });

      return {
        statusCode: StatusCodes.OK,
        message: 'Quiz submitted successfully',
        data: {
          score,
          max_score,
          passed,
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getAllQuizAttempted(req: AuthRequest) {
    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const quiz = await quiz_attempts.find({ user_id: user._id }).populate('quiz_id');

      if (quiz.length === 0) throw new customError('No attempted Quiz', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Quiz fetched successfully',
        data: quiz,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getQuizResult(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      quiz_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findById(req.user?._id);

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const quiz = await quiz_attempts.findById(data.quiz_id);

      if (!quiz) throw new customError('Quiz not found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Quiz fetched successfully',
        data: quiz,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }
}

export default new EUser();
