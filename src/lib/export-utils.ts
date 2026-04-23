import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToPDF(opts: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}) {
  const doc = new jsPDF();
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ENGGAL GROUP", 14, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Web3 Franchise Platform", 14, 21);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(opts.title, 14, 36);
  if (opts.subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(opts.subtitle, 14, 42);
  }
  doc.setFontSize(8);
  doc.text(
    `Diekspor: ${new Date().toLocaleString("id-ID")}`,
    14,
    opts.subtitle ? 47 : 42,
  );

  autoTable(doc, {
    startY: opts.subtitle ? 52 : 48,
    head: [opts.headers],
    body: opts.rows,
    theme: "striped",
    headStyles: { fillColor: [212, 175, 55], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 9 },
  });

  doc.save(opts.filename);
}

export function exportToExcel(opts: {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}) {
  const wsData = [opts.headers, ...opts.rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  // Auto column width
  const colWidths = opts.headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...opts.rows.map((r) => String(r[i] ?? "").length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, opts.sheetName);
  XLSX.writeFile(wb, opts.filename);
}
