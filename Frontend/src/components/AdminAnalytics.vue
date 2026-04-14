<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";
import { getUsers, getPayments } from "../services/analyticsService";

const users = ref([]);
const payments = ref([]);
const userChartRef = ref(null);
const paymentChartRef = ref(null);

let userChart = null;
let paymentChart = null;

const stats = ref({
  students: 0,
  teachers: 0,
  parents: 0,
  totalPayments: 0,
  revenue: 0,
});

onMounted(async () => {
  try {
    users.value = await getUsers();
    payments.value = await getPayments();
  } catch (error) {
    console.error("Failed to load admin analytics:", error);
  }

  stats.value.students = users.value.filter((user) => user.role === "student").length;
  stats.value.teachers = users.value.filter((user) => user.role === "teacher").length;
  stats.value.parents = users.value.filter((user) => user.role === "parent").length;
  stats.value.totalPayments = payments.value.length;
  stats.value.revenue = payments.value
    .filter((payment) => payment.status === "approved")
    .reduce((acc, payment) => acc + Number(payment.amount || 0), 0);

  if (userChart) userChart.destroy();
  if (paymentChart) paymentChart.destroy();

  userChart = new Chart(userChartRef.value, {
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
          backgroundColor: ["#0f766e", "#1d4ed8", "#f59e0b"],
          borderRadius: 14,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });

  paymentChart = new Chart(paymentChartRef.value, {
    type: "doughnut",
    data: {
      labels: ["Approved", "Pending", "Rejected"],
      datasets: [
        {
          data: [
            payments.value.filter((payment) => payment.status === "approved").length,
            payments.value.filter((payment) => payment.status === "pending").length,
            payments.value.filter((payment) => payment.status === "rejected").length,
          ],
          backgroundColor: ["#15803d", "#f59e0b", "#dc2626"],
        },
      ],
    },
  });
});
</script>

<template>
  <section class="analytics card">
    <div>
      <h2 class="section-title">School Analytics</h2>
      <p class="analytics-copy">Live counts for users, payments, and total approved revenue.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <p>Students</p>
        <h3>{{ stats.students }}</h3>
      </div>
      <div class="stat-card">
        <p>Teachers</p>
        <h3>{{ stats.teachers }}</h3>
      </div>
      <div class="stat-card">
        <p>Parents</p>
        <h3>{{ stats.parents }}</h3>
      </div>
      <div class="stat-card">
        <p>Payments</p>
        <h3>{{ stats.totalPayments }}</h3>
      </div>
      <div class="stat-card">
        <p>Revenue</p>
        <h3>&#8358;{{ stats.revenue }}</h3>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <canvas ref="userChartRef"></canvas>
      </div>
      <div class="chart-card">
        <canvas ref="paymentChartRef"></canvas>
      </div>
    </div>
  </section>
</template>

<style scoped>
.analytics {
  padding: 24px;
}

.analytics-copy {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.chart-card {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 18px;
}
</style>
