import nodemailer, { type Transporter } from 'nodemailer'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

class MailService {
  private transporter: Transporter | null = null
  private readonly from = env.get('MAIL_FROM') ?? 'DigitalNotes <hello@digitalnotes.app>'

  constructor() {
    const host = env.get('MAIL_HOST')
    if (!host) return

    const port = Number(env.get('MAIL_PORT') ?? 587)
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth:
        env.get('MAIL_USERNAME') && env.get('MAIL_PASSWORD')
          ? {
              user: env.get('MAIL_USERNAME'),
              pass: env.get('MAIL_PASSWORD'),
            }
          : undefined,
    })
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    if (!this.transporter) {
      logger.info({ to, resetUrl }, 'Password reset link generated (SMTP is not configured)')
      return
    }

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Reset your DigitalNotes password',
      text: [
        'Hello,',
        '',
        'You asked to reset the password for your DigitalNotes account.',
        `Open this link to choose a new password: ${resetUrl}`,
        '',
        'This link expires in one hour. If you did not request it, you can ignore this email.',
        '',
        'DigitalNotes',
      ].join('\n'),
      html: `
        <div style="background:#faf8f3;padding:32px;font-family:Arial,sans-serif;color:#1b1c18">
          <div style="max-width:480px;margin:0 auto;background:#fffdf8;border:1px solid #e6e2d8;border-radius:10px;padding:28px">
            <p style="font-size:12px;letter-spacing:2px;color:#315e42;font-weight:700">DIGITALNOTES</p>
            <h1 style="font-family:Georgia,serif;font-size:28px;letter-spacing:-1px;margin:12px 0 16px">Reset your password</h1>
            <p style="line-height:1.6;color:#5d5e55">You asked to reset the password for your DigitalNotes account. Choose a new password using the button below.</p>
            <p style="margin:24px 0">
              <a href="${resetUrl}" style="display:inline-block;background:#315e42;color:#fffdf8;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700">Choose a new password</a>
            </p>
            <p style="font-size:12px;line-height:1.6;color:#938d82">This link expires in one hour. If you did not request it, you can ignore this email.</p>
          </div>
        </div>
      `,
    })
  }
}

export default new MailService()
