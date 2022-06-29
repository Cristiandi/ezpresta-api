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
});
