<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import Chart from "chart.js/auto";
import { getDashboardSummary } from "../services/schoolService";

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
    const summary = await getDashboardSummary();

    stats.value.students = summary.users?.students || 0;
    stats.value.teachers = summary.users?.teachers || 0;
    stats.value.parents = summary.users?.parents || 0;
    stats.value.totalPayments = summary.payments?.total || 0;
    stats.value.revenue = Number(summary.revenue || 0);

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
              summary.payments?.approved || 0,
              summary.payments?.pending || 0,
              summary.payments?.rejected || 0,
            ],
            backgroundColor: ["#15803d", "#f59e0b", "#dc2626"],
          },
        ],
      },
    });
  } catch (error) {
    console.error("Failed to load admin analytics:", error);
  }
});

onBeforeUnmount(() => {
  if (userChart) userChart.destroy();
  if (paymentChart) paymentChart.destroy();
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
