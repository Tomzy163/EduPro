const stripDangerousPatterns = (value = "") =>
  String(value || "")
    .replace(/\u0000/g, "")
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();

const sanitizeObjectKey = (key = "") =>
  String(key || "")
    .replace(/\$/g, "_")
    .replace(/\./g, "_");

const isSanitizableObject = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      !(value instanceof Date) &&
      !(value instanceof Buffer)
  );

const sanitizePayload = (value) => {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      value[index] = sanitizePayload(value[index]);
    }

    return value;
  }

  if (isSanitizableObject(value)) {
    Object.keys(value).forEach((originalKey) => {
      const sanitizedKey = sanitizeObjectKey(originalKey);
      const sanitizedValue = sanitizePayload(value[originalKey]);

      if (sanitizedKey !== originalKey) {
        delete value[originalKey];
      }

      value[sanitizedKey] = sanitizedValue;
    });

    return value;
  }

  if (typeof value === "string") {
    return stripDangerousPatterns(value);
  }

  return value;
};

export const sanitizeRequestPayload = (req, _res, next) => {
  if (isSanitizableObject(req.body)) {
    sanitizePayload(req.body);
  }

  if (isSanitizableObject(req.query)) {
    sanitizePayload(req.query);
  }

  if (isSanitizableObject(req.params)) {
    sanitizePayload(req.params);
  }

  next();
};
