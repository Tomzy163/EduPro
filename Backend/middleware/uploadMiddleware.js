import multer from "multer";
import path from "path";
import fs from "fs";

// Define upload path
const uploadPath = "uploads/receipts";

// Ensure folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter (only images/PDF)
const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|pdf/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase());

  if (isValid) cb(null, true);
  else cb(new Error("Only images or PDF allowed"));
};

// Create multer instance with file size limit (10MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default upload;