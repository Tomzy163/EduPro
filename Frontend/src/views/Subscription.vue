<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/authStore";
import {
  getSubscriptionStatus,
  subscribeSchool,
  verifySubscriptionPayment,
} from "@/services/authService";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const school = ref(null);
const subscription = ref(null);
const loading = ref(false);
const activePlan = ref("");
const error = ref("");
const success = ref("");
const verifyingReference = ref("");

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
const paymentCurrency = computed(() => paymentDetails.value.currency || "NGN");
const paystackReady = computed(() => Boolean(paymentDetails.value.paystackEnabled));

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: paymentCurrency.value,
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

    const data = await subscribeSchool({ plan });
    success.value = data.message || "Redirecting to secure checkout...";

    if (data.authorizationUrl) {
      window.location.assign(data.authorizationUrl);
      return;
    }

    throw new Error("Paystack checkout URL was not returned by the server.");
  } catch (err) {
    error.value =
      err.response?.data?.message || err.message || "Unable to start this payment right now.";
  } finally {
    loading.value = false;
    activePlan.value = "";
  }
};

const verifyReturnedPayment = async () => {
  const reference = String(route.query.reference || route.query.trxref || "").trim();

  if (!reference) {
    return;
  }

  try {
    verifyingReference.value = reference;
    error.value = "";
    success.value = "Confirming your payment and waiting for the webhook to finalize access...";

    const data = await verifySubscriptionPayment(reference);
    subscription.value = data.subscription;
    school.value = data.school;
    auth.updateSubscription(data.subscription);
    success.value = data.message;

    await router.replace({ path: route.path, query: {} });

    setTimeout(() => {
      router.push("/dashboard/admin");
    }, 900);
  } catch (err) {
    error.value =
      err.response?.data?.message || "Payment returned from Paystack, but verification is still pending.";
  } finally {
    verifyingReference.value = "";
  }
};

onMounted(async () => {
  try {
    await loadSubscription();
    await verifyReturnedPayment();
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
          <p class="eyebrow">Secure Payment Flow</p>
          <h2>Paystack Checkout And Automatic Activation</h2>
          <p class="section-copy">
            Subscription checkout now runs through Paystack, and your school is activated automatically by a verified backend webhook after a successful payment.
          </p>
          <p v-if="!paystackReady" class="banner danger config-banner">
            Paystack is not configured on the backend yet. Add your `PAYSTACK_SECRET_KEY` and webhook URL before starting live subscription payments.
          </p>
        </div>

        <div class="payment-grid">
          <article class="payment-pill payment-note">
            <span>Provider</span>
            <strong>{{ paymentDetails.provider || "Paystack" }}</strong>
          </article>
          <article class="payment-pill">
            <span>Currency</span>
            <strong>{{ paymentDetails.currency || "NGN" }}</strong>
          </article>
          <article class="payment-pill">
            <span>Webhook</span>
            <strong>/api/auth/paystack/webhook</strong>
          </article>
          <article class="payment-pill">
            <span>Verification</span>
            <strong>Webhook first, backup verify on return</strong>
          </article>
          <article class="payment-pill payment-note">
            <span>Automation Note</span>
            <strong>{{
              paymentDetails.note || "No receipt upload and no manual activate button are required anymore."
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
            :disabled="loading || verifyingReference || !paystackReady"
            @click="activatePlan(plan.id)"
          >
            {{
              !paystackReady
                ? "Paystack Not Ready"
                : loading && activePlan === plan.id
                  ? "Redirecting..."
                  : verifyingReference
                    ? "Verifying payment..."
                  : subscription?.plan === plan.id && subscription?.status === "active"
                    ? "Current Plan"
                    : `Pay ${plan.name}`
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

.config-banner {
  margin-top: 18px;
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

.proof-upload {
  display: grid;
  gap: 10px;
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
