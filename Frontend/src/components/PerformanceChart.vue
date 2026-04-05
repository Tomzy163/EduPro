<script setup>
import { onMounted, ref } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  results: Array,       // for PerformanceChart
  attendance: Array,    // for AttendanceChart
});

const canvasRef = ref(null);


let chartInstance = null;

onMounted(() => {
  if (!props.results) return;

  const labels = props.results.map(r => r.course?.name);
  const scores = props.results.map(r => r.score);

  new Chart(canvasRef.value, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Scores",
          data: scores,
          backgroundColor: "#3b82f6",
        },
      ],
    },
  });
});
</script>

<template>
  <canvas ref="canvasRef"></canvas>
</template>

<style scoped>
canvas {
  width: 100% !important;
  max-height: 400px;
  margin-top: 1rem;
}
</style>