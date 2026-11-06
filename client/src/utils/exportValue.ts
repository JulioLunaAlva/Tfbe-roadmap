/**
 * exportValue.ts
 * Professional export utilities for Initiative Value data (5 Strategic Pillars Model).
 * Supports Excel (.xlsx) and PDF formats with full text wrapping and smart analytical extraction.
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportInitiative {
    name: string;
    area: string;
    champion?: string;
    transformation_lead?: string;
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

// ─── 5 Strategic Pillars Configuration ────────────────────────────────────────

export const EXPORT_PILLARS: ExportPillar[] = [
    { key: 'business_value',           label: 'Valor de Negocio',      hexColor: '7C3AED', hexText: 'FFFFFF' },
    { key: 'operational_efficiency',   label: 'Eficiencia Operativa',  hexColor: 'D97706', hexText: 'FFFFFF' },
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
    const clean = stripHtml(text).trim().toLowerCase().replace(/^\•\s*/, '');
    return (
        clean === 'n/a' ||
        clean === 'na' ||
        clean === 'no aplica' ||
        clean === 'no aplica.' ||
        clean === 'no-aplica' ||
        clean === 'n.a.' ||
        clean === 'n / a' ||
        clean === 'no aplicable'
    );
}

/**
 * Detects placeholder texts such as "Documentación pendiente por gerencia" or "Documentación pendiente"
 * so they are not counted as completed substantive documentation or shown as top executive highlights.
 */
export function isPendingDocumentation(text?: string): boolean {
    if (!text) return false;
    const clean = stripHtml(text)
        .replace(/^[•\-\*–—\s]+/, '')
        .trim()
        .toLowerCase();
    if (!clean) return false;
    return (
        clean === 'documentación pendiente por gerencia' ||
        clean === 'documentacion pendiente por gerencia' ||
        clean === 'documentación pendiente por gerencia.' ||
        clean === 'documentacion pendiente por gerencia.' ||
        clean === 'documentación pendiente' ||
        clean === 'documentacion pendiente' ||
        clean === 'documentación pendiente.' ||
        clean === 'documentacion pendiente.' ||
        clean === 'pendiente por gerencia' ||
        clean === 'pendiente de documentar' ||
        clean === 'por documentar' ||
        clean === 'información pendiente por gerencia'
    );
}

/**
 * Detects when a pillar text explicitly states that the metric is not yet quantified or has no direct saving.
 */
export function isUnquantifiedPillarText(text?: string): boolean {
    if (!text) return false;
    const clean = stripHtml(text)
        .replace(/^[•\-\*–—\s]+/, '')
        .trim()
        .toLowerCase();
    if (!clean) return false;
    return (
        clean.startsWith('no cuantificado') ||
        clean.startsWith('pendiente de cuantificar') ||
        clean.startsWith('pendiente de cuantificación') ||
        clean.startsWith('beneficio en fte pendiente de cuantificación') ||
        clean.startsWith('ahorro económico pendiente de cuantificación') ||
        clean.startsWith('no aplica ahorro directo') ||
        clean.startsWith('sin cuantificar') ||
        isPendingDocumentation(clean)
    );
}

export function isPillarFilled(val?: string): boolean {
    if (!val) return false;
    const clean = stripHtml(val).trim();
    return clean.length > 0 && clean !== '<p></p>';
}

/**
 * Returns true if the pillar has real completed documentation (or valid N/A),
 * excluding "Documentación pendiente por gerencia" placeholders.
 */
export function isPillarCompleted(val?: string): boolean {
    if (!isPillarFilled(val)) return false;
    return !isPendingDocumentation(val);
}

/**
 * Returns true if the pillar has substantive content (not empty, not N/A, and not "Documentación pendiente").
 */
export function isSubstantivePillar(val?: string): boolean {
    if (!isPillarFilled(val)) return false;
    if (isNAPillar(val)) return false;
    if (isPendingDocumentation(val)) return false;
    return true;
}

/**
 * Combines `operational_efficiency` with any quantified time/hours/capacity note from legacy `fte_detail`
 * so that all hours saved per month/week are preserved inside Eficiencia Operativa.
 */
export function getMergedOperationalEfficiencyText(val?: ExportValueData): string {
    if (!val) return '';
    const effClean = stripHtml(val.operational_efficiency);
    const fteClean = stripHtml(val.fte_detail);

    const hasQuantifiedTimeInFte =
        fteClean &&
        !isNAPillar(fteClean) &&
        !isPendingDocumentation(fteClean) &&
        !isUnquantifiedPillarText(fteClean) &&
        /[0-9]+\s*(?:hrs?|horas?|minutos?|min\b|FTEs?\b)/i.test(fteClean);

    if (hasQuantifiedTimeInFte) {
        if (!effClean || isNAPillar(effClean) || isPendingDocumentation(effClean)) {
            return fteClean;
        }
        // Avoid duplicating if already included
        if (!effClean.toLowerCase().includes(fteClean.slice(0, 20).toLowerCase())) {
            return `${effClean}\n• Tiempo / Capacidad liberada: ${fteClean.replace(/^[•\-\*–—\s]+/, '')}`;
        }
    }
    return effClean;
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

// ─── Shared Portfolio Intelligence Extractor (5 Pillars) ──────────────────────

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

export interface PortfolioAnalytics {
    totalInits: number;
    completeInits: number;
    partialInits: number;
    pendingMgmtInits: number;
    emptyInits: number;
    pctGlobalComplete: number;
    pctPartial: number;
    pctEmpty: number;
    hasBusiness: number;
    pctBusiness: number;
    hasOperational: number;
    operationalAreas: string[];
    totalHoursPerMonth: number;
    hoursImpactedCount: number;
    hasQualitative: number;
    qualCategories: { name: string; count: number; areas: string[] }[];
    hasUsers: number;
    totalUsers: number;
    usersAreas: string[];
    totalSavingsUsd: number;
    totalSavingsMdp: number;
    formattedSavings: string;
    savingsSecondaryHighlight: string;
    savingsDocumentedCount: number;
    savingsQuantifiedCount: number;
    savingsPendingCount: number;
    pctSavings: number;
}

export function analyzePortfolioValue(
    initiatives: ConsolidatedInitiativeExport[],
    allValues: Record<string, ExportValueData>
): PortfolioAnalytics {
    const totalInits = initiatives.length;

    let completeInits = 0;
    let partialInits = 0;
    let pendingMgmtInits = 0;
    let emptyInits = 0;

    let hasBusiness = 0;
    let hasOperational = 0;
    let hasQualitative = 0;
    let hasUsers = 0;

    const operationalAreasSet = new Set<string>();
    const usersAreasSet = new Set<string>();

    for (const init of initiatives) {
        const val = allValues[init.id] || {};
        // 5 Strategic Pillars
        const pillarVals = [
            val.business_value,
            val.operational_efficiency,
            val.qualitative_benefit,
            val.users_reached_detail,
            val.estimated_savings_detail,
        ];

        const rawFilledCount = pillarVals.filter(v => isPillarFilled(v)).length;
        const completedCount = pillarVals.filter(v => isPillarCompleted(v)).length;
        const pendingCount = pillarVals.filter(v => isPendingDocumentation(v)).length;

        if (rawFilledCount === 0) {
            emptyInits++;
        } else if (completedCount === 5) {
            completeInits++;
        } else {
            partialInits++;
            if (pendingCount > 0) pendingMgmtInits++;
        }

        if (isSubstantivePillar(val.business_value)) hasBusiness++;
        if (isSubstantivePillar(val.operational_efficiency)) {
            hasOperational++;
            if (init.area) operationalAreasSet.add(init.area);
        }
        if (isSubstantivePillar(val.qualitative_benefit)) hasQualitative++;
        if (isSubstantivePillar(val.users_reached_detail)) {
            hasUsers++;
            if (init.area) usersAreasSet.add(init.area);
        }
    }

    const pctGlobalComplete = totalInits > 0 ? Math.round((completeInits / totalInits) * 100) : 0;
    const pctPartial = totalInits > 0 ? Math.round((partialInits / totalInits) * 100) : 0;
    const pctEmpty = totalInits > 0 ? Math.round((emptyInits / totalInits) * 100) : 0;
    const pctBusiness = totalInits > 0 ? Math.round((hasBusiness / totalInits) * 100) : 0;

    // Hours Liberated per Month (integrated into Eficiencia Operativa from operational_efficiency + fte_detail)
    let totalHoursPerMonth = 0;
    let hoursImpactedCount = 0;

    for (const init of initiatives) {
        const valEff = allValues[init.id]?.operational_efficiency;
        const valFte = allValues[init.id]?.fte_detail;
        const combinedTimeText = `${stripHtml(valEff)} \n ${stripHtml(valFte)}`;

        const weekHrsMatch = combinedTimeText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:hrs?|horas?)\s*\/\s*semana/i)
            || combinedTimeText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:hrs?|horas?)\s*semanales/i);
        const monthHrsMatch = combinedTimeText.match(/(?:entre\s+[0-9]+\s+y\s+)?([0-9]+(?:\.[0-9]+)?)\s*(?:hrs?|horas?)\s*(?:\/\s*mes|mensuales)/i);
        const yearHrsMatch = combinedTimeText.match(/(?:entre\s+[0-9]+\s+a\s+|[0-9]+\s+a\s+)?([0-9]+(?:\.[0-9]+)?)\s*(?:hrs?|horas?)(?:\s+hombre)?\s*(?:\/\s*a[ñn]o|anuales)/i);

        if (weekHrsMatch) {
            const hrs = parseFloat(weekHrsMatch[1]);
            if (!isNaN(hrs) && hrs > 0) {
                totalHoursPerMonth += hrs * 4;
                hoursImpactedCount++;
            }
        } else if (monthHrsMatch) {
            const hrs = parseFloat(monthHrsMatch[1]);
            if (!isNaN(hrs) && hrs > 0) {
                totalHoursPerMonth += hrs;
                hoursImpactedCount++;
            }
        } else if (yearHrsMatch) {
            const hrs = parseFloat(yearHrsMatch[1]);
            if (!isNaN(hrs) && hrs > 0) {
                totalHoursPerMonth += hrs / 12;
                hoursImpactedCount++;
            }
        }
    }

    totalHoursPerMonth = Math.round(totalHoursPerMonth);

    // Savings & Quantified Value
    let totalSavingsUsd = 0;
    let totalSavingsMdp = 0;
    let savingsDocumentedCount = 0;
    let savingsQuantifiedCount = 0;
    let savingsPendingCount = 0;

    for (const init of initiatives) {
        const val = allValues[init.id]?.estimated_savings_detail;
        if (!isSubstantivePillar(val)) continue;

        const clean = stripHtml(val);
        savingsDocumentedCount++;

        if (isUnquantifiedPillarText(clean)) {
            savingsPendingCount++;
            continue;
        }

        const usdMatch = clean.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(?:USD)?/i)
            || clean.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*USD/i);

        const mdpMatch = clean.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*(?:MDP|millones\s+de\s+pesos)/i);

        if (mdpMatch) {
            const mdpVal = parseFloat(mdpMatch[1].replace(/,/g, ''));
            if (!isNaN(mdpVal) && mdpVal > 0) {
                totalSavingsMdp += mdpVal;
            }
        } else if (usdMatch) {
            const usdVal = parseFloat(usdMatch[1].replace(/,/g, ''));
            if (!isNaN(usdVal) && usdVal > 0) {
                totalSavingsUsd += usdVal;
            }
        }

        savingsQuantifiedCount++;
    }

    const pctSavings = totalInits > 0 ? Math.round((savingsQuantifiedCount / totalInits) * 100) : 0;
    const formattedSavings = totalSavingsUsd > 0
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalSavingsUsd)
        : '$0 USD';
    const savingsSecondaryHighlight = totalSavingsMdp > 0 ? `+ $${totalSavingsMdp} MDP` : '';

    // Users Reached
    let totalUsers = 0;
    for (const init of initiatives) {
        const val = allValues[init.id]?.users_reached_detail;
        if (!isSubstantivePillar(val)) continue;
        const clean = stripHtml(val);

        const matches = Array.from(
            clean.matchAll(/(?:^|\s|\+|>)([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*(?:usuarios?|usurarios?|personas?|colaboradores?|empleados?|oficiales?|oficilaes?|analistas?|especialistas?|integrantes?)/gi)
        );
        for (const m of matches) {
            const num = parseInt(m[1].replace(/,/g, ''), 10);
            if (!isNaN(num) && num > 0 && num < 100000) {
                totalUsers += num;
            }
        }
    }

    // Qualitative Categories
    const qualRules = [
        { name: 'Mitigación de Riesgos', keywords: ['riesgo', 'mitiga', 'auditor', 'vulnerab'] },
        { name: 'Cumplimiento & Normativa', keywords: ['cumplimiento', 'normativ', 'fiscal', 'legal', 'sox'] },
        { name: 'Calidad de Datos', keywords: ['calidad', 'consisten', 'precisi', 'integridad'] },
        { name: 'Visibilidad & Control', keywords: ['gobernanza', 'control', 'visibilidad', 'trazabil'] },
        { name: 'Automatización & RPA', keywords: ['automatiz', 'rpa', 'robot', 'digital'] },
        { name: 'Agilidad Operativa', keywords: ['agil', 'tiempo', 'velocidad', 'productiv'] },
    ];

    const qualCategories = qualRules.map(rule => {
        const matched = initiatives.filter(init => {
            const raw = allValues[init.id]?.qualitative_benefit;
            if (!isSubstantivePillar(raw)) return false;
            const text = stripHtml(raw).toLowerCase();
            return rule.keywords.some(kw => text.includes(kw));
        });
        return {
            name: rule.name,
            count: matched.length,
            areas: Array.from(new Set(matched.map(m => m.area).filter(Boolean))) as string[]
        };
    });

    return {
        totalInits,
        completeInits,
        partialInits,
        pendingMgmtInits,
        emptyInits,
        pctGlobalComplete,
        pctPartial,
        pctEmpty,
        hasBusiness,
        pctBusiness,
        hasOperational,
        operationalAreas: Array.from(operationalAreasSet),
        totalHoursPerMonth,
        hoursImpactedCount,
        hasQualitative,
        qualCategories,
        hasUsers,
        totalUsers,
        usersAreas: Array.from(usersAreasSet),
        totalSavingsUsd,
        totalSavingsMdp,
        formattedSavings,
        savingsSecondaryHighlight,
        savingsDocumentedCount,
        savingsQuantifiedCount,
        savingsPendingCount,
        pctSavings,
    };
}

// ─── Individual Excel Export (Single Sheet "Ficha de Iniciativa" — 5 Pillars) ───

export function exportToExcel(
    initiative: ExportInitiative,
    valueData: ExportValueData,
    pillars: ExportPillar[] = EXPORT_PILLARS
): void {
    const wb = XLSX.utils.book_new();
    const exportDate = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const filledCount = pillars.filter(p => isPillarCompleted(valueData[p.key])).length;

    const s1: any[][] = [
        ['TFBE ROADMAP — FICHA TÉCNICA DE IMPACTO & VALOR (5 PILARES)'],
        [`Generado el ${exportDate} | Estado de Adopción: ${filledCount} de ${pillars.length} Pilares Documentados`, '', ''],
        [],
        ['INFORMACIÓN GENERAL DE LA INICIATIVA', '', ''],
        ['Iniciativa', initiative.name, ''],
        ['Área', initiative.area || '—', ''],
        ['Champion / Responsable', initiative.champion || initiative.transformation_lead || '—', ''],
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
        const clean =
            pillar.key === 'operational_efficiency'
                ? getMergedOperationalEfficiencyText(valueData)
                : stripHtml(raw);
        const isFilled = isPillarFilled(raw);
        const isNa = isNAPillar(raw);
        const isPending = isPendingDocumentation(raw);

        let statusText = '⬜ Pendiente';
        if (isNa) {
            statusText = '⚪ No Aplica';
        } else if (isPending) {
            statusText = '⏳ Pendiente Gerencia';
        } else if (isFilled) {
            statusText = '✅ Completo';
        }

        s1.push([pillar.label, statusText, clean || '(Sin información documentada)']);
    });

    s1.push([]);
    s1.push([`© ${new Date().getFullYear()} TFBE Roadmap — Ficha Técnica de Impacto & Valor generada automáticamente`, '', '']);

    const ws1 = XLSX.utils.aoa_to_sheet(s1);

    ws1['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 100 }];
    ws1['!rows'] = s1.map((row, i) => {
        if (i === 0) return { hpt: 28 };
        if (i >= 14 && i < 14 + pillars.length) {
            const text = String(row[2] || '');
            const lineCount = Math.max(
                text.split('\n').reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / 90)), 0),
                2
            );
            return { hpt: Math.min(Math.max(lineCount * 15, 26), 180) };
        }
        return { hpt: 20 };
    });

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

    setStyle('A1', {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '312E81' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });
    setStyle('A2', {
        font: { sz: 9, italic: true, color: { rgb: '6366F1' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });
    setStyle('A4', {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { vertical: 'center' }
    });

    for (let r = 5; r <= 11; r++) {
        setStyle(`A${r}`, {
            font: { bold: true, sz: 9, color: { rgb: '374151' } },
            fill: { fgColor: { rgb: 'EEF2FF' } },
            alignment: { vertical: 'center' }
        });
        setStyle(`B${r}`, {
            font: { sz: 9 },
            fill: { fgColor: { rgb: 'F9FAFB' } },
            alignment: { vertical: 'center', wrapText: true }
        });
    }

    setStyle('A13', {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { vertical: 'center' }
    });

    ['A14', 'B14', 'C14'].forEach(cell => {
        setStyle(cell, {
            font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1E1B4B' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });
    });

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

// ─── Individual PDF Export (5 Pillars, Dynamic Card Heights, Zero Truncation) ─

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
    const filledCount = pillars.filter(p => isPillarCompleted(valueData[p.key])).length;

    const drawHeader = (isContinuation = false) => {
        doc.setFillColor(30, 27, 75);
        doc.roundedRect(MARGIN, 10, CONTENT_W, isContinuation ? 15 : 21, 2, 2, 'F');

        doc.setFillColor(99, 102, 241);
        doc.rect(MARGIN, 10, CONTENT_W, 1.5, 'F');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(199, 210, 254);
        doc.text(
            isContinuation
                ? 'TFBE ROADMAP — FICHA TÉCNICA EJECUTIVA (CONTINUACIÓN)'
                : 'TFBE ROADMAP — FICHA TÉCNICA EJECUTIVA DE IMPACTO & VALOR',
            MARGIN + 4,
            15.5
        );

        doc.setFontSize(isContinuation ? 10 : 12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const nameLines = doc.splitTextToSize(initiative.name, 125);
        doc.text(nameLines.slice(0, 2), MARGIN + 4, isContinuation ? 21.5 : 22);

        if (!isContinuation) {
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(203, 213, 225);
            doc.text(`Generado: ${exportDate}`, W - MARGIN - 4, 16, { align: 'right' });

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(`${filledCount}/${pillars.length} Pilares Documentados`, W - MARGIN - 4, 24, { align: 'right' });
        }
    };

    const drawMetadataStrip = (yPos: number): number => {
        const stripH = 18;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(MARGIN, yPos, CONTENT_W, stripH, 2, 2, 'FD');

        doc.setFillColor(99, 102, 241);
        doc.rect(MARGIN, yPos, 2.5, stripH, 'F');

        const colWidthsMeta = [38, 42, 36, 22, 42];
        const metaFields = [
            { label: 'ÁREA', value: initiative.area || '—' },
            { label: 'CHAMPION / RESP.', value: initiative.champion || initiative.transformation_lead || '—' },
            { label: 'ESTATUS', value: initiative.status || 'Sin Estatus' },
            { label: 'PROGRESO', value: `${initiative.progress ?? 0}%` },
            { label: 'TECNOLOGÍAS', value: initiative.technologies?.join(', ') || '—' },
        ];

        let mx = MARGIN + 5;
        metaFields.forEach((meta, idx) => {
            const cw = colWidthsMeta[idx];
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text(meta.label, mx, yPos + 5);

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            const wrappedVal = doc.splitTextToSize(meta.value, cw - 3);
            doc.text(wrappedVal.slice(0, 2), mx, yPos + 10);
            mx += cw;
        });

        return stripH;
    };

    const halfWidth = (CONTENT_W - 5) / 2; // 90.5mm
    const col1X = MARGIN;
    const col2X = MARGIN + halfWidth + 5;
    const lineSpacing = 3.6;

    const getPillarCleanText = (pillar: ExportPillar): string => {
        if (pillar.key === 'operational_efficiency') {
            return getMergedOperationalEfficiencyText(valueData);
        }
        return stripHtml(valueData[pillar.key] || '');
    };

    const calculatePillarCardHeight = (pillar: ExportPillar, cardWidth: number): number => {
        const clean = getPillarCleanText(pillar);
        if (!clean || clean === '<p></p>') return 28;

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        const lines = clean.split('\n').filter(l => l.trim().length > 0);
        let h = 13;
        for (const rawLine of lines) {
            const isBullet = rawLine.trim().startsWith('•');
            const displayText = isBullet ? rawLine.trim().slice(1).trim() : rawLine.trim();
            const textWidth = isBullet ? cardWidth - 11 : cardWidth - 7;
            const wrapped = doc.splitTextToSize(displayText, textWidth);
            h += wrapped.length * lineSpacing + 0.8;
        }
        return Math.max(h + 4, 34);
    };

    const drawPillarCard = (
        pillar: ExportPillar,
        x: number,
        y: number,
        width: number,
        height: number
    ) => {
        const raw = valueData[pillar.key] || '';
        const clean = getPillarCleanText(pillar);
        const isFilled = isPillarFilled(raw) || clean.length > 0;
        const isNa = isNAPillar(raw);
        const isPending = isPendingDocumentation(raw);
        const [pr, pg, pb] = hexToRgb(pillar.hexColor);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, width, height, 2.5, 2.5, 'FD');

        doc.setFillColor(pr, pg, pb);
        doc.roundedRect(x, y, width, 8, 2.5, 2.5, 'F');
        doc.rect(x, y + 4, width, 4, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(pillar.label.toUpperCase(), x + 3.5, y + 5.5);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        let statusBadge = '○ Pendiente';
        if (isNa) {
            statusBadge = '⚪ No Aplica';
        } else if (isPending) {
            statusBadge = '⏳ Pend. Gerencia';
        } else if (isFilled) {
            statusBadge = '✓ Documentado';
        }
        doc.text(statusBadge, x + width - 3.5, y + 5.5, { align: 'right' });

        let cy = y + 12.5;

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
            const isBullet = rawLine.trim().startsWith('•');
            const displayText = isBullet ? rawLine.trim().slice(1).trim() : rawLine.trim();
            const textWidth = isBullet ? width - 11 : width - 7;
            const wrapped = doc.splitTextToSize(displayText, textWidth);

            for (let wIdx = 0; wIdx < wrapped.length; wIdx++) {
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
            cy += 0.8;
        }
    };

    // Layout for 5 Pillars:
    // Row 0: Pillars 0 & 1 (halfWidth each)
    // Row 1: Pillars 2 & 3 (halfWidth each)
    // Row 2: Pillar 4 (full CONTENT_W width!)
    drawHeader(false);
    const stripH = drawMetadataStrip(33);
    let currentY = 33 + stripH + 4; // 55mm
    const maxPageY = 281;

    const row0H = Math.max(
        pillars[0] ? calculatePillarCardHeight(pillars[0], halfWidth) : 34,
        pillars[1] ? calculatePillarCardHeight(pillars[1], halfWidth) : 34
    );
    const row1H = Math.max(
        pillars[2] ? calculatePillarCardHeight(pillars[2], halfWidth) : 34,
        pillars[3] ? calculatePillarCardHeight(pillars[3], halfWidth) : 34
    );
    const row2H = pillars[4] ? calculatePillarCardHeight(pillars[4], CONTENT_W) : 34;

    const totalRequiredH = row0H + row1H + row2H + 8;
    const availableSinglePageH = maxPageY - currentY;

    if (totalRequiredH <= availableSinglePageH) {
        const extraPerRow = Math.floor((availableSinglePageH - totalRequiredH) / 3);
        const h0 = row0H + Math.min(extraPerRow, 18);
        const h1 = row1H + Math.min(extraPerRow, 18);
        const h2 = row2H + Math.min(extraPerRow, 18);

        if (pillars[0]) drawPillarCard(pillars[0], col1X, currentY, halfWidth, h0);
        if (pillars[1]) drawPillarCard(pillars[1], col2X, currentY, halfWidth, h0);
        currentY += h0 + 4;

        if (pillars[2]) drawPillarCard(pillars[2], col1X, currentY, halfWidth, h1);
        if (pillars[3]) drawPillarCard(pillars[3], col2X, currentY, halfWidth, h1);
        currentY += h1 + 4;

        if (pillars[4]) drawPillarCard(pillars[4], MARGIN, currentY, CONTENT_W, h2);
    } else {
        // Multi-page flow
        if (pillars[0]) drawPillarCard(pillars[0], col1X, currentY, halfWidth, row0H);
        if (pillars[1]) drawPillarCard(pillars[1], col2X, currentY, halfWidth, row0H);
        currentY += row0H + 4.5;

        if (currentY + row1H > maxPageY) {
            doc.addPage();
            drawHeader(true);
            currentY = 29;
        }
        if (pillars[2]) drawPillarCard(pillars[2], col1X, currentY, halfWidth, row1H);
        if (pillars[3]) drawPillarCard(pillars[3], col2X, currentY, halfWidth, row1H);
        currentY += row1H + 4.5;

        if (currentY + row2H > maxPageY) {
            doc.addPage();
            drawHeader(true);
            currentY = 29;
        }
        if (pillars[4]) drawPillarCard(pillars[4], MARGIN, currentY, CONTENT_W, row2H);
    }

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

// ─── Consolidated Excel Export (5 Strategic Pillars) ─────────────────────────

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

    const filterNotes: string[] = [];
    if (filterContext?.area) filterNotes.push(`Área: ${filterContext.area}`);
    if (filterContext?.transfLead && filterContext.transfLead.length > 0) filterNotes.push(`Resp: ${filterContext.transfLead.join(', ')}`);
    if (filterContext?.status && filterContext.status.length > 0) filterNotes.push(`Estatus: ${filterContext.status.join(', ')}`);
    const filterSubtitle = filterNotes.length > 0 ? `Filtros aplicados: ${filterNotes.join(' | ')}` : 'Todas las iniciativas (Universo Completo)';

    const stats = analyzePortfolioValue(initiatives, allValues);

    // ─── PESTAÑA 1: Resumen Ejecutivo (KPIs — 5 Pilares) ───────────────────────────

    const s1: any[][] = [
        ['TFBE ROADMAP — RESUMEN EJECUTIVO DE IMPACTO & VALOR (5 PILARES)'],
        [`Exportado el ${exportDate} | Portafolio: ${stats.totalInits} iniciativas | ${filterSubtitle}`],
        [],
        ['1. ADOPCIÓN Y MADUREZ DE DOCUMENTACIÓN (5 PILARES)'],
        ['Métrica', 'Iniciativas', '% del Portafolio', 'Descripción'],
        ['Total de Iniciativas Analizadas', stats.totalInits, '100%', 'Total de iniciativas evaluadas según filtros activos'],
        ['Completas Documentadas (5/5 pilares)', stats.completeInits, `${stats.pctGlobalComplete}%`, 'Con los 5 pilares de valor sustantivamente documentados (o N/A justificado)'],
        ['En Progreso / Pendiente por Gerencia', stats.partialInits, `${stats.pctPartial}%`, `Con avance parcial o marcadas como "Documentación pendiente por gerencia" (${stats.pendingMgmtInits} iniciativas)`],
        ['Sin Documentar (0 pilares)', stats.emptyInits, `${stats.pctEmpty}%`, 'Iniciativas pendientes de iniciar captura de valor'],
        ['% Global de Adopción Confirmada', `${stats.pctGlobalComplete}%`, '—', 'Proporción del portafolio con perfil de valor 100% documentado'],
        [],
        ['2. INDICADORES CONSOLIDADOS POR PILAR DE VALOR'],
        ['Pilar de Impacto', 'Métrica Principal', 'Métrica Secundaria / Alcance', 'Cobertura Completa y Observaciones'],
        [
            'Pilar 1: Valor de Negocio',
            `${stats.pctBusiness}% iniciativas alineadas (${stats.hasBusiness}/${stats.totalInits})`,
            `${stats.hasBusiness} iniciativas con valor documentado`,
            'Alineación estratégica con objetivos corporativos, flujo de cobranza, impuestos y negocio protegido'
        ],
        [
            'Pilar 2: Eficiencia Operativa y Horas Liberadas',
            `${stats.hasOperational} procesos optimizados`,
            stats.totalHoursPerMonth > 0
                ? `+${stats.totalHoursPerMonth.toLocaleString()} hrs/mes liberadas en ${stats.operationalAreas.length} áreas`
                : `${stats.operationalAreas.length} áreas impactadas`,
            `Áreas impactadas: ${stats.operationalAreas.join(', ') || 'En proceso'}`
        ],
        [
            'Pilar 3: Beneficio Cualitativo',
            `${stats.hasQualitative} iniciativas documentadas`,
            `${stats.qualCategories.filter(c => c.count > 0).length} categorías activas`,
            'Mejoras tangibles en mitigación de riesgos, cumplimiento fiscal/SOX, calidad de datos y control'
        ],
        [
            'Pilar 4: Usuarios Alcanzados',
            stats.totalUsers > 0 ? `+${stats.totalUsers.toLocaleString()} usuarios directos` : `${stats.hasUsers} iniciativas con alcance`,
            `${stats.usersAreas.length} áreas involucradas`,
            `Áreas con alcance: ${stats.usersAreas.join(', ') || 'En despliegue'}`
        ],
        [
            'Pilar 5: Ahorro Estimado',
            `${stats.formattedSavings}${stats.savingsSecondaryHighlight ? ` (${stats.savingsSecondaryHighlight})` : ''}`,
            `${stats.savingsQuantifiedCount} con beneficio activo (${stats.savingsPendingCount} por cuantificar)`,
            'Ahorro económico anualizado, aclaraciones financieras y optimización de costos operativos'
        ],
        [],
        ['3. DESGLOSE POR CATEGORÍA CUALITATIVA (PILAR 3)'],
        ['Categoría Cualitativa', 'Iniciativas con Cobertura', '% del Portafolio', 'Áreas Representativas (Completas)'],
        ...stats.qualCategories.map(cat => [
            cat.name,
            cat.count,
            stats.totalInits > 0 ? `${Math.round((cat.count / stats.totalInits) * 100)}%` : '0%',
            cat.areas.length > 0 ? cat.areas.join(', ') : 'General'
        ]),
        [],
        [`© ${new Date().getFullYear()} TFBE Roadmap — Resumen Ejecutivo de Impacto & Valor`]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(s1);

    ws1['!cols'] = [
        { wch: 38 },
        { wch: 38 },
        { wch: 38 },
        { wch: 82 },
    ];

    ws1['!rows'] = s1.map((row, idx) => {
        if (idx === 0) return { hpt: 28 };
        const col3 = String(row[3] || '');
        if (col3.length > 75) {
            return { hpt: Math.ceil(col3.length / 75) * 16 + 6 };
        }
        return { hpt: 20 };
    });

    ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } },
        { s: { r: 19, c: 0 }, e: { r: 19, c: 3 } },
        { s: { r: s1.length - 1, c: 0 }, e: { r: s1.length - 1, c: 3 } },
    ];

    const setStyle = (sheet: any, ref: string, style: object) => {
        if (!sheet[ref]) sheet[ref] = { t: 's', v: '' };
        sheet[ref].s = style;
    };

    setStyle(ws1, 'A1', {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '312E81' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });
    setStyle(ws1, 'A2', {
        font: { sz: 9, italic: true, color: { rgb: '6366F1' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    });

    [4, 12, 20].forEach(r => {
        setStyle(ws1, `A${r}`, {
            font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4F46E5' } },
            alignment: { vertical: 'center' }
        });
    });

    [5, 13, 21].forEach(r => {
        ['A', 'B', 'C', 'D'].forEach(c => {
            setStyle(ws1, `${c}${r}`, {
                font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '1E1B4B' } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
            });
        });
    });

    for (let r = 6; r <= 10; r++) {
        setStyle(ws1, `A${r}`, { font: { bold: true, sz: 9 }, alignment: { vertical: 'center' } });
        ['B', 'C', 'D'].forEach(c => setStyle(ws1, `${c}${r}`, { font: { sz: 9 }, alignment: { vertical: 'center', wrapText: true } }));
    }
    for (let r = 14; r <= 18; r++) {
        setStyle(ws1, `A${r}`, { font: { bold: true, sz: 9 }, alignment: { vertical: 'top' } });
        ['B', 'C', 'D'].forEach(c => setStyle(ws1, `${c}${r}`, { font: { sz: 9 }, alignment: { vertical: 'top', wrapText: true } }));
    }
    for (let r = 22; r <= 21 + stats.qualCategories.length; r++) {
        setStyle(ws1, `A${r}`, { font: { bold: true, sz: 9 }, alignment: { vertical: 'top' } });
        ['B', 'C', 'D'].forEach(c => setStyle(ws1, `${c}${r}`, { font: { sz: 9 }, alignment: { vertical: 'top', wrapText: true } }));
    }

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Ejecutivo (KPIs)');

    // ─── PESTAÑA 2: Detalle Iniciativas y 5 Pilares ────────────────────────────────

    const detailHeaders = [
        'Iniciativa',
        'Área',
        'Responsable / Champion',
        'Estatus',
        'Progreso (%)',
        '1. Valor de Negocio',
        '2. Eficiencia Operativa (y Horas Liberadas)',
        '3. Beneficio Cualitativo',
        '4. Usuarios Alcanzados',
        '5. Ahorro Estimado',
        'Pilares Completos'
    ];

    const s2: any[][] = [
        ['TFBE ROADMAP — DETALLE DE INICIATIVAS Y 5 PILARES DE VALOR'],
        [`Exportado el ${exportDate} | ${stats.totalInits} iniciativas | ${filterSubtitle}`],
        [],
        detailHeaders
    ];

    for (const init of initiatives) {
        const val = allValues[init.id] || {};
        const cleanBusiness = stripHtml(val.business_value);
        const cleanOperational = getMergedOperationalEfficiencyText(val);
        const cleanQualitative = stripHtml(val.qualitative_benefit);
        const cleanUsers = stripHtml(val.users_reached_detail);
        const cleanSavings = stripHtml(val.estimated_savings_detail);

        const completedCount = [
            val.business_value,
            val.operational_efficiency,
            val.qualitative_benefit,
            val.users_reached_detail,
            val.estimated_savings_detail
        ].filter(v => isPillarCompleted(v)).length;

        const hasPendingMgmt = [
            val.business_value,
            val.operational_efficiency,
            val.qualitative_benefit,
            val.users_reached_detail,
            val.estimated_savings_detail
        ].some(v => isPendingDocumentation(v));

        const leadChampion = [init.transformation_lead, init.champion].filter(Boolean).join(' / ') || '—';

        s2.push([
            init.name,
            init.area || '—',
            leadChampion,
            init.status || 'Sin Estatus',
            `${init.progress ?? 0}%`,
            cleanBusiness || '—',
            cleanOperational || '—',
            cleanQualitative || '—',
            cleanUsers || '—',
            cleanSavings || '—',
            hasPendingMgmt && completedCount === 0 ? 'Pend. Gerencia' : `${completedCount}/5`
        ]);
    }

    s2.push([]);
    s2.push([`© ${new Date().getFullYear()} TFBE Roadmap — Detalle de Iniciativas generado automáticamente`]);

    const ws2 = XLSX.utils.aoa_to_sheet(s2);

    const colWidths = [
        { wch: 36 }, // Iniciativa
        { wch: 24 }, // Área
        { wch: 28 }, // Responsable
        { wch: 24 }, // Estatus
        { wch: 14 }, // Progreso
        { wch: 52 }, // 1. Valor de Negocio
        { wch: 56 }, // 2. Eficiencia Operativa
        { wch: 52 }, // 3. Beneficio Cualitativo
        { wch: 44 }, // 4. Usuarios Alcanzados
        { wch: 46 }, // 5. Ahorro Estimado
        { wch: 18 }, // Pilares Completos
    ];
    ws2['!cols'] = colWidths;

    ws2['!rows'] = s2.map((row, rIdx) => {
        if (rIdx === 0) return { hpt: 28 };
        if (rIdx === 1) return { hpt: 20 };
        if (rIdx === 3) return { hpt: 26 };
        if (rIdx >= 4 && rIdx < s2.length - 2) {
            let maxLines = 1;
            for (let c = 5; c <= 9; c++) {
                const cellText = String(row[c] || '');
                if (cellText && cellText !== '—') {
                    const colW = colWidths[c]?.wch || 48;
                    const lines = cellText
                        .split('\n')
                        .reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / (colW - 4))), 0);
                    if (lines > maxLines) maxLines = lines;
                }
            }
            return { hpt: Math.min(Math.max(maxLines * 14 + 6, 22), 170) };
        }
        return { hpt: 18 };
    });

    ws2['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
        { s: { r: s2.length - 1, c: 0 }, e: { r: s2.length - 1, c: 10 } }
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

    const detailHeaderCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    detailHeaderCols.forEach(col => {
        setStyle(ws2, `${col}4`, {
            font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1E1B4B' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        });
    });

    for (let r = 5; r <= s2.length - 2; r++) {
        const isEven = r % 2 === 0;
        const rowBg = isEven ? 'F8FAFC' : 'FFFFFF';
        detailHeaderCols.forEach((col, cIdx) => {
            setStyle(ws2, `${col}${r}`, {
                font: { bold: cIdx === 0 || cIdx === 10, sz: 9, color: { rgb: cIdx === 0 ? '1E293B' : '334155' } },
                fill: { fgColor: { rgb: rowBg } },
                alignment: {
                    horizontal: cIdx === 4 || cIdx === 10 ? 'center' : 'left',
                    vertical: 'top',
                    wrapText: true
                }
            });
        });
    }

    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Iniciativas y Pilares');

    const fileName = `Consolidado_Impacto_Valor_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// ─── Consolidated PDF Export (Landscape A4: Page 1 5-Pillar Executive One-Pager + Dynamic Matrix) ────

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
    const MARGIN = 10;
    const CONTENT_W = W - MARGIN * 2; // 277mm
    const exportDate = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    const filterNotes: string[] = [];
    if (filterContext?.area) filterNotes.push(`Área: ${filterContext.area}`);
    if (filterContext?.transfLead && filterContext.transfLead.length > 0) filterNotes.push(`Resp: ${filterContext.transfLead.join(', ')}`);
    if (filterContext?.status && filterContext.status.length > 0) filterNotes.push(`Estatus: ${filterContext.status.join(', ')}`);
    const filterSubtitle = filterNotes.length > 0 ? `Filtros: ${filterNotes.join(' | ')}` : 'Todas las iniciativas (Universo Completo)';

    const stats = analyzePortfolioValue(initiatives, allValues);

    // ─── PÁGINA 1: ONE-PAGER EJECUTIVO DE 5 PILARES (LANDSCAPE) ──────────────────────

    doc.setFillColor(30, 27, 75);
    doc.roundedRect(MARGIN, 9, CONTENT_W, 17, 2, 2, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(MARGIN, 9, CONTENT_W, 1.5, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(199, 210, 254);
    doc.text('TFBE ROADMAP — DASHBOARD EJECUTIVO DE IMPACTO & VALOR (5 PILARES)', MARGIN + 4, 14.5);

    doc.setFontSize(11.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Consolidado Estratégico de Portafolio — ${stats.totalInits} Iniciativas`, MARGIN + 4, 21.5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Generado: ${exportDate} | ${filterSubtitle}`, W - MARGIN - 4, 21.5, { align: 'right' });

    // Section 1: 4 Adoption KPI Stat Cards
    const kpiW = (CONTENT_W - 9) / 4;
    const kpiCards = [
        { title: 'TOTAL INICIATIVAS', val: `${stats.totalInits}`, sub: 'Portafolio analizado', color: [79, 70, 229] },
        { title: 'COMPLETAS (5/5)', val: `${stats.completeInits}`, sub: `${stats.pctGlobalComplete}% documentadas al 100%`, color: [16, 185, 129] },
        { title: 'EN PROGRESO / PEND. GERENCIA', val: `${stats.partialInits}`, sub: `${stats.pctPartial}% en proceso de captura`, color: [245, 158, 11] },
        { title: 'SIN DOCUMENTAR (0/5)', val: `${stats.emptyInits}`, sub: `${stats.pctEmpty}% pendientes de inicio`, color: [156, 163, 175] },
    ];

    kpiCards.forEach((kpi, idx) => {
        const kx = MARGIN + idx * (kpiW + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(kx, 28, kpiW, 15, 2, 2, 'FD');

        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.rect(kx, 28, 2.5, 15, 'F');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.title, kx + 5, 32.8);

        doc.setFontSize(10.5);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, kx + 5, 38.2);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(kpi.sub, kx + 5, 41.6);
    });

    // Section 2: 5 Pillar Highlights (Balanced Bento: Top Row 3 Cards + Bottom Row 2 Wider Cards)
    const topColW = (CONTENT_W - 8) / 3; // ~89.6mm
    const botColW = (CONTENT_W - 4) / 2; // ~136.5mm
    const pColH = 56; // mm

    const pillarHighlights = [
        {
            label: '1. VALOR DE NEGOCIO',
            color: [124, 58, 237],
            kpi: `${stats.pctBusiness}% iniciativas alineadas`,
            sub: `${stats.hasBusiness} de ${stats.totalInits} con valor de negocio documentado`,
            desc: 'Alineación con prioridades estratégicas, protección de flujos de cobranza, impuestos y negocio.',
            items: [
                `Iniciativas con impacto estratégico: ${stats.hasBusiness} de ${stats.totalInits} (${stats.pctBusiness}%)`,
                'Flujos destacados: Cargo Central (6,800 MDP), Oxxo (600 MDP/mes), Fiscal (337 MMUSD) y Defense File (158 MMUSD).'
            ]
        },
        {
            label: '2. EFICIENCIA OPERATIVA Y HORAS LIBERADAS',
            color: [217, 119, 6],
            kpi: stats.totalHoursPerMonth > 0
                ? `${stats.hasOperational} procesos  |  +${stats.totalHoursPerMonth.toLocaleString()} hrs/mes`
                : `${stats.hasOperational} procesos optimizados`,
            sub: `${stats.operationalAreas.length} áreas operativas impactadas`,
            desc: 'Reducción de tiempos de ciclo, liberación de horas-hombre y eliminación de reprocesos manuales.',
            items: [
                `Áreas: ${stats.operationalAreas.join(', ') || 'En proceso'}`,
                'Hitos: Conciliación Oxxo (387.5 hrs/sem), Cargo Central (24 hrs/mes), Data Lake (222x), EEFF (de 16h a 2m).'
            ]
        },
        {
            label: '3. BENEFICIO CUALITATIVO',
            color: [225, 29, 72],
            kpi: `${stats.hasQualitative} iniciativas con beneficios`,
            sub: `${stats.qualCategories.filter(c => c.count > 0).length} categorías estratégicas activas`,
            desc: 'Fortalecimiento de control interno, cumplimiento normativo/SOX, trazabilidad y calidad de datos.',
            items: [
                `Categorías: Visibilidad & Control (${stats.qualCategories[3]?.count || 0}), Mitigación de Riesgos (${stats.qualCategories[0]?.count || 0}), Agilidad (${stats.qualCategories[5]?.count || 0}).`,
                `Cobertura cualitativa documentada en ${stats.hasQualitative} iniciativas del portafolio.`
            ]
        },
        {
            label: '4. USUARIOS ALCANZADOS',
            color: [5, 150, 105],
            kpi: stats.totalUsers > 0 ? `+${stats.totalUsers.toLocaleString()} usuarios directos` : `${stats.hasUsers} iniciativas`,
            sub: `${stats.usersAreas.length} áreas organizacionales beneficiadas`,
            desc: 'Equipos internos, especialistas financieros y áreas operativas que adoptan las soluciones.',
            items: [
                `Áreas con alcance: ${stats.usersAreas.join(', ') || 'En despliegue'}`,
                'Mayor adopción: Carátula CAPEX (64 usuarios), Defense File (20), Fiscal KOF (18), REPSE (18), Oficiales (10).'
            ]
        },
        {
            label: '5. AHORRO ESTIMADO',
            color: [22, 163, 74],
            kpi: `${stats.formattedSavings}${stats.savingsSecondaryHighlight ? `  ${stats.savingsSecondaryHighlight}` : ''}`,
            sub: `${stats.savingsQuantifiedCount} con beneficio activo (${stats.savingsPendingCount} por cuantificar)`,
            desc: 'Ahorro económico directo, recuperación en aclaraciones comerciales y optimización de infraestructura.',
            items: [
                `Ahorros directos: $125,000 USD anuales (Walmart GT) + $40 MDP en aclaraciones comerciales (Walmart MX).`,
                `${stats.savingsQuantifiedCount} iniciativas con impacto documentado y ${stats.savingsPendingCount} en proceso de medición.`
            ]
        },
    ];

    pillarHighlights.forEach((p, idx) => {
        const isTopRow = idx < 3;
        const cardW = isTopRow ? topColW : botColW;
        const px = isTopRow
            ? MARGIN + idx * (topColW + 4)
            : MARGIN + (idx - 3) * (botColW + 4);
        const py = isTopRow ? 45.5 : 45.5 + pColH + 3.5;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(px, py, cardW, pColH, 2, 2, 'FD');

        doc.setFillColor(p.color[0], p.color[1], p.color[2]);
        doc.roundedRect(px, py, cardW, 7, 2, 2, 'F');
        doc.rect(px, py + 3.5, cardW, 3.5, 'F');

        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(p.label, px + 3.5, py + 4.8);

        // KPI Box
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(px + 3, py + 9, cardW - 6, 13, 1.5, 1.5, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(p.color[0], p.color[1], p.color[2]);
        doc.text(p.kpi, px + 4.5, py + 14.5);

        doc.setFontSize(6.3);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(p.sub, px + 4.5, py + 19.5);

        // Description text
        doc.setFontSize(6.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(p.desc, cardW - 7);
        doc.text(descLines.slice(0, 2), px + 3.5, py + 25.5);

        // Multi-line wrapped bullets without truncation
        let by = py + 32.5;
        p.items.forEach(item => {
            const wrappedBullet = doc.splitTextToSize(item, cardW - 10);
            doc.setFillColor(p.color[0], p.color[1], p.color[2]);
            doc.circle(px + 4.5, by - 0.9, 0.75, 'F');
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 52, 70);
            wrappedBullet.slice(0, 4).forEach((line: string, lIdx: number) => {
                doc.text(line, px + 7, by + lIdx * 2.8);
            });
            by += wrappedBullet.slice(0, 4).length * 2.8 + 1.4;
        });
    });

    // Section 3: Qualitative Categories Summary Strip
    const catStripY = 166;
    const catStripH = 31;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, catStripY, CONTENT_W, catStripH, 2, 2, 'FD');

    doc.setFillColor(79, 70, 229);
    doc.rect(MARGIN, catStripY, 2.5, catStripH, 'F');

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('DESGLOSE DE CATEGORÍAS CUALITATIVAS DETECTADAS (PILAR 3)', MARGIN + 6, catStripY + 5.2);

    const catW = (CONTENT_W - 14) / 6;
    stats.qualCategories.forEach((cat, idx) => {
        const cx = MARGIN + 6 + idx * (catW + 1.2);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, catStripY + 7.8, catW, 20.5, 1.5, 1.5, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        const catTitleLines = doc.splitTextToSize(cat.name, catW - 5);
        doc.text(catTitleLines.slice(0, 2), cx + 2.5, catStripY + 12.2);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text(`${cat.count}`, cx + 2.5, catStripY + 21.5);

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(
            `iniciativas (${stats.totalInits > 0 ? Math.round((cat.count / stats.totalInits) * 100) : 0}%)`,
            cx + 9,
            catStripY + 21.5
        );

        doc.setFontSize(5.5);
        doc.setTextColor(148, 163, 184);
        const areaSample = cat.areas.slice(0, 2).join(', ') || 'General';
        const wrappedAreaSample = doc.splitTextToSize(areaSample, catW - 4);
        doc.text(wrappedAreaSample[0] || '', cx + 2.5, catStripY + 26);
    });

    // ─── PÁGINAS 2+: MATRIZ DETALLADA CON ALTURA DINÁMICA (5 PILARES) ────────────────

    const colWidths = [46, 27, 29, 25, 16, 134];
    const tableHeaders = [
        'INICIATIVA',
        'ÁREA',
        'RESPONSABLE',
        'ESTATUS',
        'AVANCE',
        'DETALLE INTEGRAL DE IMPACTO & VALOR (5 PILARES)'
    ];

    const drawTableHeader = (yPos: number) => {
        doc.setFillColor(30, 27, 75);
        doc.rect(MARGIN, yPos, CONTENT_W, 7.5, 'F');

        let tx = MARGIN;
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);

        tableHeaders.forEach((th, idx) => {
            doc.text(th, tx + 2, yPos + 5);
            tx += colWidths[idx];
        });
    };

    const drawMatrixPageBanner = (isContinuation: boolean) => {
        doc.setFillColor(30, 27, 75);
        doc.roundedRect(MARGIN, 9, CONTENT_W, 11, 1.5, 1.5, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(199, 210, 254);
        doc.text(
            isContinuation
                ? 'TFBE ROADMAP — MATRIZ DETALLADA DE INICIATIVAS Y SUS 5 PILARES (CONTINUACIÓN)'
                : 'TFBE ROADMAP — MATRIZ DETALLADA DE INICIATIVAS Y SUS 5 PILARES',
            MARGIN + 4,
            14
        );
        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text(`Listado completo sin recortes (${stats.totalInits} iniciativas registradas)`, MARGIN + 4, 18);
        doc.text(`Exportado el ${exportDate}`, W - MARGIN - 4, 16, { align: 'right' });
    };

    doc.addPage();
    drawMatrixPageBanner(false);

    let currentY = 22;
    drawTableHeader(currentY);
    currentY += 7.5;

    const lineH = 3.1;
    const maxMatrixY = 197;

    initiatives.forEach((init, idx) => {
        const val = allValues[init.id] || {};
        const pillarVals = [
            val.business_value,
            val.operational_efficiency,
            val.qualitative_benefit,
            val.users_reached_detail,
            val.estimated_savings_detail
        ];
        const completedCount = pillarVals.filter(v => isPillarCompleted(v)).length;
        const hasPendingMgmt = pillarVals.some(v => isPendingDocumentation(v));

        const cleanSingleLine = (raw?: string) =>
            stripHtml(raw)
                .split('\n')
                .map(s => s.replace(/^[•\-\*–—\s]+/, '').trim())
                .filter(Boolean)
                .join('; ');

        const impactEntries: string[] = [];
        if (hasPendingMgmt && completedCount === 0) {
            impactEntries.push('⏳ Documentación pendiente por gerencia en los 5 pilares.');
        } else {
            const pDefs: { key: keyof ExportValueData; shortLabel: string }[] = [
                { key: 'business_value', shortLabel: '1. Negocio' },
                { key: 'operational_efficiency', shortLabel: '2. Eficiencia' },
                { key: 'qualitative_benefit', shortLabel: '3. Cualitativo' },
                { key: 'users_reached_detail', shortLabel: '4. Usuarios' },
                { key: 'estimated_savings_detail', shortLabel: '5. Ahorro' },
            ];

            for (const pd of pDefs) {
                const rawP =
                    pd.key === 'operational_efficiency'
                        ? getMergedOperationalEfficiencyText(val)
                        : val[pd.key];
                if (isSubstantivePillar(rawP)) {
                    const textP = cleanSingleLine(rawP);
                    if (textP) {
                        impactEntries.push(`[${pd.shortLabel}]: ${textP}`);
                    }
                }
            }
        }

        const fullSynthesis = impactEntries.length > 0
            ? impactEntries.join('   •   ')
            : '(Sin pilares documentados — 0/5)';

        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'bold');
        const nameLines: string[] = doc.splitTextToSize(init.name || '—', colWidths[0] - 4);

        doc.setFontSize(6.3);
        doc.setFont('helvetica', 'normal');
        const areaLines: string[] = doc.splitTextToSize(init.area || '—', colWidths[1] - 4);

        const lead = [init.transformation_lead, init.champion].filter(Boolean).join(' / ') || '—';
        const leadLines: string[] = doc.splitTextToSize(lead, colWidths[2] - 4);

        const statusStr = init.status || 'Sin Estatus';
        const statusLines: string[] = doc.splitTextToSize(statusStr, colWidths[3] - 4);

        doc.setFontSize(6);
        const synthLines: string[] = doc.splitTextToSize(fullSynthesis, colWidths[5] - 4);

        const maxColLines = Math.max(
            nameLines.length,
            areaLines.length,
            leadLines.length,
            statusLines.length,
            2,
            synthLines.length
        );

        const dynamicRowH = Math.max(8.5, maxColLines * lineH + 3.2);

        if (currentY + dynamicRowH > maxMatrixY) {
            doc.addPage();
            drawMatrixPageBanner(true);
            currentY = 22;
            drawTableHeader(currentY);
            currentY += 7.5;
        }

        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.rect(MARGIN, currentY, CONTENT_W, dynamicRowH, 'FD');

        let divX = MARGIN;
        for (let c = 0; c < colWidths.length - 1; c++) {
            divX += colWidths[c];
            doc.line(divX, currentY, divX, currentY + dynamicRowH);
        }

        let tx = MARGIN;
        const textStartY = currentY + 3.8;

        // 1. Iniciativa
        doc.setFontSize(6.6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        nameLines.forEach((l, i) => doc.text(l, tx + 2, textStartY + i * lineH));

        // 2. Área
        tx += colWidths[0];
        doc.setFontSize(6.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        areaLines.forEach((l, i) => doc.text(l, tx + 2, textStartY + i * lineH));

        // 3. Responsable
        tx += colWidths[1];
        leadLines.forEach((l, i) => doc.text(l, tx + 2, textStartY + i * lineH));

        // 4. Estatus
        tx += colWidths[2];
        doc.setFont('helvetica', 'bold');
        const stLower = statusStr.toLowerCase();
        if (stLower.includes('atraso') || stLower.includes('retrasado')) {
            doc.setTextColor(185, 28, 28);
        } else if (stLower.includes('redefinición')) {
            doc.setTextColor(194, 65, 12);
        } else if (stLower.includes('entregado')) {
            doc.setTextColor(29, 78, 216);
        } else if (stLower.includes('en curso') || stLower.includes('avance')) {
            doc.setTextColor(4, 120, 87);
        } else {
            doc.setTextColor(71, 85, 105);
        }
        statusLines.forEach((l, i) => doc.text(l, tx + 2, textStartY + i * lineH));

        // 5. Avance (%) + Pilares (X/5)
        tx += colWidths[3];
        doc.setFontSize(6.4);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${init.progress ?? 0}%`, tx + 2, textStartY);

        if (hasPendingMgmt && completedCount === 0) {
            doc.setFontSize(5.6);
            doc.setTextColor(217, 119, 6);
            doc.text('Pend. Ger.', tx + 2, textStartY + lineH + 0.4);
        } else {
            doc.setFontSize(6);
            doc.setTextColor(
                completedCount === 5 ? 16 : completedCount > 0 ? 217 : 148,
                completedCount === 5 ? 185 : completedCount > 0 ? 119 : 163,
                completedCount === 5 ? 129 : completedCount > 0 ? 6 : 184
            );
            doc.text(`${completedCount}/5 pil.`, tx + 2, textStartY + lineH + 0.4);
        }

        // 6. Detalle Integral de los 5 Pilares
        tx += colWidths[4];
        doc.setFontSize(5.9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        synthLines.forEach((l, i) => doc.text(l, tx + 2, textStartY + i * lineH));

        currentY += dynamicRowH;
    });

    // ─── Dynamic Footers on All Pages ───────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, 202, W - MARGIN, 202);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('TFBE Roadmap — Consolidado Ejecutivo de Impacto & Valor (5 Pilares)', MARGIN, 206);
        doc.text(`Exportado el ${exportDate}`, W / 2, 206, { align: 'center' });
        doc.text(`Página ${p} de ${totalPages}`, W - MARGIN, 206, { align: 'right' });
    }

    doc.save(`Consolidado_Impacto_Valor_${new Date().toISOString().slice(0, 10)}.pdf`);
}
