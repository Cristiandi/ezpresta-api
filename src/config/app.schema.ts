import * as Joi from 'joi';

export default Joi.object({
  /* APP */
  PORT: Joi.required(),
  SELF_API_URL: Joi.string().required(),
  SELF_WEB_URL: Joi.required(),

  /* DATABASE */
  DATABASE_CLIENT: Joi.required(),
  DATABASE_HOST: Joi.required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.required(),
  DATABASE_PASSWORD: Joi.required(),
  DATABASE_NAME: Joi.required(),
  DATABASE_LOG: Joi.required(),

  // BASIC ACL
  BASIC_ACL_COMPANY_UID: Joi.required(),
  BASIC_ACL_ACCESS_KEY: Joi.required(),

  // RABBITMQ
  RABBITMQ_URL: Joi.required(),
  RABBITMQ_EXCHANGE: Joi.required(),
  RABBITMQ_WAIT_FOR_CONNECTION: Joi.required(),

  // TWILIO
  TWILIO_ACCOUNT_SID: Joi.required(),
  TWILIO_AUTH_TOKEN: Joi.required(),
  TWILIO_MESSAGING_SERVICE_SID: Joi.required(),

  // EPAYCO
  EPAYCO_P_CUST_ID: Joi.required(),
  EPAYCO_P_KEY: Joi.required(),
  EPAYCO_PUBLIC_KEY: Joi.required(),
  EPAYCO_PRIVATE_KEY: Joi.required(),
  EPAYCO_TESTING: Joi.required(),

  // MAILGUN
  MAILGUN_DOMAIN: Joi.required(),
  MAILGUN_FROM: Joi.required(),
  MAILGUN_PRIVATE_KEY: Joi.required(),
  MAILGUN_PUBLIC_KEY: Joi.required(),

  // MONGODB
  MONGODB_URI: Joi.required(),

  // REDIS
  REDIS_CLIENT_NAME: Joi.required(),
  REDIS_HOST: Joi.required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.required(),

  // MESSAGEBIRD
  MESSAGEBIRD_API_KEY: Joi.required(),
});
