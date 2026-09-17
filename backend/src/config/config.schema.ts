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

  // Email — transactional mail is sent via AWS SES (SESv2 SDK) using the
  // Lambda execution role, so no SMTP username/password is needed. The legacy
  // Gmail vars are kept optional for backwards compatibility (unused).
  EMAIL_FROM: Joi.string().default('KalaCUBE <connect@kalacube.com>'),
  EMAIL_USERNAME: Joi.string().allow('').default(''),
  EMAIL_PASSWORD: Joi.string().allow('').default(''),

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

  // ---- Commerce / fulfilment (orders module) --------------------------------
  // All optional. When an adapter's keys are ABSENT it runs in STUB mode (no
  // external calls) — deploying with none of these set is 100% safe.

  // Pricing knobs (all-in checkout price = art + shipping + gst). `.empty('')`
  // so a blank SSM value falls back to the default instead of failing boot.
  COMMERCE_SHIPPING_FLAT: Joi.number().empty('').default(150),
  COMMERCE_GST_RATE: Joi.number().empty('').default(0.12),
  COMMERCE_COMMISSION_RATE: Joi.number().empty('').default(0.15),

  // Payments (Razorpay) — routed through the Netavon shared backend so the
  // Razorpay SECRET is NEVER held here. Set the orders endpoint to go live.
  NETAVON_ORDERS_URL: Joi.string().allow('').default(''),
  NETAVON_PAYOUT_URL: Joi.string().allow('').default(''),

  // POD (Qikink).
  QIKINK_CLIENT_ID: Joi.string().allow('').default(''),
  QIKINK_CLIENT_SECRET: Joi.string().allow('').default(''),
  QIKINK_BASE_URL: Joi.string().allow('').default(''),

  // Logistics (Shiprocket).
  SHIPROCKET_EMAIL: Joi.string().allow('').default(''),
  SHIPROCKET_PASSWORD: Joi.string().allow('').default(''),
  SHIPROCKET_BASE_URL: Joi.string().allow('').default(''),
});
