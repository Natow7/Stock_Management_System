/**
 * Generate navigation link from notification module and reference
 * Maps backend notification modules to frontend routes
 */
export function getNotificationLink(notification) {
  if (!notification || !notification.module) return null;

  const { module, referenceId } = notification;

  // Module-to-route mapping
  const moduleRoutes = {
    // Goods Receipt & GRN
    "Goods Receipt": referenceId 
      ? `/goods-receipt?tab=pending&highlight=${referenceId}`
      : `/goods-receipt?tab=pending`,
    
    // Requisitions
    "Requisitions": `/requisitions`,
    
    // Issue Vouchers
    "Issue Vouchers": `/issue-vouchers`,
    
    // Returns
    "Returns": `/returns`,
    
    // Transfers
    "Transfers": `/transfers`,
    
    // Disposal
    "Disposal": `/disposal`,
    
    // Fixed Assets
    "Fixed Assets": `/fixed-assets`,
    
    // Stock Control
    "Stock Control": `/stock-control`,
    
    // Bin Cards
    "Bin Cards": `/bin-cards`,
    
    // Stock Cards
    "Stock Cards": `/stock-cards`,
    
    // Delegation-specific routes
    "GRN Delegation": `/goods-receipt?tab=pending`,
    "GRN Execution": `/clerk/assigned-grn-tasks`,
    "GRN Verification": `/storehead/pending-verifications`,
    
    // Users & System
    "Users": `/users`,
    "System": `/system-settings`,
    "Audit": `/audit-log`,
  };

  return moduleRoutes[module] || "/";
}

/**
 * Get user-friendly module label
 */
export function getModuleLabel(module) {
  const labels = {
    "Goods Receipt": "Goods Receipt",
    "GRN Delegation": "GRN Approval",
    "GRN Execution": "GRN Execution",
    "GRN Verification": "GRN Verification",
    "Requisitions": "Requisition",
    "Issue Vouchers": "Issue Voucher",
    "Returns": "Return",
    "Transfers": "Transfer",
    "Disposal": "Disposal",
    "Fixed Assets": "Fixed Asset",
  };

  return labels[module] || module;
}
