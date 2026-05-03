export const getStoredJson = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getStoredUser = () => getStoredJson("user");

export const getStoredSchool = () => getStoredJson("school");

export const clearStoredSession = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("school");
  sessionStorage.removeItem("token");
};

export const syncStoredSubscription = (subscription) => {
  if (!subscription) {
    return;
  }

  const user = getStoredUser();
  const school = getStoredSchool();

  if (user) {
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        ...user,
        subscription,
      })
    );
  }

  if (school) {
    sessionStorage.setItem(
      "school",
      JSON.stringify({
        ...school,
        subscription,
      })
    );
  }
};
