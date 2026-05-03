import { env } from "../config/env.js";

const buildAllowedOrigins = () => {
  const configuredOrigins = env.corsOrigins.length > 0 ? env.corsOrigins : [env.clientUrl];

  const expandedOrigins = new Set(configuredOrigins);

  configuredOrigins.forEach((origin) => {
    try {
      const parsed = new URL(origin);

      if (parsed.hostname === "localhost") {
        expandedOrigins.add(
          `${parsed.protocol}//127.0.0.1${parsed.port ? `:${parsed.port}` : ""}`
        );
      }
    } catch {
      // Ignore malformed origins from local configuration.
    }
  });

  return [...expandedOrigins];
};

export const allowedOrigins = buildAllowedOrigins();

export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
  );
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  if (
    req.secure ||
    String(req.headers["x-forwarded-proto"] || "").toLowerCase() === "https"
  ) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains"
    );
  }

  next();
};
