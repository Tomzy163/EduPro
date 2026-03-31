<script setup>
import { onMounted, ref } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  results: Array,
});

const canvasRef = ref(null);

onMounted(() => {
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
          borderWidth: 1,
        },
      ],
    },
  });
});
</script>

<template>
  <canvas ref="canvasRef"></canvas>
</template>