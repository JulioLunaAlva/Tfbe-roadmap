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

export function stripHtml(html?: string): string {
    if (!html) return '';
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
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
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function isNAPillar(text?: string): boolean {
    if (!text) return false;
    const clean = stripHtml(text).trim().toLowerCase();
    return (
        clean === 'n/a' ||
        clean === 'na' ||
        clean === 'no aplica' ||
        clean === 'no-aplica' ||
        clean === 'n.a.' ||
        clean === 'n / a' ||
        clean === 'no aplicable'
    );
}

export function isPillarFilled(val?: string): boolean {
    if (!val) return false;
    const clean = stripHtml(val).trim();
    return clean.length > 0 && clean !== '<p></p>';
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

// ─── Consolidated Excel Export ───────────────────────────────────────────────

export interface ConsolidatedInitiativeExport {
    id: string;
    name: string;
    area?: string;
    champion?: string;
    transformation_lead?: string;
    status?: string;
    progress?: number;
    technologies?: string[];
}

export function exportConsolidatedToExcel(
    initiatives: ConsolidatedInitiativeExport[],
    allValues: Record<string, ExportValueData>,
    filterContext?: {
        area?: string;
        transfLead?: string[];
        status?: string[];
    }
): void {
    const wb = XLSX.utils.book_new();
    const exportDate = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    const totalInits = initiatives.length;

    // Filter subtitle
    const filterNotes: string[] = [];
    if (filterContext?.area) filterNotes.push(`Área: ${filterContext.area}`);
    if (filterContext?.transfLead && filterContext.transfLead.length > 0) filterNotes.push(`Resp: ${filterContext.transfLead.join(', ')}`);
    if (filterContext?.status && filterContext.status.length > 0) filterNotes.push(`Estatus: ${filterContext.status.join(', ')}`);
    const filterSubtitle = filterNotes.length > 0 ? `Filtros aplicados: ${filterNotes.join(' | ')}` : 'Todas las iniciativas (Universo Completo)';

    // ─── Macro Calculations ──────────────────────────────────────────────────────────

    // 1. General adoption metrics (counting N/A as documented/completed for 6/6)
    let completeInits = 0;
    let partialInits = 0;
    let emptyInits = 0;

    let hasBusiness = 0;
    let hasOperational = 0;
    let hasQualitative = 0;
    let hasUsers = 0;

    const operationalAreasSet = new Set<string>();

    for (const init of initiatives) {
        const val = allValues[init.id] || {};
        let docCount = 0;

        if (isPillarFilled(val.business_value)) docCount++;
        if (isPillarFilled(val.operational_efficiency)) docCount++;
        if (isPillarFilled(val.fte_detail)) docCount++;
        if (isPillarFilled(val.qualitative_benefit)) docCount++;
        if (isPillarFilled(val.users_reached_detail)) docCount++;
        if (isPillarFilled(val.estimated_savings_detail)) docCount++;

        if (docCount === 6) completeInits++;
        else if (docCount > 0) partialInits++;
        else emptyInits++;

        if (isPillarFilled(val.business_value) && !isNAPillar(val.business_value)) hasBusiness++;
        if (isPillarFilled(val.operational_efficiency) && !isNAPillar(val.operational_efficiency)) {
            hasOperational++;
            if (init.area) operationalAreasSet.add(init.area);
        }
        if (isPillarFilled(val.qualitative_benefit) && !isNAPillar(val.qualitative_benefit)) hasQualitative++;
        if (isPillarFilled(val.users_reached_detail) && !isNAPillar(val.users_reached_detail)) hasUsers++;
    }

    const pctGlobalComplete = totalInits > 0 ? Math.round((completeInits / totalInits) * 100) : 0;
    const pctPartial = totalInits > 0 ? Math.round((partialInits / totalInits) * 100) : 0;
    const pctEmpty = totalInits > 0 ? Math.round((emptyInits / totalInits) * 100) : 0;
    const pctBusiness = totalInits > 0 ? Math.round((hasBusiness / totalInits) * 100) : 0;

    // 2. FTE metrics (omitting N/A)
    let totalFte = 0;
    let fteImpactedCount = 0;
    for (const init of initiatives) {
        const val = allValues[init.id]?.fte_detail;
        if (!val || val === '<p></p>' || isNAPillar(val)) continue;

        const clean = stripHtml(val);
        if (!clean || isNAPillar(clean)) continue;

        const fteMatch = clean.match(/(?:^|\s)([0-9]+(?:\.[0-9]+)?)\s*(?:FTE|ftes?|posicion(?:es)?|recurso(?:s)?|persona(?:s)?)/i)
            || clean.match(/(?:liberaci[oó]n|ahorro|impacto|reasignaci[oó]n)\s*(?:de)?\s*([0-9]+(?:\.[0-9]+)?)/i);

        if (fteMatch) {
            const num = parseFloat(fteMatch[1]);
            if (!isNaN(num) && num > 0 && num < 1000) {
                totalFte += num;
                fteImpactedCount++;
                continue;
            }
        }

        if (clean.length > 10 && !isNAPillar(clean)) {
            fteImpactedCount++;
        }
    }
    totalFte = Math.round(totalFte * 10) / 10;
    const pctFte = totalInits > 0 ? Math.round((fteImpactedCount / totalInits) * 100) : 0;

    // 3. Savings metrics (omitting N/A)
    let totalSavings = 0;
    let savingsQuantifiedCount = 0;
    for (const init of initiatives) {
        const val = allValues[init.id]?.estimated_savings_detail;
        if (!val || val === '<p></p>' || isNAPillar(val)) continue;

        const clean = stripHtml(val);
        if (!clean || isNAPillar(clean)) continue;

        const moneyMatch = clean.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|m|mdp|mil|millones)?/i)
            || clean.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(?:USD|MXN)/i);

        if (moneyMatch) {
            let amountStr = moneyMatch[1].replace(/,/g, '');
            let amount = parseFloat(amountStr);
            const multiplier = (moneyMatch[2] || '').toLowerCase();

            if (multiplier === 'k' || multiplier === 'mil') amount *= 1000;
            else if (multiplier === 'm' || multiplier === 'millones' || multiplier === 'mdp') amount *= 1000000;

            if (!isNaN(amount) && amount > 0) {
                totalSavings += amount;
                savingsQuantifiedCount++;
                continue;
            }
        }

        if (clean.length > 10 && !isNAPillar(clean)) {
            savingsQuantifiedCount++;
        }
    }
    const pctSavings = totalInits > 0 ? Math.round((savingsQuantifiedCount / totalInits) * 100) : 0;
    const formattedSavings = totalSavings > 0
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalSavings)
        : '$0 USD';

    // 4. Users Reached metrics (omitting N/A)
    let totalUsers = 0;
    const usersAreasSet = new Set<string>();
    for (const init of initiatives) {
        const val = allValues[init.id]?.users_reached_detail;
        if (!val || val === '<p></p>' || isNAPillar(val)) continue;

        const clean = stripHtml(val);
        if (!clean || isNAPillar(clean)) continue;

        if (init.area) usersAreasSet.add(init.area);

        const userMatch = clean.match(/(?:^|\s|\+|>)([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*(?:usuarios?|personas?|colaboradores?|empleados?)/i);
        if (userMatch) {
            const num = parseInt(userMatch[1].replace(/,/g, ''), 10);
            if (!isNaN(num) && num > 0 && num < 100000) {
                totalUsers += num;
            }
        }
    }
    const usersAreas = Array.from(usersAreasSet);
    const operationalAreas = Array.from(operationalAreasSet);

    // 5. Qualitative Categories breakdown
    const qualRules = [
        { name: 'Mitigación de Riesgos', keywords: ['riesgo', 'mitiga', 'auditor', 'vulnerab'] },
        { name: 'Cumplimiento & Normativa', keywords: ['cumplimiento', 'normativ', 'fiscal', 'legal', 'sox'] },
        { name: 'Calidad de Datos', keywords: ['calidad', 'consisten', 'precisi', 'integridad'] },
        { name: 'Gobernanza & Control', keywords: ['gobernanza', 'control', 'visibilidad', 'trazabil'] },
        { name: 'Automatización & RPA', keywords: ['automatiz', 'rpa', 'robot', 'digital'] },
        { name: 'Agilidad Operativa', keywords: ['agil', 'tiempo', 'velocidad', 'productiv'] },
    ];

    const qualCategories = qualRules.map(rule => {
        const matched = initiatives.filter(init => {
            const raw = allValues[init.id]?.qualitative_benefit;
            if (!raw || isNAPillar(raw)) return false;
            const text = stripHtml(raw).toLowerCase();
            return rule.keywords.some(kw => text.includes(kw));
        });
        const areas = Array.from(new Set(matched.map(m => m.area).filter(Boolean))) as string[];
        return {
            name: rule.name,
            count: matched.length,
            areas
        };
    });

    // ─── PESTAÑA 1: Resumen Ejecutivo (KPIs) ───────────────────────────────────────

    const s1: any[][] = [
        ['TFBE ROADMAP — RESUMEN EJECUTIVO DE IMPACTO & VALOR (KPIs)'],
        [`Exportado el ${exportDate} | Portafolio: ${totalInits} iniciativas | ${filterSubtitle}`],
        [],
        ['1. ADOPCIÓN Y MADUREZ DE DOCUMENTACIÓN (6 PILARES)'],
        ['Métrica', 'Iniciativas', '% del Portafolio', 'Descripción'],
        ['Total de Iniciativas Analizadas', totalInits, '100%', 'Total de iniciativas evaluadas según filtros activos'],
        ['Completas (6/6 pilares)', completeInits, `${pctGlobalComplete}%`, 'Con todos los 6 pilares de valor documentados o marcados N/A'],
        ['En Progreso (1 a 5 pilares)', partialInits, `${pctPartial}%`, 'Con avance parcial registrado en sus dimensiones de impacto'],
        ['Sin Documentar (0 pilares)', emptyInits, `${pctEmpty}%`, 'Iniciativas pendientes de iniciar documentación de valor'],
        ['% Global de Avance / Adopción', `${pctGlobalComplete}%`, '—', 'Proporción del portafolio con perfil de valor completo'],
        [],
        ['2. INDICADORES CONSOLIDADOS POR PILAR DE VALOR'],
        ['Pilar de Impacto', 'Métrica Principal', 'Métrica Secundaria', 'Cobertura y Observaciones'],
        [
            'Pilar 1: Valor de Negocio',
            `${pctBusiness}% iniciativas alineadas (${hasBusiness}/${totalInits})`,
            `${hasBusiness} temas clave identificados`,
            'Alineación estratégica con objetivos corporativos y prioridades del negocio'
        ],
        [
            'Pilar 2: Eficiencia Operativa',
            `${hasOperational} procesos optimizados`,
            `${operationalAreas.length} áreas impactadas`,
            `Áreas: ${operationalAreas.slice(0, 5).join(', ')}${operationalAreas.length > 5 ? '…' : ''}`
        ],
        [
            'Pilar 3: Impacto FTE',
            totalFte > 0 ? `${totalFte} FTEs liberados` : `${fteImpactedCount} iniciativas con impacto`,
            `${pctFte}% iniciativas con impacto FTE (${fteImpactedCount}/${totalInits})`,
            'Capacidad operativa reasignada o liberada (omitiendo valores N/A)'
        ],
        [
            'Pilar 4: Beneficio Cualitativo',
            `${hasQualitative} iniciativas documentadas`,
            `${qualCategories.filter(c => c.count > 0).length} categorías activas`,
            'Mejoras no monetarias en control, gobierno, calidad y agilidad'
        ],
        [
            'Pilar 5: Usuarios Alcanzados',
            totalUsers > 0 ? `+${totalUsers.toLocaleString()} usuarios estimados` : `${hasUsers} iniciativas con alcance`,
            `${usersAreas.length} áreas involucradas`,
            `Áreas con alcance: ${usersAreas.slice(0, 5).join(', ')}${usersAreas.length > 5 ? '…' : ''}`
        ],
        [
            'Pilar 6: Ahorro Estimado',
            formattedSavings,
            `${pctSavings}% iniciativas con ahorro cuantificado (${savingsQuantifiedCount}/${totalInits})`,
            'Ahorro económico anualizado proyectado o realizado (omitiendo valores N/A)'
        ],
        [],
        ['3. DESGLOSE POR CATEGORÍA CUALITATIVA (PILAR 4)'],
        ['Categoría Cualitativa', 'Iniciativas con Cobertura', '% del Portafolio', 'Áreas Representativas'],
        ...qualCategories.map(cat => [
            cat.name,
            cat.count,
            totalInits > 0 ? `${Math.round((cat.count / totalInits) * 100)}%` : '0%',
            cat.areas.length > 0 ? cat.areas.slice(0, 4).join(', ') : 'General'
        ]),
        [],
        [`© ${new Date().getFullYear()} TFBE Roadmap — Resumen Ejecutivo de Impacto & Valor`]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(s1);

    ws1['!cols'] = [
        { wch: 36 },
        { wch: 34 },
        { wch: 28 },
        { wch: 68 },
    ];

    ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Subtitle
        { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Section 1 header
        { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } }, // Section 2 header
        { s: { r: 20, c: 0 }, e: { r: 20, c: 3 } }, // Section 3 header
        { s: { r: s1.length - 1, c: 0 }, e: { r: s1.length - 1, c: 3 } }, // Footer
    ];

    const setStyle = (sheet: any, ref: string, style: object) => {
        if (!sheet[ref]) sheet[ref] = { t: 's', v: '' };
        sheet[ref].s = style;
    };

    // Styling Sheet 1
    setStyle(ws1, 'A1', {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '312E81' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });
    setStyle(ws1, 'A2', {
        font: { sz: 9, italic: true, color: { rgb: '6366F1' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });

    // Section title banners (Row 4, Row 12, Row 21)
    const sectionRows = [4, 12, 21];
    sectionRows.forEach(r => {
        setStyle(ws1, `A${r}`, {
            font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4F46E5' } },
            alignment: { vertical: 'center' }
        });
    });

    // Table header rows (Row 5, Row 13, Row 22)
    const tableHeaderRows = [5, 13, 22];
    tableHeaderRows.forEach(r => {
        ['A', 'B', 'C', 'D'].forEach(c => {
            setStyle(ws1, `${c}${r}`, {
                font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '1E1B4B' } },
                alignment: { horizontal: 'center', vertical: 'center' }
            });
        });
    });

    // Bold metric labels in Column A
    for (let r = 6; r <= 10; r++) {
        setStyle(ws1, `A${r}`, { font: { bold: true, sz: 9 } });
    }
    for (let r = 14; r <= 19; r++) {
        setStyle(ws1, `A${r}`, { font: { bold: true, sz: 9 } });
    }
    for (let r = 23; r <= 22 + qualCategories.length; r++) {
        setStyle(ws1, `A${r}`, { font: { bold: true, sz: 9 } });
    }

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Ejecutivo (KPIs)');

    // ─── PESTAÑA 2: Detalle Iniciativas y Pilares ──────────────────────────────────
    // Sin columna ID/Código, con las 12 columnas requeridas

    const detailHeaders = [
        'Iniciativa',
        'Área',
        'Responsable / Champion',
        'Estatus',
        'Progreso (%)',
        '1. Valor de Negocio',
        '2. Eficiencia Operativa',
        '3. Impacto FTE',
        '4. Beneficio Cualitativo',
        '5. Usuarios Alcanzados',
        '6. Ahorro Estimado',
        'Pilares Completos'
    ];

    const s2: any[][] = [
        ['TFBE ROADMAP — DETALLE DE INICIATIVAS Y 6 PILARES DE VALOR'],
        [`Exportado el ${exportDate} | ${totalInits} iniciativas | ${filterSubtitle}`],
        [],
        detailHeaders
    ];

    for (const init of initiatives) {
        const val = allValues[init.id] || {};
        const cleanBusiness = stripHtml(val.business_value);
        const cleanOperational = stripHtml(val.operational_efficiency);
        const cleanFte = stripHtml(val.fte_detail);
        const cleanQualitative = stripHtml(val.qualitative_benefit);
        const cleanUsers = stripHtml(val.users_reached_detail);
        const cleanSavings = stripHtml(val.estimated_savings_detail);

        // Doc count counts N/A as completed / documented (6/6)
        const docCount = [
            val.business_value,
            val.operational_efficiency,
            val.fte_detail,
            val.qualitative_benefit,
            val.users_reached_detail,
            val.estimated_savings_detail
        ].filter(v => isPillarFilled(v)).length;

        const leadChampion = [init.transformation_lead, init.champion].filter(Boolean).join(' / ') || '—';

        s2.push([
            init.name,
            init.area || '—',
            leadChampion,
            init.status || 'Sin Estatus',
            `${init.progress ?? 0}%`,
            cleanBusiness || '—',
            cleanOperational || '—',
            cleanFte || '—',
            cleanQualitative || '—',
            cleanUsers || '—',
            cleanSavings || '—',
            `${docCount}/6`
        ]);
    }

    s2.push([]);
    s2.push([`© ${new Date().getFullYear()} TFBE Roadmap — Detalle de Iniciativas generado automáticamente`]);

    const ws2 = XLSX.utils.aoa_to_sheet(s2);

    // Dynamic width calculation based on content starting from header row (index 3)
    const minColWidths = [28, 18, 26, 16, 14, 38, 38, 32, 38, 32, 32, 18];
    const maxColWidths = [50, 30, 38, 22, 16, 75, 75, 70, 75, 70, 70, 22];

    const colWidths: { wch: number }[] = [];
    for (let c = 0; c < detailHeaders.length; c++) {
        let maxLen = detailHeaders[c].length;
        for (let r = 3; r < s2.length - 2; r++) {
            const cell = s2[r] ? s2[r][c] : undefined;
            if (cell !== undefined && cell !== null && cell !== '') {
                const lines = String(cell).split('\n');
                for (const l of lines) {
                    if (l.length > maxLen) {
                        maxLen = l.length;
                    }
                }
            }
        }
        const minW = minColWidths[c] || 15;
        const maxW = maxColWidths[c] || 75;
        colWidths.push({ wch: Math.min(Math.max(maxLen + 3, minW), maxW) });
    }
    ws2['!cols'] = colWidths;

    ws2['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
        { s: { r: s2.length - 1, c: 0 }, e: { r: s2.length - 1, c: 11 } }
    ];

    setStyle(ws2, 'A1', {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '312E81' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });
    setStyle(ws2, 'A2', {
        font: { sz: 9, italic: true, color: { rgb: '6366F1' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });

    // Detail table header row (Row 4, index 3: A4 to L4)
    const detailHeaderCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    detailHeaderCols.forEach(col => {
        setStyle(ws2, `${col}4`, {
            font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1E1B4B' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        });
    });

    // Set bold font on initiative names (Column A) for clean reading
    for (let r = 5; r <= s2.length - 2; r++) {
        setStyle(ws2, `A${r}`, { font: { bold: true, sz: 9 } });
    }

    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Iniciativas y Pilares');

    // ─── Guardar archivo ──────────────────────────────────────────────────────────
    const fileName = `Consolidado_Impacto_Valor_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}
