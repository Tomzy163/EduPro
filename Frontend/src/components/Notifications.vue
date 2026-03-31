<script setup>
import { ref, onMounted } from "vue";
import { getMessages } from "../services/messageService";
import socket from "../services/socket";

const messages = ref([]);
const unreadCount = ref(0);

const user = JSON.parse(localStorage.getItem("user"));

onMounted(async () => {
  messages.value = await getMessages();
  unreadCount.value = messages.value.length;

  // Register user to socket
  socket.emit("register", user._id);

  // Listen for new messages
  socket.on("newMessage", (msg) => {
    messages.value.unshift(msg);
    unreadCount.value++;
  });
});
</script>

<template>
  <div class="bg-white p-4 shadow rounded">
    <h3 class="font-bold mb-2">
      Notifications 🔔
      <span class="bg-red-500 text-white px-2 py-1 rounded text-sm">
        {{ unreadCount }}
      </span>
    </h3>

    <div v-for="m in messages" :key="m._id" class="border-b py-2">
      <h4 class="font-semibold">{{ m.title }}</h4>
      <p class="text-sm">{{ m.content }}</p>
    </div>
  </div>
</template>