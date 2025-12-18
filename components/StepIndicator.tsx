import React from 'react';
import { Step } from '../types';
import { Activity, Filter, ShieldAlert, FileCheck } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps = [
  { id: Step.Crawl, label: 'Thu Domain', icon: Activity },
  { id: Step.Filter, label: 'Lọc Chỉ Số', icon: Filter },
  { id: Step.PenaltyCheck, label: 'Check Penalty', icon: ShieldAlert },
  { id: Step.Output, label: 'Xuất Kết Quả', icon: FileCheck },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="w-full py-6 px-4">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 -z-10" />
        <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 -z-10" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center group">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-900 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : isCompleted
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                <Icon size={20} />
              </div>
              <span
                className={`mt-2 text-xs font-medium tracking-wider uppercase transition-colors ${
                  isActive || isCompleted ? 'text-blue-400' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
