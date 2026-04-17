import crypto from "crypto";

const SPACE_PATTERN = /\s+/g;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/gi;
const NON_CODE_PATTERN = /[^A-Z0-9-]+/g;

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeSchoolName = (value = "") =>
  String(value || "").trim().replace(SPACE_PATTERN, " ").toLowerCase();

export const normalizeSchoolCode = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(SPACE_PATTERN, "-")
    .replace(NON_CODE_PATTERN, "");

const buildSchoolCodePrefix = (value = "") => {
  const normalized = normalizeSchoolName(value).replace(NON_ALPHANUMERIC_PATTERN, " ");
  const words = normalized.split(" ").filter(Boolean);

  if (words.length === 0) {
    return "SCH";
  }

  if (words.length === 1) {
    return words[0].slice(0, 6).toUpperCase() || "SCH";
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export const generateSchoolCodeCandidate = (value = "") => {
  const prefix = buildSchoolCodePrefix(value);
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
};

export const normalizeSchoolAliases = (aliases = [], currentName = "") => {
  const normalizedCurrent = normalizeSchoolName(currentName);
  const uniqueAliases = new Map();

  for (const alias of aliases) {
    const trimmed = String(alias || "").trim().replace(SPACE_PATTERN, " ");
    const normalizedAlias = normalizeSchoolName(trimmed);

    if (!trimmed || !normalizedAlias || normalizedAlias === normalizedCurrent) {
      continue;
    }

    if (!uniqueAliases.has(normalizedAlias)) {
      uniqueAliases.set(normalizedAlias, trimmed);
    }
  }

  return [...uniqueAliases.values()];
};
