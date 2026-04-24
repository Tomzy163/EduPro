<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getAttendanceList,
  markAttendance,
} from "@/services/attendanceService";
import { getCourses } from "@/services/courseService";
import { addSchoolBranding } from "@/utils/pdfBranding";
import { useAuthStore } from "@/store/authStore";
import socket from "@/socket";

const auth = useAuthStore();
const students = ref([]);
const courses = ref([]);
const attendance = ref([]);

const student = ref("");
const course = ref("");
const status = ref("present");

const school = computed(() => auth.school || {});

const attendanceRows = computed(() =>
  attendance.value.map((record) => ({
    student: record.student?.name || "Student",
    course: record.course?.name || "Course",
    status: record.status || "-",
    date: new Date(record.date || record.createdAt).toLocaleDateString(),
  }))
);

const getCurrentUserId = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user?._id || user?.id || "";
  } catch {
    return "";
  }
};

const fetchAll = async () => {
  try {
    const currentUserId = getCurrentUserId();
    const allCourses = await getCourses();

    courses.value = allCourses.filter(
      (item) => (item.teacher?._id || item.teacher?.id || item.teacher) === currentUserId
    );

    const uniqueStudents = new Map();
    courses.value.forEach((courseItem) => {
      (courseItem.students || []).forEach((studentItem) => {
        uniqueStudents.set(studentItem._id, studentItem);
      });
    });

    students.value = Array.from(uniqueStudents.values());
    attendance.value = await getAttendanceList();
  } catch (error) {
    console.error("Failed to load teacher attendance data:", error);
  }
};

const submit = async () => {
  if (courses.value.length === 0) {
    alert("No course has been assigned to this teacher yet. Ask the admin to assign your courses.");
    return;
  }

  try {
    await markAttendance({
      student: student.value,
      course: course.value,
      status: status.value,
    });

    await fetchAll();
  } catch (error) {
    alert(error.response?.data?.message || "Failed to mark attendance.");
  }
};

const downloadAttendanceExcel = () => {
  if (attendanceRows.value.length === 0) {
    alert("No attendance records are available to download.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(attendanceRows.value);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
  XLSX.writeFile(workbook, "teacher-attendance.xlsx");
};

const downloadAttendancePdf = async () => {
  if (attendanceRows.value.length === 0) {
    alert("No attendance records are available to download.");
    return;
  }

  const doc = new jsPDF();
  const startY = await addSchoolBranding({
    doc,
    school: school.value,
    title: "Attendance Report",
    subtitle: "Teacher export",
  });

  autoTable(doc, {
    startY,
    head: [["Student", "Course", "Status", "Date"]],
    body: attendanceRows.value.map((row) => [
      row.student,
      row.course,
      row.status,
      row.date,
    ]),
  });

  doc.save("teacher-attendance.pdf");
};

onMounted(() => {
  fetchAll();
  socket.on("admin:update", fetchAll);
  socket.on("academic:update", fetchAll);
});

onUnmounted(() => {
  socket.off("admin:update", fetchAll);
  socket.off("academic:update", fetchAll);
});
</script>

<template>
  <section class="card">
    <div class="section-head">
      <div>
        <h2 class="section-title">Attendance</h2>
        <p class="section-copy">Mark attendance and download the latest class attendance history.</p>
      </div>
      <div class="action-row">
        <button @click="downloadAttendanceExcel" class="btn btn-primary">Download Excel</button>
        <button @click="downloadAttendancePdf" class="btn btn-success">Download PDF</button>
      </div>
    </div>

    <p v-if="courses.length === 0" class="empty">
      No course has been assigned to this teacher yet.
    </p>

    <div class="form-grid">
      <select v-model="student" class="input">
        <option disabled value="">Student</option>
        <option v-for="s in students" :key="s._id" :value="s._id">
          {{ s.name }}
        </option>
      </select>

      <select v-model="course" class="input">
        <option disabled value="">Course</option>
        <option v-for="c in courses" :key="c._id" :value="c._id">
          {{ c.name }}
        </option>
      </select>

      <select v-model="status" class="input">
        <option value="present">Present</option>
        <option value="absent">Absent</option>
      </select>
    </div>

    <button @click="submit" class="btn btn-success">Mark Attendance</button>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="a in attendance" :key="a._id">
            <td>{{ a.student?.name }}</td>
            <td>{{ a.course?.name }}</td>
            <td>{{ a.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.section-copy {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .section-head {
    flex-direction: column;
  }
}
</style>
