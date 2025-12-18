import React from 'react';

interface FilterControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  colorClass?: string;
  description?: string;
}

export const FilterControl: React.FC<FilterControlProps> = ({
  label,
  value,
  min,
  max,
  onChange,
  colorClass = 'bg-blue-500',
  description
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <div>
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">{label}</label>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <span className={`text-lg font-mono font-bold ${colorClass.replace('bg-', 'text-')}`}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between mt-1 text-xs text-slate-600 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
