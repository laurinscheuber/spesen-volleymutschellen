import nodemailer from 'nodemailer'

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}

const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

const transporter = hasSMTP ? nodemailer.createTransport(smtpConfig) : null

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  if (!transporter) {
    console.log('--- SMTP Not Configured. Email Output Mocked: ---')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Content: ${text}`)
    console.log('-------------------------------------------------')
    return { success: true, mocked: true }
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Volley Mutschellen Spesen" <spesen@volleymutschellen.ch>',
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    })
    console.log('Email sent successfully: %s', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}
