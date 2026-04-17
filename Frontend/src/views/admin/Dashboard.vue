<script setup>
import Navbar from "@/components/Navbar.vue";
import ProfileManager from "@/components/ProfileManager.vue";
import PlanFeatureGate from "@/components/PlanFeatureGate.vue";
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

    <PlanFeatureGate
      feature="reporting_workflow"
      title="School Analytics"
      copy="Reporting and analytics unlock on the Supreme plan and above."
    >
      <AdminAnalytics />
    </PlanFeatureGate>
    <ProfileManager />
    <AdminSubscriptionCenter />

    <section class="dashboard-sections">
      <PlanFeatureGate
        feature="course_setup"
        title="School Setup"
        copy="School setup, course management, and assignment tools are included from the Normal plan upward."
      >
        <AdminSchoolSetup />
      </PlanFeatureGate>
      <PlanFeatureGate
        feature="priority_communication"
        title="Announcements"
        copy="Priority communication tools unlock on the Supreme plan and above."
      >
        <AdminMessages />
      </PlanFeatureGate>
      <PlanFeatureGate
        feature="user_management"
        title="User Management"
        copy="Create and manage users on the Normal plan and above."
      >
        <AdminUsers />
      </PlanFeatureGate>
      <PlanFeatureGate
        feature="course_setup"
        title="Course Assignments"
        copy="Course assignment workflows are included from the Normal plan upward."
      >
        <AdminAssignments />
      </PlanFeatureGate>
      <PlanFeatureGate
        feature="high_volume_operations"
        title="Parent And Child Linking"
        copy="High-volume school operations unlock on the Gold plan and above."
      >
        <AdminRelationships />
      </PlanFeatureGate>
      <PlanFeatureGate
        feature="timetable_setup"
        title="Timetable Builder"
        copy="Timetable setup is available on the Normal plan and above."
      >
        <AdminTimetable />
      </PlanFeatureGate>
      <PlanFeatureGate
        feature="high_volume_operations"
        title="Payment Oversight"
        copy="Operational payment oversight unlocks on the Gold plan and above."
      >
        <AdminPayments />
      </PlanFeatureGate>
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
