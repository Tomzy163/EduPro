<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import {
  getTeacherResults,
  updateResult,
  deleteResult,
} from "@/services/resultService";
import socket from "@/socket";

const results = ref([]);
const editId = ref(null);
const editScore = ref("");
const editGrade = ref("");

const fetchResults = async () => {
  const data = await getTeacherResults();
  results.value = data;
};

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

onMounted(async () => {
  await fetchResults();
  socket.on("resultUpdated", fetchResults);
});

onUnmounted(() => {
  socket.off("resultUpdated", fetchResults);
});
</script>

<template>
  <section class="card results-card">
    <h2 class="section-title">Results</h2>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Score</th>
            <th>Grade</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="result in results" :key="result._id">
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

            <td class="actions-cell">
              <button
                v-if="editId !== result._id"
                @click="startEdit(result)"
                class="btn btn-primary"
              >
                Edit
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

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
