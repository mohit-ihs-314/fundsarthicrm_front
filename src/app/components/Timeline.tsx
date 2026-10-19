import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

interface TimelineStep {
  title: string;
  description?: string;
  date?: string;
  completed: boolean;
  stepNumber?: number;
}

interface TimelineProps {
  steps: TimelineStep[];
  isRejected?: boolean;
  currentStep?: number;
}

export default function Timeline({ steps, isRejected, currentStep }: TimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCurrentStep = step.stepNumber === currentStep;
        const isPastStep = step.completed;
        const isFutureStep = !isPastStep && !isCurrentStep;
        const isRejectedAtThisStep = isRejected && isCurrentStep;

        return (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  isRejectedAtThisStep
                    ? "bg-red-100 text-red-600 ring-2 ring-red-300"
                    : isPastStep
                    ? "bg-green-100 text-green-600"
                    : isCurrentStep
                    ? "bg-blue-600 text-white ring-2 ring-blue-300"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isRejectedAtThisStep ? (
                  <XCircle className="w-5 h-5" />
                ) : isPastStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrentStep ? (
                  step.stepNumber
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-full min-h-8 transition-all ${
                    isRejectedAtThisStep
                      ? "bg-red-200"
                      : isPastStep
                      ? "bg-green-200"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <h4
                className={`font-medium mb-1 ${
                  isRejectedAtThisStep
                    ? "text-red-700"
                    : isPastStep || isCurrentStep
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {step.title}
                {isCurrentStep && !isRejected && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
                {isRejectedAtThisStep && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    Rejected Here
                  </span>
                )}
              </h4>
              {step.description && (
                <p
                  className={`text-sm ${
                    isRejectedAtThisStep ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {step.description}
                </p>
              )}
              {step.date && (
                <p className="text-xs text-gray-400 mt-1">{step.date}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}