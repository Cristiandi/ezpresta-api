// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mailgun = require('mailgun.js');

import * as fs from 'fs';
import * as path from 'path';
import * as mjml2html from 'mjml';
import * as formData from 'form-data';
import hbs from 'handlebars';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import appConfig from '../../config/app.config';

import { GetEmailTemplateStringInput } from './dto/get-email-template-string-input.dto';
import { GenerateEmailTemplateHTMLInput } from './dto/generate-email-tamplate-html-input.dto';
import { SendEmailInput } from './dto/send-email-input.dto';

@Injectable()
export class MailingService {
  private mg;

  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {
    const {
      mailgun: { privateKey, publicKey },
    } = this.appConfiguration;

    const mailgun = new Mailgun(formData);

    this.mg = mailgun.client({
      username: 'api',
      key: privateKey,
      public_key: publicKey,
    });
  }

  private getEmailTemplateString(input: GetEmailTemplateStringInput): string {
    const { templateName } = input;

    // C:\Users\cristiandi\coding\companies\easy-presta\ezpresta-api\templates\ADMINISTRATOR_LOAN_REQUEST_CREATED.mjml
    const templatePath = path.resolve(
      __dirname,
      `./templates/${templateName}.mjml`,
    );

    // check if the template exists at fs
    if (!fs.existsSync(templatePath)) {
      throw new Error(`template ${templateName} does not exist`);
    }

    // read the template
    const templateString = fs.readFileSync(templatePath, 'utf8');

    return templateString;
  }

  private generateHTML(input: GenerateEmailTemplateHTMLInput): string {
    const { templateName } = input;

    // get the email template string
    const templateString = this.getEmailTemplateString({
      templateName,
    });

    // compile the template
    const template = hbs.compile(templateString);

    const { parameters } = input;

    // get the result
    const result = template(parameters);

    // get the html
    const { html } = mjml2html(result);

    return html;
  }

  public async sendEmail(input: SendEmailInput): Promise<void> {
    const { to, subject, templateName, parameters, text, attachment } = input;

    const {
      mailgun: { from, domain },
    } = this.appConfiguration;

    const html = this.generateHTML({
      templateName,
      parameters,
    });

    const subjectToUse =
      this.appConfiguration.environment === 'production'
        ? subject
        : `${this.appConfiguration.environment} | ${subject}`;

    const msg = await this.mg.messages.create(domain, {
      from,
      to,
      subject: subjectToUse,
      text,
      html,
      attachment,
    });

    Logger.log(`${JSON.stringify(msg)}`);
  }
}
