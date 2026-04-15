<script setup>
import Navbar from "@/components/Navbar.vue";
import AdminAnalytics from "@/components/AdminAnalytics.vue";
import AdminSubscriptionCenter from "@/components/admin/AdminSubscriptionCenter.vue";
import AdminSchoolSetup from "@/components/admin/AdminSchoolSetup.vue";
import AdminMessages from "@/components/admin/AdminMessages.vue";
import AdminUsers from "@/components/admin/AdminUsers.vue";
import AdminAssignments from "@/components/admin/AdminAssignments.vue";
import AdminRelationships from "@/components/admin/AdminRelationships.vue";
import AdminTimetable from "@/components/admin/AdminTimetable.vue";
import AdminPayments from "@/components/admin/AdminPayments.vue";
</script>

<template>
  <Navbar />

  <div class="dashboard admin-dashboard">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">Admin Dashboard</h1>
        <p class="page-subtitle">
          Oversee school operations, finances, messages, and staff activity in one place.
        </p>
      </div>
    </header>

    <AdminAnalytics />
    <AdminSubscriptionCenter />

    <section class="dashboard-sections">
      <AdminSchoolSetup />
      <AdminMessages />
      <AdminUsers />
      <AdminAssignments />
      <AdminRelationships />
      <AdminTimetable />
      <AdminPayments />
    </section>
  </div>
</template>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
