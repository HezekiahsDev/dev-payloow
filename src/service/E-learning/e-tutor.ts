import fs from 'fs';
import Joi from 'joi';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuthRequest } from '../../types';
import { StatusCodes } from 'http-status-codes';
import quizSchema from '../../models/quiz.schema';
import userSchema from '../../models/user.schema';
import customError from '../../utils/custom.errors';
import { uploadFileToS3 } from '../../libraries/aws';
import generateTokens from '../../utils/generateHashMac';
import { CONFIG, DEPLOYMENT_ENV } from '../../config/index';
import eLearningSchema from '../../models/e-learning.schema';
import tutor_replySchema from '../../models/tutor_reply.schema';
import courseSchema from '../../models/e-learning-course.schema';
import questionsSchema from '../../models/user_questions.schema';
import course_announcement from '../../models/course_announcement';
import quiz_questionsSchema from '../../models/quiz_questions.schema';
import course_lessonsSchema from '../../models/course_lessons.schema';
import course_sectionsSchema from '../../models/course_sections.schema';
import { ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

class E_Tutor {
  private readonly s3: S3Client;

  private readonly cloud_front_url = CONFIG.AWS.CLOUD_FRONT as string;

  constructor() {
    this.s3 = new S3Client({
      region: CONFIG.AWS.AWS_REGION as string,
      credentials: {
        accessKeyId: CONFIG.AWS.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: CONFIG.AWS.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  // async uploadCourseVideoDocumentToS3Bucket(req: AuthRequest) {
  //   if (!req.files || !('video' in req.files)) throw new customError('File not found', StatusCodes.BAD_REQUEST);

  //   const videos = Array.isArray(req.files.video) ? req.files.video : [req.files.video];

  //   for (const video of videos) {
  //     if (!video || !video.tempFilePath || !video.name)
  //       throw new customError('File properties missing', StatusCodes.BAD_REQUEST);

  //     if (!['video/mp4', 'video/mkv', 'video/avi'].includes(video.mimetype))
  //       throw new customError('Invalid video format', StatusCodes.BAD_REQUEST);

  //     if (!fs.existsSync(video.tempFilePath)) throw new customError('File does not exist', StatusCodes.NOT_FOUND);
  //   }

  //   try {
  //     const video = videos[0];

  //     // Read the temporary file into a buffer
  //     const buffer = fs.readFileSync(video.tempFilePath);

  //     const res = await uploadFileToS3V2({
  //       s3Bucket: CONFIG.AWS.BUCKET_NAME,
  //       file: buffer,
  //       folder: 'e-tutor/course-videos',
  //       mimetype: video.mimetype,
  //       ACL: ObjectCannedACL.private,
  //     });

  //     fs.unlinkSync(video.tempFilePath);

  //     return {
  //       statusCode: StatusCodes.OK,
  //       message: 'Video uploaded successfully',
  //       data: res,
  //     };
  //   } catch (error) {
  //     const errorMessage = (error as Error).message || 'An unknown error occurred';
  //     const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

  //     return {
  //       statusCode: customErrors.status,
  //       message: customErrors.message,
  //     };
  //   }
  // }

  async uploadCourseTutorDocumentToCloudinary(req: AuthRequest) {} //TODO: work on document upload with s3

  async addCourseThumbnailImage(req: AuthRequest) {} //TODO: work on document upload with s3

  async createCourseContent(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      duration: Joi.string().required(),
      price: Joi.string().required(),
      discount_price: Joi.number().default(null),
      category: Joi.string().required(),
      sections: Joi.array()
        .items(
          Joi.object({
            title: Joi.string().required(),
            description: Joi.string().optional(),
            lessons: Joi.array()
              .items(
                Joi.object({
                  title: Joi.string().required(),
                  videoUrl: Joi.string().required(),
                  duration: Joi.number().required(),
                  order: Joi.number().required(),
                })
              )
              .required(),
          })
        )
        .required(),
      tags: Joi.array().items(Joi.string()).required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (user?.role !== CONFIG.ROLES.TUTOR) throw new customError('User is not a tutor', StatusCodes.FORBIDDEN);

      const course = await courseSchema.create({
        title: data.title,
        description: data.description,
        tutor_id: user?._id,
        duration: data.duration,
        price: data.price,
        discount_price: data.discount_price || null,
        category: data.category,
        tags: data.tags,
        sections: [],
        course_thumbnail: [],
      });

      const sectionIds: mongoose.ObjectId[] = [];
      for (const section of data.sections) {
        const newSection = await course_sectionsSchema.create({
          course_id: course._id,
          title: section.title,
          description: section.description || '',
          lessons: [],
        });

        const lessonIds: mongoose.ObjectId[] = [];

        for (const lesson of section.lessons) {
          const newLesson = await course_lessonsSchema.create({
            section_id: newSection._id,
            title: lesson.title,
            videoUrl: `${this.cloud_front_url}${lesson.videoUrl}`,
            duration: lesson.duration,
            order: lesson.order,
          });

          lessonIds.push(newLesson._id as mongoose.ObjectId);
        }

        newSection.lessons = lessonIds;
        await newSection.save();

        sectionIds.push(newSection._id as mongoose.ObjectId);
      }

      course.sections = sectionIds;
      await course.save();

      return {
        statusCode: StatusCodes.CREATED,
        message: 'Course created successfully with sections and lessons',
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

  async addCourseToExistingSectionsAndLessons(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
      sections: Joi.array()
        .items(
          Joi.object({
            sectionId: Joi.string().required(),
            lessons: Joi.array()
              .items(
                Joi.object({
                  title: Joi.string().required(),
                  videoUrl: Joi.string().required(),
                  duration: Joi.number().required(),
                  order: Joi.number().required(),
                })
              )
              .required(),
          })
        )
        .required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const course = await courseSchema.findOne({ _id: data.courseId });
      if (!course) throw new customError('Course not found', StatusCodes.NOT_FOUND);

      const sectionIds: mongoose.ObjectId[] = [];

      for (const section of data.sections) {
        const existingSection = await course_sectionsSchema.findOne({
          _id: section.sectionId,
          course_id: course._id,
        });
        if (!existingSection) throw new customError('Section not found', StatusCodes.NOT_FOUND);

        const lessonIds: mongoose.ObjectId[] = [...existingSection.lessons];

        for (const lesson of section.lessons) {
          let existingLesson = await course_lessonsSchema.findOne({
            section_id: existingSection._id,
            title: lesson.title,
          });

          if (existingLesson) {
            existingLesson.title = lesson.title;
            existingLesson.videoUrl = lesson.videoUrl;
            existingLesson.duration = lesson.duration;
            existingLesson.order = lesson.order;
          } else {
            existingLesson = new course_lessonsSchema({
              section_id: existingSection._id,
              title: lesson.title,
              videoUrl: lesson.videoUrl,
              duration: lesson.duration,
              order: lesson.order,
            });
          }

          await existingLesson.save();
          if (!lessonIds.includes(existingLesson._id as mongoose.ObjectId)) {
            lessonIds.push(existingLesson._id as mongoose.ObjectId);
          }
        }

        existingSection.lessons = lessonIds;
        await existingSection.save();

        sectionIds.push(existingSection._id as mongoose.ObjectId);
      }

      course.sections = sectionIds;
      await course.save();

      return {
        statusCode: StatusCodes.OK,
        message: 'Course updated successfully with new sections and lessons',
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

  async getCourseContent(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

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

  async updateCourseContent(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      duration: Joi.string().optional(),
      price: Joi.string().optional(),
      discount_price: Joi.string().optional(),
      category: Joi.string().optional(),
      sections: Joi.array()
        .items(
          Joi.object({
            sectionId: Joi.string().optional(),
            title: Joi.string().optional(),
            description: Joi.string().optional(),
            lessons: Joi.array()
              .items(
                Joi.object({
                  lessonId: Joi.string().optional(),
                  title: Joi.string().optional(),
                  videoUrl: Joi.string().optional(),
                  public_id: Joi.string().optional(),
                  duration: Joi.number().optional(),
                  order: Joi.number().optional(),
                })
              )
              .optional(),
          })
        )
        .optional(),
      tags: Joi.array().items(Joi.string()).optional(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user || user.role !== CONFIG.ROLES.TUTOR)
        throw new customError('User is not authorized', StatusCodes.FORBIDDEN);

      const course = await courseSchema.findOne({
        _id: data.courseId,
        tutor_id: user._id,
      });
      if (!course) throw new customError('Course not found or access denied', StatusCodes.NOT_FOUND);

      course.title = data.title || course.title;
      course.description = data.description || course.description;
      course.duration = data.duration || course.duration;
      course.price = data.price || course.price;
      course.discount_price = data.discount_price || course.discount_price;
      course.category = data.category || course.category;
      course.tags = data.tags || course.tags;

      const updatedSectionIds: mongoose.ObjectId[] = [];

      if (data.sections) {
        for (const section of data.sections) {
          let updatedSection;
          if (section.sectionId) {
            updatedSection = await course_sectionsSchema.findOneAndUpdate(
              { _id: section.sectionId, course_id: course._id },
              { title: section.title, description: section.description || '' },
              { new: true }
            );
          } else {
            updatedSection = await course_sectionsSchema.create({
              course_id: course._id,
              title: section.title,
              description: section.description || '',
              lessons: [],
            });
          }

          if (!updatedSection) throw new customError('Section not found', StatusCodes.NOT_FOUND);

          const updatedLessonIds: mongoose.ObjectId[] = [];

          if (section.lessons) {
            for (const lesson of section.lessons) {
              let updatedLesson;
              if (lesson.lessonId) {
                updatedLesson = await course_lessonsSchema.findOneAndUpdate(
                  { _id: lesson.lessonId, section_id: updatedSection?._id },
                  {
                    title: lesson.title,
                    videoUrl: lesson.videoUrl,
                    public_id: lesson.public_id || '',
                    duration: lesson.duration,
                    order: lesson.order,
                  },
                  { new: true }
                );
              } else {
                updatedLesson = await course_lessonsSchema.create({
                  section_id: updatedSection?._id,
                  title: lesson.title,
                  videoUrl: lesson.videoUrl,
                  public_id: lesson.public_id || '',
                  duration: lesson.duration,
                  order: lesson.order,
                });
              }
              updatedLessonIds.push(updatedLesson?._id as mongoose.ObjectId);
            }

            updatedSection.lessons = updatedLessonIds;
            await updatedSection.save();
          }

          updatedSectionIds.push(updatedSection?._id as mongoose.ObjectId);
        }

        course.sections = updatedSectionIds;
      }

      await course.save();

      return {
        statusCode: StatusCodes.OK,
        message: 'Course updated successfully',
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

  async createCourseTutorProfile(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      tutor_name: Joi.string().required(),
      tutor_email: Joi.string().required(),
      tutor_phone: Joi.string().required(),
      tutor_about: Joi.string().required(),
      tutor_image: Joi.string().required(),
      tutor_qualification: Joi.string().required(),
      tutor_experience: Joi.string().required(),
      tutor_achievements: Joi.string().required(),
      tutor_facebook: Joi.string().required(),
      tutor_twitter: Joi.string().required(),
      tutor_linkedin: Joi.string().required(),
      tutor_instagram: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const tutorProfile = await eLearningSchema.findOne({
        tutor_id: req.user?._id,
      });

      if (tutorProfile) throw new customError('Tutor profile already exists', StatusCodes.BAD_REQUEST);

      await eLearningSchema.create({ ...data, tutor_id: req.user?._id });

      user.isTutorVerified = true;

      await user.save();

      return {
        statusCode: StatusCodes.CREATED,
        message: 'Tutor profile created successfully',
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

  async uploadTutorImage(req: AuthRequest) {} //TODO: work on document upload with s3

  async updateCourseTutorProfile(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      tutor_id: Joi.string().required(),
      tutor_name: Joi.string().required(),
      tutor_email: Joi.string().required(),
      tutor_phone: Joi.string().required(),
      tutor_about: Joi.string().required(),
      tutor_image: Joi.string().required(),
      tutor_qualification: Joi.string().required(),
      tutor_experience: Joi.string().required(),
      tutor_achievements: Joi.string().required(),
      tutor_facebook: Joi.string().required(),
      tutor_twitter: Joi.string().required(),
      tutor_linkedin: Joi.string().required(),
      tutor_instagram: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const tutorProfile = await eLearningSchema.findOne({
        tutor_id: req.user?._id,
      });

      if (!tutorProfile) throw new customError('Tutor profile not found', StatusCodes.NOT_FOUND);

      await eLearningSchema.updateOne({ tutor_id: req.user?._id }, { $set: data });

      return {
        statusCode: StatusCodes.OK,
        message: 'Tutor profile updated successfully',
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

  async getCourseTutorProfile(req: AuthRequest) {
    try {
      const tutorProfile = await eLearningSchema.findOne({
        tutor_id: req.user?._id,
      });

      if (!tutorProfile) throw new customError('Tutor profile not found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Tutor profile retrieved successfully',
        data: tutorProfile,
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

  async getCourseTutorProfileById(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      tutorId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.params);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
    try {
      const tutorProfile = await eLearningSchema.findOne({
        tutor_id: data.tutorId,
      });

      if (!tutorProfile) throw new customError('Tutor profile not found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Tutor profile retrieved successfully',
        data: tutorProfile,
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

  async createCourseAnnouncement(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
      title: Joi.string().required(),
      description: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate(req.body);

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);
    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await courseSchema.findOne({ tutor_id: req.user?._id });

      if (!course) throw new customError('course not found', StatusCodes.NOT_FOUND);

      const announcement = await course_announcement.create({
        course_id: data.courseId,
        title: data.title,
        description: data.description,
      });

      return {
        statusCode: StatusCodes.CREATED,
        message: 'Announcement created successfully',
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

  async getAllAnnouncements(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate({ courseId: req.params.courseId });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await courseSchema.findOne({
        _id: data.courseId,
        tutor_id: req.user?._id,
      });

      if (!course) throw new customError('course not found', StatusCodes.NOT_FOUND);

      const announcements = await course_announcement.find({
        course_id: course._id,
      });

      if (announcements.length === 0) throw new customError('No announcements found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Announcements Retrieved Successfully',
        data: announcements,
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

  async getAllCourseQuestions(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      courseId: Joi.string().required(),
    })
      .options({ stripUnknown: true })
      .validate({ courseId: req.params.courseId });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });
      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await courseSchema.find({
        _id: data.courseId,
        tutor_id: req.user?._id,
      });

      if (!course) throw new customError('course not found', StatusCodes.NOT_FOUND);

      if (course.length === 0)
        return {
          statusCode: StatusCodes.OK,
          message: 'They are Questions',
          data: [],
        };

      return {
        statusCode: StatusCodes.OK,
        message: 'Questions Retrieved Successfully',
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

  async replyToQuestions(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      questionId: Joi.string().required(),
      reply: Joi.string().required(),
    })

      .options({ stripUnknown: true })
      .validate({ questionId: req.params.questionId, reply: req.body.reply });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await courseSchema.findOne({ tutor_id: req.user?._id });

      if (!course) throw new customError('course not found', StatusCodes.NOT_FOUND);

      const question = await questionsSchema.findOne({ _id: data.questionId });

      if (!question) throw new customError('Question not found', StatusCodes.NOT_FOUND);

      const tutor_reply = await tutor_replySchema.create({
        question_id: question._id,
        tutor_id: req.user?._id,
        reply: data.reply,
      });

      question.replies.push(tutor_reply._id as mongoose.ObjectId);

      await question.save();
      return {
        statusCode: StatusCodes.OK,
        message: 'Reply added successfully',
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

  async createQuizFunction(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      course_id: Joi.string().required(),
      section_id: Joi.string().required(),
      lesson_id: Joi.string().required(),
      quiz_title: Joi.string().required(),
      questions: Joi.array()
        .items(
          Joi.object({
            question_text: Joi.string().required(),
            options: Joi.array()
              .items(
                Joi.object({
                  option: Joi.string().required(),
                  is_correct: Joi.boolean().required(),
                })
              )
              .min(2)
              .required(),
          })
        )
        .min(1)
        .required(),
    }).validate(req.body, { stripUnknown: true });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    const { course_id, section_id, lesson_id, quiz_title, questions } = data;

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const course = await courseSchema.findOne({
        _id: course_id,
        tutor_id: req.user?._id,
      });
      if (!course) throw new customError('Unauthorized or Course not found', StatusCodes.UNAUTHORIZED);

      const section = await course_sectionsSchema.findOne({
        _id: section_id,
        course_id,
      });
      if (!section) throw new customError('Section not found', StatusCodes.NOT_FOUND);

      const lesson = await course_lessonsSchema.findOne({
        _id: lesson_id,
        section_id,
      });
      if (!lesson) throw new customError('Lesson not found', StatusCodes.NOT_FOUND);

      const createdQuestions = await Promise.all(
        questions.map(async (q: any) => {
          const question = new quiz_questionsSchema({
            quiz_id: null,
            question_text: q.question_text,
            options: q.options,
            tutor_id: req.user?._id,
            course_id: course_id,
            created_at: new Date(),
            updated_at: new Date(),
          });
          return await question.save();
        })
      );

      const quiz = new quizSchema({
        course_id,
        section_id,
        lesson_id,
        tutor_id: req.user?._id,
        title: quiz_title,
        questions: createdQuestions.map((question) => question._id),
        created_at: new Date(),
        updated_at: new Date(),
      });

      await Promise.all(
        createdQuestions.map(async (question) => {
          question.quiz_id = quiz._id;
          await question.save();
        })
      );

      await quiz.save();

      return {
        statusCode: StatusCodes.CREATED,
        message: 'Quiz created successfully',
        data: quiz,
      };
    } catch (error: any) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      const customErrors = new customError(errorMessage, StatusCodes.BAD_REQUEST);

      if (error.code === 11000) {
        return {
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'Duplicate entry found. Please ensure all fields are unique.',
          data: null,
        };
      }
      return {
        statusCode: customErrors.status,
        message: customErrors.message,
      };
    }
  }

  async getQuizById(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      quizId: Joi.string().required(),
    }).validate({ quizId: req.params.quizId }, { stripUnknown: true });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const quiz = await quizSchema.findById(data.quizId).populate('questions');
      if (!quiz) {
        throw new customError('Quiz not found', StatusCodes.NOT_FOUND);
      }
      return {
        statusCode: StatusCodes.OK,
        message: 'Quiz retrieved successfully',
        data: quiz,
      };
    } catch (error: any) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: errorMessage,
      };
    }
  }

  async getAllQuizzes(req: AuthRequest) {
    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const quizzes = await quizSchema.find({ tutor_id: req.user?._id }).populate('questions');

      if (!quizzes) throw new customError('No quizzes found', StatusCodes.NOT_FOUND);

      return {
        statusCode: StatusCodes.OK,
        message: 'Quizzes retrieved successfully',
        data: quizzes,
      };
    } catch (error: any) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: errorMessage,
      };
    }
  }

  async updateQuiz(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      quizId: Joi.string().required(),
      title: Joi.string().optional(),
      questions: Joi.array()
        .items(
          Joi.object({
            questionId: Joi.string().required(),
            question_text: Joi.string().optional(),
            options: Joi.array()
              .items(
                Joi.object({
                  option: Joi.string().required(),
                  is_correct: Joi.boolean().required(),
                })
              )
              .min(2)
              .required(),
          })
        )
        .min(1)
        .optional(),
    }).validate(req.body, { stripUnknown: true });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const quiz = await quizSchema.findOne({
        _id: data.quizId,
        tutor_id: req.user?._id,
      });

      if (!quiz) throw new customError('Quiz not found', StatusCodes.NOT_FOUND);

      quiz.title = data.title || quiz.title;

      if (data.questions) {
        for (const question of data.questions) {
          const quizQuestion = await quiz_questionsSchema.findOne({
            _id: question.questionId,
            quiz_id: quiz._id,
          });
          if (!quizQuestion) throw new customError('Question not found', StatusCodes.NOT_FOUND);

          quizQuestion.question_text = question.question_text || quizQuestion.question_text;
          quizQuestion.options = question.options || quizQuestion.options;
          await quizQuestion.save();
        }
      }
      await quiz.save();

      return {
        statusCode: StatusCodes.OK,
        message: 'Quiz updated successfully',
        data: quiz,
      };
    } catch (error: any) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: errorMessage,
      };
    }
  }

  async deleteQuiz(req: AuthRequest) {
    const { error, value: data } = Joi.object({
      quizId: Joi.string().required(),
    }).validate({ quizId: req.params.quizId }, { stripUnknown: true });

    if (error) throw new customError(error.message, StatusCodes.BAD_REQUEST);

    try {
      const user = await userSchema.findOne({ _id: req.user?._id });

      if (!user) throw new customError('User not found', StatusCodes.NOT_FOUND);

      const quiz = await quizSchema.findOne({ _id: data.quizId });

      if (!quiz) throw new customError('Quiz not found', StatusCodes.NOT_FOUND);

      await quiz_questionsSchema.deleteMany({ quiz_id: data.quizId });

      await quizSchema.deleteOne({ _id: data.quizId });

      return {
        statusCode: StatusCodes.NO_CONTENT,
        message: 'Quiz deleted successfully',
      };
    } catch (error: any) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: errorMessage,
      };
    }
  }
}

export default new E_Tutor();
