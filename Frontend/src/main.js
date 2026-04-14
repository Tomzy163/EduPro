import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { connectSocket } from "./services/socket";
import "./style.css";
import "@/assets/dashboard.css";

try {
  const storedUser = JSON.parse(sessionStorage.getItem("user"));
  if (storedUser?._id || storedUser?.id) {
    connectSocket(storedUser._id || storedUser.id);
  }
} catch {
  // Ignore malformed session data during bootstrap.
}

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
