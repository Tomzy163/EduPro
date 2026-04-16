import axios from "axios";
import crypto from "crypto";

const PAYSTACK_BASE_URL =
  process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";

const getPaystackSecretKey = () => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  return secretKey;
};

const getPaystackHeaders = () => ({
  Authorization: `Bearer ${getPaystackSecretKey()}`,
  "Content-Type": "application/json",
});

const normalizePaystackError = (error, fallbackMessage) => {
  const paystackMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  throw new Error(paystackMessage || fallbackMessage);
};

export const generatePaystackReference = (prefix = "subscription") =>
  `EDUPRO-${prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

export const initializePaystackTransaction = async (payload) => {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: getPaystackHeaders(),
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    normalizePaystackError(
      error,
      "Unable to initialize the Paystack transaction."
    );
  }
};

export const verifyPaystackTransaction = async (reference) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: getPaystackHeaders(),
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    normalizePaystackError(
      error,
      "Unable to verify the Paystack transaction."
    );
  }
};

export const verifyPaystackSignature = ({ rawBody, signature }) => {
  if (!rawBody || !signature) {
    return false;
  }

  const payloadBuffer = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(String(rawBody), "utf8");
  const digest = crypto
    .createHmac("sha512", getPaystackSecretKey())
    .update(payloadBuffer)
    .digest("hex");

  const expected = Buffer.from(digest, "hex");
  const received = Buffer.from(signature, "hex");

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
};
