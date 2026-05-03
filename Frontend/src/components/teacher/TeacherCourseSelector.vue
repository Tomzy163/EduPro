<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getCourses } from "@/services/courseService";
import { uploadResult } from "@/services/resultService";
import socket from "@/services/socket";

const courses = ref([]);
const selectedCourse = ref("");
const selectedStudent = ref("");
const studentSearch = ref("");
const score = ref("");
const grade = ref("");
const loading = ref(false);

const getCurrentUserId = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user?._id || user?.id || "";
  } catch {
    return "";
  }
};

const fetchCourses = async () => {
  try {
    const currentUserId = getCurrentUserId();
    const allCourses = await getCourses();
    courses.value = allCourses.filter(
      (course) => (course.teacher?._id || course.teacher?.id || course.teacher) === currentUserId
    );
  } catch (error) {
    console.error("Failed to load teacher courses:", error);
  }
};

const selectedCourseData = computed(() =>
  courses.value.find((course) => course._id === selectedCourse.value)
);

const students = computed(() => selectedCourseData.value?.students || []);

const filteredStudents = computed(() =>
  students.value.filter((student) =>
    student.name.toLowerCase().includes(studentSearch.value.toLowerCase())
  )
);

watch(selectedCourse, () => {
  selectedStudent.value = "";
  studentSearch.value = "";
});

const submitResult = async () => {
  if (courses.value.length === 0) {
    alert("No course has been assigned to this teacher yet. Ask the admin to assign your courses.");
    return;
  }

  if (!selectedStudent.value || !selectedCourse.value || !score.value || !grade.value) {
    alert("Fill all fields");
    return;
  }

  loading.value = true;

  try {
    await uploadResult({
      student: selectedStudent.value,
      course: selectedCourse.value,
      score: score.value,
      grade: grade.value,
    });

    score.value = "";
    grade.value = "";
    alert("Result entry saved successfully.");
  } catch (error) {
    alert(error.response?.data?.message || "Failed to upload result.");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCourses();
  socket.on("admin:update", fetchCourses);
});

onUnmounted(() => {
  socket.off("admin:update", fetchCourses);
});
</script>

<template>
  <section class="card selector-card">
    <h2 class="section-title">Upload Result</h2>
    <p class="section-copy">
      Each upload creates a new result entry, so you can record repeated assessments for the same subject.
    </p>

    <p v-if="courses.length === 0" class="empty">
      No course has been assigned to this teacher yet.
    </p>

    <div class="form-grid">
      <select v-model="selectedCourse" class="input">
        <option disabled value="">Select Course</option>
        <option v-for="course in courses" :key="course._id" :value="course._id">
          {{ course.name }}
        </option>
      </select>

      <input
        v-model="studentSearch"
        placeholder="Search student..."
        class="input"
      />

      <select v-model="selectedStudent" class="input">
        <option disabled value="">Select Student</option>
        <option v-for="student in filteredStudents" :key="student._id" :value="student._id">
          {{ student.name }}
        </option>
      </select>
    </div>

    <div class="form-grid actions-grid">
      <input v-model="score" placeholder="Score" class="input" />
      <input v-model="grade" placeholder="Grade" class="input" />
      <button @click="submitResult" class="btn btn-primary" :disabled="loading">
        {{ loading ? "Uploading..." : "Upload Result" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.selector-card {
  padding: 24px;
}

.actions-grid {
  margin-top: 12px;
}
</style>
