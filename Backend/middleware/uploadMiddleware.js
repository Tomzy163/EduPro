import multer from "multer";
import path from "path";
import fs from "fs";

const ensureUploadPath = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
};

const sanitizeFilename = (filename = "") =>
  String(path.basename(filename || "file"))
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

const createUploadMiddleware = ({
  uploadPath,
  errorMessage,
  allowedExtensions = [],
  allowedMimeTypes = [],
  allowedMimePrefixes = [],
}) => {
  ensureUploadPath(uploadPath);

  const normalizedExtensions = allowedExtensions.map((extension) =>
    String(extension).toLowerCase()
  );
  const normalizedMimeTypes = allowedMimeTypes.map((mime) =>
    String(mime).toLowerCase()
  );
  const normalizedMimePrefixes = allowedMimePrefixes.map((prefix) =>
    String(prefix).toLowerCase()
  );

  const storage = multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, uploadPath);
    },
    filename(_req, file, cb) {
      const extension = path.extname(file.originalname || "") || "";
      cb(
        null,
        `${Date.now()}-${sanitizeFilename(path.basename(file.originalname, extension))}${extension.toLowerCase()}`
      );
    },
  });

  const fileFilter = (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const mimeType = String(file.mimetype || "").toLowerCase();
    const extensionAllowed = normalizedExtensions.includes(extension);
    const mimeTypeAllowed =
      normalizedMimeTypes.includes(mimeType) ||
      normalizedMimePrefixes.some((prefix) => mimeType.startsWith(prefix));

    if (extensionAllowed || mimeTypeAllowed) {
      cb(null, true);
      return;
    }

    cb(new Error(errorMessage));
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
};

const upload = createUploadMiddleware({
  uploadPath: "uploads/receipts",
  errorMessage: "Only images or PDF allowed",
  allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf", ".webp", ".heic", ".heif", ".jfif"],
  allowedMimeTypes: ["application/pdf"],
  allowedMimePrefixes: ["image/"],
});

export const schoolLogoUpload = createUploadMiddleware({
  uploadPath: "uploads/schools",
  errorMessage: "Only image files are allowed for the school logo",
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".jfif", ".svg"],
  allowedMimeTypes: ["image/svg+xml"],
  allowedMimePrefixes: ["image/"],
});

export default upload;
