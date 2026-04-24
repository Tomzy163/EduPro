import { defineStore } from "pinia";

const THEME_STORAGE_KEY = "edupro-theme";

const getStoredTheme = () => {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const useUiStore = defineStore("ui", {
  state: () => ({
    theme: getStoredTheme(),
    toasts: [],
  }),

  actions: {
    applyTheme(theme = this.theme) {
      this.theme = theme === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", this.theme);

      try {
        localStorage.setItem(THEME_STORAGE_KEY, this.theme);
      } catch {
        // Ignore local storage write errors.
      }
    },

    toggleTheme() {
      this.applyTheme(this.theme === "dark" ? "light" : "dark");
    },

    pushToast({ title = "Notice", message = "", tone = "info", timeout = 4200 }) {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      this.toasts.push({
        id,
        title,
        message,
        tone,
      });

      if (timeout > 0) {
        window.setTimeout(() => this.dismissToast(id), timeout);
      }

      return id;
    },

    dismissToast(id) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    },
  },
});
