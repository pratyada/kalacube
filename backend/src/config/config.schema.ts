import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8000),
  CLIENT_URL: Joi.string().required(),

  // MongoDB
  MONGO_URI: Joi.string().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // AWS S3
  AWS_STORAGE_BUCKET: Joi.string().required(),
  // Optional: on Lambda these are omitted (AWS_ACCESS_KEY/AWS_SECRET_KEY are
  // reserved env names) and S3 uses the execution role via the default provider
  // chain. Locally they may hold real keys or placeholders.
  AWS_ACCESS_KEY: Joi.string().allow('').default(''),
  AWS_SECRET_KEY: Joi.string().allow('').default(''),
  AWS_REGION: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  // Optional: serverless/managed Redis (Upstash) auth + TLS. Absent locally.
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_TLS: Joi.boolean().truthy('true').falsy('false').default(false),

  // AWS Cognito (auth) — allow '' so the app still boots before values are wired
  COGNITO_REGION: Joi.string().allow('').default('ap-south-1'),
  COGNITO_USER_POOL_ID: Joi.string().allow('').default(''),
  COGNITO_APP_CLIENT_ID: Joi.string().allow('').default(''),

  // Email
  EMAIL_USERNAME: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),

  // Password
  SALT_ROUNDS: Joi.number().default(10),

  // OAuth - Google
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
  GOOGLE_CALLBACK_URL: Joi.string().allow('').default(''),

  // OAuth - Facebook
  FACEBOOK_APP_ID: Joi.string().allow('').default(''),
  FACEBOOK_APP_SECRET: Joi.string().allow('').default(''),
  FACEBOOK_CALLBACK_URL: Joi.string().allow('').default(''),
});
