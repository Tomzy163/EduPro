<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { getMessages } from "../services/messageService";
import socket from "@/socket";

const messages = ref([]);
const unreadCount = ref(0);

const user = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("user")) || {};
  } catch {
    return {};
  }
})();

const refreshMessages = async () => {
  messages.value = await getMessages();
  unreadCount.value = messages.value.length;
};

const handleMessage = async () => {
  await refreshMessages();
};

onMounted(async () => {
  await refreshMessages();

  if (user?._id) {
    socket.emit("register", user._id);
  }

  socket.off("message", handleMessage);
  socket.on("message", handleMessage);
});

onUnmounted(() => {
  socket.off("message", handleMessage);
});
</script>

<template>
  <div class="notifications">
    <h3>
      Notifications
      <span class="badge">{{ unreadCount }}</span>
    </h3>
    <div v-for="message in messages" :key="message._id" class="message-item">
      <h4>{{ message.title }}</h4>
      <p>{{ message.content }}</p>
    </div>
  </div>
</template>

<style scoped>
.notifications {
  background: white;
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  padding: 1rem;
  margin-bottom: 1rem;
}

.notifications h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  background-color: #ef4444;
  color: white;
  border-radius: 999px;
  font-size: 0.75rem;
}

.message-item {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 0;
}

.message-item:last-child {
  border-bottom: none;
}

.message-item h4 {
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.message-item p {
  font-size: 0.95rem;
  color: #555555;
}
</style>
