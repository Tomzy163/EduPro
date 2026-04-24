<script setup>
import { computed, onMounted, ref } from "vue";
import { chatWithTutor, getAiUsageSummary, getTutorHistory } from "@/services/aiService";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import UsageCounter from "@/components/ai/UsageCounter.vue";
import TypewriterText from "@/components/ai/TypewriterText.vue";

const auth = useAuthStore();
const ui = useUiStore();

const subject = ref("Mathematics");
const classLevel = ref("Junior Secondary");
const prompt = ref("");
const loading = ref(false);
const statusMessage = ref("");
const usage = ref(null);
const configured = ref(true);
const conversations = ref([]);
const activeConversation = ref(null);
const animateLatestResponse = ref(false);

const subjectOptions = [
  "Mathematics",
  "Science",
  "English",
  "Coding",
  "Social Studies",
  "Economics",
];

const classOptions = [
  "Primary",
  "Junior Secondary",
  "Senior Secondary",
  "Undergraduate",
];

const schoolId = computed(() => auth.school?._id || auth.user?.schoolId || "");
const messages = computed(() => activeConversation.value?.messages || []);

const applyConversation = (conversation, { animate = false } = {}) => {
  activeConversation.value = conversation;
  if (conversation) {
    subject.value = conversation.subject || subject.value;
    classLevel.value = conversation.classLevel || classLevel.value;
  }
  animateLatestResponse.value = animate;
};

const refreshUsage = async () => {
  const summary = await getAiUsageSummary();
  usage.value = summary.usage;
  configured.value = summary.configured;
};

const refreshHistory = async () => {
  conversations.value = await getTutorHistory();
  if (!activeConversation.value && conversations.value[0]) {
    applyConversation(conversations.value[0]);
  }
};

const sendQuestion = async () => {
  if (!prompt.value.trim()) {
    statusMessage.value = "Enter a question to continue.";
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    const response = await chatWithTutor({
      schoolId: schoolId.value,
      subject: subject.value,
      classLevel: classLevel.value,
      prompt: prompt.value,
      conversationId: activeConversation.value?._id,
    });

    usage.value = response.usage;
    configured.value = response.configured;
    prompt.value = "";

    const nextConversation = response.conversation;
    const existingIndex = conversations.value.findIndex(
      (conversation) => conversation._id === nextConversation._id
    );

    if (existingIndex >= 0) {
      conversations.value.splice(existingIndex, 1, nextConversation);
    } else {
      conversations.value.unshift(nextConversation);
    }

    conversations.value = [...conversations.value].sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
    );
    applyConversation(nextConversation, { animate: true });
  } catch (error) {
    statusMessage.value = error.response?.data?.message || "AI tutor is unavailable right now.";
    ui.pushToast({
      title: "Tutor unavailable",
      message: statusMessage.value,
      tone: "error",
    });
  } finally {
    loading.value = false;
  }
};

const copyText = async (text) => {
  await navigator.clipboard.writeText(text);
  ui.pushToast({
    title: "Copied",
    message: "The tutor response was copied to your clipboard.",
    tone: "success",
  });
};

onMounted(async () => {
  try {
    await Promise.all([refreshUsage(), refreshHistory()]);
  } catch (error) {
    statusMessage.value = error.response?.data?.message || "Unable to load the AI tutor.";
  }
});
</script>

<template>
  <div class="dashboard ai-page">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">AI Student Tutor</h1>
        <p class="page-subtitle">
          Ask academic questions and get friendly explanations tuned to your class level.
        </p>
      </div>
    </header>

    <UsageCounter :usage="usage" feature="ai_student_tutor" />

    <section v-if="!configured" class="card panel info-banner">
      OpenAI is not configured on the backend yet. Add `OPENAI_API_KEY` in the backend environment to enable live tutor responses.
    </section>

    <section v-if="statusMessage" class="card panel error-banner">
      {{ statusMessage }}
    </section>

    <section class="ai-grid">
      <aside class="card panel history-panel">
        <div class="section-head">
          <div>
            <h2 class="section-title">Recent Chats</h2>
            <p class="section-copy">Your tutor history is saved per student account.</p>
          </div>
        </div>

        <button
          v-for="conversation in conversations"
          :key="conversation._id"
          type="button"
          class="history-card"
          :class="{ active: activeConversation?._id === conversation._id }"
          @click="applyConversation(conversation)"
        >
          <strong>{{ conversation.title || "Untitled chat" }}</strong>
          <span>{{ conversation.subject || "General" }}</span>
        </button>

        <div v-if="conversations.length === 0" class="empty">
          Your questions will start appearing here after the first tutor response.
        </div>
      </aside>

      <section class="card panel tutor-panel">
        <div class="form-grid">
          <select v-model="subject" class="input">
            <option v-for="item in subjectOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>

          <select v-model="classLevel" class="input">
            <option v-for="item in classOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <div class="chat-window">
          <article
            v-for="(message, index) in messages"
            :key="`${message.role}-${message.createdAt}-${index}`"
            class="message-row"
            :class="message.role"
          >
            <div class="message-card">
              <p class="message-role">
                {{ message.role === "assistant" ? "EduPro Tutor" : "You" }}
              </p>
              <p class="message-copy">
                <TypewriterText
                  v-if="
                    message.role === 'assistant' &&
                    animateLatestResponse &&
                    index === messages.length - 1
                  "
                  :text="message.content"
                />
                <span v-else>{{ message.content }}</span>
              </p>
              <button
                v-if="message.role === 'assistant'"
                type="button"
                class="copy-btn"
                @click="copyText(message.content)"
              >
                Copy response
              </button>
            </div>
          </article>

          <article v-if="loading" class="message-row assistant">
            <div class="message-card typing-card">
              <p class="message-role">EduPro Tutor</p>
              <div class="typing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </article>

          <div v-if="messages.length === 0 && !loading" class="empty">
            Start with a question like “Explain fractions with examples” or “Help me debug this loop.”
          </div>
        </div>

        <div class="composer">
          <textarea
            v-model="prompt"
            rows="4"
            class="input"
            placeholder="Ask your question here..."
          />

          <button type="button" class="btn btn-primary" :disabled="loading" @click="sendQuestion">
            {{ loading ? "Thinking..." : "Ask Tutor" }}
          </button>
        </div>
      </section>
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

.ai-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 18px;
}

.history-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.64);
  color: var(--text-main);
  text-align: left;
  padding: 14px 16px;
}

.history-card span,
.section-copy {
  color: var(--text-soft);
}

.history-card.active {
  border-color: rgba(15, 118, 110, 0.36);
  background: rgba(15, 118, 110, 0.1);
}

.chat-window {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 420px;
  margin: 18px 0;
}

.message-row {
  display: flex;
}

.message-row.user {
  justify-content: flex-end;
}

.message-card {
  max-width: min(680px, 100%);
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.82);
}

.message-row.user .message-card {
  background: rgba(37, 99, 235, 0.1);
}

.message-role {
  margin: 0 0 10px;
  font-weight: 700;
}

.message-copy {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
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

.composer {
  display: grid;
  gap: 12px;
}

.typing-card {
  min-width: 180px;
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
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

@media (max-width: 960px) {
  .ai-grid {
    grid-template-columns: 1fr;
  }
}
</style>
