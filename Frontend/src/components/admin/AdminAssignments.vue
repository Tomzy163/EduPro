<script setup>
import { computed, onMounted, ref } from "vue";
import { getUsers } from "@/services/userService";
import {
  assignStudent,
  assignTeacher,
  clearStudentAssignments,
  clearTeacherAssignments,
  deleteStudentAssignment,
  deleteTeacherAssignment,
  getAssignmentHistory,
  getCourses,
  updateStudentAssignment,
  updateTeacherAssignment,
} from "@/services/courseService";

const users = ref([]);
const courses = ref([]);
const history = ref({
  studentHistory: [],
  teacherHistory: [],
});

const teacherId = ref("");
const studentId = ref("");
const teacherCourses = ref([]);
const studentCourses = ref([]);
const loadingTeacherAssign = ref(false);
const loadingStudentAssign = ref(false);
const statusMessage = ref("");
const statusTone = ref("primary");
const editingStudentAssignment = ref(null);
const editingTeacherAssignment = ref(null);

const teachers = computed(() =>
  users.value.filter((user) => user.role === "teacher")
);

const students = computed(() =>
  users.value.filter((user) => user.role === "student")
);

const showStatus = (message, tone = "primary") => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const fetchData = async () => {
  const [userData, courseData, assignmentHistory] = await Promise.all([
    getUsers(),
    getCourses(),
    getAssignmentHistory(),
  ]);

  users.value = userData;
  courses.value = courseData;
  history.value = assignmentHistory;
};

const assignTeacherMulti = async () => {
  if (!teacherId.value || teacherCourses.value.length === 0) {
    showStatus("Select a teacher and at least one course.", "danger");
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
    showStatus("Select a student and at least one course.", "danger");
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

const startStudentEdit = (assignment) => {
  editingStudentAssignment.value = {
    currentStudentId: assignment.studentId,
    currentCourseId: assignment.courseId,
    studentId: assignment.studentId,
    courseId: assignment.courseId,
  };
};

const saveStudentEdit = async () => {
  if (!editingStudentAssignment.value) {
    return;
  }

  try {
    await updateStudentAssignment(
      editingStudentAssignment.value.currentStudentId,
      editingStudentAssignment.value.currentCourseId,
      {
        studentId: editingStudentAssignment.value.studentId,
        courseId: editingStudentAssignment.value.courseId,
      }
    );

    editingStudentAssignment.value = null;
    showStatus("Student assignment updated successfully.", "success");
    await fetchData();
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to update the student assignment.",
      "danger"
    );
  }
};

const removeStudentAssignment = async (assignment) => {
  if (!confirm("Delete this student-course assignment?")) {
    return;
  }

  try {
    await deleteStudentAssignment(assignment.studentId, assignment.courseId);
    showStatus("Student assignment deleted successfully.", "success");
    await fetchData();
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to delete this student assignment.",
      "danger"
    );
  }
};

const clearAllStudentAssignments = async () => {
  if (!confirm("Clear all student-course assignments for this school?")) {
    return;
  }

  try {
    await clearStudentAssignments();
    showStatus("All student assignments cleared successfully.", "success");
    await fetchData();
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to clear student assignments.",
      "danger"
    );
  }
};

const startTeacherEdit = (assignment, teacher) => {
  editingTeacherAssignment.value = {
    courseId: assignment.courseId,
    teacherId: teacher?._id || "",
  };
};

const saveTeacherEdit = async () => {
  if (!editingTeacherAssignment.value) {
    return;
  }

  try {
    await updateTeacherAssignment(editingTeacherAssignment.value.courseId, {
      teacherId: editingTeacherAssignment.value.teacherId,
    });

    editingTeacherAssignment.value = null;
    showStatus("Teacher assignment updated successfully.", "success");
    await fetchData();
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to update the teacher assignment.",
      "danger"
    );
  }
};

const removeTeacherAssignment = async (assignment) => {
  if (!confirm("Delete this teacher-course assignment?")) {
    return;
  }

  try {
    await deleteTeacherAssignment(assignment.courseId);
    showStatus("Teacher assignment deleted successfully.", "success");
    await fetchData();
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to delete this teacher assignment.",
      "danger"
    );
  }
};

const clearAllTeacherAssignments = async () => {
  if (!confirm("Clear all teacher-course assignments for this school?")) {
    return;
  }

  try {
    await clearTeacherAssignments();
    showStatus("All teacher assignments cleared successfully.", "success");
    await fetchData();
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to clear teacher assignments.",
      "danger"
    );
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
      <div class="section-head">
        <div>
          <h2 class="section-title">Teacher Assignment History</h2>
          <p class="section-copy">
            Teacher-course assignments are grouped by teacher name and sorted alphabetically.
          </p>
        </div>
        <button @click="clearAllTeacherAssignments" class="btn btn-danger">
          Clear All
        </button>
      </div>

      <div v-if="history.teacherHistory.length === 0" class="empty">
        No teacher-course assignments yet.
      </div>

      <div v-else class="history-groups">
        <article v-for="entry in history.teacherHistory" :key="entry.teacher._id" class="history-card">
          <div class="history-card-head">
            <div>
              <h3>{{ entry.teacher.name }}</h3>
              <p>{{ entry.teacher.email }}</p>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Term</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in entry.courses" :key="assignment.id">
                  <td>{{ assignment.courseName }}</td>
                  <td>{{ assignment.term }}</td>
                  <td>{{ assignment.studentCount }}</td>
                  <td class="actions-cell">
                    <template v-if="editingTeacherAssignment?.courseId === assignment.courseId">
                      <select v-model="editingTeacherAssignment.teacherId" class="input inline-input">
                        <option v-for="teacher in teachers" :key="teacher._id" :value="teacher._id">
                          {{ teacher.name }}
                        </option>
                      </select>
                      <button @click="saveTeacherEdit" class="btn btn-success btn-small">Save</button>
                      <button @click="editingTeacherAssignment = null" class="btn btn-secondary btn-small">Cancel</button>
                    </template>
                    <template v-else>
                      <button @click="startTeacherEdit(assignment, entry.teacher)" class="btn btn-primary btn-small">
                        Edit
                      </button>
                      <button @click="removeTeacherAssignment(assignment)" class="btn btn-danger btn-small">
                        Delete
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>

    <div class="assignment-block">
      <div class="section-head">
        <div>
          <h2 class="section-title">Student Assignment History</h2>
          <p class="section-copy">
            Student-course assignments are grouped by student name and sorted alphabetically.
          </p>
        </div>
        <button @click="clearAllStudentAssignments" class="btn btn-danger">
          Clear All
        </button>
      </div>

      <div v-if="history.studentHistory.length === 0" class="empty">
        No student-course assignments yet.
      </div>

      <div v-else class="history-groups">
        <article v-for="entry in history.studentHistory" :key="entry.student._id" class="history-card">
          <div class="history-card-head">
            <div>
              <h3>{{ entry.student.name }}</h3>
              <p>{{ entry.student.email }}</p>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Term</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in entry.courses" :key="assignment.id">
                  <td>{{ assignment.courseName }}</td>
                  <td>{{ assignment.term }}</td>
                  <td>{{ assignment.teacherName }}</td>
                  <td class="actions-cell">
                    <template v-if="editingStudentAssignment?.currentStudentId === assignment.studentId && editingStudentAssignment?.currentCourseId === assignment.courseId">
                      <select v-model="editingStudentAssignment.studentId" class="input inline-input">
                        <option v-for="student in students" :key="student._id" :value="student._id">
                          {{ student.name }}
                        </option>
                      </select>
                      <select v-model="editingStudentAssignment.courseId" class="input inline-input">
                        <option v-for="course in courses" :key="course._id" :value="course._id">
                          {{ course.name }}
                        </option>
                      </select>
                      <button @click="saveStudentEdit" class="btn btn-success btn-small">Save</button>
                      <button @click="editingStudentAssignment = null" class="btn btn-secondary btn-small">Cancel</button>
                    </template>
                    <template v-else>
                      <button @click="startStudentEdit(assignment)" class="btn btn-primary btn-small">
                        Edit
                      </button>
                      <button @click="removeStudentAssignment(assignment)" class="btn btn-danger btn-small">
                        Delete
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
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

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.section-copy {
  margin: 6px 0 0;
  color: var(--text-soft);
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

.history-groups {
  display: grid;
  gap: 16px;
}

.history-card {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), #ffffff);
}

.history-card-head {
  margin-bottom: 14px;
}

.history-card-head h3 {
  margin: 0;
}

.history-card-head p {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.inline-input {
  min-width: 150px;
}

.btn-secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-small {
  padding: 8px 12px;
  font-size: 0.82rem;
}

@media (max-width: 768px) {
  .section-head {
    flex-direction: column;
  }
}
</style>
