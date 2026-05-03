import { env } from "../config/env.js";
import { truncateContext } from "../validators/aiValidators.js";

const OPENAI_API_URL = env.openAiApiUrl;
const OPENAI_TIMEOUT_MS = env.openAiTimeoutMs;
const DEFAULT_MODEL = env.openAiModel;

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const stripCodeFence = (value = "") =>
  String(value || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const extractJsonBlock = (value = "") => {
  const text = stripCodeFence(value);
  const objectMatch = text.match(/\{[\s\S]*\}$/);
  const arrayMatch = text.match(/\[[\s\S]*\]$/);
  return objectMatch?.[0] || arrayMatch?.[0] || text;
};

const extractOutputText = (payload = {}) => {
  if (payload.output_text) {
    return String(payload.output_text).trim();
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  return payload.output
    .flatMap((item) =>
      Array.isArray(item?.content)
        ? item.content
            .filter((entry) => ["output_text", "text"].includes(entry?.type))
            .map((entry) => entry.text || entry?.value || "")
        : []
    )
    .join("\n")
    .trim();
};

const parseApiError = async (response) => {
  try {
    const payload = await response.json();
    return payload?.error?.message || payload?.message || response.statusText;
  } catch {
    return response.statusText || "OpenAI request failed.";
  }
};

const buildHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${env.openAiApiKey}`,
});

export const isOpenAiConfigured = () => Boolean(env.openAiApiKey);

export const getDefaultAiModel = () => DEFAULT_MODEL;

export const requestAiText = async ({
  instructions,
  input,
  model = DEFAULT_MODEL,
  temperature = 0.35,
}) => {
  if (!isOpenAiConfigured()) {
    const error = new Error(
      "OPENAI_API_KEY is not configured on the server. Add it in Backend/.env to enable AI responses."
    );
    error.statusCode = 503;
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        model,
        instructions,
        input,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(await parseApiError(response));
      error.statusCode = response.status;
      error.code = "OPENAI_REQUEST_FAILED";
      throw error;
    }

    const payload = await response.json();
    const text = extractOutputText(payload);

    if (!text) {
      const error = new Error("The AI provider returned an empty response.");
      error.statusCode = 502;
      error.code = "OPENAI_EMPTY_RESPONSE";
      throw error;
    }

    return {
      model,
      text,
      raw: payload,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        "The AI request timed out. Please try again in a moment."
      );
      timeoutError.statusCode = 504;
      timeoutError.code = "AI_TIMEOUT";
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const requestAiJson = async (options) => {
  const response = await requestAiText(options);
  let parsed;

  try {
    parsed = JSON.parse(extractJsonBlock(response.text));
  } catch {
    const error = new Error("The AI response was not valid JSON.");
    error.statusCode = 502;
    error.code = "OPENAI_INVALID_JSON";
    throw error;
  }

  if (!isPlainObject(parsed) && !Array.isArray(parsed)) {
    const error = new Error("The AI response was not valid JSON.");
    error.statusCode = 502;
    error.code = "OPENAI_INVALID_JSON";
    throw error;
  }

  return {
    ...response,
    data: parsed,
  };
};

export const generateTutorResponse = async ({
  schoolName,
  subject,
  classLevel,
  question,
  recentMessages = [],
}) => {
  const conversationContext = recentMessages
    .slice(-6)
    .map((message) => `${message.role === "assistant" ? "Tutor" : "Student"}: ${message.content}`)
    .join("\n");

  const instructions = [
    "You are EduPro Tutor, a warm and accurate school learning assistant.",
    "Explain clearly for the student's class level, keep the tone encouraging, and show steps for problem-solving subjects.",
    "Do not fabricate facts. If the question is ambiguous, say what assumption you are making.",
    "Use short sections and plain language suitable for students.",
  ].join(" ");

  const input = truncateContext(
    `School: ${schoolName}\nSubject: ${subject}\nClass level: ${classLevel}\nRecent conversation:\n${conversationContext || "No previous context."}\n\nStudent question:\n${question}`
  );

  return requestAiText({
    instructions,
    input,
    temperature: 0.2,
  });
};

export const generateExamContent = async ({
  subject,
  className,
  topic,
  difficulty,
  numberOfQuestions,
}) => {
  const prompt = truncateContext(
    `Return valid JSON only with this shape:
{
  "title": "string",
  "instructions": ["string"],
  "multipleChoiceQuestions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "string",
      "explanation": "string",
      "marks": number
    }
  ],
  "theoryQuestions": [
    {
      "question": "string",
      "sampleAnswer": "string",
      "markingPoints": ["string"],
      "marks": number
    }
  ],
  "markingScheme": ["string"],
  "teacherNotes": ["string"]
}

Generate an exam for:
Subject: ${subject}
Class: ${className}
Topic: ${topic}
Difficulty: ${difficulty}
Total questions: ${numberOfQuestions}

Use about 60% multiple-choice and 40% theory questions. Make it classroom-ready.`
  );

  return requestAiJson({
    instructions:
      "You generate production-ready school assessments. Return only valid JSON with no markdown fences.",
    input: prompt,
    temperature: 0.45,
  });
};

export const generateReportCommentContent = async ({
  studentName,
  className,
  scores,
  attendanceSummary,
  behavior,
  strengths,
  weaknesses,
}) => {
  const prompt = truncateContext(
    `Return valid JSON only with this shape:
{
  "headline": "string",
  "comment": "string",
  "strengths": ["string"],
  "growthAreas": ["string"],
  "nextSteps": ["string"]
}

Student: ${studentName}
Class: ${className || "Not supplied"}
Scores: ${scores.map((entry) => `${entry.subject}: ${entry.score}`).join(", ") || "Not supplied"}
Attendance: ${attendanceSummary || "Not supplied"}
Behavior: ${behavior || "Not supplied"}
Strengths: ${strengths.join(", ") || "Not supplied"}
Weaknesses: ${weaknesses.join(", ") || "Not supplied"}

Write like a polished report card comment for a school management system.`
  );

  return requestAiJson({
    instructions:
      "You write concise, personalized, school-appropriate report comments. Return only valid JSON.",
    input: prompt,
    temperature: 0.4,
  });
};

export const generateAdminInsightsNarrative = async ({
  schoolName,
  months,
  metrics,
}) => {
  const prompt = truncateContext(
    `Return valid JSON only with this shape:
{
  "headline": "string",
  "summary": "string",
  "wins": ["string"],
  "risks": ["string"],
  "recommendations": ["string"],
  "monthlySummary": "string"
}

School: ${schoolName}
Reporting window: ${months} months
Metrics:
${JSON.stringify(metrics, null, 2)}`
  );

  return requestAiJson({
    instructions:
      "You are a school operations strategist. Turn structured school metrics into executive-friendly insights. Return only valid JSON.",
    input: prompt,
    temperature: 0.3,
  });
};

export const generateParentAssistantResponse = async ({
  parentName,
  studentName,
  question,
  context,
}) => {
  const prompt = truncateContext(
    `Parent name: ${parentName}
Student name: ${studentName}
Parent question: ${question}

Student context:
${JSON.stringify(context, null, 2)}

Answer as a supportive school assistant. Use the provided data only. If data is unavailable, say so clearly.`
  );

  return requestAiText({
    instructions:
      "You are the EduPro Parent Assistant. Be warm, factual, and concise. Use plain language and give practical next steps when helpful.",
    input: prompt,
    temperature: 0.25,
  });
};
