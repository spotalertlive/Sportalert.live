import fs from 'fs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendEmail = async (to, subject, templatePath, replacements = {}) => {
  let html = fs.readFileSync(templatePath, 'utf-8');

  // Replace placeholders like {{verify_url}} and {{first_name}}
  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: `"SpotAlert" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
