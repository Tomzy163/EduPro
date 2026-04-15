<script setup>
import { computed } from "vue";

const school = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("school"));
  } catch {
    return null;
  }
})();

const subscription = computed(() => school?.subscription || null);

const statusCopy = computed(() => {
  if (!subscription.value) {
    return "Subscription details will appear here once the admin account is active.";
  }

  if (subscription.value.status === "active") {
    return `The school is running on the ${subscription.value.plan} plan.`;
  }

  if (subscription.value.daysLeftInTrial > 0) {
    return `${subscription.value.daysLeftInTrial} day(s) remain in the free trial.`;
  }

  return "The free trial has ended. Renew the school plan to restore full access.";
});
</script>

<template>
  <section class="card billing-card">
    <div class="section-head">
      <div>
        <h2 class="section-title">Billing And Access</h2>
        <p class="section-copy">{{ statusCopy }}</p>
      </div>
      <router-link to="/subscription" class="btn btn-primary">
        Manage Plan
      </router-link>
    </div>

    <div class="grid-3">
      <article class="stat-card accent-teal">
        <p>Current Plan</p>
        <h3>{{ subscription?.plan || "trial" }}</h3>
      </article>
      <article class="stat-card accent-slate">
        <p>Status</p>
        <h3>{{ subscription?.status || "trial" }}</h3>
      </article>
      <article class="stat-card accent-gold">
        <p>Trial Days Left</p>
        <h3>{{ subscription?.daysLeftInTrial ?? 0 }}</h3>
      </article>
    </div>
  </section>
</template>

<style scoped>
.billing-card {
  padding: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.section-copy {
  margin: 6px 0 0;
  color: var(--text-soft);
}

@media (max-width: 768px) {
  .section-head {
    flex-direction: column;
  }
}
</style>
