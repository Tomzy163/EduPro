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

export const getSubscriptionSnapshot = (school) => {
  const now = Date.now();
  const trialEndsAt = school?.trialEndsAt ? new Date(school.trialEndsAt).getTime() : null;
  const isTrialActive =
    school?.subscriptionStatus === "trial" && trialEndsAt && trialEndsAt > now;
  const isPaidActive = school?.subscriptionStatus === "active";
  const hasAppAccess = Boolean(isTrialActive || isPaidActive);

  let status = school?.subscriptionStatus || "trial";
  if (!hasAppAccess && status !== "active") {
    status = "expired";
  }

  return {
    plan: school?.currentPlan || "trial",
    status,
    trialStartedAt: school?.trialStartedAt || null,
    trialEndsAt: school?.trialEndsAt || null,
    subscribedAt: school?.subscribedAt || null,
    subscriptionStartedAt: school?.subscriptionStartedAt || null,
    hasAppAccess,
    limitedAccess: !hasAppAccess,
    daysLeftInTrial:
      isTrialActive && trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt - now) / DAY_IN_MS))
        : 0,
    availablePlans: Object.entries(SUBSCRIPTION_PLANS)
      .filter(([key]) => key !== "trial")
      .map(([key, value]) => ({
        id: key,
        ...value,
      })),
    paymentDetails: {
      bankName: process.env.SUBSCRIPTION_BANK_NAME || "",
      accountName: process.env.SUBSCRIPTION_ACCOUNT_NAME || "",
      accountNumber: process.env.SUBSCRIPTION_ACCOUNT_NUMBER || "",
      note: process.env.SUBSCRIPTION_PAYMENT_NOTE || "",
    },
  };
};
