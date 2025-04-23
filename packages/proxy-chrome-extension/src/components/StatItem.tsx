import React, { ReactNode } from "react";

interface StatItemProps {
  /** Optional icon displayed inside the circle */
  icon?: ReactNode;
  /** Label for the statistic */
  label: string;
  /** Value or content for the statistic; if omitted, displays “—” */
  value?: ReactNode;
}

export function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="font-medium">{value ?? "—"}</div>
      </div>
    </div>
  );
}
