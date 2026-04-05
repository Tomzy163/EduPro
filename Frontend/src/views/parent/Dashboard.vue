<script setup>
import { ref, onMounted } from "vue";
import API from "../../services/api";
import { createPayment } from "../../services/paymentService";
import Notifications from "../../components/Notifications.vue";
import socket from "@/socket";




const children = ref([]);
const selectedChild = ref("");
const results = ref([]);

// Payment
const amount = ref("");
const receipt = ref(null);

const user = JSON.parse(sessionStorage.getItem("user"));

// Fetch children
const fetchData = async () => {
  const res = await API.get("/users");
  const parent = res.data.find(u => u._id === user._id);
  children.value = parent?.children || [];
};
onMounted(() => {
  socket.on("message", (msg) => {
    console.log(msg);
    alert(msg.title);
  });
});

// Get child results
const getResults = async () => {
  if (!selectedChild.value) return;
  const res = await API.get(`/results/student/${selectedChild.value}`);
  results.value = res.data;
};

// Handle file upload
const handleFile = (e) => {
  receipt.value = e.target.files[0];
};

// Submit payment
const submitPayment = async () => {
  const formData = new FormData();
  formData.append("amount", amount.value);
  formData.append("receipt", receipt.value);

  await createPayment(formData);
  alert("Payment submitted");
};

onMounted(fetchData);
</script>

<template>
  <div class="dashboard">
    <h1>Parent Dashboard</h1>
    <Notifications />

    <!-- Select Child -->
    <div class="card">
      <h3>Select Child</h3>
      <select v-model="selectedChild" @change="getResults">
        <option disabled value="">Select Child</option>
        <option v-for="c in children" :key="c._id" :value="c._id">{{ c.name }}</option>
      </select>
    </div>

    <!-- Child Results -->
    <div class="card">
      <h3>Child Results</h3>
      <table>
        <thead>
          <tr>
            <th>Course</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in results" :key="r._id">
            <td>{{ r.course?.name }}</td>
            <td>{{ r.status }}</td>
            <td>{{ new Date(r.date).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payment Section -->
    <div class="card">
      <h3>Make Payment</h3>
      <input v-model="amount" placeholder="Amount" type="number" />
      <input type="file" @change="handleFile" />
      <button @click="submitPayment">Upload Receipt</button>
    </div>
  </div>
</template>

<style scoped>
.dashboard h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-bottom: 1.5rem;
}

.card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

select, input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.75rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

button {
  background-color: #3b82f6;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #2563eb;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background-color: #f9fafb;
}
</style>