import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface MultiSelectProps {
    label: string;
    icon?: React.ReactNode;
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
}

export const MultiSelectDropdown = ({
    label,
    icon,
    options,
    selectedValues,
    onChange,
    placeholder = "Todos"
}: MultiSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        const newValues = selectedValues.includes(option)
            ? selectedValues.filter(v => v !== option)
            : [...selectedValues, option];
        onChange(newValues);
    };

    const isAllSelected = selectedValues.length === 0;

    const handleAllClick = () => {
        onChange([]);
        setIsOpen(false);
    };

    const displayValue = isAllSelected
        ? placeholder
        : selectedValues.length === 1
            ? selectedValues[0]
            : `${selectedValues.length} seleccionados`;

    return (
        <div className="space-y-1 relative" ref={dropdownRef}>
            <label className="text-xs font-medium text-[var(--text-tertiary)]">{label}</label>
            <div
                className={clsx(
                    "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-md py-2 flex items-center justify-between cursor-pointer focus:ring-1 focus:ring-[#E10600]",
                    icon ? "pl-9 pr-3" : "px-3"
                )}
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0}
            >
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] flex items-center pointer-events-none mt-2.5">
                        {icon}
                    </div>
                )}
                <span className="truncate flex-1 text-left mr-2">{displayValue}</span>
                <ChevronDown size={14} className={clsx("text-[var(--text-tertiary)] transition-transform", isOpen ? "rotate-180" : "")} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div
                        className="px-3 py-2 flex items-center cursor-pointer hover:bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)] border-b border-[var(--border-color)]"
                        onClick={handleAllClick}
                    >
                        <div className={clsx(
                            "w-4 h-4 rounded border mr-2 flex items-center justify-center transition-colors",
                            isAllSelected ? "bg-[#E10600] border-[#E10600]" : "border-[var(--border-color)] bg-transparent"
                        )}>
                            {isAllSelected && <Check size={12} className="text-white" />}
                        </div>
                        {placeholder}
                    </div>

                    {options.map(option => {
                        const isSelected = selectedValues.includes(option);
                        return (
                            <div
                                key={option}
                                className="px-3 py-2 flex items-start cursor-pointer hover:bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)]"
                                onClick={() => toggleOption(option)}
                            >
                                <div className={clsx(
                                    "w-4 h-4 rounded border mr-2 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5",
                                    isSelected ? "bg-[#E10600] border-[#E10600]" : "border-[var(--border-color)] bg-transparent"
                                )}>
                                    {isSelected && <Check size={12} className="text-white" />}
                                </div>
                                <span className="break-words flex-1 text-left leading-tight py-0.5">{option}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
