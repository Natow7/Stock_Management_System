import React from 'react';

export default function Model20PrintView({ voucher }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <html>
      <head>
        <title>Model 20 - {voucher.refNo}</title>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0.5in;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
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
          
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 10px;
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
            border: 2px solid #000;
            padding: 15px;
            margin: 15px 0;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            width: 200px;
            display: inline-block;
            min-height: 20px;
          }
          
          .footer {
            border-top: 2px solid #000;
            margin-top: 30px;
            padding-top: 15px;
            font-size: 9pt;
            text-align: center;
            color: #666;
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
        `}</style>
      </head>
      <body>
        <div className="page">
          {/* Header */}
          <div className="header">
            <div className="logo">
              {/* Placeholder for university logo */}
              <div style={{
                width: '80px',
                height: '80px',
                border: '2px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '10pt'
              }}>
                LOGO
              </div>
            </div>
            <div className="university-name">
              [University Name]
            </div>
            <div className="form-title">
              STORE ISSUE VOUCHER (MODEL 20)
            </div>
            <div className="form-subtitle">
              (Preliminary Voucher)
            </div>
          </div>

          {/* Meta Information */}
          <div className="meta-row">
            <div><strong>Voucher No:</strong> {voucher.refNo}</div>
            <div><strong>Date:</strong> {formatDate(voucher.createdAt)}</div>
          </div>
          <div className="meta-row">
            <div><strong>Status:</strong> {voucher.status}</div>
            <div><strong>Store:</strong> {voucher.storeName}</div>
          </div>

          {/* Original Requisition Section */}
          <div className="section">
            <div className="section-title">Original Requisition Information</div>
            <div className="field-row">
              <div className="field-label">Requisition Ref:</div>
              <div className="field-value">{voucher.requisitionRef || '—'}</div>
            </div>
            <div className="field-row">
              <div className="field-label">Department:</div>
              <div className="field-value">{voucher.requisitionDepartment || '—'}</div>
            </div>
            <div className="field-row">
              <div className="field-label">Requested By:</div>
              <div className="field-value">
                {voucher.requestedByName || '—'} 
                {voucher.requestedByEmail && ` (${voucher.requestedByEmail})`}
              </div>
            </div>
            <div className="field-row">
              <div className="field-label">Date Requested:</div>
              <div className="field-value">{voucher.requisitionDate ? formatDate(voucher.requisitionDate) : '—'}</div>
            </div>
          </div>

          {/* Item Details Section */}
          <div className="section">
            <div className="section-title">Item to be Issued</div>
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
                  <td>{voucher.itemCode || voucher.itemId}</td>
                  <td>{voucher.itemName}</td>
                  <td>{voucher.itemUnit || 'Piece'}</td>
                  <td style={{textAlign: 'center', fontWeight: 'bold'}}>{voucher.qty}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Gate Clearance Section */}
          <div className="checkbox-section">
            <div className="section-title" style={{background: '#f59e0b', color: '#000'}}>
              Gate Clearance
            </div>
            <div className="checkbox-row">
              <span className="checkbox">{voucher.requiresGateClearance ? '✓' : ''}</span>
              <strong>Materials will leave campus grounds</strong>
            </div>
            
            {voucher.requiresGateClearance && (
              <>
                <p style={{fontSize: '10pt', fontStyle: 'italic', margin: '10px 0 15px 30px'}}>
                  Security Officer approval required before final issuance
                </p>
                
                <div style={{marginLeft: '30px'}}>
                  <div className="field-row">
                    <div className="field-label">Collector Name:</div>
                    <div className="field-value">_________________________</div>
                  </div>
                  <div className="field-row">
                    <div className="field-label">ID Number:</div>
                    <div className="field-value">_________________________</div>
                  </div>
                  <div className="field-row">
                    <div className="field-label">Phone Number:</div>
                    <div className="field-value">_________________________</div>
                  </div>
                  <div className="field-row">
                    <div className="field-label">Vehicle Registration:</div>
                    <div className="field-value">_________________________</div>
                  </div>
                  <div className="field-row">
                    <div className="field-label">Scheduled Pickup:</div>
                    <div className="field-value">_________________________</div>
                  </div>
                </div>
              </>
            )}
            
            {!voucher.requiresGateClearance && (
              <p style={{fontSize: '10pt', fontStyle: 'italic', margin: '10px 0 0 30px'}}>
                Materials will remain on campus. No gate clearance required.
              </p>
            )}
          </div>

          {/* Approvals Section */}
          <div className="section">
            <div className="section-title">Approvals</div>
            
            {/* Store Head */}
            <div className="approval-section">
              <strong>Prepared By (Store Head):</strong>
              <div className="field-row" style={{marginTop: '10px'}}>
                <div className="field-label">Name:</div>
                <div className="field-value">{voucher.createdByName || '___________________'}</div>
              </div>
              <div className="field-row">
                <div className="field-label">Signature:</div>
                <div className="field-value">___________________</div>
              </div>
              <div className="field-row">
                <div className="field-label">Date:</div>
                <div className="field-value">{formatDate(voucher.createdAt)}</div>
              </div>
            </div>

            {/* PAO/Department Head */}
            <div className="approval-section">
              <strong>Reviewed & Approved By (Property Administration Officer):</strong>
              <div className="field-row" style={{marginTop: '10px'}}>
                <div className="field-label">Name:</div>
                <div className="field-value">
                  {voucher.approvedByName || '___________________'}
                </div>
              </div>
              <div className="field-row">
                <div className="field-label">Signature:</div>
                <div className="field-value">___________________</div>
              </div>
              <div className="field-row">
                <div className="field-label">Date:</div>
                <div className="field-value">
                  {voucher.approvedAt ? formatDate(voucher.approvedAt) : '___________________'}
                </div>
              </div>
              <div className="checkbox-row" style={{marginTop: '10px'}}>
                <span className="checkbox">{voucher.status === 'Approved' ? '✓' : ''}</span>
                <span>Approved</span>
                <span style={{marginLeft: '30px'}} className="checkbox"></span>
                <span>Rejected</span>
              </div>
              <div className="field-row">
                <div className="field-label">Remarks:</div>
                <div className="field-value">{voucher.approvalRemarks || '___________________'}</div>
              </div>
            </div>

            {/* Security Officer (if gate clearance required) */}
            {voucher.requiresGateClearance && (
              <div className="approval-section">
                <strong>Security Clearance (Materials Leaving Campus):</strong>
                <div className="field-row" style={{marginTop: '10px'}}>
                  <div className="field-label">Name:</div>
                  <div className="field-value">
                    {voucher.securityOfficerName || '___________________'}
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-label">Signature:</div>
                  <div className="field-value">___________________</div>
                </div>
                <div className="field-row">
                  <div className="field-label">Date:</div>
                  <div className="field-value">
                    {voucher.gateClearanceApprovedAt ? formatDate(voucher.gateClearanceApprovedAt) : '___________________'}
                  </div>
                </div>
                <div className="checkbox-row" style={{marginTop: '10px'}}>
                  <span className="checkbox">{voucher.gateClearanceApproved ? '✓' : ''}</span>
                  <span>Cleared</span>
                  <span style={{marginLeft: '30px'}} className="checkbox"></span>
                  <span>Rejected</span>
                </div>
                <div className="field-row">
                  <div className="field-label">Remarks:</div>
                  <div className="field-value">{voucher.securityRemarks || '___________________'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Warning */}
          {voucher.status === 'Preliminary' && (
            <div className="warning">
              ⚠️ THIS IS A PRELIMINARY VOUCHER (MODEL 20) - NOT AUTHORIZED FOR MATERIAL ISSUANCE
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <p>This is a preliminary voucher (Model 20) and does not authorize material issuance</p>
            <p>until approved and finalized as Model 22.</p>
            <p style={{marginTop: '10px'}}>Form: STR-F-20 | Rev: 01 | Date: January 2024</p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  );
}
