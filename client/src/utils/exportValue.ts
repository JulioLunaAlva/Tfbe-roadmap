/**
 * exportValue.ts
 * Professional export utilities for Initiative Value data.
 * Supports Excel (.xlsx) and PDF formats.
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportInitiative {
    name: string;
    area: string;
    champion?: string;
    status?: string;
    progress?: number;
    technologies?: string[];
}

export interface ExportPillar {
    key: string;
    label: string;
    hexColor: string;
    hexText: string;
}

export interface ExportValueData {
    [key: string]: string;
}

// ─── Pillar color map ─────────────────────────────────────────────────────────

export const EXPORT_PILLARS: ExportPillar[] = [
    { key: 'business_value',           label: 'Valor de Negocio',      hexColor: '7C3AED', hexText: 'FFFFFF' },
    { key: 'operational_efficiency',   label: 'Eficiencia Operativa',  hexColor: 'D97706', hexText: 'FFFFFF' },
    { key: 'fte_detail',               label: 'FTE',                   hexColor: '0891B2', hexText: 'FFFFFF' },
    { key: 'qualitative_benefit',      label: 'Beneficio Cualitativo', hexColor: 'E11D48', hexText: 'FFFFFF' },
    { key: 'users_reached_detail',     label: 'Usuarios Alcanzados',   hexColor: '059669', hexText: 'FFFFFF' },
    { key: 'estimated_savings_detail', label: 'Ahorro Estimado',       hexColor: '16A34A', hexText: 'FFFFFF' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li>/gi, '• ')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function isPillarFilled(val: string): boolean {
    return !!val && val !== '' && val !== '<p></p>';
}

function hexToRgb(hex: string): [number, number, number] {
    return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
    ];
}

function safeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 40);
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export function exportToExcel(
    initiative: ExportInitiative,
    valueData: ExportValueData,
    pillars: ExportPillar[] = EXPORT_PILLARS
): void {
    const wb = XLSX.utils.book_new();
    const exportDate = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const filledCount = pillars.filter(p => isPillarFilled(valueData[p.key])).length;

    // ── Sheet 1: Resumen Ejecutivo ─────────────────────────────────────────────
    const s1: any[][] = [
        ['TFBE ROADMAP — IMPACTO & VALOR', '', '', ''],
        [`Exportado el ${exportDate}`, '', '', ''],
        [],
        ['INFORMACIÓN DE LA INICIATIVA', '', '', ''],
        ['Nombre',               initiative.name, '', ''],
        ['Área',                 initiative.area || '—', '', ''],
        ['Champion',             initiative.champion || '—', '', ''],
        ['Estatus',              initiative.status || '—', '', ''],
        ['Progreso',             `${initiative.progress ?? 0}%`, '', ''],
        ['Tecnologías',          initiative.technologies?.join(', ') || '—', '', ''],
        ['Pilares documentados', `${filledCount} / ${pillars.length}`, '', ''],
        [],
        ['PILAR', 'ESTADO', 'CONTENIDO (EXTRACTO)', ''],
        ...pillars.map(p => {
            const raw = valueData[p.key] || '';
            const text = stripHtml(raw);
            const preview = text.length > 300 ? text.slice(0, 300) + '…' : (text || '(Sin documentar)');
            return [p.label, isPillarFilled(raw) ? '✅ Completo' : '⬜ Pendiente', preview, ''];
        }),
        [],
        [`© ${new Date().getFullYear()} TFBE Roadmap — Documento generado automáticamente`, '', '', ''],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(s1);

    ws1['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 90 }, { wch: 5 }];
    ws1['!rows'] = s1.map((_, i) => (i === 0 ? { hpt: 26 } : { hpt: 20 }));

    const totalRows = s1.length;
    ws1['!merges'] = [
        { s: { r: 0,  c: 0 }, e: { r: 0,  c: 3 } },
        { s: { r: 1,  c: 0 }, e: { r: 1,  c: 3 } },
        { s: { r: 3,  c: 0 }, e: { r: 3,  c: 3 } },
        { s: { r: 4,  c: 1 }, e: { r: 4,  c: 3 } },
        { s: { r: 5,  c: 1 }, e: { r: 5,  c: 3 } },
        { s: { r: 6,  c: 1 }, e: { r: 6,  c: 3 } },
        { s: { r: 7,  c: 1 }, e: { r: 7,  c: 3 } },
        { s: { r: 8,  c: 1 }, e: { r: 8,  c: 3 } },
        { s: { r: 9,  c: 1 }, e: { r: 9,  c: 3 } },
        { s: { r: 10, c: 1 }, e: { r: 10, c: 3 } },
        ...pillars.map((_, i) => ({ s: { r: 13 + i, c: 2 }, e: { r: 13 + i, c: 3 } })),
        { s: { r: totalRows - 1, c: 0 }, e: { r: totalRows - 1, c: 3 } },
    ];

    const setStyle = (ref: string, style: object) => {
        if (!ws1[ref]) ws1[ref] = { t: 's', v: '' };
        ws1[ref].s = style;
    };

    // Header title
    setStyle('A1', { font: { bold: true, sz: 15, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '312E81' } }, alignment: { horizontal: 'center', vertical: 'center' } });
    setStyle('A2', { font: { sz: 9, italic: true, color: { rgb: '6366F1' } }, alignment: { horizontal: 'center' } });

    // Info section header
    setStyle('A4', { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '4F46E5' } } });

    // Info rows labels
    for (let r = 5; r <= 11; r++) {
        setStyle(`A${r}`, { font: { bold: true, sz: 9, color: { rgb: '374151' } }, fill: { fgColor: { rgb: 'EEF2FF' } } });
        setStyle(`B${r}`, { font: { sz: 9 }, fill: { fgColor: { rgb: 'F9FAFB' } } });
    }

    // Pillars table header (row 13, 0-indexed = row 12)
    setStyle('A13', { font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E1B4B' } }, alignment: { horizontal: 'center' } });
    setStyle('B13', { font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E1B4B' } }, alignment: { horizontal: 'center' } });
    setStyle('C13', { font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E1B4B' } } });

    // Pillar data rows
    pillars.forEach((pillar, i) => {
        const row = 14 + i;
        const isEven = i % 2 === 0;
        setStyle(`A${row}`, { font: { bold: true, sz: 9, color: { rgb: pillar.hexText } }, fill: { fgColor: { rgb: pillar.hexColor } }, alignment: { vertical: 'top' } });
        setStyle(`B${row}`, { font: { sz: 9 }, fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'top' } });
        setStyle(`C${row}`, { font: { sz: 9 }, fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } }, alignment: { vertical: 'top', wrapText: true } });
    });

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Ejecutivo');

    // ── Sheet 2: Detalle por Pilar ─────────────────────────────────────────────
    const s2: any[][] = [
        ['DETALLE POR PILAR — ' + initiative.name.toUpperCase()],
        [`${initiative.area || ''} | Champion: ${initiative.champion || '—'} | ${exportDate}`],
        [],
    ];

    for (const pillar of pillars) {
        const raw = valueData[pillar.key] || '';
        const text = stripHtml(raw) || '(Sin información documentada)';
        s2.push([pillar.label.toUpperCase()]);
        text.split('\n').filter(l => l.trim()).forEach(line => s2.push([line]));
        s2.push([]);
    }

    s2.push([`© ${new Date().getFullYear()} TFBE Roadmap`]);

    const ws2 = XLSX.utils.aoa_to_sheet(s2);
    ws2['!cols'] = [{ wch: 120 }];
    ws2['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    ];

    if (ws2['A1']) ws2['A1'].s = { font: { bold: true, sz: 13, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '312E81' } }, alignment: { horizontal: 'left', vertical: 'center' } };
    if (ws2['A2']) ws2['A2'].s = { font: { sz: 9, italic: true, color: { rgb: '6366F1' } } };

    // Style pillar headers in sheet 2
    let rowIdx = 3;
    for (const pillar of pillars) {
        const raw = valueData[pillar.key] || '';
        const lines = stripHtml(raw).split('\n').filter(l => l.trim());
        const lineCount = Math.max(lines.length, 1);

        const hRef = `A${rowIdx + 1}`;
        if (ws2[hRef]) {
            ws2[hRef].s = {
                font: { bold: true, sz: 10, color: { rgb: pillar.hexText } },
                fill: { fgColor: { rgb: pillar.hexColor } },
            };
        }
        rowIdx += 1 + lineCount + 1;
    }

    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle por Pilar');

    XLSX.writeFile(wb, `ImpactoValor_${safeFileName(initiative.name)}.xlsx`);
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export function exportToPDF(
    initiative: ExportInitiative,
    valueData: ExportValueData,
    pillars: ExportPillar[] = EXPORT_PILLARS
): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const MARGIN = 18;
    const CONTENT_W = W - MARGIN * 2;
    const exportDate = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const filledCount = pillars.filter(p => isPillarFilled(valueData[p.key])).length;
    let pageNum = 1;

    const addFooter = () => {
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'normal');
        doc.text('TFBE Roadmap — Impacto & Valor', MARGIN, 287);
        doc.text(`Página ${pageNum}`, W - MARGIN, 287, { align: 'right' });
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, 283.5, W - MARGIN, 283.5);
    };

    // ── COVER PAGE ─────────────────────────────────────────────────────────────

    // Header band
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, W, 58, 'F');

    // Indigo accent stripe
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 58, W, 2.5, 'F');

    // App label
    doc.setFontSize(8);
    doc.setTextColor(165, 180, 252);
    doc.setFont('helvetica', 'bold');
    doc.text('TFBE ROADMAP', MARGIN, 14);

    // Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('Impacto & Valor', MARGIN, 32);

    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(199, 210, 254);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte Ejecutivo de Iniciativa', MARGIN, 41);

    // Date
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado el ${exportDate}`, MARGIN, 52);

    // Initiative card
    let y = 74;
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(MARGIN, y, CONTENT_W, 68, 3, 3, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN, y, CONTENT_W, 68, 3, 3, 'S');

    // Left accent bar
    doc.setFillColor(99, 102, 241);
    doc.rect(MARGIN, y, 3.5, 68, 'F');

    y += 9;
    doc.setFontSize(13);
    doc.setTextColor(30, 27, 75);
    doc.setFont('helvetica', 'bold');
    const nameLines = doc.splitTextToSize(initiative.name, CONTENT_W - 14);
    doc.text(nameLines, MARGIN + 9, y);
    y += nameLines.length * 6.5 + 2;

    doc.setFontSize(9);

    const infoRows: [string, string][] = [
        ['Área',     initiative.area || '—'],
        ['Champion', initiative.champion || '—'],
        ['Estatus',  initiative.status || '—'],
        ['Progreso', `${initiative.progress ?? 0}%`],
    ];

    for (const [label, val] of infoRows) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text(`${label}:`, MARGIN + 9, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        doc.text(val, MARGIN + 36, y);
        y += 5.8;
    }

    // Pillar completion
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text('Pilares documentados:', MARGIN + 9, y);

    const dotX = MARGIN + 60;
    pillars.forEach((pillar, i) => {
        const filled = isPillarFilled(valueData[pillar.key]);
        const [r, g, b] = filled ? hexToRgb(pillar.hexColor) : [209, 213, 219];
        doc.setFillColor(r, g, b);
        doc.circle(dotX + i * 9, y - 1.8, 3, 'F');
    });

    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text(`${filledCount} / ${pillars.length}`, dotX + pillars.length * 9 + 5, y);

    addFooter();

    // ── PILLAR PAGES ───────────────────────────────────────────────────────────

    for (const pillar of pillars) {
        doc.addPage();
        pageNum++;

        const raw = valueData[pillar.key] || '';
        const text = stripHtml(raw) || '(Sin información documentada)';
        const [pr, pg, pb] = hexToRgb(pillar.hexColor);
        const pillarIdx = pillars.indexOf(pillar) + 1;

        // Colored header band
        doc.setFillColor(pr, pg, pb);
        doc.rect(0, 0, W, 34, 'F');

        // Pillar counter label
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.text(`PILAR ${pillarIdx} DE ${pillars.length}`, MARGIN, 12);

        // Pillar name
        doc.setFontSize(19);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(pillar.label.toUpperCase(), MARGIN, 25);

        // Underline accent
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.6);
        doc.line(MARGIN, 28.5, MARGIN + 55, 28.5);
        doc.setLineWidth(0.2);

        // Initiative name (right, small)
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(220, 220, 255);
        const truncName = initiative.name.length > 55
            ? initiative.name.slice(0, 55) + '…'
            : initiative.name;
        doc.text(truncName, W - MARGIN, 12, { align: 'right' });

        // Status badge (right)
        const isFilled = isPillarFilled(raw);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(isFilled ? 167 : 209, isFilled ? 243 : 213, isFilled ? 208 : 219);
        doc.text(isFilled ? '✓ Documentado' : '○ Sin documentar', W - MARGIN, 25, { align: 'right' });

        // Content
        let cy = 46;
        const maxY = 278;
        const lineH = 5.5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);

        const contentLines = doc.splitTextToSize(text, CONTENT_W);

        for (const line of contentLines) {
            if (cy + lineH > maxY) {
                addFooter();
                doc.addPage();
                pageNum++;

                // Continuation mini-header
                doc.setFillColor(pr, pg, pb);
                doc.rect(0, 0, W, 14, 'F');
                doc.setFontSize(8);
                doc.setTextColor(pr, pg, pb);
                doc.setFont('helvetica', 'bold');
                doc.text(`${pillar.label.toUpperCase()} (continuación)`, MARGIN, 10);

                cy = 20;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(31, 41, 55);
            }

            if (line.trim().startsWith('•')) {
                doc.setFillColor(pr, pg, pb);
                doc.circle(MARGIN + 1.8, cy - 1.5, 1.3, 'F');
                doc.text(line.trim().slice(1).trim(), MARGIN + 5.5, cy);
            } else {
                doc.text(line, MARGIN, cy);
            }
            cy += lineH;
        }

        addFooter();
    }

    doc.save(`ImpactoValor_${safeFileName(initiative.name)}.pdf`);
}
