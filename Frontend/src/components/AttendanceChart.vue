<script setup>
import { onMounted, ref } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  attendance: Array,
});

const canvasRef = ref(null);

onMounted(() => {
  const present = props.attendance.filter(a => a.status === "present").length;
  const absent = props.attendance.filter(a => a.status === "absent").length;

  new Chart(canvasRef.value, {
    type: "pie",
    data: {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [present, absent],
        },
      ],
    },
  });
});
</script>

<template>
  <canvas ref="canvasRef"></canvas>
</template>