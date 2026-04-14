<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import API from "../../services/api";
import { createPayment } from "../../services/paymentService";
import Navbar from "@/components/Navbar.vue";
import Notifications from "@/components/Notifications.vue";
import socket from "@/socket";

const children = ref([]);
const selectedChild = ref("");
const results = ref([]);
const amount = ref("");
const receipt = ref(null);

const user = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("user")) || {};
  } catch {
    return {};
  }
})();

const fetchData = async () => {
  const res = await API.get("/users");
  const parent = res.data.find((item) => item._id === user._id);
  children.value = parent?.children || [];
};

const getResults = async () => {
  if (!selectedChild.value) return;
  const res = await API.get(`/results/student/${selectedChild.value}`);
  results.value = res.data;
};

const handleFile = (event) => {
  receipt.value = event.target.files[0];
};

const submitPayment = async () => {
  if (!amount.value || !receipt.value) {
    alert("Enter an amount and upload a receipt.");
    return;
  }

  const formData = new FormData();
  formData.append("amount", amount.value);
  formData.append("receipt", receipt.value);

  await createPayment(formData);
  amount.value = "";
  receipt.value = null;
  alert("Payment submitted");
};

const handleMessage = (message) => {
  if (message?.title) {
    alert(message.title);
  }
};

onMounted(async () => {
  await fetchData();
  socket.on("message", handleMessage);
});

onUnmounted(() => {
  socket.off("message", handleMessage);
});
</script>

<template>
  <Navbar />

  <div class="dashboard parent-dashboard">
    <header>
      <h1 class="page-title">Parent Dashboard</h1>
      <p class="page-subtitle">
        Follow your child&rsquo;s results and submit payment receipts from one place.
      </p>
    </header>

    <Notifications />

    <section class="card panel">
      <h2 class="section-title">Select Child</h2>
      <select v-model="selectedChild" @change="getResults" class="input">
        <option disabled value="">Select Child</option>
        <option v-for="child in children" :key="child._id" :value="child._id">
          {{ child.name }}
        </option>
      </select>
    </section>

    <section class="card panel">
      <h2 class="section-title">Child Results</h2>
      <div v-if="results.length === 0" class="empty">
        Select a child to view recent results.
      </div>
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in results" :key="result._id">
              <td>{{ result.course?.name }}</td>
              <td>{{ result.score }}</td>
              <td>{{ result.grade }}</td>
              <td>{{ new Date(result.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card panel">
      <h2 class="section-title">Make Payment</h2>
      <div class="form-grid">
        <input v-model="amount" placeholder="Amount" type="number" class="input" />
        <input type="file" @change="handleFile" class="input" />
      </div>
      <button @click="submitPayment" class="btn btn-primary">Upload Receipt</button>
    </section>
  </div>
</template>

<style scoped>
.parent-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  padding: 24px;
}
</style>
