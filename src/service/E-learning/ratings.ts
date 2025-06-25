import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import ratingSchema from '../../models/rating.schema';
import { AuthRequest } from '../../types';
import customError from '../../utils/custom.errors';

class Ratings {
  async rateCourse(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().allow(''),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const rating = await ratingSchema.findOne({ course_id: data.course_id, student_id: req.user?._id });

      if (rating) {
        await ratingSchema.updateOne({ course_id: data.course_id, student_id: req.user?._id }, { $set: data });
      } else {
        await ratingSchema.create({ ...data, student_id: req.user?._id });
      }

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

  async getCourseRating(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const rating = await ratingSchema.find({ course_id: data.course_id });

      return {
        statusCode: StatusCodes.OK,
        message: 'Course rating fetched successfully',
        data: rating,
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

  async getCourseRatingByUser(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const rating = await ratingSchema.findOne({ course_id: data.course_id, student_id: req.user?._id });

      return {
        statusCode: StatusCodes.OK,
        message: 'Course rating fetched successfully',
        data: rating,
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
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().allow(''),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const rating = await ratingSchema.findOne({ course_id: data.course_id, student_id: req.user?._id });

      if (!rating) throw new customError('Rating not found', StatusCodes.NOT_FOUND);

      await ratingSchema.updateOne({ course_id: data.course_id, student_id: req.user?._id }, { $set: data });

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

  async getAllCourseRatingById(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const rating = await ratingSchema.find({ course_id: data.course_id });

      return {
        statusCode: StatusCodes.OK,
        message: 'Course rating fetched successfully',
        data: rating,
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
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const rating = await ratingSchema.findOne({ course_id: data.course_id, student_id: req.user?._id });

      if (!rating) throw new customError('Rating not found', StatusCodes.NOT_FOUND);

      await ratingSchema.deleteOne({ course_id: data.course_id, student_id: req.user?._id });

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
}

export default new Ratings();
