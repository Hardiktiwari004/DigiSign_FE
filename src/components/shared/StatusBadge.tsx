import React from "react";
import { DocumentStatus } from "@/types/api";
import { cn } from "@/lib/utils";
import { FileUp, FileClock, CheckCircle } from "lucide-react";

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "UPLOADED":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          icon: <FileUp className="w-3.5 h-3.5 mr-1" />,
          label: "Uploaded",
        };
      case "IN_PROGRESS":
        return {
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
          icon: <FileClock className="w-3.5 h-3.5 mr-1 animate-pulse" />,
          label: "In Progress",
        };
      case "SIGNED":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
          label: "Signed",
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/20 text-slate-500",
          icon: null,
          label: status,
        };
    }
  };

  const config = getStatusStyles();

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
        config.bg,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
export default StatusBadge;
