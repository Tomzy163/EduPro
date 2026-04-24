<script setup>
import { computed, onMounted, ref } from "vue";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateExam, getAiUsageSummary } from "@/services/aiService";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import UsageCounter from "@/components/ai/UsageCounter.vue";

const auth = useAuthStore();
const ui = useUiStore();

const form = ref({
  subject: "Mathematics",
  className: "JSS 2",
  topic: "",
  numberOfQuestions: 10,
  difficulty: "medium",
});
const generatedExam = ref(null);
const usage = ref(null);
const configured = ref(true);
const loading = ref(false);
const statusMessage = ref("");

const schoolId = computed(() => auth.school?._id || auth.user?.schoolId || "");

const buildPdf = () => {
  if (!generatedExam.value) {
    return;
  }

  const exam = generatedExam.value;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(exam.title || "Generated Exam", 14, 18);
  doc.setFontSize(11);
  doc.text(
    `${exam.subject} | ${exam.className} | ${exam.topic} | ${exam.difficulty}`,
    14,
    28
  );

  autoTable(doc, {
    startY: 36,
    head: [["MCQ", "Options", "Answer", "Marks"]],
    body: (exam.multipleChoiceQuestions || []).map((item, index) => [
      `${index + 1}. ${item.question}`,
      (item.options || []).join(" | "),
      item.correctAnswer || "",
      item.marks || 1,
    ]),
  });

  autoTable(doc, {
    startY: doc.lastAutoTable?.finalY + 12 || 60,
    head: [["Theory Question", "Marking Points", "Marks"]],
    body: (exam.theoryQuestions || []).map((item, index) => [
      `${index + 1}. ${item.question}`,
      (item.markingPoints || []).join(", "),
      item.marks || 5,
    ]),
  });

  doc.save(`exam-${exam.subject}-${exam.topic}.pdf`);
};

const copyAnswerKey = async () => {
  if (!generatedExam.value) {
    return;
  }

  const answerText = [
    "Answer Key",
    ...(generatedExam.value.multipleChoiceQuestions || []).map(
      (item, index) => `${index + 1}. ${item.correctAnswer}`
    ),
    "",
    "Marking Scheme",
    ...(generatedExam.value.markingScheme || []),
  ].join("\n");

  await navigator.clipboard.writeText(answerText);
  ui.pushToast({
    title: "Copied",
    message: "The answer key and marking scheme were copied.",
    tone: "success",
  });
};

const fetchUsage = async () => {
  const summary = await getAiUsageSummary();
  usage.value = summary.usage;
  configured.value = summary.configured;
};

const submitGenerator = async () => {
  if (!form.value.topic.trim()) {
    statusMessage.value = "Enter a topic before generating an exam.";
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    const response = await generateExam({
      schoolId: schoolId.value,
      ...form.value,
    });

    generatedExam.value = response.exam;
    usage.value = response.usage;
    configured.value = response.configured;
  } catch (error) {
    statusMessage.value =
      error.response?.data?.message || "Unable to generate an exam right now.";
    ui.pushToast({
      title: "Exam generation failed",
      message: statusMessage.value,
      tone: "error",
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await fetchUsage();
  } catch {
    statusMessage.value = "Unable to load AI usage details.";
  }
});
</script>

<template>
  <div class="dashboard ai-page">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">Teacher Exam Generator</h1>
        <p class="page-subtitle">
          Build classroom-ready multiple-choice and theory tests with answer keys and marking guides.
        </p>
      </div>
    </header>

    <UsageCounter :usage="usage" feature="ai_exam_generator" />

    <section v-if="!configured" class="card panel info-banner">
      OpenAI is not configured yet. Add `OPENAI_API_KEY` in the backend environment to unlock live generation.
    </section>

    <section v-if="statusMessage" class="card panel error-banner">
      {{ statusMessage }}
    </section>

    <section class="generator-grid">
      <article class="card panel">
        <h2 class="section-title">Build Exam</h2>
        <div class="form-grid">
          <input v-model="form.subject" class="input" placeholder="Subject" />
          <input v-model="form.className" class="input" placeholder="Class" />
          <input v-model="form.topic" class="input" placeholder="Topic" />
          <input
            v-model.number="form.numberOfQuestions"
            type="number"
            min="2"
            max="30"
            class="input"
            placeholder="Questions"
          />
          <select v-model="form.difficulty" class="input">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <button type="button" class="btn btn-primary" :disabled="loading" @click="submitGenerator">
          {{ loading ? "Generating..." : "Generate Exam" }}
        </button>
      </article>

      <article class="card panel">
        <div class="section-head">
          <div>
            <h2 class="section-title">Generated Output</h2>
            <p class="section-copy">Export to PDF or copy the marking scheme once you’re happy with it.</p>
          </div>
          <div class="action-row">
            <button type="button" class="btn btn-success" :disabled="!generatedExam" @click="buildPdf">
              Export PDF
            </button>
            <button type="button" class="btn btn-primary" :disabled="!generatedExam" @click="copyAnswerKey">
              Copy Answer Key
            </button>
          </div>
        </div>

        <div v-if="!generatedExam" class="empty">
          Your generated exam will appear here.
        </div>

        <div v-else class="output-grid">
          <div class="summary-card">
            <strong>{{ generatedExam.title }}</strong>
            <p>{{ generatedExam.subject }} • {{ generatedExam.className }} • {{ generatedExam.topic }}</p>
          </div>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>MCQ</th>
                  <th>Correct Answer</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in generatedExam.multipleChoiceQuestions || []"
                  :key="`${item.question}-${index}`"
                >
                  <td>{{ index + 1 }}. {{ item.question }}</td>
                  <td>{{ item.correctAnswer }}</td>
                  <td>{{ item.marks }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="theory-list">
            <article
              v-for="(item, index) in generatedExam.theoryQuestions || []"
              :key="`${item.question}-${index}`"
              class="theory-card"
            >
              <strong>{{ index + 1 }}. {{ item.question }}</strong>
              <p>Sample answer: {{ item.sampleAnswer }}</p>
              <p>Marking points: {{ (item.markingPoints || []).join(", ") }}</p>
            </article>
          </div>
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

.generator-grid {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 18px;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(15, 118, 110, 0.08);
}

.summary-card p,
.section-copy {
  margin: 8px 0 0;
  color: var(--text-soft);
}

.theory-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.theory-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.06);
}

.theory-card p {
  margin: 8px 0 0;
  color: var(--text-soft);
}

.info-banner {
  background: rgba(37, 99, 235, 0.08);
}

.error-banner {
  background: rgba(220, 38, 38, 0.08);
  color: #991b1b;
}

@media (max-width: 960px) {
  .generator-grid {
    grid-template-columns: 1fr;
  }
}
</style>
