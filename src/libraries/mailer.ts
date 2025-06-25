import { CONFIG } from '../config';
import nodemailer from 'nodemailer';

class Mailer {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (!CONFIG.EMAIL_CREDENTIAL.SMTP_HOST) throw new Error('SMTP_HOST config not found');
    if (!CONFIG.EMAIL_CREDENTIAL.SMTP_PORT) throw new Error('SMTP_PORT config not found');
    if (!CONFIG.EMAIL_CREDENTIAL.SMTP_USER) throw new Error('SMTP_USER config not found');
    if (!CONFIG.EMAIL_CREDENTIAL.SMTP_PASSWORD) throw new Error('SMTP_PASSWORD config not found');

    this.transporter = nodemailer.createTransport({
      host: CONFIG.EMAIL_CREDENTIAL.SMTP_HOST,
      port: Number(CONFIG.EMAIL_CREDENTIAL.SMTP_PORT),
      secure: Boolean(CONFIG.EMAIL_CREDENTIAL.SECURE),
      auth: {
        user: CONFIG.EMAIL_CREDENTIAL.SMTP_USER,
        pass: CONFIG.EMAIL_CREDENTIAL.SMTP_PASSWORD,
      },
    });
  }

  async verifyConnection() {
    return this.transporter.verify().then(() => {
      console.log(
        `:::> Connected to mail server - ${CONFIG.EMAIL_CREDENTIAL.SMTP_HOST}:${CONFIG.EMAIL_CREDENTIAL.SMTP_PORT}`
      );
    });
  }

  async sendMail(mailOptions: nodemailer.SendMailOptions) {
    // Set default
    mailOptions = {
      ...mailOptions,
      from: mailOptions.from || process.env.DEFAULT_EMAIL_FROM,
    };
    return this.transporter.sendMail(mailOptions).then((info) => {
      console.log(`:::> Mail sent: ${info.messageId}`);

      return info;
    });
  }
}


export default new Mailer();;
