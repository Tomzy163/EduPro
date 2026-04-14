<script setup>
import { computed, onMounted, ref } from "vue";
import { getUsers } from "@/services/userService";
import {
  assignStudent,
  assignTeacher,
  getCourses,
} from "@/services/courseService";

const users = ref([]);
const courses = ref([]);

const teacherId = ref("");
const studentId = ref("");
const teacherCourses = ref([]);
const studentCourses = ref([]);
const loadingTeacherAssign = ref(false);
const loadingStudentAssign = ref(false);
const statusMessage = ref("");
const statusTone = ref("primary");

const teachers = computed(() =>
  users.value.filter((user) => user.role === "teacher")
);

const students = computed(() =>
  users.value.filter((user) => user.role === "student")
);

const teacherAssignmentHistory = computed(() =>
  courses.value
    .filter((course) => course.teacher)
    .map((course) => ({
      id: course._id,
      courseName: course.name,
      teacherName: course.teacher?.name || "Unassigned",
      term: course.term || "-",
    }))
);

const studentAssignmentHistory = computed(() =>
  courses.value
    .filter((course) => course.students?.length)
    .flatMap((course) =>
      course.students.map((student) => ({
        id: `${course._id}-${student._id}`,
        courseName: course.name,
        studentName: student.name,
        term: course.term || "-",
      }))
    )
);

const fetchData = async () => {
  [users.value, courses.value] = await Promise.all([getUsers(), getCourses()]);
};

const assignTeacherMulti = async () => {
  if (!teacherId.value || teacherCourses.value.length === 0) {
    alert("Select a teacher and at least one course.");
    return;
  }

  loadingTeacherAssign.value = true;
  statusMessage.value = "";

  try {
    for (const courseId of teacherCourses.value) {
      await assignTeacher({ courseId, teacherId: teacherId.value });
    }

    const teacher = teachers.value.find((item) => item._id === teacherId.value);
    teacherCourses.value = [];
    statusTone.value = "success";
    statusMessage.value = `Assigned ${teacher?.name || "teacher"} successfully.`;
    await fetchData();
  } catch (error) {
    statusTone.value = "danger";
    statusMessage.value =
      error.response?.data?.message || "Failed to assign teacher.";
  } finally {
    loadingTeacherAssign.value = false;
  }
};

const assignStudentMulti = async () => {
  if (!studentId.value || studentCourses.value.length === 0) {
    alert("Select a student and at least one course.");
    return;
  }

  loadingStudentAssign.value = true;
  statusMessage.value = "";

  try {
    for (const courseId of studentCourses.value) {
      await assignStudent({ courseId, studentId: studentId.value });
    }

    const student = students.value.find((item) => item._id === studentId.value);
    studentCourses.value = [];
    statusTone.value = "success";
    statusMessage.value = `Assigned ${student?.name || "student"} successfully.`;
    await fetchData();
  } catch (error) {
    statusTone.value = "danger";
    statusMessage.value =
      error.response?.data?.message || "Failed to assign student.";
  } finally {
    loadingStudentAssign.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <section class="card admin-assignments">
    <div v-if="statusMessage" class="status-banner" :class="`status-${statusTone}`">
      {{ statusMessage }}
    </div>

    <div class="assignment-block">
      <h2 class="section-title">Assign Teacher To Courses</h2>

      <select v-model="teacherId" class="input">
        <option disabled value="">Select Teacher</option>
        <option v-for="teacher in teachers" :key="teacher._id" :value="teacher._id">
          {{ teacher.name }}
        </option>
      </select>

      <div class="course-grid">
        <label v-for="course in courses" :key="course._id" class="course-item">
          <input v-model="teacherCourses" type="checkbox" :value="course._id" />
          <span>{{ course.name }}</span>
        </label>
      </div>

      <button @click="assignTeacherMulti" class="btn btn-primary" :disabled="loadingTeacherAssign">
        {{ loadingTeacherAssign ? "Assigning..." : "Assign Teacher" }}
      </button>
    </div>

    <div class="assignment-block">
      <h2 class="section-title">Assign Student To Courses</h2>

      <select v-model="studentId" class="input">
        <option disabled value="">Select Student</option>
        <option v-for="student in students" :key="student._id" :value="student._id">
          {{ student.name }}
        </option>
      </select>

      <div class="course-grid">
        <label v-for="course in courses" :key="course._id" class="course-item">
          <input v-model="studentCourses" type="checkbox" :value="course._id" />
          <span>{{ course.name }}</span>
        </label>
      </div>

      <button @click="assignStudentMulti" class="btn btn-success" :disabled="loadingStudentAssign">
        {{ loadingStudentAssign ? "Assigning..." : "Assign Student" }}
      </button>
    </div>

    <div class="assignment-block">
      <h2 class="section-title">Teacher Assignment History</h2>

      <div v-if="teacherAssignmentHistory.length === 0" class="empty">
        No teacher-course assignments yet.
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Teacher</th>
              <th>Term</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in teacherAssignmentHistory" :key="item.id">
              <td>{{ item.courseName }}</td>
              <td>{{ item.teacherName }}</td>
              <td>{{ item.term }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="assignment-block">
      <h2 class="section-title">Student Assignment History</h2>

      <div v-if="studentAssignmentHistory.length === 0" class="empty">
        No student-course assignments yet.
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Term</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in studentAssignmentHistory" :key="item.id">
              <td>{{ item.studentName }}</td>
              <td>{{ item.courseName }}</td>
              <td>{{ item.term }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-assignments {
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

.assignment-block + .assignment-block {
  margin-top: 24px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin: 16px 0;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  background: #fff;
}
</style>
