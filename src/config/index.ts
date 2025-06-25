import dotenv from 'dotenv';
import ms from 'ms';
dotenv.config();

const DEPLOYMENT_ENV: string = process.env.NODE_ENV as string;

if (!DEPLOYMENT_ENV || !['development', 'production'].includes(DEPLOYMENT_ENV)) {
  throw new Error('Invalid deployment environment');
}

const GLOBAL_CONFIG = {
  GONZO_API: {
    TOKEN: process.env.GONZO_CONCEPTS_SECRET?.toString(),
  },

  FRONTEND_URL: process.env.FRONTEND_URL,

  ORIGIN: process.env.ORIGIN?.toString(),
  FLUTTERWAVE: {
    PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
    SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
    ENCRYPTION_KEY: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
  },

  VTU: {
    USERNAME: process.env.VTU_USERNAME,
    PASSWORD: process.env.VTU_PASSWORD,
    URL: process.env.VTU_BASE_URL,
  },

  BASE_URL: (process.env.BASE_URL as string) || 'https://api.flutterwave.com',

  BINGPAY_API_KEY: process.env.BINGPAY_API_KEY,

  FILE_CACHE_EXPIRY_DURATION: ms('1h'),

  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    SUPERADMIN: 'superAdmin',
    TUTOR: 'Tutor',
  },

  CLOUDINARY: {
    CLOUDNAME: process.env.CLOUDNAME,
    API_KEY: process.env.API_KEY,
    API_SECRET: process.env.API_SECRET,
  },

  AWS: {
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME as string,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
    AWS_REGION: process.env.AWS_REGION as string,

    CLOUD_FRONT: process.env.CLOUD_FRONT_DOMAIN as string,
    AWS_CLOUDFRONT_KEY_PAIR_ID: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID as string,
    AWS_CLOUDFRONT_PRIVATE_KEY: process.env.AWS_CLOUDFRONT_PRIVATE_KEY as string,
    AWS_S3_SIGNED_URL_EXPIRY_DURATION: ms('1d'),
    AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME: process.env.AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME,
  },

  PAYSTACK: {
    PAYSTACK_BASE_URL: process.env.PAYSTACK_BASE_URL as string,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY as string,
  },

  FILE_FORMAT: ['png', 'jpg', 'jpeg', 'pdf', 'zip', '.do', 'webp'],
  TIME_FORMAT: 'MMMM Do YYYY, h:mm:ss a',
};

const CONFIG_BUILDER = {
  development: {
    ...GLOBAL_CONFIG,

    PORT: process.env.PORT || 5000,

    JWT_CREDENTIAL: {
      secret: 'secret',
    },

    EMAIL_CREDENTIAL: {
      SMTP_HOST: process.env.MAIL_HOST?.toString(),
      SMTP_PORT: process.env.MAIL_PORT?.toString(),
      SMTP_USER: process.env.MAIL_USERNAME?.toString(),
      SMTP_PASSWORD: process.env.MAIL_PASSWORD?.toString(),
      SECURE: process.env.SECURE,
    },

    MONGO_URL: 'mongodb://localhost:27017',
    REDIS_URL: 'redis://localhost:6379',
  },
  production: {
    ...GLOBAL_CONFIG,

    PORT: process.env.PORT || 5000,

    MONGO_URL: process.env.MONGO_URL?.toString(),
    REDIS_URL: process.env.REDIS_URL?.toString(),

    JWT_CREDENTIAL: {
      secret: process.env.JWT_SECRET,
    },

    EMAIL_CREDENTIAL: {
      SMTP_HOST: process.env.MAIL_HOST?.toString(),
      SMTP_PORT: process.env.MAIL_PORT?.toString(),
      SMTP_USER: process.env.MAIL_USERNAME?.toString(),
      SMTP_PASSWORD: process.env.MAIL_PASSWORD?.toString(),
      SECURE: process.env.SECURE,
    },
  },
};

const CONFIG = CONFIG_BUILDER[DEPLOYMENT_ENV as keyof typeof CONFIG_BUILDER];

export { CONFIG, DEPLOYMENT_ENV };
