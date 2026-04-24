import mongoose from "mongoose";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (value = "") =>
  String(value || "").trim().toLowerCase();

export const isValidEmail = (value = "") =>
  EMAIL_PATTERN.test(normalizeEmail(value));

export const normalizePhoneNumber = (value = "") => String(value || "").trim();

export const normalizeDisplayName = (value = "") =>
  String(value || "").trim().replace(/\s+/g, " ");

export const normalizePlanValue = (value = "") =>
  String(value || "").trim().toLowerCase();

export const hasMinimumPasswordLength = (value = "", minLength = 6) =>
  String(value || "").length >= minLength;

export const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(String(value || "").trim());
