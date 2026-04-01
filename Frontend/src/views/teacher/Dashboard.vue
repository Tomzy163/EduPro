<script setup>
import { ref, onMounted } from "vue";
import { getCourses } from "../../services/courseService";
import { uploadResult } from "../../services/resultService";
import { markAttendance } from "../../services/attendanceService";
import Notifications from "../../components/Notifications.vue";
import UserTimetable from "../../components/UserTimetable.vue";

const courses = ref([]);
const selectedCourse = ref("");
const selectedStudent = ref("");

// Result form
const score = ref("");
const grade = ref("");

// Attendance
const status = ref("present");

// Fetch courses assigned to teacher
const fetchCourses = async () => {
  const allCourses = await getCourses();
  const user = JSON.parse(sessionStorage.getItem("user"));
  courses.value = allCourses.filter(c => c.teacher?._id === user._id);
};

onMounted(fetchCourses);

// Upload result
const submitResult = async () => {
  await uploadResult({
    student: selectedStudent.value,
    course: selectedCourse.value,
    score: score.value,
    grade: grade.value,
  });
  alert("Result uploaded");
};

// Mark attendance
const submitAttendance = async () => {
  await markAttendance({
    student: selectedStudent.value,
    course: selectedCourse.value,
    status: status.value,
  });
  alert("Attendance marked");
};
</script>

<template>
  <div class="dashboard">
    <h1 class="page-title">Teacher Dashboard</h1>
    <Notifications />

    <!-- TIMETABLE -->
    <UserTimetable />

    <!-- SELECT COURSE & STUDENT -->
    <section class="card">
      <h2 class="section-title">Upload Results & Attendance</h2>

      <div class="form-grid mb-4">
        <select v-model="selectedCourse" class="input">
          <option disabled value="">Select Course</option>
          <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.name }}</option>
        </select>

        <select v-model="selectedStudent" class="input">
          <option disabled value="">Select Student</option>
          <option v-for="c in courses.find(c => c._id === selectedCourse)?.students || []" :key="c._id" :value="c._id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <!-- Result -->
      <div class="flex gap-2 mb-2">
        <input v-model="score" placeholder="Score" class="input"/>
        <input v-model="grade" placeholder="Grade" class="input"/>
        <button @click="submitResult" class="btn btn-primary">Upload Result</button>
      </div>

      <!-- Attendance -->
      <div class="flex gap-2">
        <select v-model="status" class="input">
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        <button @click="submitAttendance" class="btn btn-success">Mark Attendance</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 1rem;
  background: #f3f4f6;
  min-height: 100vh;
}
.page-title { font-size: 2rem; font-weight: 700; color: #1f2937; }
.card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.section-title { font-weight: 600; margin-bottom: 1rem; color: #111827; }
.input { width: 100%; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #d1d5db; }
.btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
.btn-primary { background: #2563eb; color: white; } .btn-primary:hover { background: #1d4ed8; }
.btn-success { background: #16a34a; color: white; } .btn-success:hover { background: #15803d; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 0.8rem; margin-bottom: 1rem; }
</style>