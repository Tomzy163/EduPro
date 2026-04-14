<script setup>
import { ref, onMounted } from "vue";
import { sendMessage, getMessages } from "@/services/messageService";
import API from "@/services/api";

const title = ref("");
const content = ref("");
const roleTarget = ref("student");
const messages = ref([]);

const fetchMessages = async () => {
  messages.value = await getMessages();
};

onMounted(fetchMessages);

const send = async () => {
  await sendMessage({
    title: title.value,
    content: content.value,
    roleTarget: roleTarget.value,
  });

  title.value = "";
  content.value = "";
  fetchMessages();
};

const deleteMsg = async (id) => {
  await API.delete(`/messages/${id}`);
  fetchMessages();
};

const clearAll = async () => {
  await API.delete("/messages");
  fetchMessages();
};
</script>

<template>
  <section class="card">
    <h2>Announcements</h2>

    <input v-model="title" class="input" placeholder="Title" />
    <textarea v-model="content" class="input"></textarea>

    <select v-model="roleTarget" class="input">
      <option value="student">Students</option>
      <option value="teacher">Teachers</option>
      <option value="parent">Parents</option>
      <option value="all">All</option>
    </select>

    <button @click="send" class="btn success">Send</button>

    <div v-for="msg in messages" :key="msg._id" class="message">
      <h4>{{ msg.title }}</h4>
      <p>{{ msg.content }}</p>
      <button @click="deleteMsg(msg._id)" class="btn danger small">Delete</button>
    </div>

    <button @click="clearAll" class="btn danger">Clear All</button>
  </section>
</template>