<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";
import { getUsers, getPayments } from "../services/analyticsService";

const users = ref([]);
const payments = ref([]);

const userChartRef = ref(null);
const paymentChartRef = ref(null);

const stats = ref({ students: 0, teachers: 0, parents: 0, totalPayments: 0, revenue: 0 });

onMounted(async () => {
  users.value = await getUsers();
  payments.value = await getPayments();

  stats.value.students = users.value.filter(u => u.role === "student").length;
  stats.value.teachers = users.value.filter(u => u.role === "teacher").length;
  stats.value.parents = users.value.filter(u => u.role === "parent").length;

  stats.value.totalPayments = payments.value.length;
  stats.value.revenue = payments.value.filter(p => p.status === "approved").reduce((acc, p) => acc + p.amount, 0);

  new Chart(userChartRef.value, {
    type: "bar",
    data: {
      labels: ["Students", "Teachers", "Parents"],
      datasets: [{ label: "Users", data: [stats.value.students, stats.value.teachers, stats.value.parents], backgroundColor: "#3b82f6" }]
    }
  });

  new Chart(paymentChartRef.value, {
    type: "doughnut",
    data: {
      labels: ["Approved", "Pending", "Rejected"],
      datasets: [{
        data: [
          payments.value.filter(p => p.status === "approved").length,
          payments.value.filter(p => p.status === "pending").length,
          payments.value.filter(p => p.status === "rejected").length
        ],
        backgroundColor: ["#10b981", "#fbbf24", "#ef4444"]
      }]
    }
  });
});
</script>

<template>
  <div class="analytics-container">
    <h2>Analytics</h2>

    <div class="stats-grid">
      <div class="stat-card"><h3>Students</h3><p>{{ stats.students }}</p></div>
      <div class="stat-card"><h3>Teachers</h3><p>{{ stats.teachers }}</p></div>
      <div class="stat-card"><h3>Payments</h3><p>{{ stats.totalPayments }}</p></div>
      <div class="stat-card"><h3>Revenue</h3><p>₦{{ stats.revenue }}</p></div>
    </div>

    <div class="charts-grid">
      <div class="chart-card"><canvas ref="userChartRef"></canvas></div>
      <div class="chart-card"><canvas ref="paymentChartRef"></canvas></div>
    </div>
  </div>
</template>

<style scoped>
.analytics-container h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  text-align: center;
}

.stat-card h3 {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.stat-card p {
  font-size: 1.25rem;
  font-weight: 600;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.chart-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
</style>