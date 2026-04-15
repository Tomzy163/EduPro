export const SUBSCRIPTION_PLANS = {
  trial: {
    name: "Free Trial",
    summary: "30-day access for new schools.",
  },
  normal: {
    name: "Normal Plan",
    summary: "Core school operations for smaller schools.",
  },
  supreme: {
    name: "Supreme Plan",
    summary: "Expanded reporting and collaboration tools.",
  },
  gold: {
    name: "Gold Plan",
    summary: "High-capacity access for fast-growing schools.",
  },
  platinum: {
    name: "Platinum Plan",
    summary: "Full premium access for large institutions.",
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
  };
};
