<script setup>
import { computed, onMounted, ref } from "vue";
import { askParentAssistant, getAiUsageSummary } from "@/services/aiService";
import API from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import UsageCounter from "@/components/ai/UsageCounter.vue";
import TypewriterText from "@/components/ai/TypewriterText.vue";

const auth = useAuthStore();
const ui = useUiStore();

const children = ref([]);
const selectedStudentId = ref("");
const question = ref("");
const answer = ref("");
const context = ref(null);
const usage = ref(null);
const configured = ref(true);
const loading = ref(false);
const statusMessage = ref("");
const animateLatestResponse = ref(false);

const schoolId = computed(() => auth.school?._id || auth.user?.schoolId || "");
const selectedChild = computed(
  () => children.value.find((child) => child._id === selectedStudentId.value) || null
);

const loadChildren = async () => {
  const response = await API.get(`/relationships/parent/${auth.user?._id}`);
  children.value = response.data?.children || [];
  selectedStudentId.value = children.value[0]?._id || "";
};

const loadUsage = async () => {
  const summary = await getAiUsageSummary();
  usage.value = summary.usage;
  configured.value = summary.configured;
};

const askAssistant = async () => {
  if (!question.value.trim()) {
    statusMessage.value = "Enter a question to continue.";
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    const response = await askParentAssistant({
      schoolId: schoolId.value,
      studentId: selectedStudentId.value,
      question: question.value,
    });

    answer.value = response.answer;
    context.value = response.context;
    usage.value = response.usage;
    configured.value = response.configured;
    animateLatestResponse.value = true;
  } catch (error) {
    statusMessage.value =
      error.response?.data?.message || "Parent assistant is unavailable right now.";
    ui.pushToast({
      title: "Assistant unavailable",
      message: statusMessage.value,
      tone: "error",
    });
  } finally {
    loading.value = false;
  }
};

const copyAnswer = async () => {
  await navigator.clipboard.writeText(answer.value);
  ui.pushToast({
    title: "Copied",
    message: "The parent assistant reply was copied.",
    tone: "success",
  });
};

onMounted(async () => {
  const tasks = await Promise.allSettled([loadChildren(), loadUsage()]);
  const failedTask = tasks.find((task) => task.status === "rejected");

  if (failedTask?.reason) {
    statusMessage.value =
      failedTask.reason?.response?.data?.message || "Unable to load the AI assistant.";
  }
});
</script>

<template>
  <div class="dashboard ai-page">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">Parent AI Assistant</h1>
        <p class="page-subtitle">
          Ask for attendance updates, weak subjects, recent payments, and your child’s current progress.
        </p>
      </div>
    </header>

    <UsageCounter :usage="usage" feature="ai_parent_assistant" />

    <section v-if="!configured" class="card panel info-banner">
      OpenAI is not configured yet. The page will still show live student context after setup.
    </section>

    <section v-if="statusMessage" class="card panel error-banner">
      {{ statusMessage }}
    </section>

    <section class="card panel assistant-form">
      <div class="form-grid">
        <select v-model="selectedStudentId" class="input">
          <option disabled value="">Select child</option>
          <option v-for="child in children" :key="child._id" :value="child._id">
            {{ child.name }}
          </option>
        </select>

        <textarea
          v-model="question"
          rows="4"
          class="input"
          placeholder="Ask: How is my child doing this term?"
        />
      </div>

      <button type="button" class="btn btn-primary" :disabled="loading" @click="askAssistant">
        {{ loading ? "Checking records..." : "Ask Assistant" }}
      </button>
    </section>

    <section class="assistant-grid">
      <article class="card panel">
        <h2 class="section-title">Response</h2>

        <div v-if="loading" class="typing-dots">
          <span />
          <span />
          <span />
        </div>

        <div v-else-if="answer" class="response-card">
          <p class="response-copy">
            <TypewriterText :text="answer" :animate="animateLatestResponse" />
          </p>
          <button type="button" class="copy-btn" @click="copyAnswer">
            Copy response
          </button>
        </div>

        <div v-else class="empty">
          The assistant reply will appear here after you ask a question.
        </div>
      </article>

      <article class="card panel">
        <h2 class="section-title">Live Context</h2>

        <div v-if="context" class="context-grid">
          <div class="context-card">
            <span>Selected child</span>
            <strong>{{ selectedChild?.name || "Unknown student" }}</strong>
          </div>
          <div class="context-card">
            <span>Attendance</span>
            <strong>{{ context.attendance?.percentage ?? 0 }}%</strong>
          </div>
          <div class="context-card">
            <span>Approved payments</span>
            <strong>{{ context.paymentSummary?.approvedPayments ?? 0 }}</strong>
          </div>
          <div class="context-card">
            <span>Recent scores</span>
            <strong>{{ context.latestScores?.length ?? 0 }}</strong>
          </div>
        </div>

        <div v-if="context?.weakSubjects?.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Weak Subject</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="subject in context.weakSubjects" :key="subject.subject">
                <td>{{ subject.subject }}</td>
                <td>{{ subject.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!context" class="empty">
          Recent attendance, scores, and payment context will appear here after the first question.
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

.assistant-form {
  display: grid;
  gap: 14px;
}

.assistant-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.response-copy {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.65;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.context-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.08);
}

.context-card span {
  display: block;
  margin-bottom: 8px;
  color: var(--text-soft);
}

.copy-btn {
  margin-top: 14px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  padding: 9px 12px;
  font-weight: 700;
}

.typing-dots {
  display: inline-flex;
  gap: 8px;
}

.typing-dots span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #0f766e;
  animation: blink 1s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.info-banner {
  background: rgba(37, 99, 235, 0.08);
}

.error-banner {
  background: rgba(220, 38, 38, 0.08);
  color: #991b1b;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

@media (max-width: 960px) {
  .assistant-grid,
  .context-grid {
    grid-template-columns: 1fr;
  }
}
</style>
