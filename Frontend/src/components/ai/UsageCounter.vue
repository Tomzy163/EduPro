<script setup>
defineProps({
  usage: {
    type: Object,
    default: null,
  },
  feature: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="usage-counter card">
    <div>
      <p class="usage-label">AI usage this month</p>
      <h3>{{ usage?.totalUsed ?? 0 }} / {{ usage?.monthlyLimit ?? 0 }}</h3>
      <p class="usage-copy">
        Remaining: {{ usage?.remaining ?? 0 }}
      </p>
    </div>
    <div v-if="feature" class="usage-feature">
      {{ usage?.usageByFeature?.[feature] ?? 0 }} used for this tool
    </div>
  </div>
</template>

<style scoped>
.usage-counter {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
}

.usage-label,
.usage-copy {
  margin: 0;
  color: var(--text-soft);
}

.usage-counter h3 {
  margin: 8px 0 6px;
  font-family: "Outfit", sans-serif;
  font-size: 1.6rem;
}

.usage-feature {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-weight: 700;
}
</style>
