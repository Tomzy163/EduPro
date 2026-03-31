<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";
import { getUsers, getPayments } from "../services/analyticsService";

const users = ref([]);
const payments = ref([]);

const userChartRef = ref(null);
const paymentChartRef = ref(null);

const stats = ref({
  students: 0,
  teachers: 0,
  parents: 0,
  totalPayments: 0,
  revenue: 0,
});

onMounted(async () => {
  users.value = await getUsers();
  payments.value = await getPayments();

  // Calculate stats
  stats.value.students = users.value.filter(u => u.role === "student").length;
  stats.value.teachers = users.value.filter(u => u.role === "teacher").length;
  stats.value.parents = users.value.filter(u => u.role === "parent").length;

  stats.value.totalPayments = payments.value.length;
  stats.value.revenue = payments.value
    .filter(p => p.status === "approved")
    .reduce((acc, p) => acc + p.amount, 0);

  // USER CHART
  new Chart(userChartRef.value, {
    type: "bar",
    data: {
      labels: ["Students", "Teachers", "Parents"],
      datasets: [
        {
          label: "Users",
          data: [
            stats.value.students,
            stats.value.teachers,
            stats.value.parents,
          ],
        },
      ],
    },
  });

  // PAYMENT CHART
  new Chart(paymentChartRef.value, {
    type: "doughnut",
    data: {
      labels: ["Approved", "Pending", "Rejected"],
      datasets: [
        {
          data: [
            payments.value.filter(p => p.status === "approved").length,
            payments.value.filter(p => p.status === "pending").length,
            payments.value.filter(p => p.status === "rejected").length,
          ],
        },
      ],
    },
  });
});
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Analytics</h2>

    <!-- STATS CARDS -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 shadow rounded">
        <h3>Students</h3>
        <p class="text-xl font-bold">{{ stats.students }}</p>
      </div>

      <div class="bg-white p-4 shadow rounded">
        <h3>Teachers</h3>
        <p class="text-xl font-bold">{{ stats.teachers }}</p>
      </div>

      <div class="bg-white p-4 shadow rounded">
        <h3>Payments</h3>
        <p class="text-xl font-bold">{{ stats.totalPayments }}</p>
      </div>

      <div class="bg-white p-4 shadow rounded">
        <h3>Revenue</h3>
        <p class="text-xl font-bold">₦{{ stats.revenue }}</p>
      </div>
    </div>

    <!-- CHARTS -->
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-white p-4 shadow rounded">
        <canvas ref="userChartRef"></canvas>
      </div>

      <div class="bg-white p-4 shadow rounded">
        <canvas ref="paymentChartRef"></canvas>
      </div>
    </div>
  </div>
</template>