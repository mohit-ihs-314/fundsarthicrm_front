interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  string,
  { color: string; bgColor: string; label: string }
> = {
  new: {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    label: "New",
  },
  "in-process": {
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    label: "In Process",
  },
  approved: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    label: "Approved",
  },
  rejected: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    label: "Rejected",
  },
  pending: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    label: "Pending",
  },
  completed: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    label: "Completed",
  },
  active: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    label: "Active",
  },
  inactive: {
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    label: "Inactive",
  },
  scheduled: {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    label: "Scheduled",
  },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
