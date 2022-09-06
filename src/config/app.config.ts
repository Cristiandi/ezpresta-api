import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    environment: process.env.NODE_ENV || 'development',
    app: {
      port: parseInt(process.env.PORT, 10) || 8080,
      selfApiUrl: process.env.SELF_API_URL,
      selftWebUrl: process.env.SELF_WEB_URL,
      apiKey: process.env.API_KEY,
    },
    database: {
      client: process.env.DATABASE_CLIENT,
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      log: process.env.DATABASE_LOG || 'yes',
    },
    acl: {
      companyUid: process.env.BASIC_ACL_COMPANY_UID,
      accessKey: process.env.BASIC_ACL_ACCESS_KEY,
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL,
      exchange: process.env.RABBITMQ_EXCHANGE,
      waitForConnection: process.env.RABBITMQ_WAIT_FOR_CONNECTION === '1',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    },
    epayco: {
      pCustId: process.env.EPAYCO_P_CUST_ID,
      pKey: process.env.EPAYCO_P_KEY,
      publicKey: process.env.EPAYCO_PUBLIC_KEY,
      privateKey: process.env.EPAYCO_PRIVATE_KEY,
      testing: process.env.EPAYCO_TESTING === '1',
    },
    mailgun: {
      domain: process.env.MAILGUN_DOMAIN,
      from: process.env.MAILGUN_FROM,
      privateKey: process.env.MAILGUN_PRIVATE_KEY,
      publicKey: process.env.MAILGUN_PUBLIC_KEY,
    },
    mongoDB: {
      uri: process.env.MONGODB_URI,
    },
    redis: {
      clientName: process.env.REDIS_CLIENT_NAME,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    },
    messagebird: {
      apiKey: process.env.MESSAGEBIRD_API_KEY,
    },
  };
});
