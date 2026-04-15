<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/authStore";
import { getSubscriptionStatus, subscribeSchool } from "@/services/authService";

const router = useRouter();
const auth = useAuthStore();

const school = ref(null);
const subscription = ref(null);
const loading = ref(false);
const activePlan = ref("");
const error = ref("");
const success = ref("");

const editablePlanPrices = {
  normal: 75000,
  supreme: 100000,
  gold: 150000,
  platinum: 200000,
};

const planDescriptions = {
  normal: [
    "User management",
    "Course and timetable setup",
    "Attendance and result tracking",
  ],
  supreme: [
    "Everything in Normal",
    "Priority communication tools",
    "Better reporting workflow",
  ],
  gold: [
    "Everything in Supreme",
    "High-volume school operations",
    "Advanced monitoring support",
  ],
  platinum: [
    "Everything in Gold",
    "Best-fit for large institutions",
    "Maximum access across the platform",
  ],
};

const trialMessage = computed(() => {
  if (!subscription.value) {
    return "";
  }

  if (subscription.value.status === "active") {
    return `Your school is currently on the ${subscription.value.plan} plan.`;
  }

  if (subscription.value.daysLeftInTrial > 0) {
    return `${subscription.value.daysLeftInTrial} day(s) left in your free trial.`;
  }

  return "Your free trial has ended. Choose a plan to restore full access.";
});

const plans = computed(() =>
  (subscription.value?.availablePlans || []).map((plan) => ({
    ...plan,
    price: editablePlanPrices[plan.id] ?? plan.price ?? 0,
  }))
);

const paymentDetails = computed(() => subscription.value?.paymentDetails || {});

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const loadSubscription = async () => {
  const data = await getSubscriptionStatus();
  school.value = data.school;
  subscription.value = data.subscription;
  auth.updateSubscription(data.subscription);
};

const activatePlan = async (plan) => {
  try {
    loading.value = true;
    activePlan.value = plan;
    error.value = "";
    success.value = "";

    const data = await subscribeSchool(plan);
    subscription.value = data.subscription;
    school.value = data.school;
    auth.updateSubscription(data.subscription);
    success.value = data.message;

    setTimeout(() => {
      router.push("/dashboard/admin");
    }, 900);
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to activate this plan right now.";
  } finally {
    loading.value = false;
    activePlan.value = "";
  }
};

onMounted(async () => {
  try {
    await loadSubscription();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load subscription details.";
  }
});
</script>

<template>
  <div class="subscription-page">
    <div class="subscription-shell">
      <header class="hero card">
        <p class="eyebrow">School Access Control</p>
        <h1>{{ school?.name || "School Subscription" }}</h1>
        <p class="hero-copy">{{ trialMessage }}</p>

        <div v-if="subscription" class="status-row">
          <span class="pill status">{{ subscription.status }}</span>
          <span class="pill plan">{{ subscription.plan }}</span>
        </div>

        <p v-if="error" class="banner danger">{{ error }}</p>
        <p v-if="success" class="banner success">{{ success }}</p>
      </header>

      <section class="card payment-card">
        <div>
          <p class="eyebrow">Subscription Payment Details</p>
          <h2>Plan Pricing And Account Details</h2>
          <p class="section-copy">
            The plan prices shown below can be updated directly inside this page, and the bank details come from your backend environment settings.
          </p>
        </div>

        <div class="payment-grid">
          <article class="payment-pill">
            <span>Bank Name</span>
            <strong>{{ paymentDetails.bankName || "Set SUBSCRIPTION_BANK_NAME in backend/.env" }}</strong>
          </article>
          <article class="payment-pill">
            <span>Account Name</span>
            <strong>{{ paymentDetails.accountName || "Set SUBSCRIPTION_ACCOUNT_NAME in backend/.env" }}</strong>
          </article>
          <article class="payment-pill">
            <span>Account Number</span>
            <strong>{{ paymentDetails.accountNumber || "Set SUBSCRIPTION_ACCOUNT_NUMBER in backend/.env" }}</strong>
          </article>
          <article class="payment-pill payment-note">
            <span>Activation Note</span>
            <strong>{{
              paymentDetails.note || "After confirming payment, click the plan below to activate it immediately."
            }}</strong>
          </article>
        </div>
      </section>

      <section class="plans-grid">
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="card plan-card"
        >
          <div class="plan-head">
            <div>
              <h2>{{ plan.name }}</h2>
              <p>{{ plan.summary }}</p>
              <strong class="price">{{ formatCurrency(plan.price) }}</strong>
            </div>
            <span
              v-if="subscription?.plan === plan.id && subscription?.status === 'active'"
              class="active-tag"
            >
              Active
            </span>
          </div>

          <ul class="feature-list">
            <li v-for="feature in planDescriptions[plan.id]" :key="feature">
              {{ feature }}
            </li>
          </ul>

          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="activatePlan(plan.id)"
          >
            {{
              loading && activePlan === plan.id
                ? "Activating..."
                : subscription?.plan === plan.id && subscription?.status === "active"
                  ? "Current Plan"
                  : `Pay And Activate ${plan.name}`
            }}
          </button>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped>
.subscription-page {
  min-height: 100vh;
  padding: 32px 18px;
  background:
    radial-gradient(circle at top left, rgba(14, 116, 144, 0.18), transparent 34%),
    linear-gradient(180deg, #f8fafc, #e2e8f0);
}

.subscription-shell {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.hero {
  padding: 28px;
}

.eyebrow {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  color: #0f766e;
  font-weight: 700;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.2rem);
}

.hero-copy {
  margin: 10px 0 0;
  color: var(--text-soft);
  max-width: 700px;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 999px;
  font-weight: 700;
  text-transform: capitalize;
}

.status {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.plan {
  background: rgba(30, 64, 175, 0.12);
  color: #1d4ed8;
}

.banner {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 600;
}

.banner.success {
  background: rgba(22, 163, 74, 0.12);
  color: #166534;
}

.banner.danger {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.payment-card {
  padding: 24px;
  display: grid;
  gap: 18px;
  background:
    radial-gradient(circle at top right, rgba(29, 78, 216, 0.12), transparent 30%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.97), rgba(241, 245, 249, 0.95));
}

.section-copy {
  margin: 8px 0 0;
  color: var(--text-soft);
}

.payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.payment-pill {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.payment-pill span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.payment-pill strong {
  color: #0f172a;
}

.payment-note {
  grid-column: 1 / -1;
}

.plan-card {
  padding: 24px;
  display: grid;
  gap: 18px;
}

.plan-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.plan-head h2 {
  margin: 0;
}

.plan-head p {
  margin: 8px 0 0;
  color: var(--text-soft);
}

.price {
  display: inline-block;
  margin-top: 14px;
  font-size: 1.5rem;
  color: #0f172a;
}

.active-tag {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.14);
  color: #166534;
  font-size: 0.82rem;
  font-weight: 700;
}

.feature-list {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  display: grid;
  gap: 10px;
}
</style>
