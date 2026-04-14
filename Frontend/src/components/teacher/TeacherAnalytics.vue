<script setup>
import { computed, onMounted, ref } from "vue";
import { getTeacherResults } from "@/services/resultService";

const results = ref([]);

const fetchResults = async () => {
  results.value = await getTeacherResults();
};

const totalStudents = computed(
  () => new Set(results.value.map((result) => result.student?._id).filter(Boolean)).size
);

const averageScore = computed(() => {
  if (!results.value.length) return 0;
  return Math.round(
    results.value.reduce((sum, result) => sum + Number(result.score || 0), 0) /
      results.value.length
  );
});

const passRate = computed(() => {
  if (!results.value.length) return 0;
  const passCount = results.value.filter((result) => Number(result.score) >= 50).length;
  return Math.round((passCount / results.value.length) * 100);
});

onMounted(fetchResults);
</script>

<template>
  <section class="card analytics-card">
    <h2 class="section-title">Class Analytics</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <p>Total Students</p>
        <h3>{{ totalStudents }}</h3>
      </div>
      <div class="stat-card">
        <p>Average Score</p>
        <h3>{{ averageScore }}</h3>
      </div>
      <div class="stat-card">
        <p>Pass Rate</p>
        <h3>{{ passRate }}%</h3>
      </div>
    </div>
  </section>
</template>

<style scoped>
.analytics-card {
  padding: 24px;
}
</style>
