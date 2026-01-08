// import nodemailer from "nodemailer";
// import ejs from "ejs";
// import path from "path";
// import dotenv from "dotenv";

// // Ensure environment variables are loaded
// dotenv.config();

// interface EmailOptions {
//   to: string;
//   subject: string;
//   template: string;
//   data?: Record<string, unknown>;
// }

// // Zoho Mail SMTP configuration
// const createTransporter = () => {
//   const host = process.env.SMTP_HOST || "smtp.zoho.com";
//   // Use port 587 (TLS/STARTTLS) - works better on cloud platforms like Render
//   const port = Number(process.env.SMTP_PORT) || 587;
//   const user = process.env.SMTP_USER;
//   const pass = process.env.SMTP_PASS;

//   // Debug logging
//   console.log("SMTP Config:", {
//     host,
//     port,
//     user,
//     passLength: pass?.length,
//   });

//   // Validate credentials exist
//   if (!user || !pass) {
//     throw new Error(
//       `Missing SMTP credentials. SMTP_USER: ${
//         user ? "set" : "missing"
//       }, SMTP_PASS: ${pass ? "set" : "missing"}`
//     );
//   }

//   return nodemailer.createTransport({
//     host,
//     port,
//     secure: port === 465, // true for 465, false for 587
//     auth: {
//       user,
//       pass,
//     },
//     // Add timeouts to prevent hanging
//     connectionTimeout: 10000, // 10 seconds
//     greetingTimeout: 10000,
//     socketTimeout: 10000,
//   });
// };

// const sendEmail = async (options: EmailOptions): Promise<void> => {
//   const transporter = createTransporter();

//   // Render email template
//   const templatePath = path.join(
//     process.cwd(),
//     "templates",
//     `${options.template}.ejs`
//   );
//   const html = await ejs.renderFile(templatePath, options.data || {});

//   const mailOptions = {
//     from: process.env.SMTP_FROM || process.env.SMTP_USER,
//     to: options.to,
//     subject: options.subject,
//     html,
//   };

//   await transporter.sendMail(mailOptions);
// };

// export const sendWaitlistConfirmation = async (
//   email: string
// ): Promise<void> => {
//   await sendEmail({
//     to: email,
//     subject: "Welcome to Kollabs Waitlist! 🎉",
//     template: "waitlist-confirmation",
//     data: {
//       email,
//     },
//   });
// };

import { Resend } from "resend";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, unknown>;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Validate API key exists
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  // Render email template
  const templatePath = path.join(
    process.cwd(),
    "templates",
    `${options.template}.ejs`
  );
  const html = await ejs.renderFile(templatePath, options.data || {});

  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  console.log("Sending email via Resend:", {
    from: fromEmail,
    to: options.to,
    subject: options.subject,
  });

  const response = await resend.emails.send({
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    html,
  });

  console.log("Resend response:", JSON.stringify(response, null, 2));

  // Check for errors in response
  if (response.error) {
    throw new Error(`Resend error: ${response.error.message}`);
  }
};

export const sendWaitlistConfirmation = async (
  email: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: "Welcome to Koneticus Waitlist! 🎉",
    template: "waitlist-confirmation",
    data: {
      email,
    },
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: "Reset Your Password - Koneticus",
    template: "password-reset",
    data: {
      resetUrl,
    },
  });
};
