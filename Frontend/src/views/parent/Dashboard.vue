<script setup>
import { ref, onMounted } from "vue";
import API from "../../services/api";
import { createPayment } from "../../services/paymentService";
import Notifications from "../../components/Notifications.vue";

const children = ref([]);
const selectedChild = ref("");
const results = ref([]);

// Payment
const amount = ref("");
const receipt = ref(null);

const user = JSON.parse(localStorage.getItem("user"));

// Fetch children + results
const fetchData = async () => {
  const res = await API.get("/users"); // admin route, improve later

  const parent = res.data.find(u => u._id === user._id);

  children.value = parent?.children || [];
};

// Get child results
const getResults = async () => {
  const res = await API.get(`/results/student/${selectedChild}`);
  results.value = res.data;
};

// Handle file
const handleFile = (e) => {
  receipt.value = e.target.files[0];
};

// Upload payment
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
  <div>
    <h1>Parent Dashboard</h1>
    <Notifications />

    <!-- SELECT CHILD -->
    <h3>Select Child</h3>
    <select v-model="selectedChild" @change="getResults">
      <option disabled value="">Select Child</option>
      <option v-for="c in children" :value="c._id">
        {{ c.name }}
      </option>
    </select>

    <hr />

    <!-- CHILD RESULTS -->
    <h2>Child Results</h2>
    <table border="1">
  <thead>
    <tr>
      <th>Course</th>
      <th>Status</th>
      <th>Date</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="r in results"  :key="r.id">
      <td>{{r.course }}</td>
      <td>{{ r.status }}</td>
      <td>{{ r.date }}</td>
    </tr>
  </tbody>
</table>

    <hr />

    <!-- PAYMENT -->
    <h2>Make Payment</h2>

    <input v-model="amount" placeholder="Amount" type="number" />
    <input type="file" @change="handleFile" />

    <button @click="submitPayment">Upload Receipt</button>
  </div>
</template>