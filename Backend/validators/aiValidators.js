const MAX_PROMPT_LENGTH = 2500;
const MAX_CONTEXT_LENGTH = 6000;

const cleanText = (value = "", { max = 160, preserveLines = false } = {}) => {
  const normalized = String(value || "")
    .replace(/\u0000/g, "")
    .trim();
  const compact = preserveLines
    ? normalized.replace(/\r/g, "")
    : normalized.replace(/\s+/g, " ");

  return compact.slice(0, max);
};

const cleanArray = (value, maxItems = 8) =>
  Array.isArray(value)
    ? value
        .map((item) => cleanText(item, { max: 160 }))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
};

export const validateTutorPayload = (body = {}) => {
  const schoolId = cleanText(body.schoolId, { max: 120 });
  const subject = cleanText(body.subject || "General", { max: 80 });
  const classLevel = cleanText(body.classLevel || "General class", { max: 80 });
  const prompt = cleanText(body.prompt, {
    max: MAX_PROMPT_LENGTH,
    preserveLines: true,
  });
  const conversationId = cleanText(body.conversationId, { max: 120 });

  if (!schoolId) {
    throw createValidationError("schoolId is required.");
  }

  if (!prompt) {
    throw createValidationError("Enter a question for the AI tutor.");
  }

  return {
    schoolId,
    subject,
    classLevel,
    prompt,
    conversationId,
  };
};

export const validateExamPayload = (body = {}) => {
  const schoolId = cleanText(body.schoolId, { max: 120 });
  const subject = cleanText(body.subject, { max: 120 });
  const className = cleanText(body.className || body.class, { max: 120 });
  const topic = cleanText(body.topic, { max: 160 });
  const difficulty = cleanText(body.difficulty || "medium", { max: 20 }).toLowerCase();
  const numberOfQuestions = Number(body.numberOfQuestions || 0);

  if (!schoolId || !subject || !className || !topic || !numberOfQuestions) {
    throw createValidationError(
      "Subject, class, topic, schoolId, and number of questions are required."
    );
  }

  if (!["easy", "medium", "hard"].includes(difficulty)) {
    throw createValidationError("Difficulty must be easy, medium, or hard.");
  }

  if (!Number.isInteger(numberOfQuestions) || numberOfQuestions < 2 || numberOfQuestions > 30) {
    throw createValidationError("Number of questions must be between 2 and 30.");
  }

  return {
    schoolId,
    subject,
    className,
    topic,
    difficulty,
    numberOfQuestions,
  };
};

export const validateReportCommentPayload = (body = {}) => {
  const schoolId = cleanText(body.schoolId, { max: 120 });
  const studentId = cleanText(body.studentId, { max: 120 });
  const studentName = cleanText(body.studentName, { max: 120 });
  const className = cleanText(body.className || body.class, { max: 120 });
  const attendanceSummary = cleanText(body.attendanceSummary, { max: 160 });
  const behavior = cleanText(body.behavior, { max: 160 });
  const strengths = cleanArray(body.strengths);
  const weaknesses = cleanArray(body.weaknesses);
  const scores = Array.isArray(body.scores)
    ? body.scores
        .map((entry) => ({
          subject: cleanText(entry?.subject, { max: 120 }),
          score: Number(entry?.score || 0),
        }))
        .filter((entry) => entry.subject)
        .slice(0, 20)
    : [];

  if (!schoolId) {
    throw createValidationError("schoolId is required.");
  }

  if (!studentId && !studentName) {
    throw createValidationError("Provide a studentId or studentName.");
  }

  return {
    schoolId,
    studentId,
    studentName,
    className,
    attendanceSummary,
    behavior,
    strengths,
    weaknesses,
    scores,
  };
};

export const validateAdminInsightsPayload = (body = {}) => {
  const schoolId = cleanText(body.schoolId, { max: 120 });
  const months = Number(body.months || 6);

  if (!schoolId) {
    throw createValidationError("schoolId is required.");
  }

  if (!Number.isInteger(months) || months < 1 || months > 12) {
    throw createValidationError("Months must be between 1 and 12.");
  }

  return {
    schoolId,
    months,
  };
};

export const validateParentAssistantPayload = (body = {}) => {
  const schoolId = cleanText(body.schoolId, { max: 120 });
  const question = cleanText(body.question, {
    max: MAX_PROMPT_LENGTH,
    preserveLines: true,
  });
  const studentId = cleanText(body.studentId, { max: 120 });

  if (!schoolId) {
    throw createValidationError("schoolId is required.");
  }

  if (!question) {
    throw createValidationError("Enter a question for the parent assistant.");
  }

  return {
    schoolId,
    question,
    studentId,
  };
};

export const truncateContext = (value = "", max = MAX_CONTEXT_LENGTH) =>
  cleanText(value, { max, preserveLines: true });
