import nodemailer from "nodemailer";

const PLACEHOLDER_VALUES = new Set([
  "yourgmail@gmail.com",
  "your-app-password",
  "youremail@gmail.com",
  "yourpassword",
  "your_ethereal_username",
  "your_ethereal_password",
  "changeme",
  "example@example.com",
]);

const isConfiguredValue = (value = "") => {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_VALUES.has(normalized.toLowerCase());
};

const getMailerCredentials = () => {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!isConfiguredValue(smtpUser) || !isConfiguredValue(smtpPass)) {
    return null;
  }

  return {
    user: smtpUser,
    pass: smtpPass,
  };
};

const getTransportConfig = () => {
  const credentials = getMailerCredentials();

  if (!credentials) {
    return null;
  }

  const host =
    process.env.SMTP_HOST ||
    (credentials.user.toLowerCase().includes("@gmail.com")
      ? "smtp.gmail.com"
      : undefined);

  return {
    host: host || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure:
      process.env.SMTP_SECURE === "true" ||
      Number(process.env.SMTP_PORT || 587) === 465,
    auth: credentials,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };
};

export const getMailerFromAddress = () =>
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  process.env.EMAIL_USER ||
  "no-reply@edupro.local";

export const isMailerConfigured = () => Boolean(getTransportConfig());

export const sendPasswordResetEmail = async ({ to, name, resetLink }) => {
  const transportConfig = getTransportConfig();

  if (!transportConfig) {
    return {
      sent: false,
      reason: "SMTP credentials are not configured.",
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  await transporter.sendMail({
    from: getMailerFromAddress(),
    to,
    subject: "EduPro password reset",
    text: `Hello ${name},\n\nUse the link below to reset your password:\n${resetLink}\n\nThis link expires in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">EduPro Password Reset</h2>
        <p>Hello ${name},</p>
        <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
        <p style="margin: 24px 0;">
          <a
            href="${resetLink}"
            style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: #0f766e; color: #ffffff; text-decoration: none; font-weight: 700;"
          >
            Reset Password
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
      </div>
    `,
  });

  return {
    sent: true,
  };
};
