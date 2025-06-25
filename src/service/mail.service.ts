import { IEmail } from '../types';
import { CONFIG } from '../config';
import mailer from "../libraries/mailer";

class MailService {
  async resetPasswordEmail({ token, user, origin }: IEmail) {
    if (user === null || user === undefined) return;

    const options = {
      username: user.firstName,
      verificationLink: token,
      email: user.email,
    };

    const verify = `${origin}/reset-password?token=${options.verificationLink}&email=${options.email}`;

    const emailProp = `
        <div style="text-align: center;">
            <img src="" alt="Company Logo" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover; margin-top: 20px;">
        </div>
        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${options.username},</p>
        <p style="font-size: 16px; margin-bottom: 20px;">You have requested for a reset password, please click the link below to change your password.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">Please click <a href="${verify}" target="_blank" rel="noopener noreferrer">Reset password</a> to change your account password.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">If this was you, please ignore this email.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">Thank you!</p>
        <p style="font-size: 16px; margin-bottom: 0;">DOCUMENT MANAGEMENT</p>
    </div>
    `;

    return await mailer.sendMail({
      to: options.email,
      subject: 'Dare to change your password?',
      text: emailProp,
      html: emailProp,
    });
  }

  async resetPasswordOtpEmail({ code, user, origin }: IEmail) {
    if (user === null || user === undefined) return;

    const options = {
      username: user.firstName,
      email: user.email,
    };

    const emailProp = `
        <div style="text-align: center;">
            <img src="" alt="Company Logo" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover; margin-top: 20px;">
        </div>
        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${options.username},</p>
        <p style="font-size: 16px; margin-bottom: 20px;">You have requested for a reset password, please use the code below to change your password.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">${code}</p>
        <p style="font-size: 16px; margin-bottom: 20px;">If this was you, please ignore this email.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">Thank you!</p>
    </div>
    `;

    return await mailer.sendMail({
      to: options.email,
      subject: 'Reset Password Code',
      text: emailProp,
      html: emailProp,
    });
  }

  async RefererEmail({ token, user, origin = CONFIG.ORIGIN, receiverEmail, senderId }: IEmail) {
    if (user === null || user === undefined) return;

    const options = {
      tokenUser: token,
      userEmail: user.email,
      firstName: user.firstName,
      origin,
      sentTo: receiverEmail,
      senderId,
    };

    const verify = `${origin}?token=${options.tokenUser}&email=${options.userEmail}&sendId=${options.senderId}`;

    const emailProp = `
        <div style="text-align: center;">
            <img src="" alt="Company Logo" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover; margin-top: 20px;">
        </div>
        <p style="font-size: 16px; margin-bottom: 20px;">${options.firstName} sent you a referral link,</p>
        <p style="font-size: 16px; margin-bottom: 20px;">You have requested for a reset password, please click the link below to change your password.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">Please click <a href="${verify}" target="_blank" rel="noopener noreferrer">join</a> to join Deca online stores.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">If this was you, please ignore this email.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">Thank you!</p>
        <p style="font-size: 16px; margin-bottom: 0;">Deca online stores</p>
    </div>
    `;
    return await mailer.sendMail({
      to: options.sentTo,
      subject: `${options.firstName} sent you an email`,
      text: emailProp,
      html: emailProp,
    });
  }

  async transactionalTransferMail({ receiverEmail, body, title, createdAt }: IEmail) {
    const options = { receiverEmail, body, title, createdAt };

    const emailProp = ` 
<div style="text-align: center; padding: 40px; background-color: #f5f5f5;">
    <div style="display: inline-block; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: left;">
        <div style="text-align: center;">
            <img src="" 
                 alt="Company Logo" 
                 style="border-radius: 50%; width: 150px; height: 150px; object-fit: cover; margin-top: 10px;">
        </div>
        <p style="font-size: 18px; margin-bottom: 20px; text-align: center;">${options.title}</p>
        <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">${options.body}</p>
        <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">${options.createdAt}</p>
        <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">Thank you!</p>
        <p style="font-size: 16px; margin-bottom: 0; text-align: center;"></p>
    </div>
</div>
`;

    return await mailer.sendMail({
      to: options.receiverEmail,
      subject: options.title,
      text: emailProp,
      html: emailProp,
    });
  }

  async sendPaymentSuccessEmail({ receiverEmail, body, title, createdAt }: IEmail) {
    const options = { receiverEmail, body, title, createdAt };

    const emailProp = ` 
        
<div style="text-align: center; padding: 40px; background-color: #f5f5f5;">
    <div style="display: inline-block; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: left;">
        <div style="text-align: center;">
            <img src="" 
                 alt="Company Logo" 
                 style="border-radius: 50%; width: 150px; height: 150px; object-fit: cover; margin-top: 10px;">

        </div>
        <p style="font-size: 18px; margin-bottom: 20px; text-align: center;">${options.title}</p>
        <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">${options.body}</p>
        <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">${options.createdAt}</p>
        <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">Thank you!</p>
        <p style="font-size: 16px; margin-bottom: 0; text-align: center;">Kudikan</p>
    </div>
</div>
`;

    return await mailer.sendMail({
      to: options.receiverEmail,
      subject: options.title,
      text: emailProp,
      html: emailProp,
    });
  }

  async sendErrorNotification({ errorMessage }: { errorMessage: string }) {
    const emailProp = ` 
    <div style="text-align: center; padding: 40px; background-color: #f5f5f5;">
        <div style="display: inline-block; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-width: 500px; text-align: left;">
            <div style="text-align: center;">
                <img src="" alt="Company Logo" style="border-radius: 50%; width: 150px; height: 150px; object-fit: cover; margin-top: 10px;">
            </div>
            <p style="font-size: 18px; margin-bottom: 20px; text-align: center;">Error Notification</p>
            <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">An error occurred in the application:</p>
            <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">${errorMessage}</p>
            <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">Please check the system for further details.</p>
            <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">Thank you!</p>
            <p style="font-size: 16px; margin-bottom: 0; text-align: center;">Kudikan</p>
        </div>
    </div>
    `;

    return await mailer.sendMail({
      to: 'marvelloussolomon49@gmail.com', // or other recipient as needed
      subject: 'Application Error Notification',
      text: emailProp,
      html: emailProp,
    });
  }
}

const mailService = new MailService();

export default mailService;
