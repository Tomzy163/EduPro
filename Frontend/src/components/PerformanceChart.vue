<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  results: {
    type: Array,
    default: () => [],
  },
});

const canvasRef = ref(null);
let chartInstance = null;

const renderChart = () => {
  if (!canvasRef.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvasRef.value, {
    type: "bar",
    data: {
      labels: props.results.map((result) => result.course?.name || "Course"),
      datasets: [
        {
          label: "Scores",
          data: props.results.map((result) => Number(result.score || 0)),
          backgroundColor: "#1d4ed8",
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

watch(() => props.results, renderChart, { deep: true });

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
