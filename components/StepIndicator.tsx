import React from 'react';
import { Step } from '../types';
import { Activity, Filter, ShieldAlert, FileCheck } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: Step;
  onStepSelect?: (step: Step) => void;
}

const steps = [
  { id: Step.Crawl, label: 'Thu Domain', icon: Activity },
  { id: Step.Filter, label: 'Lọc Chỉ Số', icon: Filter },
  { id: Step.PenaltyCheck, label: 'Check Penalty', icon: ShieldAlert },
  { id: Step.Output, label: 'Xuất Kết Quả', icon: FileCheck },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepSelect }) => {
  return (
    <div className="w-full py-3 sm:py-5 px-2 sm:px-4">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 -z-10" />
        <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500 -z-10" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <button 
              key={step.id} 
              onClick={() => onStepSelect && onStepSelect(step.id)}
              disabled={!onStepSelect}
              className="flex flex-col items-center group cursor-pointer focus:outline-none disabled:cursor-default"
            >
              <div
                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 sm:border-4 transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-900 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110'
                    : isCompleted
                    ? 'bg-blue-600 border-blue-600 text-white hover:scale-105'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={`mt-1.5 sm:mt-2 text-[9px] sm:text-xs font-bold tracking-wider uppercase transition-colors text-center ${
                  isActive ? 'text-blue-400 font-extrabold' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
