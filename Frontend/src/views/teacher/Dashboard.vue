<script setup>
import Navbar from "@/components/Navbar.vue";
import Notifications from "@/components/Notifications.vue";
import SchoolAccountCard from "@/components/SchoolAccountCard.vue";
import TeacherAnalytics from "@/components/teacher/TeacherAnalytics.vue";
import TeacherResults from "@/components/teacher/TeacherResults.vue";
import TeacherAttendance from "@/components/teacher/TeacherAttendance.vue";
import TeacherCourseSelector from "@/components/teacher/TeacherCourseSelector.vue";
import UserTimetable from "@/components/UserTimetable.vue";

const school = JSON.parse(sessionStorage.getItem("school") || "null");
</script>

<template>
  <Navbar />

  <div class="dashboard teacher-dashboard">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">Teacher Dashboard</h1>
        <p class="page-subtitle">
          Manage classes, attendance, results, and daily teaching flow from one workspace.
        </p>
      </div>
    </header>

    <Notifications />
    <TeacherAnalytics />

    <SchoolAccountCard
      :school="school"
      title="School Account Number"
      subtitle="Teachers can quickly confirm the official account details configured by the admin."
    />

    <section class="card panel">
      <h2 class="section-title">Class Timetable</h2>
      <UserTimetable />
    </section>

    <section class="grid-2">
      <TeacherCourseSelector />
      <TeacherAttendance />
    </section>

    <TeacherResults />
  </div>
</template>

<style scoped>
.teacher-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel {
  padding: 24px;
}
</style>
