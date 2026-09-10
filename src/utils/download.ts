import { jsPDF } from 'jspdf';
import type { Deadline, Subject, SubjectColor } from '@/types';
import { groupDeadlinesByDate, relativeDeadlineLabel } from '@/utils/deadlines';
import { COLOR_HEX } from '@/utils/colors';
import { getFileTimestamp } from '@/utils/filename';

export type ExportGrouping = 'category' | 'subject';

interface ExportOptions {
  studentName: string;
  semesterName: string;
  deadlines: Deadline[];
  subjects: Subject[];
  scopeLabel: string;
  grouping: ExportGrouping;
}

const SUBJECT_PDF_COLORS: Record<
  SubjectColor,
  {
    bg: [number, number, number];
    text: [number, number, number];
    border: [number, number, number];
    itemBg: [number, number, number];
  }
> = {
  rose: { bg: [249, 238, 240], text: [156, 62, 84], border: [244, 204, 212], itemBg: [255, 250, 251] },
  amber: { bg: [249, 242, 228], text: [154, 110, 46], border: [244, 224, 186], itemBg: [255, 252, 245] },
  teal: { bg: [232, 243, 240], text: [46, 110, 100], border: [194, 226, 218], itemBg: [247, 252, 251] },
  blue: { bg: [234, 241, 248], text: [58, 97, 143], border: [198, 219, 239], itemBg: [247, 250, 255] },
  violet: { bg: [240, 235, 246], text: [94, 74, 142], border: [219, 205, 235], itemBg: [250, 247, 254] },
  emerald: { bg: [234, 243, 237], text: [58, 122, 74], border: [198, 225, 207], itemBg: [247, 253, 249] },
  crimson: { bg: [248, 235, 235], text: [142, 53, 53], border: [241, 199, 199], itemBg: [255, 248, 248] },
  slate: { bg: [238, 240, 243], text: [68, 84, 95], border: [208, 215, 223], itemBg: [249, 250, 252] },
  plum: { bg: [244, 238, 241], text: [110, 68, 94], border: [228, 211, 221], itemBg: [252, 248, 250] },
  ochre: { bg: [244, 238, 226], text: [126, 94, 48], border: [228, 211, 178], itemBg: [252, 250, 244] },
};

const DEFAULT_SUBJECT_PDF = {
  bg: [243, 244, 246] as [number, number, number],
  text: [75, 85, 99] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  itemBg: [250, 250, 250] as [number, number, number],
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getSubject(deadline: Deadline, subjects: Subject[]): Subject | undefined {
  return subjects.find((s) => s.id === deadline.subjectId);
}

function getSubjectName(deadline: Deadline, subjects: Subject[]): string {
  const s = getSubject(deadline, subjects);
  return s ? s.name : 'Other';
}

interface PdfGroup {
  id: string;
  label: string;
  sublabel?: string;
  hex: string;
  pdfBg: [number, number, number];
  pdfText: [number, number, number];
  pdfBorder: [number, number, number];
  pdfItemBg: [number, number, number];
  items: Deadline[];
}

function groupByCategory(deadlines: Deadline[]): PdfGroup[] {
  const groups = groupDeadlinesByDate(deadlines);
  return groups.map((g) => ({
    id: g.id,
    label: g.label,
    sublabel: g.sublabel,
    hex: g.hex,
    pdfBg: g.pdfBg,
    pdfText: g.pdfText,
    pdfBorder: g.pdfBorder,
    pdfItemBg: g.pdfItemBg,
    items: g.items,
  }));
}

function groupBySubject(deadlines: Deadline[], subjects: Subject[]): PdfGroup[] {
  const sorted = [...deadlines].sort((a, b) => a.dueDate - b.dueDate);
  const withSubject = subjects.filter((s) =>
    sorted.some((d) => d.subjectId === s.id),
  );
  const groups: PdfGroup[] = withSubject.map((subject) => {
    const pal = SUBJECT_PDF_COLORS[subject.color] || DEFAULT_SUBJECT_PDF;
    return {
      id: subject.id,
      label: subject.name,
      hex: COLOR_HEX[subject.color] || '#64748b',
      pdfBg: pal.bg,
      pdfText: pal.text,
      pdfBorder: pal.border,
      pdfItemBg: pal.itemBg,
      items: sorted.filter((d) => d.subjectId === subject.id),
    };
  });

  const noSubject = sorted.filter((d) => !d.subjectId);
  if (noSubject.length > 0) {
    groups.push({
      id: 'other',
      label: 'Other (General)',
      hex: '#64748b',
      pdfBg: DEFAULT_SUBJECT_PDF.bg,
      pdfText: DEFAULT_SUBJECT_PDF.text,
      pdfBorder: DEFAULT_SUBJECT_PDF.border,
      pdfItemBg: DEFAULT_SUBJECT_PDF.itemBg,
      items: noSubject,
    });
  }
  return groups;
}

export function downloadDeadlinesAsText(opts: ExportOptions): void {
  const { studentName, semesterName, deadlines, subjects, scopeLabel, grouping } = opts;
  const sorted = [...deadlines].sort((a, b) => a.dueDate - b.dueDate);
  const groups =
    grouping === 'subject'
      ? groupBySubject(sorted, subjects)
      : groupByCategory(sorted);
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const lines: string[] = [];
  lines.push('='.repeat(55));
  lines.push('  ACADEMIC DEADLINE REPORT');
  lines.push('='.repeat(55));
  lines.push('');
  lines.push(`Student:   ${studentName || '—'}`);
  lines.push(`Semester:  ${semesterName}`);
  lines.push(`Scope:     ${scopeLabel}`);
  lines.push(`Format:    ${grouping === 'subject' ? 'Subject-wise' : 'Date-wise'}`);
  lines.push(`Generated: ${date}`);
  lines.push('');
  lines.push('-'.repeat(55));
  lines.push('');

  if (sorted.length === 0) {
    lines.push('No deadlines found.');
  } else {
    groups.forEach((g) => {
      const title = g.sublabel ? `${g.label} (${g.sublabel})` : g.label;
      lines.push(`[${title.toUpperCase()}] (${g.items.length})`);
      lines.push('');
      g.items.forEach((d, i) => {
        lines.push(`  ${i + 1}. ${d.title}`);
        lines.push(`     Due:     ${formatDate(d.dueDate)} — ${relativeDeadlineLabel(d)}`);
        lines.push(`     Subject: ${getSubjectName(d, subjects)}`);
        if (d.description) lines.push(`     Notes:   ${d.description}`);
        lines.push(`     Status:  ${d.completed ? 'Completed' : 'Pending'}`);
        lines.push('');
      });
      lines.push('-'.repeat(55));
      lines.push('');
    });
  }

  lines.push('');
  lines.push('Generated by eStudesk • Focus. Prepare. Succeed.');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const semSlug = semesterName ? semesterName.replace(/\s+/g, '-').toLowerCase() : 'semester';
  const scopeSlug = scopeLabel ? scopeLabel.replace(/\s+/g, '-').toLowerCase() : 'all';
  const stamp = getFileTimestamp();
  a.href = url;
  a.download = `deadlines-${semSlug}-${scopeSlug}_${stamp}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDeadlinesAsPDF(opts: ExportOptions): void {
  const { studentName, semesterName, deadlines, subjects, scopeLabel, grouping } = opts;
  const sorted = [...deadlines].sort((a, b) => a.dueDate - b.dueDate);
  const groups =
    grouping === 'subject'
      ? groupBySubject(sorted, subjects)
      : groupByCategory(sorted);
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  // --- Top Header Card ---
  doc.setFillColor(249, 247, 242);
  doc.setDrawColor(228, 222, 210);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, 'FD');

  // Decorative left color bar
  doc.setFillColor(74, 138, 100);
  doc.roundedRect(margin, y, 2.5, 28, 1.2, 1.2, 'F');

  // Header Title
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Academic Deadline Schedule', margin + 7, y + 9);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('eStudesk Academic Study Suite • Structured Agenda', margin + 7, y + 15);

  // Date Tag (top right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated: ${dateStr}`, pageW - margin - 5, y + 9, { align: 'right' });

  // Metadata chips inside header
  const chipY = y + 19;
  const chips = [
    { label: 'Semester', val: semesterName || 'General', bg: [238, 242, 255] as [number, number, number], text: [67, 56, 202] as [number, number, number] },
    { label: 'Scope', val: scopeLabel, bg: [240, 253, 244] as [number, number, number], text: [22, 101, 52] as [number, number, number] },
    { label: 'View', val: grouping === 'subject' ? 'Subject-wise' : 'Date-wise', bg: [254, 243, 199] as [number, number, number], text: [146, 64, 14] as [number, number, number] },
    { label: 'Total', val: `${sorted.length} deadlines`, bg: [241, 245, 249] as [number, number, number], text: [51, 65, 85] as [number, number, number] },
  ];

  if (studentName) {
    chips.unshift({ label: 'Student', val: studentName, bg: [243, 244, 246] as [number, number, number], text: [31, 41, 55] as [number, number, number] });
  }

  let chipX = margin + 7;
  chips.forEach((c) => {
    const text = `${c.label}: ${c.val}`;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    const tw = doc.getTextWidth(text) + 6;
    doc.setFillColor(...c.bg);
    doc.roundedRect(chipX, chipY, tw, 5.5, 1.2, 1.2, 'F');
    doc.setTextColor(...c.text);
    doc.text(text, chipX + 3, chipY + 3.8);
    chipX += tw + 3;
  });

  y += 34;

  if (sorted.length === 0) {
    doc.setFillColor(250, 250, 249);
    doc.setDrawColor(228, 222, 210);
    doc.roundedRect(margin, y, contentW, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108);
    doc.text('No upcoming or pending deadlines found. All caught up!', margin + contentW / 2, y + 11, { align: 'center' });
  } else {
    groups.forEach((g) => {
      // Check space for header + at least one card
      if (y > pageH - 35) {
        doc.addPage();
        y = margin;
      }

      // Group Header Banner (Soft pastel background)
      const groupLabel = g.sublabel ? `${g.label}  (${g.sublabel})` : g.label;
      doc.setFillColor(...g.pdfBg);
      doc.setDrawColor(...g.pdfBorder);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentW, 8.5, 2, 2, 'FD');

      // Left Accent Bullet
      doc.setFillColor(g.hex);
      doc.circle(margin + 4.5, y + 4.25, 1.5, 'F');

      // Group Title
      doc.setTextColor(...g.pdfText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(groupLabel.toUpperCase(), margin + 8.5, y + 5.5);

      // Item count pill
      const countLabel = `${g.items.length} ${g.items.length === 1 ? 'task' : 'tasks'}`;
      doc.setFontSize(7.5);
      const countW = doc.getTextWidth(countLabel) + 5;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...g.pdfBorder);
      doc.roundedRect(pageW - margin - countW - 3, y + 1.8, countW, 5, 1, 1, 'FD');
      doc.setTextColor(...g.pdfText);
      doc.text(countLabel, pageW - margin - countW / 2 - 3, y + 5.2, { align: 'center' });

      y += 11.5;

      // Group Items (Rendered as distinct soft pastel cards)
      g.items.forEach((d) => {
        const subj = getSubject(d, subjects);
        const subjName = subj ? subj.name : 'Other';
        const dueStr = formatDate(d.dueDate);
        const relStr = relativeDeadlineLabel(d);

        // Calculate card height dynamically
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(d.title, contentW - 55);
        const titleH = titleLines.length * 4.2;

        let descH = 0;
        let descLines: string[] = [];
        if (d.description) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          descLines = doc.splitTextToSize(d.description, contentW - 12);
          descH = descLines.length * 3.4 + 2;
        }

        const cardH = Math.max(14, 8 + titleH + descH);

        // Page break check
        if (y + cardH > pageH - 16) {
          doc.addPage();
          y = margin;
        }

        // Draw Deadline Item Card
        doc.setFillColor(...g.pdfItemBg);
        doc.setDrawColor(...g.pdfBorder);
        doc.setLineWidth(0.25);
        doc.roundedRect(margin, y, contentW, cardH, 2, 2, 'FD');

        // Checkbox icon
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin + 3.5, y + 3.5, 3.8, 3.8, 0.8, 0.8, 'FD');
        if (d.completed) {
          doc.setFillColor(74, 138, 100);
          doc.roundedRect(margin + 4.2, y + 4.2, 2.4, 2.4, 0.4, 0.4, 'F');
        }

        // Title text
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(titleLines, margin + 10, y + 6.2);

        // Right badges (Status & Subject)
        let badgeRightX = pageW - margin - 3.5;

        // Status Badge
        const statusText = d.completed ? 'Completed' : 'Pending';
        const statusBg: [number, number, number] = d.completed ? [220, 252, 231] : [254, 243, 199];
        const statusColor: [number, number, number] = d.completed ? [22, 101, 52] : [146, 64, 14];
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const statusW = doc.getTextWidth(statusText) + 5;
        doc.setFillColor(...statusBg);
        doc.roundedRect(badgeRightX - statusW, y + 3.2, statusW, 4.5, 1, 1, 'F');
        doc.setTextColor(...statusColor);
        doc.text(statusText, badgeRightX - statusW / 2, y + 6.3, { align: 'center' });
        badgeRightX -= statusW + 2;

        // Subject Badge
        if (subj) {
          const sColor = SUBJECT_PDF_COLORS[subj.color] || DEFAULT_SUBJECT_PDF;
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          const subjW = doc.getTextWidth(subjName) + 5;
          doc.setFillColor(...sColor.bg);
          doc.roundedRect(badgeRightX - subjW, y + 3.2, subjW, 4.5, 1, 1, 'F');
          doc.setTextColor(...sColor.text);
          doc.text(subjName, badgeRightX - subjW / 2, y + 6.3, { align: 'center' });
        }

        // Due date & relative info line
        const metaY = y + 6.5 + titleH;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Due: ${dueStr}`, margin + 10, metaY);

        const dueW = doc.getTextWidth(`Due: ${dueStr}`) + 2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...g.pdfText);
        doc.text(`•  ${relStr}`, margin + 10 + dueW, metaY);

        // Description if present
        if (descLines.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(descLines, margin + 10, metaY + 4);
        }

        y += cardH + 2.2;
      });

      y += 3;
    });
  }

  // --- Footer Page Numbers ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Subtle divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 11, pageW - margin, pageH - 11);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('eStudesk • Academic Preparation & Deadline Tracker', margin, pageH - 6.5);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 6.5, { align: 'right' });
  }

  const semSlug = semesterName ? semesterName.replace(/\s+/g, '-').toLowerCase() : 'semester';
  const scopeSlug = scopeLabel ? scopeLabel.replace(/\s+/g, '-').toLowerCase() : 'all';
  const stamp = getFileTimestamp();
  doc.save(`deadlines-${semSlug}-${scopeSlug}_${stamp}.pdf`);
}
