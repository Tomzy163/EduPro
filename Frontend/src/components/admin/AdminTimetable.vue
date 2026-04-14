<script setup>
import { computed, onMounted, ref } from "vue";
import API from "@/services/api";
import { getCourses } from "@/services/courseService";
import { getUsers } from "@/services/userService";

const timetable = ref([]);
const users = ref([]);
const courses = ref([]);

const name = ref("");
const audience = ref("teacher");
const assigneeId = ref("");
const courseId = ref("");
const day = ref("Monday");
const time = ref("08:00am-09:00am");
const location = ref("");
const timetableDraft = ref([]);

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

const filteredAssignees = computed(() =>
  users.value.filter((user) => user.role === audience.value)
);

const fetchData = async () => {
  const [timetableRes, courseData, userData] = await Promise.all([
    API.get("/timetable"),
    getCourses(),
    getUsers(),
  ]);

  timetable.value = timetableRes.data;
  courses.value = courseData;
  users.value = userData;
};

const addDraftSlot = () => {
  if (!name.value || !courseId.value || !assigneeId.value || !day.value || !time.value) {
    alert("Fill all timetable fields.");
    return;
  }

  timetableDraft.value.push({
    name: name.value.trim(),
    audience: audience.value,
    assigneeId: assigneeId.value,
    course: courseId.value,
    day: day.value,
    time: time.value,
    location: location.value.trim(),
  });
};

const saveAllSlots = async () => {
  if (timetableDraft.value.length === 0) {
    alert("Add at least one timetable slot.");
    return;
  }

  await API.post("/timetable/bulk", timetableDraft.value);

  timetableDraft.value = [];
  name.value = "";
  assigneeId.value = "";
  courseId.value = "";
  location.value = "";

  await fetchData();
};

const removeSlot = async (id) => {
  await API.delete(`/timetable/${id}`);
  await fetchData();
};

onMounted(fetchData);
</script>

<template>
  <section class="card admin-timetable">
    <h2 class="section-title">Timetable Builder</h2>
    <p class="section-copy">
      Create multiple timetable slots, group them under one timetable name, and assign them to a student or teacher.
    </p>

    <div class="form-grid">
      <input v-model="name" class="input" placeholder="Timetable name" />

      <select v-model="audience" class="input">
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
      </select>

      <select v-model="assigneeId" class="input">
        <option disabled value="">Assign To</option>
        <option v-for="user in filteredAssignees" :key="user._id" :value="user._id">
          {{ user.name }}
        </option>
      </select>

      <select v-model="courseId" class="input">
        <option disabled value="">Select Course</option>
        <option v-for="course in courses" :key="course._id" :value="course._id">
          {{ course.name }}
        </option>
      </select>

      <select v-model="day" class="input">
        <option v-for="item in days" :key="item" :value="item">{{ item }}</option>
      </select>

      <select v-model="time" class="input">
        <option v-for="item in times" :key="item" :value="item">{{ item }}</option>
      </select>

      <input v-model="location" class="input" placeholder="Location or room" />

      <button @click="addDraftSlot" class="btn btn-primary">
        Add Slot
      </button>
    </div>

    <div class="draft-section">
      <h3 class="section-title">Draft Slots</h3>

      <div v-if="timetableDraft.length === 0" class="empty">
        Add timetable slots here before saving.
      </div>

      <div v-else class="draft-list">
        <div v-for="(slot, index) in timetableDraft" :key="`${slot.name}-${index}`" class="draft-item">
          <strong>{{ slot.name }}</strong>
          <span>{{ slot.day }} | {{ slot.time }} | {{ slot.location || "No location" }}</span>
        </div>
      </div>

      <button @click="saveAllSlots" class="btn btn-success">
        Save Timetable Slots
      </button>
    </div>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Timetable</th>
            <th>Course</th>
            <th>Audience</th>
            <th>Assigned To</th>
            <th>Day</th>
            <th>Time</th>
            <th>Location</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in timetable" :key="slot._id">
            <td>{{ slot.name }}</td>
            <td>{{ slot.course?.name }}</td>
            <td>{{ slot.audience }}</td>
            <td>{{ slot.teacher?.name || slot.student?.name || "Unassigned" }}</td>
            <td>{{ slot.day }}</td>
            <td>{{ slot.time }}</td>
            <td>{{ slot.location || "-" }}</td>
            <td>
              <button @click="removeSlot(slot._id)" class="btn btn-danger">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.admin-timetable {
  padding: 24px;
}

.section-copy {
  margin: 6px 0 16px;
  color: var(--text-soft);
}

.draft-section {
  margin: 24px 0;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.draft-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: #fff;
}
</style>
