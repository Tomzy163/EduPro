import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";           // your router/index.js
import { createPinia } from "pinia";
import './style.css';                     // Tailwind or other CSS

const app = createApp(App);

// 1️⃣ Create Pinia instance and register it
const pinia = createPinia();
app.use(pinia);  // must be before any store usage

// 2️⃣ Register Vue Router
app.use(router);

// 3️⃣ Mount the app
app.mount("#app");