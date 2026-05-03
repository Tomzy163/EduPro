<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getTeacherResults,
  updateResult,
  deleteResult,
  deleteResults,
} from "@/services/resultService";
import { addSchoolBranding } from "@/utils/pdfBranding";
import { useAuthStore } from "@/store/authStore";
import socket from "@/socket";

const auth = useAuthStore();
const results = ref([]);
const editId = ref(null);
const editScore = ref("");
const editGrade = ref("");
const search = ref("");
const courseFilter = ref("");
const deletingMany = ref(false);

const school = computed(() => auth.school || {});

const fetchResults = async () => {
  const data = await getTeacherResults();
  results.value = data;
};

const availableCourses = computed(() =>
  [...new Set(results.value.map((result) => result.course?.name).filter(Boolean))]
);

const filteredResults = computed(() =>
  results.value.filter((result) => {
    const studentName = result.student?.name?.toLowerCase() || "";
    const courseName = result.course?.name || "";
    const matchesSearch = studentName.includes(search.value.trim().toLowerCase());
    const matchesCourse = !courseFilter.value || courseName === courseFilter.value;
    return matchesSearch && matchesCourse;
  })
);

const visibleResultIds = computed(() => filteredResults.value.map((result) => result._id));

const startEdit = (result) => {
  editId.value = result._id;
  editScore.value = result.score;
  editGrade.value = result.grade;
};

const saveUpdate = async (id) => {
  await updateResult(id, {
    score: editScore.value,
    grade: editGrade.value,
  });

  editId.value = null;
  await fetchResults();
};

const remove = async (id) => {
  if (!confirm("Delete result?")) return;
  await deleteResult(id);
  await fetchResults();
};

const removeFiltered = async () => {
  if (visibleResultIds.value.length === 0) {
    alert("There are no visible result entries to delete.");
    return;
  }

  if (!confirm(`Delete ${visibleResultIds.value.length} visible result entr${visibleResultIds.value.length === 1 ? "y" : "ies"}?`)) {
    return;
  }

  deletingMany.value = true;

  try {
    await deleteResults(visibleResultIds.value);
    editId.value = null;
    await fetchResults();
  } finally {
    deletingMany.value = false;
  }
};

const downloadSingleResult = async (result) => {
  const doc = new jsPDF();
  const startY = await addSchoolBranding({
    doc,
    school: school.value,
    title: "Student Result Slip",
    subtitle: `${result.student?.name || "Student"} result record`,
  });

  autoTable(doc, {
    startY,
    head: [["Field", "Value"]],
    body: [
      ["Student", result.student?.name || "Student"],
      ["Course", result.course?.name || "Course"],
      ["Score", result.score ?? "-"],
      ["Grade", result.grade ?? "-"],
      ["Date", new Date(result.createdAt).toLocaleDateString()],
    ],
  });

  doc.save(`${(result.student?.name || "student").replace(/\s+/g, "-").toLowerCase()}-result.pdf`);
};

const downloadGroupedResultsPdf = async () => {
  if (filteredResults.value.length === 0) {
    alert("No result records are available for the current filter.");
    return;
  }

  const doc = new jsPDF();
  const startY = await addSchoolBranding({
    doc,
    school: school.value,
    title: "Class Result Report",
    subtitle: "Teacher export",
  });

  autoTable(doc, {
    startY,
    head: [["Student", "Course", "Score", "Grade", "Date"]],
    body: filteredResults.value.map((result) => [
      result.student?.name || "Student",
      result.course?.name || "Course",
      result.score ?? "-",
      result.grade ?? "-",
      new Date(result.createdAt).toLocaleDateString(),
    ]),
  });

  doc.save("group-results.pdf");
};

const downloadGroupedResultsExcel = () => {
  if (filteredResults.value.length === 0) {
    alert("No result records are available for the current filter.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(
    filteredResults.value.map((result) => ({
      Student: result.student?.name || "Student",
      Course: result.course?.name || "Course",
      Score: result.score ?? "-",
      Grade: result.grade ?? "-",
      Date: new Date(result.createdAt).toLocaleDateString(),
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
  XLSX.writeFile(workbook, "group-results.xlsx");
};

onMounted(async () => {
  await fetchResults();
  socket.on("resultUpdated", fetchResults);
  socket.on("admin:update", fetchResults);
});

onUnmounted(() => {
  socket.off("resultUpdated", fetchResults);
  socket.off("admin:update", fetchResults);
});
</script>

<template>
  <section class="card results-card">
    <div class="section-head">
      <div>
        <h2 class="section-title">Results</h2>
        <p class="section-copy">
          Download a single student&apos;s result slip or export grouped class results.
        </p>
      </div>
      <div class="action-row">
        <button @click="downloadGroupedResultsExcel" class="btn btn-primary">
          Export Group Excel
        </button>
        <button
          @click="removeFiltered"
          class="btn btn-danger"
          :disabled="deletingMany || filteredResults.length === 0"
        >
          {{ deletingMany ? "Deleting..." : "Delete Visible" }}
        </button>
        <button @click="downloadGroupedResultsPdf" class="btn btn-success">
          Export Group PDF
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <input
        v-model="search"
        class="input"
        placeholder="Search by student name"
      />
      <select v-model="courseFilter" class="input">
        <option value="">All Courses</option>
        <option v-for="course in availableCourses" :key="course" :value="course">
          {{ course }}
        </option>
      </select>
    </div>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Score</th>
            <th>Grade</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="result in filteredResults" :key="result._id">
            <td>{{ result.student?.name }}</td>
            <td>{{ result.course?.name }}</td>

            <td v-if="editId === result._id">
              <input v-model="editScore" class="input" />
            </td>
            <td v-else>{{ result.score }}</td>

            <td v-if="editId === result._id">
              <input v-model="editGrade" class="input" />
            </td>
            <td v-else>{{ result.grade }}</td>

            <td>{{ new Date(result.createdAt).toLocaleDateString() }}</td>

            <td class="actions-cell">
              <button
                v-if="editId !== result._id"
                @click="startEdit(result)"
                class="btn btn-primary"
              >
                Edit
              </button>
              <button
                @click="downloadSingleResult(result)"
                class="btn btn-secondary"
              >
                Download
              </button>
              <button
                v-if="editId === result._id"
                @click="saveUpdate(result._id)"
                class="btn btn-success"
              >
                Save
              </button>
              <button @click="remove(result._id)" class="btn btn-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.results-card {
  padding: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.section-copy {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.action-row,
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-bar {
  margin-bottom: 18px;
}

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-secondary {
  background: #e2e8f0;
  color: #0f172a;
}

@media (max-width: 768px) {
  .section-head {
    flex-direction: column;
  }
}
</style>
