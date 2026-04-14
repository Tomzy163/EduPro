<script setup>
import { ref, onMounted } from "vue";
import API from "@/services/api";

const payments = ref([]);

// Payments 
const fetchPayments = async () => { const res = await API.get("/payments"); payments.value = res.data; };


const approvePayment = async (id, status) => { 
    await API.put(`/payments/${id}`, { status }); 
    fetchPayments(); 
};

onMounted(fetchPayments);
</script>

<template>
  <section class="card">
      <h2 class="section-title">Payments</h2>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p._id">
              <td>{{ p.user?.name }}</td>
              <td>{{ p.amount }}</td>
              <td>{{ p.status }}</td>
              <td>
                <button @click="approvePayment(p._id, 'approved')" class="btn success small">Approve</button>
                <button @click="approvePayment(p._id, 'rejected')" class="btn danger small">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
</template>