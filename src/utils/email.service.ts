import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, unknown>;
}

// Zoho Mail SMTP configuration
const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Debug logging (remove in production)
  console.log("SMTP Config:", {
    host,
    port,
    user,
    passLength: pass?.length,
    passFirstChar: pass?.[0],
    passLastChar: pass?.[pass.length - 1],
  });

  // Validate credentials exist
  if (!user || !pass) {
    throw new Error(
      `Missing SMTP credentials. SMTP_USER: ${
        user ? "set" : "missing"
      }, SMTP_PASS: ${pass ? "set" : "missing"}`
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: true, // Zoho uses SSL on port 465
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = createTransporter();

  // Render email template
  const templatePath = path.join(
    process.cwd(),
    "templates",
    `${options.template}.ejs`
  );
  const html = await ejs.renderFile(templatePath, options.data || {});

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWaitlistConfirmation = async (
  email: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: "Welcome to Kollabs Waitlist! 🎉",
    template: "waitlist-confirmation",
    data: {
      email,
    },
  });
};
