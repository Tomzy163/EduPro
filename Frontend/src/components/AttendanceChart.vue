<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  attendance: {
    type: Array,
    default: () => [],
  },
});

const canvasRef = ref(null);
let chartInstance = null;

const renderChart = () => {
  if (!canvasRef.value) return;

  const present = props.attendance.filter((item) => item.status === "present").length;
  const absent = props.attendance.filter((item) => item.status === "absent").length;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvasRef.value, {
    type: "pie",
    data: {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [present, absent],
          backgroundColor: ["#15803d", "#dc2626"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

watch(() => props.attendance, renderChart, { deep: true });

onMounted(renderChart);

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>

<template>
  <div class="chart-shell">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.chart-shell {
  position: relative;
  min-height: 280px;
}
</style>
