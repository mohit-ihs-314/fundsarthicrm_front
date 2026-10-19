import { X, User, Calendar, FileText, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import Timeline from "./Timeline";

interface LoanDetailDrawerProps {
  loan: any;
  onClose: () => void;
  onStatusChange: (loanId: string, newStatus: string) => void;
}

// ✅ Safe helper
const safe = (val: any, fallback = "") => val ?? fallback;

export default function LoanDetailDrawer({
  loan,
  onClose,
  onStatusChange,
}: LoanDetailDrawerProps) {

  const loanSteps = [
    { stepNumber: 1, title: "Application Submitted", description: "Customer submitted loan application", date: loan.appliedDate },
    { stepNumber: 2, title: "Document Verification", description: "Verifying submitted documents" },
    { stepNumber: 3, title: "Bank Processing", description: "Application under bank review" },
    { stepNumber: 4, title: "Approval", description: "Final approval and disbursement" },
  ];

  const timelineSteps = loanSteps.map((step) => ({
    ...step,
    completed: loan.isRejected
      ? step.stepNumber <= loan.currentStep
      : step.stepNumber < loan.currentStep ||
      (step.stepNumber === loan.currentStep && loan.currentStep === 4),
  }));

  const handleNextStep = () => {
    const nextStep = loan.currentStep + 1;
    if (nextStep <= 4) {
      let newStatus = loan.status;
      let newProgress = loan.progress;

      if (nextStep === 2 || nextStep === 3) {
        newStatus = "in-process";
        newProgress = nextStep === 2 ? 50 : 75;
      } else if (nextStep === 4) {
        newStatus = "approved";
        newProgress = 100;
      }

      onStatusChange(
        loan.id,
        JSON.stringify({
          status: newStatus,
          currentStep: nextStep,
          progress: newProgress,
        })
      );
    }
  };

  const handleReject = () => {
    onStatusChange(
      loan.id,
      JSON.stringify({
        status: "rejected",
        currentStep: loan.currentStep,
        progress: 0,
        isRejected: true,
      })
    );
  };

  const currentStepInfo = loanSteps.find(
    (s) => s.stepNumber === loan.currentStep
  );

  // ✅ FIXED LOGIC
  const isApproved = loan.currentStep === 4 && !loan.isRejected;
  const isRejected = loan.isRejected || loan.status === "rejected";

  const canProceed = !isRejected && !isApproved;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
          <div>
            <h2 className="text-xl font-bold">Loan Application Details</h2>
            <p className="text-sm text-gray-500">{loan.id}</p>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">

          {/* CARD */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-2xl">
            <div className="flex justify-between">
              <div>
                <p className="text-sm">Loan Amount</p>
                <h3 className="text-3xl font-bold">
                  ₹{((loan.loanAmount || 0) / 100000).toFixed(2)}L
                </h3>
              </div>
              <StatusBadge status={loan.status} />
            </div>

            <div className="grid grid-cols-2 mt-4">
              <div>
                <p className="text-sm">Loan Type</p>
                <p>{safe(loan.loanType)}</p>
              </div>
              <div>
                <p className="text-sm">Applied Date</p>
                <p>{safe(loan.appliedDate, "N/A")}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{loan.progress || 0}%</span>
              </div>
              <div className="bg-white/20 h-2 rounded mt-1">
                <div
                  className="bg-white h-2 rounded"
                  style={{ width: `${loan.progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* STEP */}
          <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
            <div className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full">
              {loan.currentStep}
            </div>
            <div>
              <p className="font-semibold">{currentStepInfo?.title}</p>
              <p className="text-sm text-gray-600">{currentStepInfo?.description}</p>
            </div>
          </div>

          {/* USER */}
          <div className="border rounded-2xl p-6">
            <h4 className="font-semibold mb-4 flex gap-2">
              <User className="w-5 h-5 text-blue-600" /> Customer Information
            </h4>

            <div className="space-y-3">
              <p><b>Name:</b> {safe(loan.userName)}</p>
              <p><b>Mobile:</b> {safe(loan.mobile)}</p>
              <p><b>Email:</b> {safe(loan.email)}</p>
              <p><b>City:</b> {safe(loan.city)}</p>
              <p><b>Employment:</b> {safe(loan.employment)}</p>
              <p><b>Income:</b> ₹{(loan.income || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* LOAN DETAILS */}
          <div className="border rounded-2xl p-6">
            <h4 className="font-semibold mb-4 flex gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Loan Details
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <p><b>Purpose:</b> {safe(loan.formData?.purpose || loan.loanType)}</p>

              {loan.formData?.propertyValue && (
                <p>
                  <b>Property Value:</b> ₹{(Number(loan.formData.propertyValue) / 100000).toFixed(2)}L
                </p>
              )}

              {loan.formData?.tenure && (
                <p><b>Tenure:</b> {loan.formData.tenure} years</p>
              )}
            </div>
          </div>

          {/* 🔥 EXTRA FIELDS (AUTO SHOW ALL JSON DATA) */}
          {loan.formData && Object.keys(loan.formData).length > 0 && (
            <div className="border rounded-2xl p-6">
              <h4 className="font-semibold mb-4 flex gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Additional Details
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(loan.formData)
                  .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
                  .map(([key, value]) => (
                    <div key={key}>
                      <p>
                        <b className="capitalize">
                          {key.replace(/([A-Z])/g, " $1")}:
                        </b>{" "}
                        {typeof value === "object"
                          ? Object.entries(value)
                            .filter(([_, v]) => v !== "" && v !== null && v !== undefined)
                            .map(([k, v]) => (
                              <span key={k}>
                                <br />
                                <span className="ml-2">
                                  <b>{k.replace(/([A-Z])/g, " $1")}:</b> {String(v)}
                                </span>
                              </span>
                            ))
                          : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* NOTES */}
          {loan.notes && (
            <div className={`border p-4 rounded-2xl ${isRejected ? "bg-red-50" : "bg-yellow-50"}`}>
              <p className="font-semibold">
                {isRejected ? "Rejection Reason" : "Notes"}
              </p>
              <p>{safe(loan.notes)}</p>
            </div>
          )}

          {/* TIMELINE */}
          <div className="border rounded-2xl p-6">
            <h4 className="font-semibold mb-4 flex gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Timeline
            </h4>
            <Timeline steps={timelineSteps} isRejected={isRejected} currentStep={loan.currentStep} />
          </div>

          {/* ACTION */}
          <div className="flex gap-3">
            {canProceed && loan.currentStep < 4 && (
              <>
                <button onClick={handleNextStep} className="flex-1 bg-blue-600 text-white p-3 rounded-xl flex justify-center gap-2">
                  <ArrowRight className="w-5 h-5" /> Next Step
                </button>
                <button onClick={handleReject} className="flex-1 bg-red-600 text-white p-3 rounded-xl flex justify-center gap-2">
                  <XCircle className="w-5 h-5" /> Reject
                </button>
              </>
            )}

            {isApproved && (
              <div className="flex-1 bg-green-50 p-3 text-center rounded-xl">
                <CheckCircle2 className="inline w-5 h-5" /> Approved
              </div>
            )}

            {isRejected && (
              <div className="flex-1 bg-red-50 p-3 text-center rounded-xl">
                <XCircle className="inline w-5 h-5" /> Rejected
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}