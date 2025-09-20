import * as handlebars from 'handlebars'
import nodemailer from 'nodemailer'
import fs from 'node:fs'
import path from 'path'

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT as string, 10)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SENDER_EMAIL = process.env.SENDER_EMAIL
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true
const TLS = process.env.ALLOW_UNAUTHORIZED_CERTS ? { rejectUnauthorized: false } : undefined

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE ?? true,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
    },
    tls: TLS
})

const sendPasswordResetEmail = async (email: string, resetLink: string) => {
    const passwordResetTemplateSource = fs.readFileSync(path.join(__dirname, '../', 'emails', 'workspace_user_reset_password.hbs'), 'utf8')
    const compiledPasswordResetTemplateSource = handlebars.compile(passwordResetTemplateSource)

    const htmlToSend = compiledPasswordResetTemplateSource({ resetLink })
    await transporter.sendMail({
        from: SENDER_EMAIL || '"Nguyen Duc Kien" <nguyenduckien2508@gmail.com>', // sender address
        to: email,
        subject: 'Reset your password', // Subject line
        text: `You requested a link to reset your password. Click here to reset the password: ${resetLink}`, // plain text body
        html: htmlToSend // html body
    })
}

export { sendPasswordResetEmail }
