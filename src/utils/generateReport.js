import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ── palette (print-safe RGB) ──────────────────────────────────── */
const TEAL    = [20, 184, 166];
const DARK    = [15, 23, 42];
const GRAY    = [100, 116, 139];
const LGRAY   = [241, 245, 249];
const WHITE   = [255, 255, 255];
const RED     = [220, 38, 38];
const AMBER   = [217, 119, 6];
const GREEN   = [22, 163, 74];

const riskRGB    = (lvl) => lvl === 'high' ? RED : lvl === 'medium' ? AMBER : GREEN;
const healthRGB  = (s)   => s >= 80 ? GREEN : s >= 60 ? AMBER : RED;

// jsPDF helvetica only covers Latin-1; replace ₹ and other non-Latin-1 chars
const pdfSafe = (t) => String(t ?? '').replace(/₹/g, 'Rs.').replace(/[^\x00-\xFF]/g, '');

/* ── constants ─────────────────────────────────────────────────── */
const MANDATORY_KEYS = [
  'termination', 'payment', 'confidentiality',
  'jurisdiction', 'liability', 'indemnity',
];
const MANDATORY_LABELS = {
  termination:     'Termination Clause',
  payment:         'Payment Terms',
  confidentiality: 'Confidentiality Clause',
  jurisdiction:    'Jurisdiction / Governing Law',
  liability:       'Liability Clause',
  indemnity:       'Indemnity Clause',
};

/* ── main export ────────────────────────────────────────────────── */
export function generateAnalysisReport(doc, analysis) {
  const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW     = pdf.internal.pageSize.getWidth();   // 210
  const PH     = pdf.internal.pageSize.getHeight();  // 297
  const M      = 18;
  const CW     = PW - M * 2;
  let y        = 0;

  /* ── 1. Header strip ──────────────────────────────────────────── */
  pdf.setFillColor(...DARK);
  pdf.rect(0, 0, PW, 20, 'F');

  pdf.setTextColor(...TEAL);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NyayaAI', M, 13);

  pdf.setTextColor(160, 180, 200);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Legal Intelligence Platform', M + 22, 13);

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  pdf.setTextColor(140, 160, 180);
  pdf.text(`Report generated: ${reportDate}`, PW - M, 13, { align: 'right' });

  y = 28;

  /* ── 2. Document title & metadata ────────────────────────────── */
  const docName = (doc?.originalName || 'Document').replace(/\.[^.]+$/, '');
  const title   = docName.length > 70 ? docName.slice(0, 67) + '…' : docName;

  pdf.setTextColor(...DARK);
  pdf.setFontSize(17);
  pdf.setFont('helvetica', 'bold');
  pdf.text(pdfSafe(title), M, y);
  y += 7;

  const metaParts = [
    `Type: ${analysis.detectedDocType || doc?.docType || 'N/A'}`,
    `Jurisdiction: ${analysis.detectedJurisdiction || 'N/A'}`,
    `Analyzed: ${new Date(analysis.analyzedAt || Date.now()).toLocaleDateString('en-IN')}`,
    doc?.expiryDate
      ? `Expiry: ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}`
      : null,
  ].filter(Boolean).join('   ·   ');

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...GRAY);
  pdf.text(metaParts, M, y);
  y += 5;

  pdf.setDrawColor(...TEAL);
  pdf.setLineWidth(0.4);
  pdf.line(M, y, PW - M, y);
  y += 7;

  /* ── 3. Health score + stat row ──────────────────────────────── */
  const score  = analysis.healthScore ?? 0;
  const hColor = healthRGB(score);
  const rLevel = (doc?.riskLevel || 'low').toUpperCase();
  const rColor = riskRGB(doc?.riskLevel || 'low');

  // Score box
  pdf.setFillColor(...hColor);
  pdf.roundedRect(M, y, 36, 16, 2, 2, 'F');
  pdf.setTextColor(...WHITE);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${score}`, M + 18, y + 10, { align: 'center' });

  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('HEALTH SCORE', M + 18, y + 15, { align: 'center' });

  // Risk level chip
  const rLight = rColor.map((c) => Math.min(255, c + 185));
  pdf.setFillColor(...rLight);
  pdf.roundedRect(M + 42, y + 3, 26, 9, 1.5, 1.5, 'F');
  pdf.setTextColor(...rColor);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${rLevel} RISK`, M + 55, y + 8.8, { align: 'center' });

  // Stats text
  const statsText = [
    `${(analysis.clauses || []).length} Clauses`,
    `${(analysis.risks   || []).length} Risks`,
    `Compliance: ${analysis.compliance?.score ?? 0}%`,
    `Confidence: ${analysis.confidenceScore ?? 0}%`,
  ].join('   ·   ');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.text(statsText, M + 74, y + 9);

  y += 24;

  /* ── 4. AI Summary ────────────────────────────────────────────── */
  y = sectionHead(pdf, 'AI Summary', M, y, CW);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(40, 50, 65);
  const summaryLines = pdf.splitTextToSize(pdfSafe(analysis.summary || 'No summary available.'), CW);
  const summaryH = summaryLines.length * 5.5;
  y = pageBreakGuard(pdf, y, summaryH + 15, M, PH);
  pdf.text(summaryLines, M, y);
  y += summaryH + 10;

  /* ── 5. Clauses table ─────────────────────────────────────────── */
  const clauses = analysis.clauses || [];
  if (clauses.length > 0) {
    y = pageBreakGuard(pdf, y, 28, M, PH);
    y = sectionHead(pdf, `Clauses  (${clauses.length})`, M, y, CW);

    autoTable(pdf, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Clause Type', 'Plain English Summary', 'Risk']],
      body: clauses.map((c) => [
        pdfSafe(c.type || '—'),
        pdfSafe(c.plainEnglish || '—'),
        (c.riskLevel || 'low').toUpperCase(),
      ]),
      headStyles:           { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      bodyStyles:           { textColor: DARK, fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      alternateRowStyles:   { fillColor: LGRAY },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 116 },
        2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          data.cell.styles.textColor = riskRGB(data.cell.raw?.toLowerCase());
        }
      },
      theme: 'grid',
    });
    y = pdf.lastAutoTable.finalY + 10;
  }

  /* ── 6. Risks table ───────────────────────────────────────────── */
  const risks = analysis.risks || [];
  if (risks.length > 0) {
    y = pageBreakGuard(pdf, y, 28, M, PH);
    y = sectionHead(pdf, `Risks Identified  (${risks.length})`, M, y, CW);

    autoTable(pdf, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Title', 'Sev.', 'Description', 'Recommendation']],
      body: risks.map((r) => [
        pdfSafe(r.title       || '—'),
        (r.severity   || 'low').toUpperCase(),
        pdfSafe(r.description || '—'),
        pdfSafe(r.recommendation || '—'),
      ]),
      headStyles:          { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      bodyStyles:          { textColor: DARK, fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      alternateRowStyles:  { fillColor: LGRAY },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold' },
        1: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 74 },
        3: { cellWidth: 50 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = riskRGB(data.cell.raw?.toLowerCase());
        }
      },
      theme: 'grid',
    });
    y = pdf.lastAutoTable.finalY + 10;
  }

  /* ── 7. Compliance checklist ─────────────────────────────────── */
  y = pageBreakGuard(pdf, y, 28, M, PH);
  y = sectionHead(pdf, `Compliance Checklist  (Score: ${analysis.compliance?.score ?? 0}%)`, M, y, CW);

  const comp = analysis.compliance || {};
  const clauseRows = MANDATORY_KEYS.map((key) => {
    const present = !(comp.missingClauses || []).includes(key);
    return ['clause', present, MANDATORY_LABELS[key], present ? 'PRESENT' : 'MISSING'];
  });
  const structRows = [
    ['struct', !!comp.signaturePresent,  'Signature Present',        comp.signaturePresent  ? 'PASS' : 'FAIL'],
    ['struct', !!comp.datesValid,        'Valid Dates Found',         comp.datesValid        ? 'PASS' : 'FAIL'],
    ['struct', !!comp.jurisdictionValid, 'Indian Jurisdiction Valid', comp.jurisdictionValid ? 'PASS' : 'FAIL'],
  ];

  const allRows = [...clauseRows, ...structRows];

  autoTable(pdf, {
    startY: y,
    margin: { left: M, right: M },
    head: [['', 'Check Item', 'Status']],
    body: allRows.map(([, , label, status]) => ['', label, status]),
    headStyles:          { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles:          { textColor: DARK, fontSize: 8.5, cellPadding: 2.8, overflow: 'linebreak' },
    alternateRowStyles:  { fillColor: LGRAY },
    columnStyles: {
      0: { cellWidth: 8,   halign: 'center', fontSize: 10 },
      1: { cellWidth: 144 },
      2: { cellWidth: 22,  halign: 'center', fontStyle: 'bold', fontSize: 8 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const row     = allRows[data.row.index];
      const passing = row[1];
      if (data.column.index === 0) {
        data.cell.text    = [passing ? '✓' : '✗'];
        data.cell.styles.textColor = passing ? GREEN : RED;
      }
      if (data.column.index === 2) {
        data.cell.styles.textColor = passing ? GREEN : RED;
      }
    },
    theme: 'grid',
  });

  /* ── 8. Footer on every page ─────────────────────────────────── */
  const total = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setFillColor(245, 247, 250);
    pdf.rect(0, PH - 9, PW, 9, 'F');
    pdf.setDrawColor(220, 225, 230);
    pdf.setLineWidth(0.25);
    pdf.line(0, PH - 9, PW, PH - 9);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...GRAY);
    pdf.text(
      'Generated by NyayaAI — For informational purposes only. Not a substitute for legal advice.',
      M, PH - 3.5
    );
    pdf.text(`Page ${p} of ${total}`, PW - M, PH - 3.5, { align: 'right' });
  }

  /* ── Save ─────────────────────────────────────────────────────── */
  const safeName = (doc?.originalName || 'document')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '_')
    .trim();
  pdf.save(`NyayaAI_Report_${safeName}.pdf`);
}

/* ── helper: teal-accented section header ──────────────────────── */
function sectionHead(pdf, text, x, y, cw) {
  pdf.setDrawColor(...TEAL);
  pdf.setLineWidth(0.5);
  pdf.line(x, y, x + cw, y);
  pdf.setTextColor(...TEAL);
  pdf.setFontSize(10.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text(text, x, y - 1.5);
  return y + 5;
}

/* ── helper: add a new page if too close to the bottom ─────────── */
function pageBreakGuard(pdf, y, minRemaining, margin, pageH) {
  if (y > pageH - minRemaining - 15) {
    pdf.addPage();
    return margin + 8;
  }
  return y;
}
