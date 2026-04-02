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
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvasRef.value, {
    type: "bar",
    data: { labels, datasets: [{ label: "Scores", data: scores, backgroundColor: "#3b82f6" }] },
  });
});
onMounted(() => {
  if (props.results) {
    const labels = props.results.map(r => r.course?.name);
    const scores = props.results.map(r => r.score);

    new Chart(canvasRef.value, {
      type: "bar",
      data: { labels, datasets: [{ label: "Scores", data: scores, backgroundColor: "#3b82f6" }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  if (props.attendance) {
    const present = props.attendance.filter(a => a.status === "present").length;
    const absent = props.attendance.filter(a => a.status === "absent").length;

    new Chart(canvasRef.value, {
      type: "pie",
      data: { labels: ["Present", "Absent"], datasets: [{ data: [present, absent], backgroundColor: ["#10b981", "#ef4444"] }] },
      options: { responsive: true }
    });
  }
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