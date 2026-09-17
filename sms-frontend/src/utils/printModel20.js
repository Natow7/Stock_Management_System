export function printModel20(voucher) {
  // Create HTML content
  const html = generateModel20HTML(voucher);
  
  // Open new window
  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  
  if (!printWindow) {
    alert('Please allow popups to print Model 20');
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

function generateModel20HTML(voucher) {
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
  <title>Model 20 - ${voucher.refNo}</title>
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
    }
    
    .form-subtitle {
      font-size: 12pt;
      font-style: italic;
      color: #666;
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
      border-bottom: 1px dotted #333;
      min-height: 20px;
    }
    
    .checkbox-section {
      border: 2px solid #f59e0b;
      background: #fffbeb;
      padding: 15px;
      margin: 20px 0;
    }
    
    .checkbox-row {
      display: flex;
      align-items: center;
      margin: 10px 0;
    }
    
    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #000;
      display: inline-block;
      margin-right: 10px;
      text-align: center;
      line-height: 18px;
      font-size: 16pt;
      font-weight: bold;
    }
    
    .approval-section {
      border: 1px solid #666;
      padding: 15px;
      margin: 15px 0;
      background: #f9f9f9;
    }
    
    .warning {
      background: #fee;
      border: 2px solid #c00;
      padding: 10px;
      margin: 15px 0;
      font-weight: bold;
      text-align: center;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background: #f0f0f0;
      font-weight: bold;
    }
    
    .footer {
      border-top: 2px solid #000;
      margin-top: 30px;
      padding-top: 15px;
      font-size: 9pt;
      text-align: center;
      color: #666;
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
    
    .editable-field {
      background: #fffbeb !important;
    }
    
    .editable-field:focus {
      outline: 2px solid #f59e0b;
      background: #fff !important;
    }
    
    @media print {
      .editable-field {
        background: white !important;
        border-color: #000 !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-buttons no-print">
    <h3 style="margin-bottom: 10px; color: #000;">📝 Model 20 - Editable Preview</h3>
    <p style="margin-bottom: 15px; font-size: 11pt;">
      You can edit the <strong>quantity</strong> and <strong>gate clearance information</strong> below before printing.
    </p>
    <button onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()">✖ Close</button>
  </div>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-placeholder">
        LOGO
      </div>
      <div class="university-name">
        [University Name]
      </div>
      <div class="form-title">
        STORE ISSUE VOUCHER (MODEL 20)
      </div>
      <div class="form-subtitle">
        (Preliminary Voucher)
      </div>
    </div>

    <!-- Meta Information -->
    <div class="meta-row">
      <div><strong>Voucher No:</strong> ${voucher.refNo}</div>
      <div><strong>Date:</strong> ${formatDate(voucher.createdAt)}</div>
    </div>
    <div class="meta-row">
      <div><strong>Status:</strong> ${voucher.status}</div>
      <div><strong>Store:</strong> ${voucher.storeName || '—'}</div>
    </div>

    <!-- Original Requisition Section -->
    <div class="section">
      <div class="section-title">Original Requisition Information</div>
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
      <div class="field-row">
        <div class="field-label">Date Requested:</div>
        <div class="field-value">${voucher.requisitionDate ? formatDate(voucher.requisitionDate) : '—'}</div>
      </div>
    </div>

    <!-- Item Details Section -->
    <div class="section">
      <div class="section-title">Item to be Issued</div>
      <table>
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Unit</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${voucher.itemCode || voucher.itemId || '—'}</td>
            <td>${voucher.itemName || '—'}</td>
            <td>${voucher.itemUnit || 'Piece'}</td>
            <td style="text-align: center; font-weight: bold;">
              <input 
                type="number" 
                value="${voucher.qty}" 
                min="1"
                style="width: 80px; text-align: center; font-size: 14pt; font-weight: bold; border: 2px solid #000; padding: 5px; background: #fffbeb;"
                class="editable-field"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 10pt; font-style: italic; color: #666; margin-top: 5px;">
        ℹ️ Quantity can be edited before printing/saving
      </p>
    </div>

    <!-- Gate Clearance Section -->
    <div class="checkbox-section">
      <div class="section-title" style="background: #f59e0b; color: #000;">
        Gate Clearance (Editable)
      </div>
      
      <div class="checkbox-row" style="cursor: pointer;" onclick="toggleGateClearance()">
        <input 
          type="checkbox" 
          id="gateClearanceCheckbox"
          ${voucher.requiresGateClearance ? 'checked' : ''} 
          style="width: 20px; height: 20px; cursor: pointer; margin-right: 10px;"
          onchange="toggleGateClearanceFields()"
        />
        <label for="gateClearanceCheckbox" style="cursor: pointer; font-weight: bold;">
          Materials will leave campus grounds
        </label>
      </div>
      
      <p style="font-size: 10pt; font-style: italic; margin: 10px 0 15px 30px; color: #666;">
        ℹ️ Check this box if materials are leaving campus (requires Security Officer approval)
      </p>
      
      <div id="gateClearanceFields" style="display: ${voucher.requiresGateClearance ? 'block' : 'none'}; margin-left: 30px; margin-top: 15px;">
        <p style="font-size: 11pt; font-weight: bold; margin-bottom: 10px; color: #c00;">
          ⚠️ Security Officer approval required before final issuance
        </p>
        
        <div class="field-row">
          <div class="field-label">Collector Name:</div>
          <div style="flex: 1;">
            <input 
              type="text" 
              placeholder="Full name of person collecting"
              style="width: 100%; border: none; border-bottom: 1px solid #333; padding: 2px 5px; font-size: 11pt;"
              class="editable-field"
            />
          </div>
        </div>
        <div class="field-row">
          <div class="field-label">ID Number:</div>
          <div style="flex: 1;">
            <input 
              type="text" 
              placeholder="Government or university ID"
              style="width: 100%; border: none; border-bottom: 1px solid #333; padding: 2px 5px; font-size: 11pt;"
              class="editable-field"
            />
          </div>
        </div>
        <div class="field-row">
          <div class="field-label">Phone Number:</div>
          <div style="flex: 1;">
            <input 
              type="tel" 
              placeholder="Contact number"
              style="width: 100%; border: none; border-bottom: 1px solid #333; padding: 2px 5px; font-size: 11pt;"
              class="editable-field"
            />
          </div>
        </div>
        <div class="field-row">
          <div class="field-label">Vehicle Registration:</div>
          <div style="flex: 1;">
            <input 
              type="text" 
              placeholder="License plate number (if applicable)"
              style="width: 100%; border: none; border-bottom: 1px solid #333; padding: 2px 5px; font-size: 11pt;"
              class="editable-field"
            />
          </div>
        </div>
        <div class="field-row">
          <div class="field-label">Scheduled Pickup:</div>
          <div style="flex: 1;">
            <input 
              type="datetime-local" 
              style="width: 100%; border: none; border-bottom: 1px solid #333; padding: 2px 5px; font-size: 11pt;"
              class="editable-field"
            />
          </div>
        </div>
        <div class="field-row">
          <div class="field-label">Destination:</div>
          <div style="flex: 1;">
            <input 
              type="text" 
              placeholder="Where materials are going"
              style="width: 100%; border: none; border-bottom: 1px solid #333; padding: 2px 5px; font-size: 11pt;"
              class="editable-field"
            />
          </div>
        </div>
        <div class="field-row">
          <div class="field-label">Purpose:</div>
          <div style="flex: 1;">
            <textarea 
              placeholder="Reason for taking materials off campus"
              rows="2"
              style="width: 100%; border: 1px solid #333; padding: 5px; font-size: 11pt; resize: vertical;"
              class="editable-field"
            ></textarea>
          </div>
        </div>
      </div>
      
      ${!voucher.requiresGateClearance ? `
        <p id="noClearanceMessage" style="font-size: 10pt; font-style: italic; margin: 10px 0 0 30px;">
          Materials will remain on campus. No gate clearance required.
        </p>
      ` : ''}
    </div>

    <script>
      function toggleGateClearanceFields() {
        const checkbox = document.getElementById('gateClearanceCheckbox');
        const fields = document.getElementById('gateClearanceFields');
        const message = document.getElementById('noClearanceMessage');
        
        if (checkbox.checked) {
          fields.style.display = 'block';
          if (message) message.style.display = 'none';
        } else {
          fields.style.display = 'none';
          if (message) message.style.display = 'block';
        }
      }
      
      function toggleGateClearance() {
        const checkbox = document.getElementById('gateClearanceCheckbox');
        checkbox.checked = !checkbox.checked;
        toggleGateClearanceFields();
      }
    </script>

    <!-- Approvals Section -->
    <div class="section">
      <div class="section-title">Approvals</div>
      
      <!-- Store Head -->
      <div class="approval-section">
        <strong>Prepared By (Store Head):</strong>
        <div class="field-row" style="margin-top: 10px;">
          <div class="field-label">Name:</div>
          <div class="field-value">${voucher.createdByName || '___________________'}</div>
        </div>
        <div class="field-row">
          <div class="field-label">Signature:</div>
          <div class="field-value">___________________</div>
        </div>
        <div class="field-row">
          <div class="field-label">Date:</div>
          <div class="field-value">${formatDate(voucher.createdAt)}</div>
        </div>
      </div>

      <!-- PAO/Department Head -->
      <div class="approval-section">
        <strong>Reviewed & Approved By (Property Administration Officer):</strong>
        <div class="field-row" style="margin-top: 10px;">
          <div class="field-label">Name:</div>
          <div class="field-value">
            ${voucher.approvedByName || '___________________'}
          </div>
        </div>
        <div class="field-row">
          <div class="field-label">Signature:</div>
          <div class="field-value">___________________</div>
        </div>
        <div class="field-row">
          <div class="field-label">Date:</div>
          <div class="field-value">
            ${voucher.approvedAt ? formatDate(voucher.approvedAt) : '___________________'}
          </div>
        </div>
        <div class="checkbox-row" style="margin-top: 10px;">
          <span class="checkbox">${voucher.status === 'Approved' ? '✓' : ''}</span>
          <span>Approved</span>
          <span style="margin-left: 30px;" class="checkbox">${voucher.status === 'Rejected' ? '✓' : ''}</span>
          <span>Rejected</span>
        </div>
        <div class="field-row">
          <div class="field-label">Remarks:</div>
          <div class="field-value">${voucher.approvalRemarks || '___________________'}</div>
        </div>
      </div>

      <!-- Security Officer (if gate clearance required) -->
      ${voucher.requiresGateClearance ? `
        <div class="approval-section">
          <strong>Security Clearance (Materials Leaving Campus):</strong>
          <div class="field-row" style="margin-top: 10px;">
            <div class="field-label">Name:</div>
            <div class="field-value">
              ${voucher.securityOfficerName || '___________________'}
            </div>
          </div>
          <div class="field-row">
            <div class="field-label">Signature:</div>
            <div class="field-value">___________________</div>
          </div>
          <div class="field-row">
            <div class="field-label">Date:</div>
            <div class="field-value">
              ${voucher.gateClearanceApprovedAt ? formatDate(voucher.gateClearanceApprovedAt) : '___________________'}
            </div>
          </div>
          <div class="checkbox-row" style="margin-top: 10px;">
            <span class="checkbox">${voucher.gateClearanceApproved ? '✓' : ''}</span>
            <span>Cleared</span>
            <span style="margin-left: 30px;" class="checkbox"></span>
            <span>Rejected</span>
          </div>
          <div class="field-row">
            <div class="field-label">Remarks:</div>
            <div class="field-value">${voucher.securityRemarks || '___________________'}</div>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Warning -->
    ${voucher.status === 'Preliminary' ? `
      <div class="warning">
        ⚠️ THIS IS A PRELIMINARY VOUCHER (MODEL 20) - NOT AUTHORIZED FOR MATERIAL ISSUANCE
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>This is a preliminary voucher (Model 20) and does not authorize material issuance</p>
      <p>until approved and finalized as Model 22.</p>
      <p style="margin-top: 10px;">Form: STR-F-20 | Rev: 01 | Date: January 2024</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}
