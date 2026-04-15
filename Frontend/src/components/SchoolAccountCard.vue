<script setup>
import { computed } from "vue";

const props = defineProps({
  school: {
    type: Object,
    default: () => ({}),
  },
  title: {
    type: String,
    default: "School Payment Details",
  },
  subtitle: {
    type: String,
    default: "These are the official account details configured by the school admin.",
  },
});

const hasAccountDetails = computed(() =>
  Boolean(
    props.school?.bankName ||
      props.school?.accountName ||
      props.school?.accountNumber ||
      props.school?.paymentInstructions
  )
);
</script>

<template>
  <section class="card account-card">
    <div class="account-copy">
      <p class="eyebrow">Payment Desk</p>
      <h2 class="section-title">{{ title }}</h2>
      <p class="section-copy">{{ subtitle }}</p>
    </div>

    <div v-if="hasAccountDetails" class="account-grid">
      <article class="detail-pill">
        <span>Bank Name</span>
        <strong>{{ school?.bankName || "Not set yet" }}</strong>
      </article>

      <article class="detail-pill">
        <span>Account Name</span>
        <strong>{{ school?.accountName || "Not set yet" }}</strong>
      </article>

      <article class="detail-pill">
        <span>Account Number</span>
        <strong>{{ school?.accountNumber || "Not set yet" }}</strong>
      </article>

      <article v-if="school?.paymentInstructions" class="detail-pill detail-wide">
        <span>Instructions</span>
        <strong>{{ school.paymentInstructions }}</strong>
      </article>
    </div>

    <div v-else class="empty">
      The admin has not added payment account details yet.
    </div>
  </section>
</template>

<style scoped>
.account-card {
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(14, 116, 144, 0.14), transparent 34%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.95));
}

.account-copy {
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.detail-pill {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
}

.detail-pill span {
  display: block;
  margin-bottom: 8px;
  color: var(--text-soft);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.detail-pill strong {
  display: block;
  color: #0f172a;
  font-size: 1.02rem;
}

.detail-wide {
  grid-column: 1 / -1;
}
</style>
