
// Calendar Schema Definition
export const CALENDAR_SCHEMA = [
    {
        name: 'Q1',
        months: [
            { name: 'Ene', weeks: [1, 2, 3, 4, 5] },
            { name: 'Feb', weeks: [6, 7, 8, 9] },
            { name: 'Mar', weeks: [10, 11, 12, 13] }
        ]
    },
    {
        name: 'Q2',
        months: [
            { name: 'Abr', weeks: [14, 15, 16, 17] },
            { name: 'May', weeks: [18, 19, 20, 21, 22] },
            { name: 'Jun', weeks: [23, 24, 25, 26] }
        ]
    },
    {
        name: 'Q3',
        months: [
            { name: 'Jul', weeks: [27, 28, 29, 30] },
            { name: 'Ago', weeks: [31, 32, 33, 34, 35] },
            { name: 'Sep', weeks: [36, 37, 38, 39] }
        ]
    },
    {
        name: 'Q4',
        months: [
            { name: 'Oct', weeks: [40, 41, 42, 43, 44] },
            { name: 'Nov', weeks: [45, 46, 47, 48] },
            { name: 'Dic', weeks: [49, 50, 51, 52] }
        ]
    }
];

export const flatWeeks = CALENDAR_SCHEMA.flatMap(q => q.months.flatMap(m => m.weeks));

export const getCurrentWeekNumber = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export const getMonthFromWeek = (week: number) => {
    for (const q of CALENDAR_SCHEMA) {
        for (const m of q.months) {
            if (m.weeks.includes(week)) {
                return { quarter: q.name, month: m.name };
            }
        }
    }
    return null;
};
