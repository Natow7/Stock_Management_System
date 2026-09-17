export function printModel22(voucher) {
  // Create HTML content
  const html = generateModel22HTML(voucher);
  
  // Open new window
  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  
  if (!printWindow) {
    alert('Please allow popups to print Model 22');
    return;
  }
  
  // Write content
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

function generateModel22HTML(voucher) {
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Model 22 - ${voucher.refNo}</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 0.5in;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding: 20px;
    }
    
    .page {
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      padding: 0.5in;
      border: 3px solid #000;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    
    .logo-placeholder {
      width: 80px;
      height: 80px;
      border: 2px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 10px;
      font-size: 10pt;
      font-weight: bold;
    }
    
    .university-name {
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .form-title {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
      color: #c00;
    }
    
    .form-subtitle {
      font-size: 14pt;
      font-weight: bold;
      color: #000;
    }
    
    .official-stamp {
      border: 3px solid #c00;
      background: #fee;
      padding: 10px;
      text-align: center;
      font-weight: bold;
      color: #c00;
      margin: 10px 0;
    }
    
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 15px 0;
      font-size: 11pt;
    }
    
    .section {
      border: 2px solid #000;
      padding: 15px;
      margin: 20px 0;
      position: relative;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      background: #000;
      color: #fff;
      padding: 5px 10px;
      margin: -15px -15px 15px -15px;
    }
    
    .field-row {
      display: flex;
      margin: 8px 0;
    }
    
    .field-label {
      font-weight: bold;
      width: 200px;
      flex-shrink: 0;
    }
    
    .field-value {
      flex: 1;
      border-bottom: 1px solid #000;
      min-height: 20px;
    }
    
    .approval-section {
      border: 2px solid #000;
      padding: 15px;
      margin: 15px 0;
      background: #f9f9f9;
    }
    
    .signature-stamp {
      border: 2px solid #000;
      padding: 30px;
      text-align: center;
      background: #fff;
      margin: 10px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    th, td {
      border: 2px solid #000;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background: #e0e0e0;
      font-weight: bold;
    }
    
    .footer {
      border-top: 3px solid #000;
      margin-top: 30px;
      padding-top: 15px;
      font-size: 9pt;
      text-align: center;
      color: #000;
      font-weight: bold;
    }
    
    .print-buttons {
      text-align: center;
      margin: 20px 0;
      padding: 20px;
      background: #f0f0f0;
      border: 2px solid #ccc;
    }
    
    .print-buttons button {
      padding: 10px 20px;
      font-size: 14pt;
      margin: 0 10px;
      cursor: pointer;
      border: 2px solid #000;
      background: #fff;
    }
    
    .print-buttons button:hover {
      background: #eee;
    }
    
    .issued-stamp {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      border: 5px solid #c00;
      color: #c00;
      padding: 20px 40px;
      font-size: 36pt;
      font-weight: bold;
      opacity: 0.3;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="print-buttons no-print">
    <button onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()">✖ Close</button>
  </div>

  <div class="page">
    <div class="issued-stamp">ISSUED</div>
    
    <!-- Header -->
    <div class="header">
      <div class="logo-placeholder">
        LOGO
      </div>
      <div class="university-name">
        [University Name]
      </div>
      <div class="form-title">
        STORE ISSUE VOUCHER (MODEL 22)
      </div>
      <div class="form-subtitle">
        (Official Issue - Final)
      </div>
    </div>

    <!-- Official Stamp -->
    <div class="official-stamp">
      ✓ OFFICIAL DOCUMENT - MATERIALS ISSUED AND STOCK DEDUCTED
    </div>

    <!-- Meta Information -->
    <div class="meta-row">
      <div><strong>Voucher No:</strong> ${voucher.refNo}</div>
      <div><strong>Issue Date:</strong> ${formatDate(voucher.issuedAt || voucher.updatedAt)}</div>
    </div>
    <div class="meta-row">
      <div><strong>Original Model 20:</strong> ${voucher.refNo}</div>
      <div><strong>Store:</strong> ${voucher.storeName || '—'}</div>
    </div>

    <!-- Original Requisition Section -->
    <div class="section">
      <div class="section-title">Requisition Information</div>
      <div class="field-row">
        <div class="field-label">Requisition Ref:</div>
        <div class="field-value">${voucher.requisitionRef || '—'}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Department:</div>
        <div class="field-value">${voucher.requisitionDepartment || '—'}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Requested By:</div>
        <div class="field-value">
          ${voucher.requestedByName || '—'} 
          ${voucher.requestedByEmail ? `(${voucher.requestedByEmail})` : ''}
        </div>
      </div>
    </div>

    <!-- Item Details Section -->
    <div class="section">
      <div class="section-title">Item Issued</div>
      <table>
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Unit</th>
            <th>Quantity Issued</th>
            <th>Stock Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${voucher.itemCode || voucher.itemId || '—'}</td>
            <td>${voucher.itemName || '—'}</td>
            <td>${voucher.itemUnit || 'Piece'}</td>
            <td style="text-align: center; font-weight: bold; font-size: 14pt;">${voucher.qty}</td>
            <td style="text-align: center;">${voucher.stockBalance || '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Gate Clearance Status (if applicable) -->
    ${voucher.requiresGateClearance ? `
      <div class="section" style="border-color: #f59e0b;">
        <div class="section-title" style="background: #f59e0b; color: #000;">
          Gate Clearance Status
        </div>
        <div class="field-row">
          <div class="field-label">Materials Left Campus:</div>
          <div class="field-value">YES</div>
        </div>
        <div class="field-row">
          <div class="field-label">Security Clearance:</div>
          <div class="field-value">${voucher.gateClearanceApproved ? '✓ APPROVED' : 'PENDING'}</div>
        </div>
        ${voucher.gateClearanceApprovedAt ? `
          <div class="field-row">
            <div class="field-label">Cleared By:</div>
            <div class="field-value">${voucher.securityOfficerName || '—'}</div>
          </div>
          <div class="field-row">
            <div class="field-label">Clearance Date:</div>
            <div class="field-value">${formatDate(voucher.gateClearanceApprovedAt)}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Approval Chain -->
    <div class="section">
      <div class="section-title">Authorization Chain</div>
      
      <!-- Store Head -->
      <div class="approval-section">
        <strong>1. Prepared By (Store Head):</strong>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          <div style="flex: 1;">
            <div><strong>Name:</strong> ${voucher.createdByName || '—'}</div>
            <div><strong>Date:</strong> ${formatDate(voucher.createdAt)}</div>
          </div>
          <div class="signature-stamp" style="width: 200px; height: 80px; padding: 10px;">
            <div style="font-size: 10pt;">Signature & Stamp</div>
          </div>
        </div>
      </div>

      <!-- PAO -->
      <div class="approval-section">
        <strong>2. Approved By (Property Administration Officer):</strong>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          <div style="flex: 1;">
            <div><strong>Name:</strong> ${voucher.approvedByName || '—'}</div>
            <div><strong>Date:</strong> ${voucher.approvedAt ? formatDate(voucher.approvedAt) : '—'}</div>
            <div><strong>Status:</strong> ✓ APPROVED</div>
          </div>
          <div class="signature-stamp" style="width: 200px; height: 80px; padding: 10px;">
            <div style="font-size: 10pt;">Signature & Stamp</div>
          </div>
        </div>
      </div>

      <!-- Security (if applicable) -->
      ${voucher.requiresGateClearance && voucher.gateClearanceApproved ? `
        <div class="approval-section">
          <strong>3. Security Clearance (Gate Approval):</strong>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <div style="flex: 1;">
              <div><strong>Name:</strong> ${voucher.securityOfficerName || '—'}</div>
              <div><strong>Date:</strong> ${formatDate(voucher.gateClearanceApprovedAt)}</div>
              <div><strong>Status:</strong> ✓ CLEARED</div>
            </div>
            <div class="signature-stamp" style="width: 200px; height: 80px; padding: 10px;">
              <div style="font-size: 10pt;">Signature & Stamp</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Store Head Final Issue -->
      <div class="approval-section" style="border: 3px solid #c00;">
        <strong>4. Issued By (Store Head - Final):</strong>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          <div style="flex: 1;">
            <div><strong>Name:</strong> ${voucher.issuedByName || voucher.createdByName || '—'}</div>
            <div><strong>Date:</strong> ${formatDate(voucher.issuedAt || voucher.updatedAt)}</div>
            <div style="color: #c00; font-weight: bold;">✓ MATERIALS ISSUED - STOCK DEDUCTED</div>
          </div>
          <div class="signature-stamp" style="width: 200px; height: 80px; padding: 10px; border-color: #c00;">
            <div style="font-size: 10pt; color: #c00; font-weight: bold;">Official Stamp</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Receiver Acknowledgment -->
    <div class="section" style="border: 3px solid #000;">
      <div class="section-title">Receiver Acknowledgment</div>
      <p style="margin-bottom: 15px;">
        I hereby acknowledge receipt of the materials listed above in good condition.
      </p>
      <div class="field-row">
        <div class="field-label">Receiver Name:</div>
        <div class="field-value">_________________________</div>
      </div>
      <div class="field-row">
        <div class="field-label">Signature:</div>
        <div class="field-value">_________________________</div>
      </div>
      <div class="field-row">
        <div class="field-label">Date Received:</div>
        <div class="field-value">_________________________</div>
      </div>
      <div class="field-row">
        <div class="field-label">ID Number:</div>
        <div class="field-value">_________________________</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>THIS IS AN OFFICIAL DOCUMENT (MODEL 22)</p>
      <p>MATERIALS HAVE BEEN ISSUED AND STOCK HAS BEEN DEDUCTED</p>
      <p style="margin-top: 10px;">Form: STR-F-22 | Rev: 01 | Date: January 2024</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p style="margin-top: 5px;">Voucher No: ${voucher.refNo}</p>
    </div>
  </div>
</body>
</html>
  `;
}
