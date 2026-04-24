<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import API from "../services/api";
import socket from "@/socket";
import { useAuthStore } from "@/store/authStore";
import {
  exportTimetableExcel,
  exportTimetablePdf,
} from "@/utils/timetableExport";

const auth = useAuthStore();
const timetable = ref([]);
const user = computed(() => auth.user || JSON.parse(sessionStorage.getItem("user") || "null") || {});
const school = computed(() => auth.school || JSON.parse(sessionStorage.getItem("school") || "null"));

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const times = [
  "08:00am-09:00am",
  "09:00am-10:00am",
  "10:00am-11:00am",
  "11:00am-12:00pm",
  "12:00pm-01:00pm",
  "01:00pm-02:00pm",
  "02:00pm-03:00pm",
];

const fetchTimetable = async () => {
  const res = await API.get("/timetable");
  timetable.value = res.data;
};

const sortedTimetable = computed(() => [...timetable.value]);

const getSlot = (day, time) => {
  return timetable.value.find((slot) => slot.day === day && slot.time === time);
};

const getColor = (name) => {
  const colors = [
    "bg-blue", "bg-green", "bg-purple",
    "bg-orange", "bg-pink", "bg-indigo"
  ];
  if (!name) return "";
  const index = name.length % colors.length;
  return colors[index];
};

const downloadPdf = async () => {
  if (!sortedTimetable.value.length) {
    alert("No timetable slots are available to download.");
    return;
  }

  await exportTimetablePdf({
    slots: sortedTimetable.value,
    school: school.value,
    schoolName: school.value?.name || user.value?.school || "EduPro School",
    title: `${user.value?.role === "teacher" ? "Teacher" : "Student"} Timetable`,
    subtitle: user.value?.name ? `Prepared for ${user.value.name}` : "",
    fileName: `${(user.value?.name || "user").replace(/\s+/g, "-").toLowerCase()}-timetable.pdf`,
  });
};

const downloadExcel = () => {
  if (!sortedTimetable.value.length) {
    alert("No timetable slots are available to download.");
    return;
  }

  exportTimetableExcel({
    slots: sortedTimetable.value,
    fileName: `${(user.value?.name || "user").replace(/\s+/g, "-").toLowerCase()}-timetable.xlsx`,
    sheetName: "Timetable",
  });
};

onMounted(fetchTimetable);

onMounted(() => {
  socket.on("admin:update", fetchTimetable);
});

onUnmounted(() => {
  socket.off("admin:update", fetchTimetable);
});
</script>

<template>
  <section class="card">
    <div class="section-head">
      <div>
        <h2 class="section-title">My Timetable</h2>
        <p class="section-copy">Review the latest class schedule and export it when needed.</p>
      </div>

      <div class="toolbar">
        <button @click="downloadExcel" class="btn btn-primary">Download Excel</button>
        <button @click="downloadPdf" class="btn btn-success">Download PDF</button>
      </div>
    </div>

    <div class="timetable-container">
      <div class="timetable-header">
        <div class="time-cell">Time</div>
        <div v-for="day in days" :key="day" class="day-cell">
          {{ day }}
        </div>
      </div>

      <div v-for="time in times" :key="time" class="timetable-row">
        <div class="time-cell">{{ time }}</div>

        <div v-for="day in days" :key="day" class="slot-cell">
          <div
            v-if="getSlot(day, time)"
            class="slot-box"
            :class="getColor(getSlot(day, time).course?.name)"
          >
            <strong>{{ getSlot(day, time).course?.name }}</strong>
            <small>{{ getSlot(day, time).name }}</small>
            <small v-if="getSlot(day, time).location">
              {{ getSlot(day, time).location }}
            </small>

            <small v-if="user.role === 'student'">
              {{ getSlot(day, time).teacher?.name }}
            </small>

            <small v-if="user.role === 'teacher'">
              {{ getSlot(day, time).student?.name || "Assigned class slot" }}
            </small>
          </div>

          <div v-else class="empty-slot">-</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: white;
  padding: 2rem;
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #111827;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.section-copy {
  margin: 0;
  color: #64748b;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.timetable-container {
  overflow-x: auto;
}

.timetable-header,
.timetable-row {
  display: grid;
  grid-template-columns: 120px repeat(5, 1fr);
}

.time-cell {
  padding: 0.75rem;
  font-weight: 600;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.day-cell {
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.slot-cell {
  border: 1px solid #e5e7eb;
  padding: 6px;
  min-height: 70px;
}

.slot-box {
  height: 100%;
  border-radius: 8px;
  padding: 6px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  font-size: 0.85rem;
  transition: transform 0.2s;
}

.slot-box:hover {
  transform: scale(1.03);
}

.bg-blue { background: #3b82f6; }
.bg-green { background: #16a34a; }
.bg-purple { background: #7c3aed; }
.bg-orange { background: #f97316; }
.bg-pink { background: #ec4899; }
.bg-indigo { background: #6366f1; }

.empty-slot {
  text-align: center;
  color: #9ca3af;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .section-head {
    flex-direction: column;
  }

  .timetable-header,
  .timetable-row {
    grid-template-columns: 80px repeat(5, 150px);
  }
}
</style>
