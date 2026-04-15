import axios from "axios";

const PLACEHOLDER_VALUES = new Set([
  "changeme",
  "your-twilio-sid",
  "your-twilio-token",
  "your-twilio-number",
]);

const isConfiguredValue = (value = "") => {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_VALUES.has(normalized.toLowerCase());
};

const getSmsConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (
    !isConfiguredValue(accountSid) ||
    !isConfiguredValue(authToken) ||
    !isConfiguredValue(from)
  ) {
    return null;
  }

  return {
    accountSid,
    authToken,
    from,
  };
};

export const sendSms = async ({ to, body }) => {
  const config = getSmsConfig();

  if (!config) {
    return {
      sent: false,
      reason: "SMS provider is not configured.",
    };
  }

  const payload = new URLSearchParams({
    From: config.from,
    To: to,
    Body: body,
  });

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    payload.toString(),
    {
      auth: {
        username: config.accountSid,
        password: config.authToken,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15000,
    }
  );

  return {
    sent: true,
  };
};
