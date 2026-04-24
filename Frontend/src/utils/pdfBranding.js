import { apiBaseUrl } from "@/services/runtimeConfig";

const resolveAssetUrl = (assetPath = "") => {
  const normalized = String(assetPath || "").trim();

  if (!normalized) {
    return "";
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `${apiBaseUrl.replace(/\/api$/, "")}/${normalized.replace(/^\/+/, "")}`;
};

const loadImageAsDataUrl = async (imagePath = "") => {
  const imageUrl = resolveAssetUrl(imagePath);

  if (!imageUrl) {
    return "";
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Unable to load the school logo.");
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the school logo."));
    reader.readAsDataURL(blob);
  });
};

export const addSchoolBranding = async ({
  doc,
  school = {},
  title = "",
  subtitle = "",
  metaLines = [],
}) => {
  let textLeft = 14;

  if (school?.logo) {
    try {
      const logoDataUrl = await loadImageAsDataUrl(school.logo);
      const format = logoDataUrl.includes("image/png")
        ? "PNG"
        : logoDataUrl.includes("image/webp")
          ? "WEBP"
          : "JPEG";

      doc.addImage(logoDataUrl, format, 14, 10, 20, 20);
      textLeft = 40;
    } catch (error) {
      console.warn("Unable to include school logo in PDF export:", error);
    }
  }

  const schoolName = school?.name || "EduPro School";
  let currentY = 18;

  doc.setFontSize(20);
  doc.text(schoolName, textLeft, currentY);

  currentY += 10;
  doc.setFontSize(14);
  doc.text(title, textLeft, currentY);

  if (subtitle) {
    currentY += 8;
    doc.setFontSize(10);
    doc.text(subtitle, textLeft, currentY);
  }

  const lines = [
    ...metaLines.filter(Boolean),
    `Generated: ${new Date().toLocaleDateString()}`,
  ];

  doc.setFontSize(10);
  lines.forEach((line) => {
    currentY += 7;
    doc.text(line, textLeft, currentY);
  });

  return currentY + 8;
};
