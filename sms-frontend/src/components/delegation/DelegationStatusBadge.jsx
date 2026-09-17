import React from "react";
import Badge from "../ui/Badge.jsx";

const statusConfig = {
  "Awaiting Evaluation": {
    variant: "warning",
    icon: "⏳",
  },
  "Awaiting PRO Approval": {
    variant: "warning",
    icon: "📋",
  },
  "PRO Approved": {
    variant: "info",
    icon: "✓",
  },
  "Awaiting Store Head Verification": {
    variant: "info",
    icon: "🔍",
  },
  Verified: {
    variant: "success",
    icon: "✅",
  },
  Rejected: {
    variant: "error",
    icon: "❌",
  },
  Approved: {
    variant: "success",
    icon: "✓",
  },
};

export default function DelegationStatusBadge({ status }) {
  const config = statusConfig[status] || {
    variant: "default",
    icon: "•",
  };

  return (
    <Badge variant={config.variant}>
      <span className="mr-1">{config.icon}</span>
      {status}
    </Badge>
  );
}
