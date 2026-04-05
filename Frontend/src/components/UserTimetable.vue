<script setup>
import { ref, onMounted } from "vue";
import API from "../services/api";

const timetable = ref([]);
const user = JSON.parse(sessionStorage.getItem("user"));

// Days & time slots
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

// Fetch timetable
const fetchTimetable = async () => {
  const res = await API.get("/timetable");

  if (user.role === "teacher") {
    timetable.value = res.data.filter(t => t.teacher?._id === user._id);
  } else if (user.role === "student") {
    timetable.value = res.data.filter(t =>
      !t.student || t.student?._id === user._id
    );
  } else if (user.role === "parent") {
    timetable.value = res.data; // or filter by children later
  }
};

// Get slot
const getSlot = (day, time) => {
  return timetable.value.find(t => t.day === day && t.time === time);
};

// Color generator (based on course)
const getColor = (name) => {
  const colors = [
    "bg-blue", "bg-green", "bg-purple",
    "bg-orange", "bg-pink", "bg-indigo"
  ];
  if (!name) return "";
  const index = name.length % colors.length;
  return colors[index];
};

onMounted(fetchTimetable);
</script>

<template>
  <section class="card">
    <h2 class="section-title">My Timetable</h2>

    <div class="timetable-container">
      <!-- Header -->
      <div class="timetable-header">
        <div class="time-cell">Time</div>
        <div v-for="day in days" :key="day" class="day-cell">
          {{ day }}
        </div>
      </div>

      <!-- Body -->
      <div v-for="time in times" :key="time" class="timetable-row">
        <!-- Time -->
        <div class="time-cell">{{ time }}</div>

        <!-- Days -->
        <div v-for="day in days" :key="day" class="slot-cell">
          <div
            v-if="getSlot(day, time)"
            class="slot-box"
            :class="getColor(getSlot(day, time).course?.name)"
          >
            <strong>{{ getSlot(day, time).course?.name }}</strong>

            <small v-if="user.role === 'student'">
              {{ getSlot(day, time).teacher?.name }}
            </small>

            <small v-if="user.role === 'teacher'">
              Class
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

/* GRID */
.timetable-container {
  overflow-x: auto;
}

.timetable-header,
.timetable-row {
  display: grid;
  grid-template-columns: 120px repeat(5, 1fr);
}

/* CELLS */
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

/* SLOT BOX */
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

/* COLORS */
.bg-blue { background: #3b82f6; }
.bg-green { background: #16a34a; }
.bg-purple { background: #7c3aed; }
.bg-orange { background: #f97316; }
.bg-pink { background: #ec4899; }
.bg-indigo { background: #6366f1; }

/* EMPTY */
.empty-slot {
  text-align: center;
  color: #9ca3af;
  margin-top: 15px;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .timetable-header,
  .timetable-row {
    grid-template-columns: 80px repeat(5, 150px);
  }
}
</style>