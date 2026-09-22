import React from 'react';
import { RichTextEditor } from '../common/RichTextEditor';

interface ValueData {
    business_value: string;
    operational_efficiency: string;
    fte_detail: string;
    qualitative_benefit: string;
    users_reached_detail: string;
    estimated_savings_detail: string;
}

interface PillarConfig {
    key: keyof ValueData;
    label: string;
    icon: any;
    gradient: string;
    borderColor: string;
    iconBg: string;
    iconColor: string;
    accentRing: string;
    placeholder: string;
}

interface InitiativePillarsEditorProps {
    valueData: ValueData;
    onChangeValue: React.Dispatch<React.SetStateAction<ValueData>>;
    canEdit: boolean;
    pillars: PillarConfig[];
}

export const InitiativePillarsEditor: React.FC<InitiativePillarsEditorProps> = ({
    valueData,
    onChangeValue,
    canEdit,
    pillars
}) => {
    return (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-0 tour-iv-pillars">
            {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                    <div
                        key={pillar.key}
                        className={`bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 
                            flex flex-col overflow-hidden transition-all hover:shadow-md ring-1 ${pillar.accentRing}
                            min-h-[280px] max-h-[400px]`}
                    >
                        {/* Pillar Header */}
                        <div className={`px-4 py-3 bg-gradient-to-r ${pillar.gradient} border-b ${pillar.borderColor} flex items-center gap-2 flex-shrink-0`}>
                            <div className={`p-1.5 ${pillar.iconBg} rounded-lg ${pillar.iconColor}`}>
                                <Icon size={18} />
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
                                {pillar.label}
                            </h3>
                        </div>

                        {/* Pillar Editor */}
                        <div className="flex-1 p-0 flex flex-col min-h-0 overflow-hidden">
                            <RichTextEditor
                                value={valueData[pillar.key]}
                                onChange={(val) =>
                                    onChangeValue(prev => ({ ...prev, [pillar.key]: val }))
                                }
                                readOnly={!canEdit}
                                placeholder={
                                    canEdit
                                        ? pillar.placeholder
                                        : 'Sin información disponible'
                                }
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
