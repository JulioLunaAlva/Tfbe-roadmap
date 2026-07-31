/**
 * exportRoadmap.ts
 * Professional Excel export for the Roadmap table.
 * Respects active filters — exports only the visible (filteredInitiatives) list.
 */

import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoadmapInitiative {
    id: string;
    name: string;
    area: string;
    champion: string;
    complexity?: string;
    status?: string;
    progress?: number;
    start_date?: string;
    end_date?: string;
    technologies?: string[];
    developer_owner?: string[];
    transformation_lead?: string;
    value?: string;
    notes?: string;
    is_top_priority?: boolean;
    is_key_initiative?: boolean;
    tags?: string[];
    phases?: { name: string; progress?: number; is_active?: boolean }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d?: string) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return d;
    }
};

const arr = (v?: string[] | string): string => {
    if (!v) return '—';
    if (Array.isArray(v)) return v.join(', ') || '—';
    return v || '—';
};

const setStyle = (ws: XLSX.WorkSheet, ref: string, style: object) => {
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = style;
};

const DARK = '1E1B4B';     // deep indigo
const RED  = 'C40500';     // brand red
const MID  = '4F46E5';     // indigo-600
const LITE = 'EEF2FF';     // indigo-50
const GRAY = 'F9FAFB';
const WHITE = 'FFFFFF';
const TEXT_DARK = '111827';

const STATUS_COLORS: Record<string, string> = {
    'Entregado':               '059669',
    'En Curso':                '0891B2',
    'Avance conforme plan':    '059669',
    'En plan':                 '6366F1',
    'Retrasado':               'DC2626',
    'Atraso':                  'DC2626',
    'Cancelado':               '6B7280',
};

const statusColor = (s?: string): string => {
    if (!s) return '6B7280';
    for (const [k, v] of Object.entries(STATUS_COLORS)) {
        if (s.toLowerCase().includes(k.toLowerCase())) return v;
    }
    return '6B7280';
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export function exportRoadmapToExcel(
    initiatives: RoadmapInitiative[],
    year: number,
    hasActiveFilters: boolean
): void {
    if (initiatives.length === 0) return;

    const wb = XLSX.utils.book_new();
    const exportDate = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const filterLabel = hasActiveFilters
        ? `Vista filtrada — ${initiatives.length} de ${initiatives.length} iniciativas`
        : `Vista completa — ${initiatives.length} iniciativas`;

    // ── Sheet 1: Dashboard KPIs ───────────────────────────────────────────────
    const total = initiatives.length;
    const delivered = initiatives.filter(i => (i.status || '').toLowerCase().includes('entregado')).length;
    const inProgress = initiatives.filter(i => {
        const s = (i.status || '').toLowerCase();
        return s.includes('en curso') || s.includes('avance') || s.includes('en plan');
    }).length;
    const delayed = initiatives.filter(i => {
        const s = (i.status || '').toLowerCase();
        return s.includes('retrasado') || s.includes('atraso');
    }).length;
    const avgProgress = total > 0
        ? Math.round(initiatives.reduce((acc, i) => acc + (i.progress ?? 0), 0) / total)
        : 0;
    const topPriority = initiatives.filter(i => i.is_top_priority).length;
    const keyInit = initiatives.filter(i => i.is_key_initiative).length;

    // Unique areas
    const areaMap: Record<string, number> = {};
    for (const i of initiatives) {
        if (i.area) areaMap[i.area] = (areaMap[i.area] || 0) + 1;
    }

    const kpiRows: any[][] = [
        ['TFBE ROADMAP', '', '', '', '', ''],
        [`Año ${year} — Reporte Ejecutivo`, '', '', '', '', ''],
        [`Exportado el ${exportDate}`, '', '', '', '', ''],
        [filterLabel, '', '', '', '', ''],
        [],
        ['INDICADORES GENERALES', '', '', '', '', ''],
        [],
        ['MÉTRICA', 'VALOR', '', 'MÉTRICA', 'VALOR', ''],
        ['Total de Iniciativas',  total,       '', 'Promedio de Progreso', `${avgProgress}%`,  ''],
        ['Entregadas',            delivered,   '', 'Top Priority',         topPriority,         ''],
        ['En Progreso',           inProgress,  '', 'Iniciativas Clave',    keyInit,             ''],
        ['Retrasadas',            delayed,     '', 'Áreas involucradas',   Object.keys(areaMap).length, ''],
        [],
        ['DISTRIBUCIÓN POR ÁREA', '', '', '', '', ''],
        ['Área', 'Iniciativas', 'Progreso promedio', '', '', ''],
        ...Object.entries(areaMap).sort((a, b) => a[0].localeCompare(b[0])).map(([area, count]) => {
            const areaInitiatives = initiatives.filter(i => i.area === area);
            const avgProg = Math.round(areaInitiatives.reduce((acc, i) => acc + (i.progress ?? 0), 0) / areaInitiatives.length);
            return [area, count, `${avgProg}%`, '', '', ''];
        }),
        [],
        [`© ${new Date().getFullYear()} TFBE Roadmap — Documento generado automáticamente`, '', '', '', '', ''],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(kpiRows);
    ws1['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 4 }, { wch: 30 }, { wch: 16 }, { wch: 4 }];
    ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 5 } },
        { s: { r: 13, c: 0 }, e: { r: 13, c: 5 } },
    ];

    // Title styles
    setStyle(ws1, 'A1', { font: { bold: true, sz: 18, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center', vertical: 'center' } });
    setStyle(ws1, 'A2', { font: { bold: true, sz: 12, color: { rgb: 'A5B4FC' } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });
    setStyle(ws1, 'A3', { font: { sz: 9, italic: true, color: { rgb: '94A3B8' } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });
    setStyle(ws1, 'A4', { font: { sz: 9, color: { rgb: hasActiveFilters ? 'FCD34D' : '6EE7B7' } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });

    // KPIs header
    setStyle(ws1, 'A6', { font: { bold: true, sz: 10, color: { rgb: WHITE } }, fill: { fgColor: { rgb: RED } }, alignment: { horizontal: 'left' } });

    // KPI table header (row 8, 0-indexed 7)
    ['A8', 'B8', 'D8', 'E8'].forEach(ref => {
        setStyle(ws1, ref, { font: { bold: true, sz: 9, color: { rgb: WHITE } }, fill: { fgColor: { rgb: MID } }, alignment: { horizontal: 'center' } });
    });

    // KPI values
    for (let r = 9; r <= 12; r++) {
        const isEven = r % 2 === 0;
        const bg = isEven ? LITE : WHITE;
        setStyle(ws1, `A${r}`, { font: { bold: true, sz: 9 }, fill: { fgColor: { rgb: bg } } });
        setStyle(ws1, `B${r}`, { font: { bold: true, sz: 11, color: { rgb: MID } }, fill: { fgColor: { rgb: bg } }, alignment: { horizontal: 'center' } });
        setStyle(ws1, `D${r}`, { font: { bold: true, sz: 9 }, fill: { fgColor: { rgb: bg } } });
        setStyle(ws1, `E${r}`, { font: { bold: true, sz: 11, color: { rgb: MID } }, fill: { fgColor: { rgb: bg } }, alignment: { horizontal: 'center' } });
    }

    // Area header
    setStyle(ws1, 'A14', { font: { bold: true, sz: 10, color: { rgb: WHITE } }, fill: { fgColor: { rgb: RED } }, alignment: { horizontal: 'left' } });
    setStyle(ws1, 'A15', { font: { bold: true, sz: 9, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });
    setStyle(ws1, 'B15', { font: { bold: true, sz: 9, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });
    setStyle(ws1, 'C15', { font: { bold: true, sz: 9, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });

    XLSX.utils.book_append_sheet(wb, ws1, 'Dashboard');

    // ── Sheet 2: Portfolio (full data) ─────────────────────────────────────────
    const headers = [
        '#', 'Iniciativa', 'Área', 'Champion', 'Dev / Owner', 'Transf. Lead',
        'Tecnologías', 'Complejidad', 'Estatus', 'Progreso %', 'Inicio', 'Fin',
        'Valor', 'Top Priority', 'Inic. Clave', 'Tags', 'Fases activas', 'Notas',
    ];

    const portfolioRows: any[][] = [
        [`TFBE ROADMAP ${year} — PORTAFOLIO DE INICIATIVAS`, ...Array(headers.length - 1).fill('')],
        [filterLabel, ...Array(headers.length - 1).fill('')],
        [],
        headers,
        ...initiatives.map((i, idx) => [
            idx + 1,
            i.name,
            i.area,
            i.champion,
            arr(i.developer_owner),
            i.transformation_lead || '—',
            arr(i.technologies),
            i.complexity || '—',
            i.status || '—',
            i.progress ?? 0,
            fmtDate(i.start_date),
            fmtDate(i.end_date),
            i.value || '—',
            i.is_top_priority ? '⭐ Sí' : 'No',
            i.is_key_initiative ? '🔑 Sí' : 'No',
            arr(i.tags),
            i.phases?.filter(p => p.is_active).map(p => `${p.name}${p.progress !== undefined ? ` (${p.progress}%)` : ''}`).join(' | ') || '—',
            i.notes || '—',
        ]),
        [],
        [`© ${new Date().getFullYear()} TFBE Roadmap`, ...Array(headers.length - 1).fill('')],
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(portfolioRows);
    ws2['!cols'] = [
        { wch: 4 },   // #
        { wch: 45 },  // Iniciativa
        { wch: 22 },  // Área
        { wch: 20 },  // Champion
        { wch: 22 },  // Dev/Owner
        { wch: 20 },  // Transf. Lead
        { wch: 28 },  // Tecnologías
        { wch: 12 },  // Complejidad
        { wch: 24 },  // Estatus
        { wch: 11 },  // Progreso
        { wch: 14 },  // Inicio
        { wch: 14 },  // Fin
        { wch: 20 },  // Valor
        { wch: 12 },  // Top Priority
        { wch: 12 },  // Inic. Clave
        { wch: 22 },  // Tags
        { wch: 50 },  // Fases
        { wch: 40 },  // Notas
    ];

    const hLen = headers.length;
    ws2['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: hLen - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: hLen - 1 } },
    ];

    // Title
    setStyle(ws2, 'A1', { font: { bold: true, sz: 14, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center', vertical: 'center' } });
    setStyle(ws2, 'A2', { font: { sz: 9, color: { rgb: hasActiveFilters ? 'FCD34D' : '6EE7B7' } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });

    // Column headers row 4 (0-indexed = 3)
    headers.forEach((_, colIdx) => {
        const colLetter = XLSX.utils.encode_col(colIdx);
        const ref = `${colLetter}4`;
        setStyle(ws2, ref, {
            font: { bold: true, sz: 9, color: { rgb: WHITE } },
            fill: { fgColor: { rgb: RED } },
            alignment: { horizontal: 'center', wrapText: true },
            border: { bottom: { style: 'thin', color: { rgb: 'B90500' } } },
        });
    });

    // Data rows
    initiatives.forEach((init, rowIdx) => {
        const excelRow = 5 + rowIdx; // 1-indexed
        const isEven = rowIdx % 2 === 0;
        const bg = isEven ? GRAY : WHITE;

        headers.forEach((_, colIdx) => {
            const colLetter = XLSX.utils.encode_col(colIdx);
            const ref = `${colLetter}${excelRow}`;
            const isStatusCol = colIdx === 8;   // Estatus
            const isProgCol = colIdx === 9;     // Progreso

            let style: any = {
                font: { sz: 9 },
                fill: { fgColor: { rgb: bg } },
                alignment: { vertical: 'top', wrapText: colIdx >= 15 },
            };

            if (colIdx === 0) {
                style.font = { sz: 9, bold: true };
                style.alignment = { horizontal: 'center', vertical: 'top' };
            }
            if (colIdx === 1) {
                style.font = { sz: 9, bold: true, color: { rgb: TEXT_DARK } };
            }
            if (isStatusCol) {
                const sc = statusColor(init.status);
                style.font = { sz: 8, bold: true, color: { rgb: WHITE } };
                style.fill = { fgColor: { rgb: sc } };
                style.alignment = { horizontal: 'center', vertical: 'center' };
            }
            if (isProgCol) {
                const pct = init.progress ?? 0;
                const progColor = pct >= 75 ? '059669' : pct >= 40 ? 'D97706' : 'DC2626';
                style.font = { sz: 9, bold: true, color: { rgb: progColor } };
                style.alignment = { horizontal: 'center', vertical: 'top' };
            }

            if (ws2[ref]) ws2[ref].s = style;
        });
    });

    XLSX.utils.book_append_sheet(wb, ws2, 'Portafolio');

    // ── Sheet 3: By Area ───────────────────────────────────────────────────────
    const areas = Array.from(new Set(initiatives.map(i => i.area).filter(Boolean))).sort();

    const areaRows: any[][] = [
        [`TFBE ROADMAP ${year} — DESGLOSE POR ÁREA`, ''],
        [filterLabel, ''],
        [],
    ];

    const areaHeaderStyle = (color: string) => ({
        font: { bold: true, sz: 10, color: { rgb: WHITE } },
        fill: { fgColor: { rgb: color } },
    });
    const AREA_COLORS = ['4F46E5', '0891B2', '7C3AED', 'D97706', 'E11D48', '059669', '16A34A', '9333EA'];

    for (const [aIdx, area] of areas.entries()) {
        const areaItems = initiatives.filter(i => i.area === area);
        const areaAvgProg = Math.round(areaItems.reduce((acc, i) => acc + (i.progress ?? 0), 0) / areaItems.length);
        const aColor = AREA_COLORS[aIdx % AREA_COLORS.length];

        areaRows.push([`${area.toUpperCase()}`, `${areaItems.length} iniciativas · Progreso promedio: ${areaAvgProg}%`]);
        areaRows.push(['Iniciativa', 'Champion', 'Estatus', 'Progreso', 'Inicio', 'Fin']);
        for (const init of areaItems) {
            areaRows.push([
                init.name,
                init.champion,
                init.status || '—',
                `${init.progress ?? 0}%`,
                fmtDate(init.start_date),
                fmtDate(init.end_date),
            ]);
        }
        areaRows.push([]); // spacer
        areaRows.push(['Subtotal área:', '', '', `Prom. ${areaAvgProg}%`, '', '']);
        areaRows.push([]);
        areaRows.push([]);
        // store area color index for styling (done below via row tracking)
        void aColor;
    }

    areaRows.push([`© ${new Date().getFullYear()} TFBE Roadmap`, '']);

    const ws3 = XLSX.utils.aoa_to_sheet(areaRows);
    ws3['!cols'] = [{ wch: 48 }, { wch: 22 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
    ws3['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];

    setStyle(ws3, 'A1', { font: { bold: true, sz: 14, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center', vertical: 'center' } });
    setStyle(ws3, 'A2', { font: { sz: 9, color: { rgb: hasActiveFilters ? 'FCD34D' : '6EE7B7' } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });

    // Style area header rows by tracking row position
    let rowCursor = 3; // 0-indexed, after title(0), subtitle(1), blank(2)
    for (const [aIdx, area] of areas.entries()) {
        const areaItems = initiatives.filter(i => i.area === area);
        const aColor = AREA_COLORS[aIdx % AREA_COLORS.length];
        const excelAreaHeaderRow = rowCursor + 1; // 1-indexed
        const excelColHeaderRow = rowCursor + 2;

        // Area header cell
        for (let c = 0; c < 6; c++) {
            const ref = `${XLSX.utils.encode_col(c)}${excelAreaHeaderRow}`;
            setStyle(ws3, ref, areaHeaderStyle(aColor));
        }
        // Merge area header col 0-1
        if (!ws3['!merges']) ws3['!merges'] = [];
        ws3['!merges'].push({ s: { r: rowCursor, c: 0 }, e: { r: rowCursor, c: 1 } });

        // Column sub-header
        for (let c = 0; c < 6; c++) {
            const ref = `${XLSX.utils.encode_col(c)}${excelColHeaderRow}`;
            setStyle(ws3, ref, { font: { bold: true, sz: 8, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });
        }

        // Data rows
        for (let r = 0; r < areaItems.length; r++) {
            const initRow = excelColHeaderRow + 1 + r;
            const isEven = r % 2 === 0;
            const bg = isEven ? GRAY : WHITE;
            const init = areaItems[r];
            for (let c = 0; c < 6; c++) {
                const ref = `${XLSX.utils.encode_col(c)}${initRow}`;
                let style: any = { font: { sz: 9 }, fill: { fgColor: { rgb: bg } }, alignment: { vertical: 'top', wrapText: c === 0 } };
                if (c === 0) style.font = { sz: 9, bold: true };
                if (c === 2) {
                    const sc = statusColor(init.status);
                    style = { font: { sz: 8, bold: true, color: { rgb: WHITE } }, fill: { fgColor: { rgb: sc } }, alignment: { horizontal: 'center', vertical: 'center' } };
                }
                if (c === 3) {
                    const pct = init.progress ?? 0;
                    const pc = pct >= 75 ? '059669' : pct >= 40 ? 'D97706' : 'DC2626';
                    style.font = { sz: 9, bold: true, color: { rgb: pc } };
                    style.alignment = { horizontal: 'center', vertical: 'top' };
                }
                if (ws3[ref]) ws3[ref].s = style;
            }
        }

        // Subtotal row
        const subtotalRow = excelColHeaderRow + areaItems.length + 1;
        setStyle(ws3, `A${subtotalRow}`, { font: { bold: true, sz: 9, color: { rgb: aColor } }, fill: { fgColor: { rgb: LITE } } });
        setStyle(ws3, `D${subtotalRow}`, { font: { bold: true, sz: 9, color: { rgb: aColor } }, fill: { fgColor: { rgb: LITE } }, alignment: { horizontal: 'center' } });

        rowCursor += 1 + 1 + areaItems.length + 1 + 1 + 1; // areaHeader + colHeader + items + subtotal + 2 blanks
    }

    XLSX.utils.book_append_sheet(wb, ws3, 'Por Área');

    // ── Write file ─────────────────────────────────────────────────────────────
    const filterSuffix = hasActiveFilters ? '_filtrado' : '_completo';
    XLSX.writeFile(wb, `Roadmap_${year}${filterSuffix}.xlsx`);
}
