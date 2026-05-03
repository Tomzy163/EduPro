<script setup>
import { computed, onMounted, ref, watch } from "vue";
import jsPDF from "jspdf";
import { getAiUsageSummary, generateReportComment } from "@/services/aiService";
import { getAttendance } from "@/services/attendanceService";
import { getStudentResults, getTeacherResults } from "@/services/resultService";
import { getUsers } from "@/services/userService";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import UsageCounter from "@/components/ai/UsageCounter.vue";

const auth = useAuthStore();
const ui = useUiStore();

const students = ref([]);
const selectedStudentId = ref("");
const results = ref([]);
const attendance = ref([]);
const behavior = ref("positive and cooperative");
const className = ref("Current class");
const comment = ref(null);
const usage = ref(null);
const configured = ref(true);
const loading = ref(false);
const statusMessage = ref("");

const schoolId = computed(() => auth.school?._id || auth.user?.schoolId || "");
const selectedStudent = computed(
  () => students.value.find((student) => student._id === selectedStudentId.value) || null
);

const strengths = computed(() =>
  [...results.value]
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
    .slice(0, 2)
    .map((result) => `${result.course?.name || "Subject"} is a strength`)
);

const weaknesses = computed(() =>
  [...results.value]
    .sort((left, right) => Number(left.score || 0) - Number(right.score || 0))
    .slice(0, 2)
    .map((result) => `${result.course?.name || "Subject"} needs more support`)
);

const attendanceSummary = computed(() => {
  if (!attendance.value.length) {
    return "Attendance data is limited";
  }

  const present = attendance.value.filter((entry) => entry.status === "present").length;
  const percentage = Math.round((present / attendance.value.length) * 100);
  return `${present} present out of ${attendance.value.length} records (${percentage}%)`;
});

const loadUsage = async () => {
  const summary = await getAiUsageSummary();
  usage.value = summary.usage;
  configured.value = summary.configured;
};

const loadStudents = async () => {
  if (auth.user?.role === "admin") {
    const allUsers = await getUsers();
    students.value = allUsers.filter((user) => user.role === "student");
  } else {
    const teacherResults = await getTeacherResults();
    const uniqueStudents = new Map();

    teacherResults.forEach((result) => {
      if (result.student?._id && !uniqueStudents.has(result.student._id)) {
        uniqueStudents.set(result.student._id, {
          _id: result.student._id,
          name: result.student.name,
        });
      }
    });

    students.value = [...uniqueStudents.values()];
  }

  selectedStudentId.value = students.value[0]?._id || "";
};

const loadStudentContext = async () => {
  if (!selectedStudentId.value) {
    results.value = [];
    attendance.value = [];
    return;
  }

  const [studentResults, studentAttendance] = await Promise.all([
    getStudentResults(selectedStudentId.value),
    getAttendance(selectedStudentId.value),
  ]);

  results.value = studentResults;
  attendance.value = studentAttendance;
};

const exportComment = () => {
  if (!comment.value) {
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("AI Report Comment", 14, 18);
  doc.setFontSize(12);
  doc.text(`Student: ${selectedStudent.value?.name || "Student"}`, 14, 30);
  doc.text(`Attendance: ${attendanceSummary.value}`, 14, 38);
  doc.text(comment.value.comment, 14, 50, { maxWidth: 180 });
  doc.save(`report-comment-${selectedStudent.value?.name || "student"}.pdf`);
};

const copyComment = async () => {
  if (!comment.value) {
    return;
  }

  await navigator.clipboard.writeText(comment.value.comment);
  ui.pushToast({
    title: "Copied",
    message: "The report comment was copied to your clipboard.",
    tone: "success",
  });
};

const submitComment = async () => {
  if (!selectedStudentId.value) {
    statusMessage.value = "Select a student first.";
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    const response = await generateReportComment({
      schoolId: schoolId.value,
      studentId: selectedStudentId.value,
      studentName: selectedStudent.value?.name,
      className: className.value,
      behavior: behavior.value,
      attendanceSummary: attendanceSummary.value,
      strengths: strengths.value,
      weaknesses: weaknesses.value,
      scores: results.value.map((result) => ({
        subject: result.course?.name || "Subject",
        score: Number(result.score || 0),
      })),
    });

    comment.value = response.comment;
    usage.value = response.usage;
    configured.value = response.configured;
  } catch (error) {
    statusMessage.value =
      error.response?.data?.message || "Unable to generate the report comment.";
  } finally {
    loading.value = false;
  }
};

watch(selectedStudentId, () => {
  loadStudentContext().catch(() => {
    statusMessage.value = "Unable to load the selected student's academic records.";
  });
});

onMounted(async () => {
  const tasks = await Promise.allSettled([loadStudents(), loadUsage()]);
  const failedTask = tasks.find((task) => task.status === "rejected");

  if (selectedStudentId.value) {
    await loadStudentContext().catch(() => {
      statusMessage.value = "Unable to load the selected student's academic records.";
    });
  }

  if (failedTask?.reason) {
    statusMessage.value =
      failedTask.reason?.response?.data?.message || "Unable to load report comment tools.";
  }
});
</script>

<template>
  <div class="dashboard ai-page">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">AI Report Comment Generator</h1>
        <p class="page-subtitle">
          Generate polished report card comments using live student scores, attendance, and growth areas.
        </p>
      </div>
    </header>

    <UsageCounter :usage="usage" feature="ai_report_comments" />

    <section v-if="!configured" class="card panel info-banner">
      OpenAI is not configured yet. The page still loads live student records so you can prepare data.
    </section>

    <section v-if="statusMessage" class="card panel error-banner">
      {{ statusMessage }}
    </section>

    <section class="comments-grid">
      <article class="card panel">
        <h2 class="section-title">Student Inputs</h2>

        <div class="form-grid">
          <select v-model="selectedStudentId" class="input">
            <option disabled value="">Select student</option>
            <option v-for="student in students" :key="student._id" :value="student._id">
              {{ student.name }}
            </option>
          </select>
          <input v-model="className" class="input" placeholder="Class" />
          <input v-model="behavior" class="input" placeholder="Behavior summary" />
        </div>

        <div class="context-list">
          <div class="context-card">
            <span>Attendance</span>
            <strong>{{ attendanceSummary }}</strong>
          </div>
          <div class="context-card">
            <span>Strengths</span>
            <strong>{{ strengths.join(", ") || "Not enough result data yet" }}</strong>
          </div>
          <div class="context-card">
            <span>Weaknesses</span>
            <strong>{{ weaknesses.join(", ") || "Not enough result data yet" }}</strong>
          </div>
        </div>

        <button type="button" class="btn btn-primary" :disabled="loading" @click="submitComment">
          {{ loading ? "Generating..." : "Generate Comment" }}
        </button>
      </article>

      <article class="card panel">
        <div class="section-head">
          <div>
            <h2 class="section-title">Generated Comment</h2>
            <p class="section-copy">Download the comment or copy it straight into the report card workflow.</p>
          </div>
          <div class="action-row">
            <button type="button" class="btn btn-success" :disabled="!comment" @click="exportComment">
              Download
            </button>
            <button type="button" class="btn btn-primary" :disabled="!comment" @click="copyComment">
              Copy
            </button>
          </div>
        </div>

        <div v-if="comment" class="comment-card">
          <strong>{{ comment.headline }}</strong>
          <p>{{ comment.comment }}</p>

          <div class="comment-list">
            <div>
              <span>Strengths</span>
              <p>{{ comment.strengths?.join(", ") }}</p>
            </div>
            <div>
              <span>Growth Areas</span>
              <p>{{ comment.growthAreas?.join(", ") }}</p>
            </div>
            <div>
              <span>Next Steps</span>
              <p>{{ comment.nextSteps?.join(", ") }}</p>
            </div>
          </div>
        </div>

        <div v-else class="empty">
          The generated report comment will appear here.
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel {
  padding: 22px;
}

.comments-grid {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 18px;
}

.context-list {
  display: grid;
  gap: 12px;
  margin: 18px 0;
}

.context-card,
.comment-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.06);
}

.context-card span,
.comment-list span,
.section-copy {
  color: var(--text-soft);
}

.comment-card p {
  line-height: 1.65;
}

.comment-list {
  display: grid;
  gap: 12px;
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.info-banner {
  background: rgba(37, 99, 235, 0.08);
}

.error-banner {
  background: rgba(220, 38, 38, 0.08);
  color: #991b1b;
}

@media (max-width: 960px) {
  .comments-grid {
    grid-template-columns: 1fr;
  }
}
</style>
