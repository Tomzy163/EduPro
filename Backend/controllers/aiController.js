import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import AIConversation from "../models/AIConversation.js";
import AIExam from "../models/AIExam.js";
import Course from "../models/Course.js";
import Message from "../models/Message.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import Payment from "../models/Payment.js";
import Result from "../models/Result.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import { createAuditLog } from "../utils/auditLogger.js";
import {
  ensureAiUsageAccess,
  getUsageSummary,
  recordAiUsage,
} from "../utils/aiQuota.js";
import { AI_FEATURE_KEYS } from "../utils/aiPolicy.js";
import {
  generateAdminInsightsNarrative,
  generateExamContent,
  generateParentAssistantResponse,
  generateReportCommentContent,
  generateTutorResponse,
  getDefaultAiModel,
  isOpenAiConfigured,
} from "../services/aiService.js";
import {
  validateAdminInsightsPayload,
  validateExamPayload,
  validateParentAssistantPayload,
  validateReportCommentPayload,
  validateTutorPayload,
} from "../validators/aiValidators.js";

const getSchoolObjectId = (req) =>
  new mongoose.Types.ObjectId(String(req.user.school?._id || req.user.school));

const summarizeAttendance = (records = []) => {
  const total = records.length;
  const present = records.filter((record) => record.status === "present").length;
  const absent = total - present;
  const percentage = total ? Math.round((present / total) * 100) : 0;

  return {
    total,
    present,
    absent,
    percentage,
  };
};

const buildDeterministicReportComment = ({
  studentName,
  scores,
  attendanceSummary,
  behavior,
  strengths,
  weaknesses,
}) => {
  const strongest = [...scores].sort((a, b) => b.score - a.score)[0];
  const weakest = [...scores].sort((a, b) => a.score - b.score)[0];
  const headline = strongest
    ? `${studentName} is showing promise in ${strongest.subject}.`
    : `${studentName} has made steady progress this term.`;

  const commentParts = [
    headline,
    attendanceSummary
      ? `Attendance is ${attendanceSummary}.`
      : "Attendance data is limited for this period.",
    behavior ? `Behavior has been ${behavior}.` : "",
    weakest ? `${studentName} should focus more on ${weakest.subject}.` : "",
  ].filter(Boolean);

  return {
    headline,
    comment: commentParts.join(" "),
    strengths:
      strengths.length > 0
        ? strengths
        : strongest
          ? [`Strong performance in ${strongest.subject}`]
          : ["Consistent effort shown this term"],
    growthAreas:
      weaknesses.length > 0
        ? weaknesses
        : weakest
          ? [`Improve understanding in ${weakest.subject}`]
          : ["Keep building confidence across subjects"],
    nextSteps: [
      "Maintain regular revision habits.",
      "Work on punctuality and assignment completion.",
      "Ask for support early when topics become difficult.",
    ],
  };
};

const buildDeterministicInsights = ({
  attendanceTrends,
  weakSubjects,
  topStudents,
  paymentTrends,
}) => {
  const strongestMonth = paymentTrends[0]?.month || "this period";
  return {
    headline: "School performance snapshot is ready.",
    summary:
      "Core operational metrics were analyzed successfully. Attendance, revenue, and performance trends are available below for decision-making.",
    wins: [
      topStudents[0]
        ? `${topStudents[0].name} is leading current performance trends.`
        : "Top student data is limited right now.",
      attendanceTrends[0]
        ? `Attendance records were captured across ${attendanceTrends.length} recent month(s).`
        : "Attendance history is still building up.",
    ],
    risks: [
      weakSubjects[0]
        ? `${weakSubjects[0].courseName} is currently the weakest-performing subject.`
        : "Weak subject trends are limited because result data is still small.",
      paymentTrends[0]
        ? `Watch cashflow consistency after ${strongestMonth}.`
        : "Payment trend data is limited for this period.",
    ],
    recommendations: [
      "Provide intervention classes for the weakest subjects.",
      "Follow up on attendance dips early in the month.",
      "Celebrate top performers publicly to improve morale.",
    ],
    monthlySummary:
      "This summary was generated from live EduPro records without an external AI response because OPENAI_API_KEY is not configured yet.",
  };
};

const buildDeterministicParentReply = ({ studentName, context }) => {
  const strongest = context.latestScores?.[0];
  const weakest = [...(context.latestScores || [])].sort((a, b) => a.score - b.score)[0];

  return [
    `${studentName} has ${context.attendance.percentage}% attendance for the current record window.`,
    strongest
      ? `Strongest recent subject: ${strongest.subject} (${strongest.score}).`
      : "There are no recent score entries yet.",
    weakest ? `Main support area: ${weakest.subject} (${weakest.score}).` : "",
    context.paymentSummary.latestApprovedAmount
      ? `Latest approved payment: NGN ${Number(
          context.paymentSummary.latestApprovedAmount
        ).toLocaleString()}.`
      : "There is no approved fee payment recorded yet.",
    context.upcomingItems.length
      ? `Upcoming timetable items: ${context.upcomingItems
          .slice(0, 2)
          .map((item) => `${item.day} ${item.time} - ${item.course}`)
          .join("; ")}.`
      : "No upcoming exam or timetable alert is stored right now.",
  ]
    .filter(Boolean)
    .join(" ");
};

const serializeConversation = (conversation) => ({
  _id: conversation._id,
  subject: conversation.subject,
  classLevel: conversation.classLevel,
  title: conversation.title,
  lastUsedAt: conversation.lastUsedAt,
  updatedAt: conversation.updatedAt,
  messages: conversation.messages,
});

const getTeacherActivity = async (schoolId) => {
  const [teachers, resultsByTeacher, messagesByTeacher] = await Promise.all([
    User.find({
      school: schoolId,
      role: "teacher",
    }).select("_id name"),
    Result.aggregate([
      { $match: { school: schoolId } },
      { $group: { _id: "$uploadedBy", totalResultsUploaded: { $sum: 1 } } },
    ]),
    Message.aggregate([
      { $match: { school: schoolId } },
      { $group: { _id: "$sender", totalMessagesSent: { $sum: 1 } } },
    ]),
  ]);

  const resultLookup = Object.fromEntries(
    resultsByTeacher
      .filter((entry) => entry._id)
      .map((entry) => [String(entry._id), entry.totalResultsUploaded])
  );
  const messageLookup = Object.fromEntries(
    messagesByTeacher
      .filter((entry) => entry._id)
      .map((entry) => [String(entry._id), entry.totalMessagesSent])
  );

  const coursesByTeacher = await Course.aggregate([
    { $match: { school: schoolId, teacher: { $ne: null } } },
    { $group: { _id: "$teacher", totalCourses: { $sum: 1 } } },
  ]);
  const courseLookup = Object.fromEntries(
    coursesByTeacher.map((entry) => [String(entry._id), entry.totalCourses])
  );

  return teachers.map((teacher) => ({
    id: teacher._id,
    name: teacher.name,
    totalCourses: courseLookup[String(teacher._id)] || 0,
    totalResultsUploaded: resultLookup[String(teacher._id)] || 0,
    totalMessagesSent: messageLookup[String(teacher._id)] || 0,
  }));
};

const getMonthRange = (months = 6) => {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - (months - 1));
  return start;
};

export const getAiUsageSummary = async (req, res) => {
  try {
    const usage = await getUsageSummary({
      school: req.user.school,
      user: req.user,
    });

    return res.json({
      configured: isOpenAiConfigured(),
      model: getDefaultAiModel(),
      usage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTutorHistory = async (req, res) => {
  try {
    const conversations = await AIConversation.find({
      school: req.user.school._id,
      student: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .limit(12);

    return res.json(conversations.map((conversation) => serializeConversation(conversation)));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const chatWithTutor = async (req, res) => {
  const payload = validateTutorPayload(req.body);
  let usageAfter = null;

  try {
    await ensureAiUsageAccess({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.tutor,
    });

    const existingConversation =
      payload.conversationId && mongoose.Types.ObjectId.isValid(payload.conversationId)
        ? await AIConversation.findOne({
            _id: payload.conversationId,
            school: req.user.school._id,
            student: req.user._id,
          })
        : null;

    const conversation =
      existingConversation ||
      new AIConversation({
        school: req.user.school._id,
        student: req.user._id,
        subject: payload.subject,
        classLevel: payload.classLevel,
      });

    const aiResponse = await generateTutorResponse({
      schoolName: req.user.school.name,
      subject: payload.subject,
      classLevel: payload.classLevel,
      question: payload.prompt,
      recentMessages: conversation.messages,
    });

    conversation.subject = payload.subject;
    conversation.classLevel = payload.classLevel;
    conversation.title =
      conversation.title || payload.prompt.split("\n")[0].slice(0, 80);
    conversation.lastUsedAt = new Date();
    conversation.messages.push(
      {
        role: "user",
        content: payload.prompt,
        subject: payload.subject,
      },
      {
        role: "assistant",
        content: aiResponse.text,
        subject: payload.subject,
      }
    );

    if (conversation.messages.length > 24) {
      conversation.messages = conversation.messages.slice(-24);
    }

    await conversation.save();

    await recordAiUsage({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.tutor,
      requestText: payload.prompt,
      responseText: aiResponse.text,
      metadata: {
        subject: payload.subject,
        classLevel: payload.classLevel,
        conversationId: conversation._id,
      },
    });

    usageAfter = await getUsageSummary({
      school: req.user.school,
      user: req.user,
    });

    await createAuditLog({
      req,
      action: "ai.tutor.chat",
      entityType: "aiConversation",
      entityId: conversation._id,
      metadata: {
        subject: payload.subject,
        classLevel: payload.classLevel,
      },
    });

    return res.json({
      conversation: serializeConversation(conversation),
      answer: aiResponse.text,
      usage: usageAfter,
      configured: isOpenAiConfigured(),
      model: aiResponse.model,
    });
  } catch (error) {
    await recordAiUsage({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.tutor,
      status:
        error.statusCode === 403 || error.statusCode === 429 ? "blocked" : "failed",
      requestText: payload.prompt,
      metadata: {
        subject: payload.subject,
        classLevel: payload.classLevel,
        errorCode: error.code || "",
      },
    }).catch(() => {});

    await createAuditLog({
      req,
      action: "ai.tutor.chat",
      entityType: "aiConversation",
      status:
        error.statusCode === 403 || error.statusCode === 429 ? "blocked" : "failed",
      metadata: {
        subject: payload.subject,
        classLevel: payload.classLevel,
        errorCode: error.code || "",
      },
    });

    return res.status(error.statusCode || 500).json({
      message: error.message,
      code: error.code,
      usage: error.usage || usageAfter,
    });
  }
};

export const generateExam = async (req, res) => {
  const payload = validateExamPayload(req.body);

  try {
    await ensureAiUsageAccess({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.examGenerator,
    });

    const aiResponse = await generateExamContent(payload);
    const exam = await AIExam.create({
      school: req.user.school._id,
      createdBy: req.user._id,
      subject: payload.subject,
      className: payload.className,
      topic: payload.topic,
      questionCount: payload.numberOfQuestions,
      difficulty: payload.difficulty,
      examContent: aiResponse.data,
    });

    await recordAiUsage({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.examGenerator,
      requestText: JSON.stringify(payload),
      responseText: aiResponse.text,
      metadata: {
        examId: exam._id,
      },
    });

    const usage = await getUsageSummary({
      school: req.user.school,
      user: req.user,
    });

    await createAuditLog({
      req,
      action: "ai.exam.generate",
      entityType: "aiExam",
      entityId: exam._id,
      metadata: {
        subject: payload.subject,
        className: payload.className,
      },
    });

    return res.json({
      exam: {
        _id: exam._id,
        ...aiResponse.data,
        subject: payload.subject,
        className: payload.className,
        topic: payload.topic,
        difficulty: payload.difficulty,
        questionCount: payload.numberOfQuestions,
      },
      usage,
      model: aiResponse.model,
      configured: isOpenAiConfigured(),
    });
  } catch (error) {
    await recordAiUsage({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.examGenerator,
      status:
        error.statusCode === 403 || error.statusCode === 429 ? "blocked" : "failed",
      requestText: JSON.stringify(payload),
      metadata: {
        errorCode: error.code || "",
      },
    }).catch(() => {});

    await createAuditLog({
      req,
      action: "ai.exam.generate",
      entityType: "aiExam",
      status:
        error.statusCode === 403 || error.statusCode === 429 ? "blocked" : "failed",
      metadata: {
        subject: payload.subject,
        className: payload.className,
        errorCode: error.code || "",
      },
    });

    return res.status(error.statusCode || 500).json({
      message: error.message,
      code: error.code,
      usage: error.usage,
    });
  }
};

export const generateReportComment = async (req, res) => {
  const payload = validateReportCommentPayload(req.body);

  try {
    await ensureAiUsageAccess({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.reportComments,
    });

    let resolvedStudentName = payload.studentName;
    let resolvedClassName = payload.className;
    let resolvedScores = payload.scores;
    let resolvedAttendance = payload.attendanceSummary;
    let resolvedStrengths = payload.strengths;
    let resolvedWeaknesses = payload.weaknesses;

    if (payload.studentId && mongoose.Types.ObjectId.isValid(payload.studentId)) {
      const [student, results, attendance] = await Promise.all([
        User.findOne({
          _id: payload.studentId,
          school: req.user.school._id,
          role: "student",
        }).select("name"),
        Result.find({
          school: req.user.school._id,
          student: payload.studentId,
        }).populate("course", "name"),
        Attendance.find({
          school: req.user.school._id,
          student: payload.studentId,
        }),
      ]);

      if (!student) {
        return res.status(404).json({ message: "Student not found in this school." });
      }

      resolvedStudentName = student.name;
      resolvedScores =
        resolvedScores.length > 0
          ? resolvedScores
          : results.map((result) => ({
              subject: result.course?.name || "Subject",
              score: Number(result.score || 0),
            }));

      if (!resolvedAttendance) {
        const attendanceSummary = summarizeAttendance(attendance);
        resolvedAttendance = attendanceSummary.total
          ? `${attendanceSummary.present} present out of ${attendanceSummary.total} (${attendanceSummary.percentage}%)`
          : "Attendance records are limited";
      }

      if (resolvedStrengths.length === 0 && resolvedScores.length > 0) {
        resolvedStrengths = [...resolvedScores]
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
          .map((entry) => `${entry.subject} is a strength`);
      }

      if (resolvedWeaknesses.length === 0 && resolvedScores.length > 0) {
        resolvedWeaknesses = [...resolvedScores]
          .sort((a, b) => a.score - b.score)
          .slice(0, 2)
          .map((entry) => `${entry.subject} needs more support`);
      }
    }

    const fallbackComment = buildDeterministicReportComment({
      studentName: resolvedStudentName,
      scores: resolvedScores,
      attendanceSummary: resolvedAttendance,
      behavior: payload.behavior,
      strengths: resolvedStrengths,
      weaknesses: resolvedWeaknesses,
    });

    const response = isOpenAiConfigured()
      ? await generateReportCommentContent({
          studentName: resolvedStudentName,
          className: resolvedClassName,
          scores: resolvedScores,
          attendanceSummary: resolvedAttendance,
          behavior: payload.behavior,
          strengths: resolvedStrengths,
          weaknesses: resolvedWeaknesses,
        })
      : {
          model: "deterministic-fallback",
          text: JSON.stringify(fallbackComment),
          data: fallbackComment,
        };

    await recordAiUsage({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.reportComments,
      requestText: JSON.stringify(payload),
      responseText: response.text,
      metadata: {
        studentName: resolvedStudentName,
        fallback: !isOpenAiConfigured(),
      },
    });

    const usage = await getUsageSummary({
      school: req.user.school,
      user: req.user,
    });

    await createAuditLog({
      req,
      action: "ai.report-comment.generate",
      entityType: "student",
      entityId: payload.studentId,
      metadata: {
        studentName: resolvedStudentName,
        fallback: !isOpenAiConfigured(),
      },
    });

    return res.json({
      comment: response.data,
      usage,
      model: response.model,
      configured: isOpenAiConfigured(),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
      code: error.code,
      usage: error.usage,
    });
  }
};

export const getAdminInsights = async (req, res) => {
  const payload = validateAdminInsightsPayload(req.body);

  try {
    await ensureAiUsageAccess({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.adminAnalytics,
    });

    const schoolId = getSchoolObjectId(req);
    const rangeStart = getMonthRange(payload.months);

    const [attendanceRows, resultRows, topStudentRows, paymentRows, teacherActivity] =
      await Promise.all([
        Attendance.aggregate([
          {
            $match: {
              school: schoolId,
              date: { $gte: rangeStart },
            },
          },
          {
            $group: {
              _id: {
                month: { $dateToString: { format: "%Y-%m", date: "$date" } },
                status: "$status",
              },
              total: { $sum: 1 },
            },
          },
          { $sort: { "_id.month": 1 } },
        ]),
        Result.aggregate([
          {
            $match: {
              school: schoolId,
              createdAt: { $gte: rangeStart },
            },
          },
          {
            $group: {
              _id: "$course",
              averageScore: { $avg: "$score" },
              entries: { $sum: 1 },
            },
          },
          { $sort: { averageScore: 1 } },
          { $limit: 5 },
        ]),
        Result.aggregate([
          {
            $match: {
              school: schoolId,
              createdAt: { $gte: rangeStart },
            },
          },
          {
            $group: {
              _id: "$student",
              averageScore: { $avg: "$score" },
              resultsCount: { $sum: 1 },
            },
          },
          { $sort: { averageScore: -1 } },
          { $limit: 5 },
        ]),
        Payment.aggregate([
          {
            $match: {
              school: schoolId,
              createdAt: { $gte: rangeStart },
            },
          },
          {
            $group: {
              _id: {
                month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                status: "$status",
              },
              totalAmount: { $sum: { $toDouble: "$amount" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.month": 1 } },
        ]),
        getTeacherActivity(schoolId),
      ]);

    const [weakCourses, topStudents] = await Promise.all([
      Course.find({
        _id: { $in: resultRows.map((row) => row._id) },
      }).select("name"),
      User.find({
        _id: { $in: topStudentRows.map((row) => row._id) },
      }).select("name"),
    ]);

    const courseLookup = Object.fromEntries(
      weakCourses.map((course) => [String(course._id), course.name])
    );
    const studentLookup = Object.fromEntries(
      topStudents.map((student) => [String(student._id), student.name])
    );

    const attendanceMap = new Map();
    attendanceRows.forEach((row) => {
      const month = row._id.month;
      const entry = attendanceMap.get(month) || {
        month,
        present: 0,
        absent: 0,
      };
      entry[row._id.status] = row.total;
      attendanceMap.set(month, entry);
    });

    const paymentMap = new Map();
    paymentRows.forEach((row) => {
      const month = row._id.month;
      const entry = paymentMap.get(month) || {
        month,
        approvedAmount: 0,
        pendingAmount: 0,
        rejectedAmount: 0,
        totalTransactions: 0,
      };

      const bucket = `${row._id.status}Amount`;
      if (bucket in entry) {
        entry[bucket] = Number(row.totalAmount || 0);
      }
      entry.totalTransactions += row.count || 0;
      paymentMap.set(month, entry);
    });

    const insightsPayload = {
      attendanceTrends: [...attendanceMap.values()],
      weakSubjects: resultRows.map((row) => ({
        courseName: courseLookup[String(row._id)] || "Unknown Course",
        averageScore: Math.round(Number(row.averageScore || 0)),
        entries: row.entries,
      })),
      topPerformingStudents: topStudentRows.map((row) => ({
        name: studentLookup[String(row._id)] || "Unknown Student",
        averageScore: Math.round(Number(row.averageScore || 0)),
        resultsCount: row.resultsCount,
      })),
      feePaymentTrends: [...paymentMap.values()],
      teacherActivity,
      monthlySummary: {
        generatedAt: new Date(),
        reportingWindowMonths: payload.months,
      },
    };

    const fallbackInsights = buildDeterministicInsights({
      attendanceTrends: insightsPayload.attendanceTrends,
      weakSubjects: insightsPayload.weakSubjects,
      topStudents: insightsPayload.topPerformingStudents,
      paymentTrends: insightsPayload.feePaymentTrends,
    });

    const response = isOpenAiConfigured()
      ? await generateAdminInsightsNarrative({
          schoolName: req.user.school.name,
          months: payload.months,
          metrics: insightsPayload,
        })
      : {
          model: "deterministic-fallback",
          text: JSON.stringify(fallbackInsights),
          data: fallbackInsights,
        };

    await recordAiUsage({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.adminAnalytics,
      requestText: JSON.stringify(payload),
      responseText: response.text,
      metadata: {
        fallback: !isOpenAiConfigured(),
      },
    });

    const usage = await getUsageSummary({
      school: req.user.school,
      user: req.user,
    });

    await createAuditLog({
      req,
      action: "ai.admin-insights.generate",
      entityType: "school",
      entityId: req.user.school._id,
      metadata: {
        months: payload.months,
        fallback: !isOpenAiConfigured(),
      },
    });

    return res.json({
      metrics: insightsPayload,
      insights: response.data,
      usage,
      model: response.model,
      configured: isOpenAiConfigured(),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
      code: error.code,
      usage: error.usage,
    });
  }
};

export const parentAssistant = async (req, res) => {
  const payload = validateParentAssistantPayload(req.body);

  try {
    await ensureAiUsageAccess({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.parentAssistant,
    });

    const linkedChildren = await ParentStudentLink.find({
      school: req.user.school._id,
      parent: req.user._id,
    }).select("student");

    const childIds = linkedChildren.map((link) => String(link.student));
    const targetStudentId =
      payload.studentId && childIds.includes(String(payload.studentId))
        ? String(payload.studentId)
        : childIds[0];

    if (!targetStudentId) {
      return res.status(404).json({
        message: "No linked student record was found for this parent account.",
      });
    }

    const [student, results, attendance, payments, upcomingItems] = await Promise.all([
      User.findOne({
        _id: targetStudentId,
        school: req.user.school._id,
        role: "student",
      }).select("name"),
      Result.find({
        school: req.user.school._id,
        student: targetStudentId,
      })
        .populate("course", "name")
        .sort({ createdAt: -1 })
        .limit(12),
      Attendance.find({
        school: req.user.school._id,
        student: targetStudentId,
      })
        .sort({ date: -1, createdAt: -1 })
        .limit(20),
      Payment.find({
        school: req.user.school._id,
        user: req.user._id,
      })
        .sort({ createdAt: -1 })
        .limit(10),
      Timetable.find({
        school: req.user.school._id,
        student: targetStudentId,
      })
        .populate("course", "name")
        .sort({ day: 1, time: 1 })
        .limit(6),
    ]);

    if (!student) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const attendanceSummary = summarizeAttendance(attendance);
    const latestScores = results.map((result) => ({
      subject: result.course?.name || "Subject",
      score: Number(result.score || 0),
      grade: result.grade || "",
    }));
    const approvedPayments = payments.filter((payment) =>
      ["approved", "success"].includes(payment.status)
    );

    const context = {
      attendance: attendanceSummary,
      latestScores,
      weakSubjects: [...latestScores].sort((a, b) => a.score - b.score).slice(0, 3),
      paymentSummary: {
        totalPaymentsRecorded: payments.length,
        approvedPayments: approvedPayments.length,
        latestApprovedAmount: approvedPayments[0]?.amount || null,
      },
      upcomingItems: upcomingItems.map((item) => ({
        day: item.day,
        time: item.time,
        course: item.course?.name || "Course",
        location: item.location || "",
      })),
      notes: {
        feeBalance:
          "The current data model stores payment history but does not keep an invoice balance ledger yet.",
        upcomingExams:
          "No dedicated exam schedule module exists in the current database snapshot, so timetable data is used as the nearest upcoming activity reference.",
      },
    };

    const response = isOpenAiConfigured()
      ? await generateParentAssistantResponse({
          parentName: req.user.name,
          studentName: student.name,
          question: payload.question,
          context,
        })
      : {
          model: "deterministic-fallback",
          text: buildDeterministicParentReply({
            studentName: student.name,
            context,
          }),
        };

    await recordAiUsage({
      school: req.user.school,
      user: req.user,
      feature: AI_FEATURE_KEYS.parentAssistant,
      requestText: payload.question,
      responseText: response.text,
      metadata: {
        studentId: targetStudentId,
        fallback: !isOpenAiConfigured(),
      },
    });

    const usage = await getUsageSummary({
      school: req.user.school,
      user: req.user,
    });

    await createAuditLog({
      req,
      action: "ai.parent-assistant.chat",
      entityType: "student",
      entityId: targetStudentId,
      metadata: {
        fallback: !isOpenAiConfigured(),
      },
    });

    return res.json({
      answer: response.text,
      student: {
        _id: targetStudentId,
        name: student.name,
      },
      context,
      usage,
      model: response.model,
      configured: isOpenAiConfigured(),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
      code: error.code,
      usage: error.usage,
    });
  }
};
