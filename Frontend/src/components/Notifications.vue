<script setup>
import { ref, onMounted } from "vue";
import { getMessages } from "../services/messageService";
import socket from "@/socket";

const messages = ref([]);
const unreadCount = ref(0);

const user = JSON.parse(sessionStorage.getItem("user"));

onMounted(async () => {
  messages.value = await getMessages();
  unreadCount.value = messages.value.length;

  socket.emit("register", user._id);
  
  socket.on("register", (userId) => {
  console.log("Received userId:", userId);
});

  socket.off("newMessage");
 socket.on("message", async () => {
  messages.value = await getMessages();
  unreadCount.value = messages.value.length;
});
});
</script>

<template>
  <div class="notifications">
    <h3>
      Notifications 🔔
      <span class="badge">{{ unreadCount }}</span>
    </h3>
    <div v-for="m in messages" :key="m._id" class="message-item">
      <h4>{{ m.title }}</h4>
      <p>{{ m.content }}</p>
    </div>
  </div>
</template>

<style scoped>
.notifications {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  padding: 1rem;
  margin-bottom: 1rem;
}

.notifications h3 {
  font-weight: bold;
  margin-bottom: 0.75rem;
}

.badge {
  background-color: #ef4444;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 50%;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.message-item {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.5rem 0;
}

.message-item h4 {
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.message-item p {
  font-size: 0.875rem;
  color: #555555;
}
</style>