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

// ─── Individual Excel Export (Single Sheet "Ficha de Iniciativa") ───────────────

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

    // ── Single Sheet: Ficha de Iniciativa ──────────────────────────────────────
    const s1: any[][] = [
        ['TFBE ROADMAP — FICHA TÉCNICA DE IMPACTO & VALOR', '', ''],
        [`Generado el ${exportDate} | Estado de Adopción: ${filledCount} de ${pillars.length} Pilares Documentados`, '', ''],
        [],
        ['INFORMACIÓN GENERAL DE LA INICIATIVA', '', ''],
        ['Iniciativa', initiative.name, ''],
        ['Área', initiative.area || '—', ''],
        ['Champion / Responsable', initiative.champion || '—', ''],
        ['Estatus', initiative.status || 'Sin Estatus', ''],
        ['Progreso (%)', `${initiative.progress ?? 0}%`, ''],
        ['Tecnologías', initiative.technologies?.join(', ') || '—', ''],
        ['Pilares Documentados', `${filledCount} / ${pillars.length} (${Math.round((filledCount / pillars.length) * 100)}%)`, ''],
        [],
        ['DETALLE POR PILAR DE IMPACTO & VALOR', '', ''],
        ['Pilar de Impacto', 'Estatus', 'Detalle / Justificación Documentada'],
    ];

    pillars.forEach(pillar => {
        const raw = valueData[pillar.key] || '';
        const clean = stripHtml(raw);
        const isFilled = isPillarFilled(raw);
        const isNa = isNAPillar(raw);

        let statusText = '⬜ Pendiente';
        if (isNa) {
            statusText = '⚪ No Aplica';
        } else if (isFilled) {
            statusText = '✅ Completo';
        }

        s1.push([pillar.label, statusText, clean || '(Sin información documentada)']);
    });

    s1.push([]);
    s1.push([`© ${new Date().getFullYear()} TFBE Roadmap — Ficha Técnica de Impacto & Valor generada automáticamente`, '', '']);

    const ws1 = XLSX.utils.aoa_to_sheet(s1);

    ws1['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 95 }];
    ws1['!rows'] = s1.map((_, i) => (i === 0 ? { hpt: 26 } : { hpt: 20 }));

    const totalRows = s1.length;
    ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
        { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } },
        { s: { r: 5, c: 1 }, e: { r: 5, c: 2 } },
        { s: { r: 6, c: 1 }, e: { r: 6, c: 2 } },
        { s: { r: 7, c: 1 }, e: { r: 7, c: 2 } },
        { s: { r: 8, c: 1 }, e: { r: 8, c: 2 } },
        { s: { r: 9, c: 1 }, e: { r: 9, c: 2 } },
        { s: { r: 10, c: 1 }, e: { r: 10, c: 2 } },
        { s: { r: 12, c: 0 }, e: { r: 12, c: 2 } },
        { s: { r: totalRows - 1, c: 0 }, e: { r: totalRows - 1, c: 2 } },
    ];

    const setStyle = (ref: string, style: object) => {
        if (!ws1[ref]) ws1[ref] = { t: 's', v: '' };
        ws1[ref].s = style;
    };

    // Title banner
    setStyle('A1', {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '312E81' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });
    setStyle('A2', {
        font: { sz: 9, italic: true, color: { rgb: '6366F1' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });

    // Info section banner (Row 4)
    setStyle('A4', {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { vertical: 'center' }
    });

    // Info rows labels (Rows 5 to 11)
    for (let r = 5; r <= 11; r++) {
        setStyle(`A${r}`, {
            font: { bold: true, sz: 9, color: { rgb: '374151' } },
            fill: { fgColor: { rgb: 'EEF2FF' } },
            alignment: { vertical: 'center' }
        });
        setStyle(`B${r}`, {
            font: { sz: 9 },
            fill: { fgColor: { rgb: 'F9FAFB' } },
            alignment: { vertical: 'center' }
        });
    }

    // Pillars section banner (Row 13)
    setStyle('A13', {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { vertical: 'center' }
    });

    // Pillars table header (Row 14)
    ['A14', 'B14', 'C14'].forEach(cell => {
        setStyle(cell, {
            font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1E1B4B' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });
    });

    // Pillar rows (Rows 15 to 20)
    pillars.forEach((pillar, i) => {
        const row = 15 + i;
        const isEven = i % 2 === 0;
        setStyle(`A${row}`, {
            font: { bold: true, sz: 9, color: { rgb: pillar.hexText } },
            fill: { fgColor: { rgb: pillar.hexColor } },
            alignment: { vertical: 'top' }
        });
        setStyle(`B${row}`, {
            font: { sz: 9 },
            fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'top' }
        });
        setStyle(`C${row}`, {
            font: { sz: 9 },
            fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } },
            alignment: { vertical: 'top', wrapText: true }
        });
    });

    XLSX.utils.book_append_sheet(wb, ws1, 'Ficha de Iniciativa');
    XLSX.writeFile(wb, `Ficha_ImpactoValor_${safeFileName(initiative.name)}.xlsx`);
}

// ─── Individual PDF Export (Executive One-Pager: 1-2 Pages Max) ───────────────

export function exportToPDF(
    initiative: ExportInitiative,
    valueData: ExportValueData,
    pillars: ExportPillar[] = EXPORT_PILLARS
): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const MARGIN = 12;
    const CONTENT_W = W - MARGIN * 2; // 186mm
    const exportDate = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const filledCount = pillars.filter(p => isPillarFilled(valueData[p.key])).length;

    // Helper: Draw Header on Page 1
    const drawHeader = () => {
        // Deep Indigo Banner
        doc.setFillColor(30, 27, 75);
        doc.roundedRect(MARGIN, 10, CONTENT_W, 20, 2, 2, 'F');

        // Top Accent Line
        doc.setFillColor(99, 102, 241);
        doc.rect(MARGIN, 10, CONTENT_W, 1.5, 'F');

        // Small App Subtitle
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(199, 210, 254);
        doc.text('TFBE ROADMAP — FICHA TÉCNICA EJECUTIVA DE IMPACTO & VALOR', MARGIN + 4, 16);

        // Initiative Name
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const nameLines = doc.splitTextToSize(initiative.name, 122);
        doc.text(nameLines.slice(0, 2), MARGIN + 4, 23);

        // Right side: date & pill adoption badge
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text(`Generado: ${exportDate}`, W - MARGIN - 4, 16, { align: 'right' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${filledCount}/${pillars.length} Pilares Documentados`, W - MARGIN - 4, 24, { align: 'right' });
    };

    // Helper: Draw Compact Metadata Strip
    const drawMetadataStrip = (yPos: number) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(MARGIN, yPos, CONTENT_W, 15, 2, 2, 'FD');

        // Accent left bar
        doc.setFillColor(99, 102, 241);
        doc.rect(MARGIN, yPos, 2.5, 15, 'F');

        const colWidth = (CONTENT_W - 8) / 5;
        const metaFields = [
            { label: 'ÁREA', value: initiative.area || '—' },
            { label: 'CHAMPION / RESP.', value: initiative.champion || '—' },
            { label: 'ESTATUS', value: initiative.status || 'Sin Estatus' },
            { label: 'PROGRESO', value: `${initiative.progress ?? 0}%` },
            { label: 'TECNOLOGÍAS', value: initiative.technologies?.slice(0, 3).join(', ') || '—' },
        ];

        metaFields.forEach((meta, idx) => {
            const mx = MARGIN + 5 + idx * colWidth;
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text(meta.label, mx, yPos + 5.5);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            const truncVal = meta.value.length > 22 ? meta.value.slice(0, 20) + '…' : meta.value;
            doc.text(truncVal, mx, yPos + 11.5);
        });
    };

    // Helper: Draw a single Pillar Card Box
    const drawPillarCard = (
        pillar: ExportPillar,
        x: number,
        y: number,
        width: number,
        height: number
    ) => {
        const raw = valueData[pillar.key] || '';
        const clean = stripHtml(raw);
        const isFilled = isPillarFilled(raw);
        const isNa = isNAPillar(raw);
        const [pr, pg, pb] = hexToRgb(pillar.hexColor);

        // Box container
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, width, height, 2.5, 2.5, 'FD');

        // Card Header Bar
        doc.setFillColor(pr, pg, pb);
        doc.roundedRect(x, y, width, 8, 2.5, 2.5, 'F');
        doc.rect(x, y + 4, width, 4, 'F'); // Square bottom corners of header

        // Header Title
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(pillar.label.toUpperCase(), x + 3.5, y + 5.5);

        // Header Status Badge
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        let statusBadge = '○ Pendiente';
        if (isNa) {
            statusBadge = '⚪ No Aplica';
        } else if (isFilled) {
            statusBadge = '✓ Documentado';
        }
        doc.text(statusBadge, x + width - 3.5, y + 5.5, { align: 'right' });

        // Card Body Text
        let cy = y + 12.5;
        const maxTextY = y + height - 3;
        const lineSpacing = 3.6;

        if (!clean || clean === '<p></p>') {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(156, 163, 175);
            doc.text('(Sin información documentada para este pilar)', x + 3.5, cy);
            return;
        }

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);

        const lines = clean.split('\n').filter(l => l.trim().length > 0);
        for (const rawLine of lines) {
            if (cy > maxTextY) break;
            const isBullet = rawLine.trim().startsWith('•');
            const displayText = isBullet ? rawLine.trim().slice(1).trim() : rawLine.trim();
            const textWidth = isBullet ? width - 11 : width - 7;
            const wrapped = doc.splitTextToSize(displayText, textWidth);

            for (let wIdx = 0; wIdx < wrapped.length; wIdx++) {
                if (cy > maxTextY) break;
                if (isBullet && wIdx === 0) {
                    doc.setFillColor(pr, pg, pb);
                    doc.circle(x + 4.5, cy - 1, 0.9, 'F');
                    doc.text(wrapped[wIdx], x + 7, cy);
                } else if (isBullet) {
                    doc.text(wrapped[wIdx], x + 7, cy);
                } else {
                    doc.text(wrapped[wIdx], x + 3.5, cy);
                }
                cy += lineSpacing;
            }
            cy += 0.5;
        }
    };

    // Calculate layout: 2 Columns × 3 Rows
    const colWidth = (CONTENT_W - 5) / 2; // 90.5mm
    const col1X = MARGIN;
    const col2X = MARGIN + colWidth + 5;

    // Pairs of pillars:
    // Pair 0: Pillars 0 & 1 (Valor de Negocio & Eficiencia Operativa)
    // Pair 1: Pillars 2 & 3 (Impacto en FTE & Beneficio Cualitativo)
    // Pair 2: Pillars 4 & 5 (Usuarios Alcanzados & Ahorro Estimado)
    const pairs = [
        [pillars[0], pillars[1]],
        [pillars[2], pillars[3]],
        [pillars[4], pillars[5]]
    ];

    // Estimate line counts per pair
    const estimateLines = (pillar: ExportPillar) => {
        const text = stripHtml(valueData[pillar.key]);
        if (!text) return 1;
        return doc.splitTextToSize(text, colWidth - 8).length;
    };

    const pair0Lines = Math.max(estimateLines(pillars[0]), estimateLines(pillars[1]));
    const pair1Lines = Math.max(estimateLines(pillars[2]), estimateLines(pillars[3]));
    const pair2Lines = Math.max(estimateLines(pillars[4]), estimateLines(pillars[5]));

    const totalLinesNeeded = pair0Lines + pair1Lines + pair2Lines;

    // Page 1 rendering
    drawHeader();
    drawMetadataStrip(32);

    let startY = 49;
    const availableHPage1 = 282 - startY; // ~233mm

    // If total content fits on Page 1 comfortably (<= 45 lines total, or ~72mm per row):
    if (totalLinesNeeded <= 44) {
        // Exactly ONE-PAGER layout!
        const rowH = Math.min(Math.floor((availableHPage1 - 8) / 3), 74);
        pairs.forEach((pair, idx) => {
            const currentY = startY + idx * (rowH + 4);
            if (pair[0]) drawPillarCard(pair[0], col1X, currentY, colWidth, rowH);
            if (pair[1]) drawPillarCard(pair[1], col2X, currentY, colWidth, rowH);
        });
    } else {
        // Flows gracefully into 2 pages maximum!
        // Page 1: Pair 0 and Pair 1 with generous room
        const rowH1 = Math.min(Math.floor((availableHPage1 - 6) / 2), 110);
        if (pairs[0][0]) drawPillarCard(pairs[0][0], col1X, startY, colWidth, rowH1);
        if (pairs[0][1]) drawPillarCard(pairs[0][1], col2X, startY, colWidth, rowH1);

        const y2 = startY + rowH1 + 5;
        if (pairs[1][0]) drawPillarCard(pairs[1][0], col1X, y2, colWidth, rowH1);
        if (pairs[1][1]) drawPillarCard(pairs[1][1], col2X, y2, colWidth, rowH1);

        // Page 2: Pair 2 + Summary block
        doc.addPage();

        // Page 2 Mini Header
        doc.setFillColor(30, 27, 75);
        doc.roundedRect(MARGIN, 10, CONTENT_W, 14, 2, 2, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(199, 210, 254);
        doc.text('TFBE ROADMAP — FICHA TÉCNICA EJECUTIVA (Continuación)', MARGIN + 4, 15.5);
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`${initiative.name} — ${initiative.area || 'General'}`, MARGIN + 4, 21.5);

        const page2StartY = 27;
        const rowH2 = 110;
        if (pairs[2][0]) drawPillarCard(pairs[2][0], col1X, page2StartY, colWidth, rowH2);
        if (pairs[2][1]) drawPillarCard(pairs[2][1], col2X, page2StartY, colWidth, rowH2);

        // Notes / Summary Card on Page 2
        const notesY = page2StartY + rowH2 + 5;
        const notesH = 282 - notesY;
        if (notesH > 25) {
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(MARGIN, notesY, CONTENT_W, notesH, 2, 2, 'FD');
            doc.setFillColor(99, 102, 241);
            doc.rect(MARGIN, notesY, 2.5, notesH, 'F');

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            doc.text('RESUMEN DE GOBERNANZA & ADOPCIÓN DE VALOR', MARGIN + 5, notesY + 6);

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text(
                `Esta iniciativa registra ${filledCount} de 6 pilares de impacto formalmente documentados (${Math.round((filledCount / 6) * 100)}% de completitud).`,
                MARGIN + 5,
                notesY + 11.5
            );
            doc.text(
                'El modelo de 6 pilares de TFBE evalúa dimensiones financieras, operativas, de talento y estratégicas para optimizar la toma de decisiones.',
                MARGIN + 5,
                notesY + 16
            );
        }
    }

    // Dynamic Footer on all pages (Página X de Y)
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, 287, W - MARGIN, 287);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('TFBE Roadmap — Ficha Técnica Ejecutiva de Impacto & Valor', MARGIN, 292);
        doc.text(`Generado el ${exportDate}`, W / 2, 292, { align: 'center' });
        doc.text(`Página ${p} de ${totalPages}`, W - MARGIN, 292, { align: 'right' });
    }

    doc.save(`Ficha_ImpactoValor_${safeFileName(initiative.name)}.pdf`);
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

// ─── Consolidated PDF Export (Landscape A4: Page 1 One-Pager + Page 2+ Detail Matrix) ────

export function exportConsolidatedToPDF(
    initiatives: ConsolidatedInitiativeExport[],
    allValues: Record<string, ExportValueData>,
    filterContext?: {
        area?: string;
        transfLead?: string[];
        status?: string[];
    }
): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297;
    const MARGIN = 12;
    const CONTENT_W = W - MARGIN * 2; // 273mm
    const exportDate = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    const totalInits = initiatives.length;

    // Subtitle filters
    const filterNotes: string[] = [];
    if (filterContext?.area) filterNotes.push(`Área: ${filterContext.area}`);
    if (filterContext?.transfLead && filterContext.transfLead.length > 0) filterNotes.push(`Resp: ${filterContext.transfLead.join(', ')}`);
    if (filterContext?.status && filterContext.status.length > 0) filterNotes.push(`Estatus: ${filterContext.status.join(', ')}`);
    const filterSubtitle = filterNotes.length > 0 ? `Filtros: ${filterNotes.join(' | ')}` : 'Todas las iniciativas (Universo Completo)';

    // ─── Macro Calculations ──────────────────────────────────────────────────────────
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

    // FTE (omitting N/A)
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
        if (clean.length > 10 && !isNAPillar(clean)) fteImpactedCount++;
    }
    totalFte = Math.round(totalFte * 10) / 10;
    const pctFte = totalInits > 0 ? Math.round((fteImpactedCount / totalInits) * 100) : 0;

    // Savings (omitting N/A)
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
        if (clean.length > 10 && !isNAPillar(clean)) savingsQuantifiedCount++;
    }
    const pctSavings = totalInits > 0 ? Math.round((savingsQuantifiedCount / totalInits) * 100) : 0;
    const formattedSavings = totalSavings > 0
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalSavings)
        : '$0 USD';

    // Users (omitting N/A)
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
            if (!isNaN(num) && num > 0 && num < 100000) totalUsers += num;
        }
    }
    const usersAreas = Array.from(usersAreasSet);
    const operationalAreas = Array.from(operationalAreasSet);

    // Qualitative Categories
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
        return {
            name: rule.name,
            count: matched.length,
            areas: Array.from(new Set(matched.map(m => m.area).filter(Boolean))) as string[]
        };
    });

    // ─── PÁGINA 1: ONE-PAGER EJECUTIVO (LANDSCAPE) ───────────────────────────────────

    // Top Header Banner
    doc.setFillColor(30, 27, 75);
    doc.roundedRect(MARGIN, 10, CONTENT_W, 18, 2, 2, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(MARGIN, 10, CONTENT_W, 1.5, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(199, 210, 254);
    doc.text('TFBE ROADMAP — DASHBOARD EJECUTIVO DE IMPACTO & VALOR', MARGIN + 4, 16);

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`Consolidado de Portafolio — ${totalInits} Iniciativas`, MARGIN + 4, 23);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Generado: ${exportDate} | ${filterSubtitle}`, W - MARGIN - 4, 23, { align: 'right' });

    // Section 1: 4 Adoption KPI Stat Cards
    const kpiW = (CONTENT_W - 9) / 4;
    const kpiCards = [
        { title: 'TOTAL INICIATIVAS', val: `${totalInits}`, sub: 'Portafolio analizado', color: [79, 70, 229] },
        { title: 'COMPLETAS (6/6)', val: `${completeInits}`, sub: `${pctGlobalComplete}% del portafolio`, color: [16, 185, 129] },
        { title: 'EN PROGRESO (1-5)', val: `${partialInits}`, sub: `${pctPartial}% en documentación`, color: [245, 158, 11] },
        { title: 'SIN DOCUMENTAR', val: `${emptyInits}`, sub: `${pctEmpty}% pendientes de inicio`, color: [156, 163, 175] },
    ];

    kpiCards.forEach((kpi, idx) => {
        const kx = MARGIN + idx * (kpiW + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(kx, 30, kpiW, 16, 2, 2, 'FD');

        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.rect(kx, 30, 2.5, 16, 'F');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.title, kx + 5, 35);

        doc.setFontSize(11);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, kx + 5, 41);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(kpi.sub, kx + 5, 44.5);
    });

    // Section 2: 6 Pillar Highlights (Grid: 3 Columns × 2 Rows)
    const pColW = (CONTENT_W - 8) / 3; // ~88.3mm
    const pColH = 54; // mm

    const pillarHighlights = [
        {
            label: '1. VALOR DE NEGOCIO',
            color: [124, 58, 237],
            kpi: `${pctBusiness}% iniciativas alineadas`,
            sub: `${hasBusiness} de ${totalInits} documentadas`,
            desc: 'Alineación con prioridades estratégicas del negocio y cumplimiento de objetivos corporativos.',
            items: [`Ejes estratégicos identificados: ${hasBusiness}`, `Representación en portafolio: ${pctBusiness}%`]
        },
        {
            label: '2. EFICIENCIA OPERATIVA',
            color: [217, 119, 6],
            kpi: `${hasOperational} procesos optimizados`,
            sub: `${operationalAreas.length} áreas impactadas`,
            desc: 'Reducción de tiempos de ciclo y eliminación de pasos manuales redundantes en flujos clave.',
            items: [`Áreas: ${operationalAreas.slice(0, 4).join(', ') || 'En proceso'}`, `Cobertura: ${hasOperational} flujos`]
        },
        {
            label: '3. IMPACTO EN FTE',
            color: [8, 145, 178],
            kpi: totalFte > 0 ? `${totalFte} FTEs liberados` : `${fteImpactedCount} iniciativas`,
            sub: `${pctFte}% cobertura de iniciativas`,
            desc: 'Reasignación de capacidad laboral operativa hacia tareas de mayor valor agregado o innovación.',
            items: [`Iniciativas con impacto FTE: ${fteImpactedCount}`, `Total acumulado: ${totalFte > 0 ? `${totalFte} FTEs` : 'Por cuantificar'}`]
        },
        {
            label: '4. BENEFICIO CUALITATIVO',
            color: [225, 29, 72],
            kpi: `${hasQualitative} iniciativas con beneficios`,
            sub: `${qualCategories.filter(c => c.count > 0).length} categorías activas`,
            desc: 'Mejoras no monetarias en mitigación de riesgos, control interno, gobierno de datos y agilidad.',
            items: [`Categorías activas: ${qualCategories.filter(c => c.count > 0).length} de 6`, `Iniciativas documentadas: ${hasQualitative}`]
        },
        {
            label: '5. USUARIOS ALCANZADOS',
            color: [5, 150, 105],
            kpi: totalUsers > 0 ? `+${totalUsers.toLocaleString()} usuarios` : `${hasUsers} iniciativas`,
            sub: `${usersAreas.length} áreas involucradas`,
            desc: 'Comunidades de usuarios internos y externos beneficiados por la adopción de las soluciones.',
            items: [`Áreas con alcance: ${usersAreas.slice(0, 4).join(', ') || 'En despliegue'}`, `Total estimado: ${totalUsers > 0 ? `+${totalUsers.toLocaleString()}` : 'Cualitativo'}`]
        },
        {
            label: '6. AHORRO ESTIMADO',
            color: [22, 163, 74],
            kpi: formattedSavings,
            sub: `${pctSavings}% iniciativas cuantificadas`,
            desc: 'Ahorro financiero directo e indirecto proyectado o alcanzado derivado de la ejecución.',
            items: [`Iniciativas con ahorro cuantificado: ${savingsQuantifiedCount} de ${totalInits}`, `Monto proyectado: ${formattedSavings}`]
        },
    ];

    pillarHighlights.forEach((p, idx) => {
        const colIdx = idx % 3;
        const rowIdx = Math.floor(idx / 3);
        const px = MARGIN + colIdx * (pColW + 4);
        const py = 48 + rowIdx * (pColH + 4);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(px, py, pColW, pColH, 2, 2, 'FD');

        // Card Header Banner
        doc.setFillColor(p.color[0], p.color[1], p.color[2]);
        doc.roundedRect(px, py, pColW, 7.5, 2, 2, 'F');
        doc.rect(px, py + 3.5, pColW, 4, 'F');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(p.label, px + 3.5, py + 5);

        // KPI Box inside card
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(px + 3, py + 10, pColW - 6, 14, 1.5, 1.5, 'F');

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(p.color[0], p.color[1], p.color[2]);
        doc.text(p.kpi, px + 5, py + 16);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(p.sub, px + 5, py + 21);

        // Description text
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(p.desc, pColW - 7);
        doc.text(descLines.slice(0, 2), px + 3.5, py + 28);

        // Bullets
        let by = py + 37;
        p.items.forEach(item => {
            doc.setFillColor(p.color[0], p.color[1], p.color[2]);
            doc.circle(px + 5, by - 1, 0.8, 'F');
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            const truncItem = item.length > 46 ? item.slice(0, 44) + '…' : item;
            doc.text(truncItem, px + 8, by);
            by += 4.5;
        });
    });

    // Section 3: Qualitative Categories Summary Strip
    const catStripY = 166;
    const catStripH = 28;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, catStripY, CONTENT_W, catStripH, 2, 2, 'FD');

    doc.setFillColor(79, 70, 229);
    doc.rect(MARGIN, catStripY, 2.5, catStripH, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('DESGLOSE DE CATEGORÍAS CUALITATIVAS DETECTADAS (PILAR 4)', MARGIN + 6, catStripY + 5.5);

    const catW = (CONTENT_W - 14) / 6;
    qualCategories.forEach((cat, idx) => {
        const cx = MARGIN + 6 + idx * (catW + 1.2);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, catStripY + 8.5, catW, 16.5, 1.5, 1.5, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        const nameParts = cat.name.split(' ');
        doc.text(nameParts[0], cx + 2.5, catStripY + 13);
        if (nameParts.length > 1) {
            doc.text(nameParts.slice(1).join(' ').slice(0, 14), cx + 2.5, catStripY + 16.5);
        }

        doc.setFontSize(8.5);
        doc.setTextColor(79, 70, 229);
        doc.text(`${cat.count}`, cx + 2.5, catStripY + 22.5);

        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(`inits (${totalInits > 0 ? Math.round((cat.count / totalInits) * 100) : 0}%)`, cx + 11, catStripY + 22.5);
    });

    // ─── PÁGINAS 2+: MATRIZ DETALLADA DE INICIATIVAS ────────────────────────────────

    const colWidths = [52, 30, 34, 22, 16, 18, 101]; // Sum = 273mm
    const tableHeaders = [
        'INICIATIVA',
        'ÁREA',
        'RESPONSABLE',
        'ESTATUS',
        'AVANCE',
        'PILARES',
        'SÍNTESIS DE IMPACTO & VALOR DOCUMENTADO'
    ];

    const drawTableHeader = (yPos: number) => {
        doc.setFillColor(30, 27, 75);
        doc.rect(MARGIN, yPos, CONTENT_W, 7.5, 'F');

        let tx = MARGIN;
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);

        tableHeaders.forEach((th, idx) => {
            doc.text(th, tx + 2.5, yPos + 5);
            tx += colWidths[idx];
        });
    };

    // Begin Page 2
    doc.addPage();

    // Detailed Matrix Top Header Banner
    doc.setFillColor(30, 27, 75);
    doc.roundedRect(MARGIN, 10, CONTENT_W, 12, 1.5, 1.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(199, 210, 254);
    doc.text('TFBE ROADMAP — MATRIZ DETALLADA DE INICIATIVAS Y SUS 6 PILARES', MARGIN + 4, 15);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Listado completo de iniciativas (${totalInits} registradas)`, MARGIN + 4, 19.5);
    doc.text(`Exportado el ${exportDate}`, W - MARGIN - 4, 17, { align: 'right' });

    let currentY = 24;
    drawTableHeader(currentY);
    currentY += 7.5;

    const rowH = 10.5;

    initiatives.forEach((init, idx) => {
        // Page break if row doesn't fit
        if (currentY + rowH > 198) {
            doc.addPage();
            // Header for continuation pages
            doc.setFillColor(30, 27, 75);
            doc.roundedRect(MARGIN, 10, CONTENT_W, 10, 1.5, 1.5, 'F');
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(199, 210, 254);
            doc.text('TFBE ROADMAP — MATRIZ DETALLADA DE INICIATIVAS (Continuación)', MARGIN + 4, 16.5);

            currentY = 22;
            drawTableHeader(currentY);
            currentY += 7.5;
        }

        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.rect(MARGIN, currentY, CONTENT_W, rowH, 'FD');

        const val = allValues[init.id] || {};
        const docCount = [
            val.business_value,
            val.operational_efficiency,
            val.fte_detail,
            val.qualitative_benefit,
            val.users_reached_detail,
            val.estimated_savings_detail
        ].filter(v => isPillarFilled(v)).length;

        // Synthesis of primary impacts
        const impactParts: string[] = [];
        const cleanBiz = stripHtml(val.business_value);
        if (cleanBiz && !isNAPillar(cleanBiz)) {
            impactParts.push(cleanBiz.split('.')[0] || cleanBiz.slice(0, 45));
        }
        const cleanEff = stripHtml(val.operational_efficiency);
        if (cleanEff && !isNAPillar(cleanEff)) {
            impactParts.push(cleanEff.split('.')[0] || cleanEff.slice(0, 45));
        }
        const cleanSav = stripHtml(val.estimated_savings_detail);
        if (cleanSav && !isNAPillar(cleanSav)) {
            impactParts.push(`Ahorro: ${cleanSav.slice(0, 30)}`);
        }
        const synthesisText = impactParts.join(' | ') || '(Sin pilares documentados)';

        let tx = MARGIN;

        // 1. Iniciativa
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        const nameText = init.name.length > 34 ? init.name.slice(0, 32) + '…' : init.name;
        doc.text(nameText, tx + 2.5, currentY + 6);

        // 2. Área
        tx += colWidths[0];
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const areaText = (init.area || '—').length > 20 ? (init.area || '').slice(0, 18) + '…' : (init.area || '—');
        doc.text(areaText, tx + 2.5, currentY + 6);

        // 3. Responsable
        tx += colWidths[1];
        const lead = init.transformation_lead || init.champion || '—';
        const leadText = lead.length > 22 ? lead.slice(0, 20) + '…' : lead;
        doc.text(leadText, tx + 2.5, currentY + 6);

        // 4. Estatus
        tx += colWidths[2];
        const st = init.status || 'Sin Estatus';
        doc.text(st.length > 15 ? st.slice(0, 14) + '…' : st, tx + 2.5, currentY + 6);

        // 5. Avance
        tx += colWidths[3];
        doc.text(`${init.progress ?? 0}%`, tx + 2.5, currentY + 6);

        // 6. Pilares (X/6)
        tx += colWidths[4];
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(docCount === 6 ? 16 : (docCount > 0 ? 217 : 156), docCount === 6 ? 185 : (docCount > 0 ? 119 : 163), docCount === 6 ? 129 : (docCount > 0 ? 6 : 175));
        doc.text(`${docCount}/6`, tx + 2.5, currentY + 6);

        // 7. Síntesis
        tx += colWidths[5];
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const synthLines = doc.splitTextToSize(synthesisText, colWidths[6] - 5);
        doc.text(synthLines.slice(0, 2), tx + 2.5, currentY + 4.5);

        currentY += rowH;
    });

    // ─── Dynamic Footers on All Pages ───────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, 203, W - MARGIN, 203);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('TFBE Roadmap — Consolidado Ejecutivo de Impacto & Valor', MARGIN, 207);
        doc.text(`Exportado el ${exportDate}`, W / 2, 207, { align: 'center' });
        doc.text(`Página ${p} de ${totalPages}`, W - MARGIN, 207, { align: 'right' });
    }

    doc.save(`Consolidado_Impacto_Valor_${new Date().toISOString().slice(0, 10)}.pdf`);
}
