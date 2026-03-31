<script setup>
import { ref, onMounted } from "vue";
import { getCourses } from "../../services/courseService";
import { uploadResult } from "../../services/resultService";
import { markAttendance } from "../../services/attendanceService";
import Notifications from "../../components/Notifications.vue";

const courses = ref([]);
const selectedCourse = ref("");
const selectedStudent = ref("");

// Result form
const score = ref("");
const grade = ref("");

// Attendance
const status = ref("present");

// Get courses
const fetchCourses = async () => {
  const allCourses = await getCourses();

  // Filter only courses assigned to this teacher
  const user = JSON.parse(localStorage.getItem("user"));

  courses.value = allCourses.filter(
    (c) => c.teacher?._id === user._id
  );
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
  <div>
    <h1>Teacher Dashboard</h1>

    <Notifications />

    <!-- SELECT COURSE -->
    <h3>Select Course</h3>
    <select v-model="selectedCourse">
      <option disabled value="">Select Course</option>
      <option v-for="c in courses" :value="c._id">
        {{ c.name }}
      </option>
    </select>

    <!-- SELECT STUDENT -->
    <h3>Select Student</h3>
    <select v-model="selectedStudent">
      <option disabled value="">Select Student</option>
      <option
        v-for="c in courses.find(c => c._id === selectedCourse)?.students || []"
        :value="c._id"
      >
        {{ c.name }}
      </option>
    </select>

    <hr />

    <!-- RESULT SECTION -->
    <h2>Upload Result</h2>

    <input v-model="score" placeholder="Score" />
    <input v-model="grade" placeholder="Grade" />

    <button @click="submitResult">Upload Result</button>

    <hr />

    <!-- ATTENDANCE -->
    <h2>Mark Attendance</h2>

    <select v-model="status">
      <option value="present">Present</option>
      <option value="absent">Absent</option>
    </select>

    <button @click="submitAttendance">Mark Attendance</button>
  </div>
</template>