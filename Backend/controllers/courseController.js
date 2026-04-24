import Course from "../models/Course.js";
import User from "../models/User.js";
import { emitSchoolAdminUpdate } from "../utils/realtime.js";

const getSchoolId = (req) => req.user.school._id;

const populateCourseQuery = (query) =>
  query
    .populate("teacher", "name email")
    .populate("students", "name email");

const getSchoolCourse = (courseId, schoolId) =>
  Course.findOne({ _id: courseId, school: schoolId });

const getSchoolUser = (userId, role, schoolId) =>
  User.findOne({ _id: userId, role, school: schoolId });

const attachStudentToCourse = async ({ student, course }) => {
  if (!student.courses.some((id) => String(id) === String(course._id))) {
    student.courses.push(course._id);
    await student.save();
  }

  if (!course.students.some((id) => String(id) === String(student._id))) {
    course.students.push(student._id);
    await course.save();
  }
};

const detachStudentFromCourse = async ({ student, course }) => {
  student.courses = (student.courses || []).filter(
    (id) => String(id) !== String(course._id)
  );
  course.students = (course.students || []).filter(
    (id) => String(id) !== String(student._id)
  );

  await Promise.all([student.save(), course.save()]);
};

const syncTeacherCourse = async ({ course, teacher }) => {
  if (course.teacher && String(course.teacher) !== String(teacher._id)) {
    await User.findByIdAndUpdate(course.teacher, {
      $pull: { courses: course._id },
    });
  }

  course.teacher = teacher._id;
  await course.save();

  if (!teacher.courses.some((id) => String(id) === String(course._id))) {
    teacher.courses.push(course._id);
    await teacher.save();
  }
};

const clearTeacherFromCourse = async (course) => {
  if (course.teacher) {
    await User.findByIdAndUpdate(course.teacher, {
      $pull: { courses: course._id },
    });
  }

  course.teacher = undefined;
  await course.save();
};

export const createCourse = async (req, res) => {
  try {
    const { name, term } = req.body;

    const course = await Course.create({
      name,
      term,
      school: getSchoolId(req),
    });

    res.json(course);

    await emitSchoolAdminUpdate({
      schoolId: getSchoolId(req),
      entity: "course",
      action: "created",
      message: `Admin created the ${course.name} course.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await populateCourseQuery(
      Course.find({ school: getSchoolId(req) })
    );

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const schoolId = getSchoolId(req);

    const [student, course] = await Promise.all([
      getSchoolUser(studentId, "student", schoolId),
      getSchoolCourse(courseId, schoolId),
    ]);

    if (!student || !course) {
      return res.status(404).json({ message: "Student or course not found." });
    }

    await attachStudentToCourse({ student, course });

    const updatedCourse = await populateCourseQuery(Course.findById(courseId));

    res.json({
      message: "Course assigned to student",
      course: updatedCourse,
    });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "course",
      action: "student-assigned",
      message: "Admin assigned students to a course.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignTeacher = async (req, res) => {
  try {
    const { courseId, teacherId } = req.body;
    const schoolId = getSchoolId(req);

    const [course, teacher] = await Promise.all([
      getSchoolCourse(courseId, schoolId),
      getSchoolUser(teacherId, "teacher", schoolId),
    ]);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    await syncTeacherCourse({ course, teacher });

    const updatedCourse = await populateCourseQuery(Course.findById(courseId));

    res.json({ message: "Teacher assigned", course: updatedCourse });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "course",
      action: "teacher-assigned",
      message: "Admin assigned a teacher to a course.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignmentHistory = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const [students, teachers, courses] = await Promise.all([
      User.find({ school: schoolId, role: "student" }).select("name email"),
      User.find({ school: schoolId, role: "teacher" }).select("name email"),
      populateCourseQuery(Course.find({ school: schoolId })),
    ]);

    const studentHistory = students
      .map((student) => {
        const assignments = courses
          .filter((course) =>
            course.students?.some(
              (assignedStudent) => String(assignedStudent._id) === String(student._id)
            )
          )
          .map((course) => ({
            id: `${student._id}:${course._id}`,
            studentId: student._id,
            courseId: course._id,
            courseName: course.name,
            term: course.term || "-",
            teacherName: course.teacher?.name || "Unassigned",
          }))
          .sort((left, right) => left.courseName.localeCompare(right.courseName));

        return {
          student: {
            _id: student._id,
            name: student.name,
            email: student.email,
          },
          courses: assignments,
        };
      })
      .filter((entry) => entry.courses.length > 0)
      .sort((left, right) => left.student.name.localeCompare(right.student.name));

    const teacherHistory = teachers
      .map((teacher) => {
        const assignments = courses
          .filter(
            (course) => String(course.teacher?._id || "") === String(teacher._id)
          )
          .map((course) => ({
            id: String(course._id),
            courseId: course._id,
            courseName: course.name,
            term: course.term || "-",
            studentCount: course.students?.length || 0,
          }))
          .sort((left, right) => left.courseName.localeCompare(right.courseName));

        return {
          teacher: {
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
          },
          courses: assignments,
        };
      })
      .filter((entry) => entry.courses.length > 0)
      .sort((left, right) => left.teacher.name.localeCompare(right.teacher.name));

    res.json({
      studentHistory,
      teacherHistory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateStudentAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const currentStudentId = req.params.studentId;
    const currentCourseId = req.params.courseId;
    const nextStudentId = req.body.studentId || currentStudentId;
    const nextCourseId = req.body.courseId || currentCourseId;

    const [currentStudent, currentCourse, nextStudent, nextCourse] = await Promise.all([
      getSchoolUser(currentStudentId, "student", schoolId),
      getSchoolCourse(currentCourseId, schoolId),
      getSchoolUser(nextStudentId, "student", schoolId),
      getSchoolCourse(nextCourseId, schoolId),
    ]);

    if (!currentStudent || !currentCourse || !nextStudent || !nextCourse) {
      return res.status(404).json({ message: "Assignment record not found." });
    }

    await detachStudentFromCourse({ student: currentStudent, course: currentCourse });
    await attachStudentToCourse({ student: nextStudent, course: nextCourse });

    res.json({ message: "Student-course assignment updated successfully." });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "course",
      action: "student-assignment-updated",
      message: "Admin updated a student-course assignment.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStudentAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const [student, course] = await Promise.all([
      getSchoolUser(req.params.studentId, "student", schoolId),
      getSchoolCourse(req.params.courseId, schoolId),
    ]);

    if (!student || !course) {
      return res.status(404).json({ message: "Assignment record not found." });
    }

    await detachStudentFromCourse({ student, course });
    res.json({ message: "Student-course assignment deleted successfully." });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "course",
      action: "student-assignment-deleted",
      message: "Admin removed a student-course assignment.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearStudentAssignments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);

    await Promise.all([
      Course.updateMany({ school: schoolId }, { $set: { students: [] } }),
      User.updateMany(
        { school: schoolId, role: "student" },
        { $set: { courses: [] } }
      ),
    ]);

    res.json({ message: "All student-course assignments cleared successfully." });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "course",
      action: "student-assignments-cleared",
      message: "Admin cleared all student-course assignments.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTeacherAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const course = await getSchoolCourse(req.params.courseId, schoolId);

    if (!course) {
      return res.status(404).json({ message: "Assignment record not found." });
    }

    const teacher = await getSchoolUser(req.body.teacherId, "teacher", schoolId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found in this school." });
    }

    await syncTeacherCourse({ course, teacher });
    res.json({ message: "Teacher-course assignment updated successfully." });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "course",
      action: "teacher-assignment-updated",
      message: "Admin updated a teacher-course assignment.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTeacherAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const course = await getSchoolCourse(req.params.courseId, schoolId);

    if (!course) {
      return res.status(404).json({ message: "Assignment record not found." });
    }

    await clearTeacherFromCourse(course);
    res.json({ message: "Teacher-course assignment deleted successfully." });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "course",
      action: "teacher-assignment-deleted",
      message: "Admin removed a teacher-course assignment.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearTeacherAssignments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const courses = await Course.find({ school: schoolId, teacher: { $ne: null } });

    for (const course of courses) {
      await clearTeacherFromCourse(course);
    }

    res.json({ message: "All teacher-course assignments cleared successfully." });

    await emitSchoolAdminUpdate({
      schoolId,
      entity: "course",
      action: "teacher-assignments-cleared",
      message: "Admin cleared all teacher-course assignments.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentsWithCourses = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      school: req.user.school._id,
    });

    const courses = await Course.find({
      school: req.user.school._id,
    })
      .populate("teacher", "name")
      .populate("students", "name");

    res.json({ students, courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeachersWithCourses = async (req, res) => {
  try {
    const teachers = await User.find({
      role: "teacher",
      school: req.user.school._id,
    });

    const courses = await Course.find({
      school: req.user.school._id,
    }).populate("teacher");

    res.json({ teachers, courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
