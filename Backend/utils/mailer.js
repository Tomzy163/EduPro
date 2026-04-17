import nodemailer from "nodemailer";
import axios from "axios";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

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

const canWritePreviewEmail = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.ALLOW_LOCAL_EMAIL_PREVIEW !== "false";

const allowPreviewFallbackOnProviderFailure = () =>
  process.env.EMAIL_FALLBACK_TO_PREVIEW === "true";

const getServerBaseUrl = () =>
  (process.env.SERVER_URL ||
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");

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

const getSendGridConfig = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM;

  if (!isConfiguredValue(apiKey) || !isConfiguredValue(fromEmail)) {
    return null;
  }

  return {
    apiKey: String(apiKey).trim(),
    fromEmail: String(fromEmail).trim(),
    fromName: String(process.env.SENDGRID_FROM_NAME || "EduPro").trim(),
  };
};

const getTransportConfig = () => {
  const credentials = getMailerCredentials();
  const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE;

  if (!credentials) {
    return null;
  }

  if (service) {
    return {
      service,
      auth: credentials,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    };
  }

  const host =
    process.env.SMTP_HOST ||
    process.env.EMAIL_HOST ||
    (credentials.user.toLowerCase().includes("@gmail.com")
      ? "smtp.gmail.com"
      : undefined);

  const port = Number(
    process.env.SMTP_PORT || process.env.EMAIL_PORT || 587
  );
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.EMAIL_SECURE === "true" ||
    port === 465;

  return {
    host: host || "smtp.gmail.com",
    port,
    secure,
    auth: credentials,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };
};

const writePreviewEmail = async ({ to, subject, text, html }) => {
  const previewDir = path.join(process.cwd(), "uploads", "email-previews");
  await fs.mkdir(previewDir, { recursive: true });

  const previewId = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  const htmlFilename = `${previewId}.html`;
  const manifestFilename = `${previewId}.json`;
  const htmlPath = path.join(previewDir, htmlFilename);
  const manifestPath = path.join(previewDir, manifestFilename);
  const fallbackHtml = `<pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${text || ""}</pre>`;

  await fs.writeFile(htmlPath, html || fallbackHtml, "utf8");
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        to,
        subject,
        text,
        htmlFile: htmlFilename,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );

  return {
    sent: true,
    mode: "preview",
    previewUrl: `${getServerBaseUrl()}/uploads/email-previews/${htmlFilename}`,
    previewPath: htmlPath,
    manifestPath,
  };
};

export const getMailerFromAddress = () =>
  process.env.SENDGRID_FROM_EMAIL ||
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  process.env.EMAIL_USER ||
  "no-reply@edupro.local";

export const isMailerConfigured = () =>
  Boolean(getSendGridConfig() || getTransportConfig());

const sendWithSendGrid = async ({ to, subject, text, html }) => {
  const config = getSendGridConfig();

  if (!config) {
    return null;
  }

  await axios.post(
    "https://api.sendgrid.com/v3/mail/send",
    {
      personalizations: [
        {
          to: [{ email: to }],
          subject,
        },
      ],
      from: {
        email: config.fromEmail,
        name: config.fromName,
      },
      content: [
        {
          type: "text/plain",
          value: text || "",
        },
        {
          type: "text/html",
          value:
            html ||
            `<pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${text || ""}</pre>`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  return {
    sent: true,
    mode: "sendgrid",
  };
};

const sendWithSmtp = async ({ to, subject, text, html }) => {
  const transportConfig = getTransportConfig();

  if (!transportConfig) {
    return null;
  }

  const transporter = nodemailer.createTransport(transportConfig);

  await transporter.sendMail({
    from: getMailerFromAddress(),
    to,
    subject,
    text,
    html,
  });

  return {
    sent: true,
    mode: "smtp",
  };
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const sendGridConfig = getSendGridConfig();
  const smtpConfig = getTransportConfig();
  const hasRealProvider = Boolean(sendGridConfig || smtpConfig);

  if (!hasRealProvider) {
    if (canWritePreviewEmail()) {
      return writePreviewEmail({ to, subject, text, html });
    }

    return {
      sent: false,
      reason: "SMTP credentials are not configured.",
    };
  }

  try {
    if (sendGridConfig) {
      return await sendWithSendGrid({ to, subject, text, html });
    }

    return await sendWithSmtp({ to, subject, text, html });
  } catch (error) {
    if (canWritePreviewEmail() && allowPreviewFallbackOnProviderFailure()) {
      const preview = await writePreviewEmail({ to, subject, text, html });

      return {
        ...preview,
        fallbackReason: error.message,
      };
    }

    throw error;
  }
};

export const sendPasswordResetEmail = async ({ to, name, resetLink }) => {
  return sendEmail({
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
};
