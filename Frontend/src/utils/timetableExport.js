import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_ORDER = [
  "08:00am-09:00am",
  "09:00am-10:00am",
  "10:00am-11:00am",
  "11:00am-12:00pm",
  "12:00pm-01:00pm",
  "01:00pm-02:00pm",
  "02:00pm-03:00pm",
];

export const sortTimetableSlots = (slots = []) =>
  [...slots].sort((left, right) => {
    const dayDiff = DAY_ORDER.indexOf(left.day) - DAY_ORDER.indexOf(right.day);

    if (dayDiff !== 0) {
      return dayDiff;
    }

    return TIME_ORDER.indexOf(left.time) - TIME_ORDER.indexOf(right.time);
  });

const mapSlot = (slot) => ({
  Timetable: slot.name || "Timetable",
  Course: slot.course?.name || "Course",
  Day: slot.day || "-",
  Time: slot.time || "-",
  Location: slot.location || "-",
  Teacher: slot.teacher?.name || "-",
  Student: slot.student?.name || "-",
  Audience: slot.audience || "-",
});

export const exportTimetablePdf = ({
  slots = [],
  schoolName = "EduPro School",
  title = "Timetable",
  fileName = "timetable.pdf",
  subtitle = "",
}) => {
  if (!slots.length) {
    return false;
  }

  const rows = sortTimetableSlots(slots).map(mapSlot);
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text(schoolName, 14, 18);
  doc.setFontSize(14);
  doc.text(title, 14, 28);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);

  if (subtitle) {
    doc.text(subtitle, 14, 43);
  }

  autoTable(doc, {
    startY: subtitle ? 50 : 44,
    head: [["Timetable", "Course", "Day", "Time", "Location", "Teacher", "Student"]],
    body: rows.map((row) => [
      row.Timetable,
      row.Course,
      row.Day,
      row.Time,
      row.Location,
      row.Teacher,
      row.Student,
    ]),
  });

  doc.save(fileName);
  return true;
};

export const exportTimetableExcel = ({
  slots = [],
  fileName = "timetable.xlsx",
  sheetName = "Timetable",
}) => {
  if (!slots.length) {
    return false;
  }

  const rows = sortTimetableSlots(slots).map(mapSlot);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);

  return true;
};
