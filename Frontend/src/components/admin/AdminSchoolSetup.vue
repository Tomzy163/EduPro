<script setup>
import { ref } from "vue";
import API from "@/services/api";

const schoolName = ref("");

const updateLink = async () => { try { await API.put(`/relationships/${editId.value}`, { 
  parentId: editParent.value, 
  studentId: editStudent.value, 
}); 
editId.value = null; 
fetchHistory(); 
} catch (err) { 
  console.error("UPDATE ERROR:", err.response?.data || err); 

} 
};
</script>

<template>
  <section class="card">
    <h2>School Setup</h2>
    <div class="row">
      <input v-model="schoolName" class="input" placeholder="School Name" />
      <button @click="saveSchool" class="btn primary">Save</button>
    </div>
  </section>
</template>