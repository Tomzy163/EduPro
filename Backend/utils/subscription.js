export const SUBSCRIPTION_PLANS = {
  trial: {
    name: "Free Trial",
    summary: "30-day access for new schools.",
  },
  normal: {
    name: "Normal Plan",
    summary: "Core school operations for smaller schools.",
    price: 75000,
  },
  supreme: {
    name: "Supreme Plan",
    summary: "Expanded reporting and collaboration tools.",
    price: 100000,
  },
  gold: {
    name: "Gold Plan",
    summary: "High-capacity access for fast-growing schools.",
    price: 150000,
  },
  platinum: {
    name: "Platinum Plan",
    summary: "Full premium access for large institutions.",
    price: 200000,
  },
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_DURATION_DAYS = 30;

const resolvePaidPlanExpiry = (school) => {
  if (school?.subscriptionEndsAt) {
    return school.subscriptionEndsAt;
  }

  if (!school?.subscriptionStartedAt) {
    return null;
  }

  return new Date(
    new Date(school.subscriptionStartedAt).getTime() +
      SUBSCRIPTION_DURATION_DAYS * DAY_IN_MS
  );
};

export const getSubscriptionSnapshot = (school) => {
  const now = Date.now();
  const trialEndsAt = school?.trialEndsAt ? new Date(school.trialEndsAt).getTime() : null;
  const paidPlanEndsAt = resolvePaidPlanExpiry(school);
  const paidPlanEndsAtMs = paidPlanEndsAt ? new Date(paidPlanEndsAt).getTime() : null;
  const isTrialActive =
    school?.subscriptionStatus === "trial" && trialEndsAt && trialEndsAt > now;
  const isPaidActive =
    school?.subscriptionStatus === "active" &&
    (!paidPlanEndsAtMs || paidPlanEndsAtMs > now);
  const hasAppAccess = Boolean(isTrialActive || isPaidActive);

  let status = school?.subscriptionStatus || "trial";
  if (!hasAppAccess && status !== "active") {
    status = "expired";
  }

  if (!hasAppAccess && school?.subscriptionStatus === "active") {
    status = "expired";
  }

  return {
    plan: school?.currentPlan || "trial",
    status,
    trialStartedAt: school?.trialStartedAt || null,
    trialEndsAt: school?.trialEndsAt || null,
    subscribedAt: school?.subscribedAt || null,
    subscriptionStartedAt: school?.subscriptionStartedAt || null,
    subscriptionEndsAt: paidPlanEndsAt || null,
    hasAppAccess,
    limitedAccess: !hasAppAccess,
    daysLeftInTrial:
      isTrialActive && trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt - now) / DAY_IN_MS))
        : 0,
    daysLeftInPaidPlan:
      isPaidActive && paidPlanEndsAtMs
        ? Math.max(0, Math.ceil((paidPlanEndsAtMs - now) / DAY_IN_MS))
        : 0,
    availablePlans: Object.entries(SUBSCRIPTION_PLANS)
      .filter(([key]) => key !== "trial")
      .map(([key, value]) => ({
        id: key,
        ...value,
      })),
    paymentDetails: {
      provider: "Paystack",
      currency: process.env.PAYSTACK_CURRENCY || "NGN",
      paystackEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
      note:
        process.env.SUBSCRIPTION_PAYMENT_NOTE ||
        "Payments are processed securely by Paystack and activated automatically by webhook.",
    },
  };
};

export const getSubscriptionDurationDays = () => SUBSCRIPTION_DURATION_DAYS;
