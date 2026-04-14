<script setup>
import { computed, onMounted, ref } from "vue";
import {
  assignStudent,
  assignTeacher,
  createCourse,
  getCourses,
} from "@/services/courseService";
import { getUsers } from "@/services/userService";

const courses = ref([]);
const users = ref([]);

const courseName = ref("");
const courseTerm = ref("First Term");
const selectedCourseId = ref("");
const selectedTeacherId = ref("");
const selectedStudentIds = ref([]);
const loading = ref(false);
const statusMessage = ref("");
const statusTone = ref("primary");

const teachers = computed(() =>
  users.value.filter((user) => user.role === "teacher")
);

const students = computed(() =>
  users.value.filter((user) => user.role === "student")
);

const selectedCourse = computed(() =>
  courses.value.find((course) => course._id === selectedCourseId.value)
);

const fetchData = async () => {
  [courses.value, users.value] = await Promise.all([getCourses(), getUsers()]);
};

const handleCreateCourse = async () => {
  if (!courseName.value.trim()) {
    alert("Enter a course name.");
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    await createCourse({
      name: courseName.value.trim(),
      term: courseTerm.value,
    });

    courseName.value = "";
    courseTerm.value = "First Term";
    statusTone.value = "success";
    statusMessage.value = "Course created successfully.";
    await fetchData();
  } catch (error) {
    statusTone.value = "danger";
    statusMessage.value =
      error.response?.data?.message || "Failed to create course.";
  } finally {
    loading.value = false;
  }
};

const handleAssignTeacher = async () => {
  if (!selectedCourseId.value || !selectedTeacherId.value) {
    alert("Select a course and teacher.");
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    await assignTeacher({
      courseId: selectedCourseId.value,
      teacherId: selectedTeacherId.value,
    });

    statusTone.value = "success";
    statusMessage.value = "Teacher assigned successfully.";
    await fetchData();
  } catch (error) {
    statusTone.value = "danger";
    statusMessage.value =
      error.response?.data?.message || "Failed to assign teacher.";
  } finally {
    loading.value = false;
  }
};

const handleAssignStudents = async () => {
  if (!selectedCourseId.value || selectedStudentIds.value.length === 0) {
    alert("Select a course and at least one student.");
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    for (const studentId of selectedStudentIds.value) {
      await assignStudent({
        courseId: selectedCourseId.value,
        studentId,
      });
    }

    selectedStudentIds.value = [];
    statusTone.value = "success";
    statusMessage.value = "Students assigned successfully.";
    await fetchData();
  } catch (error) {
    statusTone.value = "danger";
    statusMessage.value =
      error.response?.data?.message || "Failed to assign students.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <section class="card admin-school-setup">
    <div v-if="statusMessage" class="status-banner" :class="`status-${statusTone}`">
      {{ statusMessage }}
    </div>

    <div class="section-block">
      <h2 class="section-title">Course Management</h2>
      <p class="section-copy">
        Create courses, attach a teacher, and enroll students for the current school.
      </p>

      <div class="form-grid">
        <input
          v-model="courseName"
          class="input"
          placeholder="Course name"
        />

        <select v-model="courseTerm" class="input">
          <option value="First Term">First Term</option>
          <option value="Second Term">Second Term</option>
          <option value="Third Term">Third Term</option>
        </select>

        <button @click="handleCreateCourse" class="btn btn-primary" :disabled="loading">
          {{ loading ? "Saving..." : "Create Course" }}
        </button>
      </div>
    </div>

    <div class="section-block">
      <h3 class="section-title">Assign Course Owner And Students</h3>

      <div class="form-grid">
        <select v-model="selectedCourseId" class="input">
          <option disabled value="">Select Course</option>
          <option v-for="course in courses" :key="course._id" :value="course._id">
            {{ course.name }} - {{ course.term || "No term" }}
          </option>
        </select>

        <select v-model="selectedTeacherId" class="input">
          <option disabled value="">Select Teacher</option>
          <option v-for="teacher in teachers" :key="teacher._id" :value="teacher._id">
            {{ teacher.name }}
          </option>
        </select>

        <button @click="handleAssignTeacher" class="btn btn-success" :disabled="loading">
          {{ loading ? "Saving..." : "Assign Teacher" }}
        </button>
      </div>

      <div class="student-picker">
        <label
          v-for="student in students"
          :key="student._id"
          class="student-option"
        >
          <input
            v-model="selectedStudentIds"
            :value="student._id"
            type="checkbox"
          />
          <span>{{ student.name }}</span>
        </label>
      </div>

      <button @click="handleAssignStudents" class="btn btn-primary" :disabled="loading">
        {{ loading ? "Saving..." : "Assign Selected Students" }}
      </button>
    </div>

    <div class="section-block">
      <h3 class="section-title">Available Courses</h3>

      <div v-if="courses.length === 0" class="empty">
        No courses have been created yet.
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Term</th>
              <th>Teacher</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in courses" :key="course._id">
              <td>{{ course.name }}</td>
              <td>{{ course.term || "-" }}</td>
              <td>{{ course.teacher?.name || "Unassigned" }}</td>
              <td>
                {{
                  course.students?.length
                    ? course.students.map((student) => student.name).join(", ")
                    : "No students assigned"
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-school-setup {
  padding: 24px;
}

.status-banner {
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 600;
}

.status-success {
  background: rgba(21, 128, 61, 0.1);
  color: #166534;
}

.status-danger {
  background: rgba(220, 38, 38, 0.1);
  color: #991b1b;
}

.status-primary {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.section-block + .section-block {
  margin-top: 24px;
}

.section-copy {
  margin: 6px 0 16px;
  color: var(--text-soft);
}

.student-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin: 16px 0;
}

.student-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  background: #fff;
}
</style>
