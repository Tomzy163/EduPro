<script setup>
import { ref, computed, onMounted } from "vue";
import { getUsers, createUser, deleteUser } from "@/services/userService";

const users = ref([]);
const search = ref("");
const roleFilter = ref("all");

const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("teacher");

const fetchUsers = async () => {
  users.value = await getUsers();
};

onMounted(fetchUsers);

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.value.toLowerCase()) ||
      u.email.toLowerCase().includes(search.value.toLowerCase());

    const matchesRole =
      roleFilter.value === "all" || u.role === roleFilter.value;

    return matchesSearch && matchesRole;
  });
});

const addUser = async () => {
  await createUser({
    name: name.value,
    email: email.value,
    password: password.value,
    role: role.value,
  });

  name.value = "";
  email.value = "";
  password.value = "";
  role.value = "teacher";

  fetchUsers();
};

const removeUser = async (id) => {
  await deleteUser(id);
  fetchUsers();
};
</script>

<template>
    <!-- USERS -->
    <section class="card">
      <h2>Create User</h2>

      <div class="grid">
        <input v-model="name" placeholder="Name" class="input" />
        <input v-model="email" placeholder="Email" class="input" />
        <input v-model="password" placeholder="Password" class="input" />

        <select v-model="role" class="input">
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      <button @click="addUser" class="btn primary">Create</button>

      <div class="divider"></div>

      <h3>Users</h3>

      <div class="row">
        <input v-model="search" placeholder="Search..." class="input" />

        <select v-model="roleFilter" class="input">
          <option value="all">All</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="u in paginatedUsers" :key="u._id">
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge">{{ u.role }}</span></td>
            <td>
              <button @click="removeUser(u._id)" class="btn danger small">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button class="btn success small" @click="currentPage--" :disabled="currentPage===1">Prev</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button class="btn primary small" @click="currentPage++" :disabled="currentPage===totalPages">Next</button>
      </div>
    </section>

</template>