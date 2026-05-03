<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/store/authStore";
import {
  FEATURE_LABELS,
  FEATURE_REQUIRED_PLAN,
  hasPlanFeature,
} from "@/utils/planAccess";

const props = defineProps({
  feature: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "",
  },
  copy: {
    type: String,
    default: "",
  },
});

const auth = useAuthStore();

const subscription = computed(
  () => auth.school?.subscription || auth.user?.subscription || null
);
const limitedAccess = computed(
  () => subscription.value?.limitedAccess === true || subscription.value?.hasAppAccess === false
);
const allowed = computed(
  () => !limitedAccess.value && hasPlanFeature(subscription.value, props.feature)
);
const title = computed(() => props.title || FEATURE_LABELS[props.feature] || "Feature");
const copy = computed(
  () =>
    props.copy ||
    `${title.value} is available on the ${FEATURE_REQUIRED_PLAN[props.feature] || "required plan"} and above.`
);
const lockedCopy = computed(() => {
  if (!limitedAccess.value) {
    return copy.value;
  }

  return auth.user?.role === "admin"
    ? "Your school subscription needs to be activated or renewed before this feature can be used."
    : "This feature is currently unavailable because the school's subscription needs attention. Contact your school admin.";
});
</script>

<template>
  <slot v-if="allowed" />

  <section v-else class="feature-locked card">
    <span class="locked-pill">{{ limitedAccess ? "Access Paused" : "Plan Locked" }}</span>
    <h2 class="section-title">{{ title }}</h2>
    <p class="section-copy">{{ lockedCopy }}</p>
    <router-link
      v-if="auth.user?.role === 'admin'"
      to="/subscription"
      class="btn btn-primary"
    >
      {{ limitedAccess ? "Manage Subscription" : "Upgrade Plan" }}
    </router-link>
  </section>
</template>

<style scoped>
.feature-locked {
  padding: 24px;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
}

.locked-pill {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(217, 119, 6, 0.12);
  color: #b45309;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.section-copy {
  margin: 8px 0 16px;
  color: var(--text-soft);
}
</style>
