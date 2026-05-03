import dotenv from "dotenv";

dotenv.config();

const PLACEHOLDER_VALUES = new Set([
  "",
  "changeme",
  "supersecretkey",
  "replace-with-a-long-random-secret",
  "yourgmail@gmail.com",
  "your-app-password",
  "youremail@gmail.com",
  "yourpassword",
  "your_ethereal_username",
  "your_ethereal_password",
  "your-sendgrid-api-key",
  "your-twilio-sid",
  "your-twilio-token",
  "your-twilio-number",
  "sk_test_xxxxxxxxxxxxxxxxxxxxxxxx",
  "pk_test_xxxxxxxxxxxxxxxxxxxxxxxx",
  "your_api_key_here",
]);

const normalizeText = (value = "") => String(value || "").trim();
const normalizeLower = (value = "") => normalizeText(value).toLowerCase();
const normalizePhone = (value = "") => normalizeText(value).replace(/\s+/g, "");
const stripTrailingSlash = (value = "") => normalizeText(value).replace(/\/+$/, "");
const splitList = (value = "") =>
  String(value || "")
    .split(",")
    .map((entry) => stripTrailingSlash(entry))
    .filter(Boolean);
const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nodeEnv = normalizeLower(process.env.NODE_ENV || "development") || "development";
const port = toNumber(process.env.PORT, 5000);
const configuredClientUrls = splitList(process.env.CLIENT_URL);
const fallbackClientUrl = nodeEnv === "production" ? "" : "http://localhost:5173";
const clientUrl = configuredClientUrls[0] || fallbackClientUrl;
const corsOrigins = [...new Set([...configuredClientUrls, ...splitList(process.env.CORS_ORIGINS)])];
const serverUrl = stripTrailingSlash(
  process.env.SERVER_URL ||
    process.env.API_BASE_URL ||
    (nodeEnv === "production" ? "" : `http://localhost:${port}`)
);

export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === "production",
  isDevelopment: nodeEnv !== "production",
  port,
  clientUrl,
  corsOrigins,
  serverUrl,
  mongoUri: normalizeText(process.env.MONGO_URI),
  jwtSecret: normalizeText(process.env.JWT_SECRET),
  jwtIssuer: normalizeText(process.env.JWT_ISSUER || "edupro-api"),
  jwtAudience: normalizeText(process.env.JWT_AUDIENCE || "edupro-web"),
  jwtExpiresIn: normalizeText(process.env.JWT_EXPIRES_IN || "7d"),
  paystackBaseUrl: stripTrailingSlash(
    process.env.PAYSTACK_BASE_URL || "https://api.paystack.co"
  ),
  paystackSecretKey: normalizeText(process.env.PAYSTACK_SECRET_KEY),
  paystackCurrency: normalizeText(process.env.PAYSTACK_CURRENCY || "NGN") || "NGN",
  paystackCallbackUrl: stripTrailingSlash(process.env.PAYSTACK_CALLBACK_URL),
  openAiApiKey: normalizeText(process.env.OPENAI_API_KEY),
  openAiApiUrl: stripTrailingSlash(
    process.env.OPENAI_API_URL || "https://api.openai.com/v1/responses"
  ),
  openAiModel: normalizeText(process.env.OPENAI_MODEL || "gpt-4o-mini"),
  openAiTimeoutMs: toNumber(process.env.OPENAI_TIMEOUT_MS, 30000),
  platinumOverrideName: normalizeText(process.env.PLATINUM_OVERRIDE_NAME || "Divine"),
  platinumOverrideEmail: normalizeLower(
    process.env.PLATINUM_OVERRIDE_EMAIL || "excelempire@gmail.com"
  ),
  platinumOverridePhone: normalizePhone(
    process.env.PLATINUM_OVERRIDE_PHONE || "9163663404"
  ),
});

export const isPlaceholderValue = (value = "") =>
  PLACEHOLDER_VALUES.has(normalizeLower(value));

export const validateEnv = () => {
  const errors = [];
  const warnings = [];

  if (!env.mongoUri) {
    errors.push("MONGO_URI is required.");
  }

  if (!env.jwtSecret) {
    errors.push("JWT_SECRET is required.");
  } else if (isPlaceholderValue(env.jwtSecret)) {
    const message = "JWT_SECRET is using a placeholder value.";

    if (env.isProduction) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  if (env.isProduction && !env.clientUrl && env.corsOrigins.length === 0) {
    errors.push("CLIENT_URL or CORS_ORIGINS must be configured in production.");
  }

  if (env.paystackSecretKey && isPlaceholderValue(env.paystackSecretKey)) {
    warnings.push("PAYSTACK_SECRET_KEY is still using a placeholder value.");
  }

  if (env.openAiApiKey && isPlaceholderValue(env.openAiApiKey)) {
    warnings.push("OPENAI_API_KEY is still using a placeholder value.");
  }

  if (errors.length > 0) {
    const error = new Error(
      `Invalid environment configuration:\n- ${errors.join("\n- ")}`
    );
    error.code = "INVALID_ENV";
    throw error;
  }

  return { warnings };
};
