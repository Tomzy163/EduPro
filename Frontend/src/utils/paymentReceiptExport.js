import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addSchoolBranding } from "@/utils/pdfBranding";

export const exportPaymentReceiptPdf = async ({
  payment,
  school,
  payerName,
}) => {
  if (!payment) {
    return false;
  }

  const doc = new jsPDF();
  const startY = await addSchoolBranding({
    doc,
    school,
    title: "Payment Receipt",
    subtitle: `Receipt No: ${payment.receiptNumber || "Pending"}`,
    metaLines: [
      `Payer: ${payerName || payment.user?.name || "School user"}`,
      `Student: ${payment.student?.name || payment.studentNameSnapshot || "Not linked"}`,
      `Status: ${payment.status || "pending"}`,
    ],
  });

  autoTable(doc, {
    startY,
    head: [["Field", "Value"]],
    body: [
      ["Amount", `NGN ${Number(payment.amount || 0).toLocaleString()}`],
      ["Payment Type", payment.type || "school_fee"],
      ["Reference", payment.reference || payment.receiptNumber || "-"],
      ["Uploaded Receipt", payment.receipt ? "Yes" : "No"],
      ["Submitted On", new Date(payment.createdAt || Date.now()).toLocaleDateString()],
      [
        "Approved On",
        payment.confirmedAt ? new Date(payment.confirmedAt).toLocaleDateString() : "-",
      ],
    ],
  });

  doc.save(
    `${String(payment.receiptNumber || "payment-receipt")
      .replace(/\s+/g, "-")
      .toLowerCase()}.pdf`
  );

  return true;
};
