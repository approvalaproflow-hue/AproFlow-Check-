import { jsPDF } from "jspdf";
import { RequestForm } from "../types";
import { PDFDocument } from "pdf-lib";
import { customFetch } from "../utils/customFetch";

const fetch = customFetch;

export const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = dataUrl;
  });
};

export async function finalizeAndSavePDF(
  doc: jsPDF,
  r: RequestForm,
  fileName: string,
  extraPdfDocs?: jsPDF[],
  extraAttachments?: string[],
  apiHeaders?: any
) {
  try {
    const attachments = r.attachments || [];
    const allAttachments = [
      ...attachments,
      ...(extraAttachments || [])
    ];

    // Identify and include embedded supporting voucher and travel document proof contents
    if (r.cashVoucherDetails?.billFileContent && r.cashVoucherDetails.billFileContent.startsWith("data:")) {
      const cvProofName = r.cashVoucherDetails.billFileName || "cash_voucher_proof.jpg";
      const attachmentStr = `${cvProofName}|${r.cashVoucherDetails.billFileContent}`;
      if (!allAttachments.includes(attachmentStr)) {
        allAttachments.push(attachmentStr);
      }
    }
    if (r.travelExpensesDetails?.billFileContent && r.travelExpensesDetails.billFileContent.startsWith("data:")) {
      const teProofName = r.travelExpensesDetails.billFileName || "travel_expenses_proof.jpg";
      const attachmentStr = `${teProofName}|${r.travelExpensesDetails.billFileContent}`;
      if (!allAttachments.includes(attachmentStr)) {
        allAttachments.push(attachmentStr);
      }
    }

    // De-duplicate attachments to avoid repeating the same uploads
    const uniqueAttachments = Array.from(new Set(allAttachments));
    const validAttachments = uniqueAttachments.filter(att => att && att.includes('|'));

    if (validAttachments.length === 0 && (!extraPdfDocs || extraPdfDocs.length === 0)) {
      doc.save(fileName);
      return;
    }

    // Export the primary doc compiled by jsPDF to ArrayBuffer
    const mainPdfBytes = doc.output("arraybuffer");
    
    // Instantiate a new combined PDF documents container
    const mergedPdf = await PDFDocument.create();
    
    // Load and copy pages of the primary document onto the container
    const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
    const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
    mainPages.forEach((page) => mergedPdf.addPage(page));

    // Append each extra PDF document page-by-page (e.g. connected original request layout)
    if (extraPdfDocs && extraPdfDocs.length > 0) {
      for (const extraDoc of extraPdfDocs) {
        try {
          const extraBytes = extraDoc.output("arraybuffer");
          const extraPdfDoc = await PDFDocument.load(extraBytes);
          const extraPages = await mergedPdf.copyPages(extraPdfDoc, extraPdfDoc.getPageIndices());
          extraPages.forEach((page) => mergedPdf.addPage(page));
        } catch (extraErr) {
          console.error("Error fusing extra PDF document:", extraErr);
        }
      }
    }

    // Append each supporting file page-by-page in chronological upload order
    for (const attachment of validAttachments) {
      const parts = attachment.split('|');
      const name = parts[0];
      const dataUrl = parts[1];

      if (!dataUrl) continue;

      if (dataUrl.startsWith("data:application/pdf;base64,")) {
        try {
          const base64Str = dataUrl.split(',')[1];
          const binaryString = atob(base64Str);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const attPdfDoc = await PDFDocument.load(bytes);
          const attPages = await mergedPdf.copyPages(attPdfDoc, attPdfDoc.getPageIndices());
          attPages.forEach((p) => mergedPdf.addPage(p));
        } catch (pdfErr) {
          console.error("Error fusing PDF attachment:", name, pdfErr);
        }
      } else if (dataUrl.startsWith("data:image/") || /\.(jpe?g|png|gif|webp|bmp|tiff|heic)$/i.test(name)) {
        try {
          let format = "JPEG";
          if (dataUrl.includes("image/png")) format = "PNG";
          else if (dataUrl.includes("image/webp")) format = "WEBP";
          else if (dataUrl.includes("image/gif")) format = "GIF";

          // Dynamically scale image A4 portrait canvas
          const imgDoc = new jsPDF("p", "mm", "a4");
          const dims = await getImageDimensions(dataUrl);
          
          if (dims.width > 0 && dims.height > 0) {
            const maxW = 190;
            const maxH = 277;
            const ratio = Math.min(maxW / dims.width, maxH / dims.height);
            const renderW = dims.width * ratio;
            const renderH = dims.height * ratio;
            const renderX = 10 + (maxW - renderW) / 2;
            const renderY = 10 + (maxH - renderH) / 2;
            imgDoc.addImage(dataUrl, format, renderX, renderY, renderW, renderH);
          } else {
            imgDoc.addImage(dataUrl, format, 10, 10, 190, 277);
          }

          const imgPageBytes = imgDoc.output("arraybuffer");
          const imgPdfDoc = await PDFDocument.load(imgPageBytes);
          const imgPages = await mergedPdf.copyPages(imgPdfDoc, [0]);
          mergedPdf.addPage(imgPages[0]);
        } catch (imgErr) {
          console.error("Error fusing Image attachment:", name, imgErr);
        }
      }
    }

    // Serialize merged document to bytes
    const finalPdfBytes = await mergedPdf.save();
    
    // Dispatch in-browser save
    const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    // Auto-save generated PDF to Cloud
    if (apiHeaders) {
      try {
        let binary = "";
        const len = finalPdfBytes.byteLength;
        const finalUint = new Uint8Array(finalPdfBytes);
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(finalUint[i]);
        }
        const base64Str = btoa(binary);
        const dataUrl = "data:application/pdf;base64," + base64Str;

        await fetch("/api/saved-pdfs", {
          method: "POST",
          headers: {
            ...apiHeaders,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requestId: r.id,
            fileName,
            category: r.category || "Generated PDF",
            fileContent: dataUrl
          })
        });
      } catch (postPdfErr) {
        console.error("PDF upload during generation failed:", postPdfErr);
      }
    }
  } catch (err) {
    console.error("Primary merging execution failed, defaulting to pure template layout download:", err);
    doc.save(fileName);

    // Upload fallback single-page PDF to ensure persistence
    if (apiHeaders) {
      try {
        const fallbackBytes = doc.output("arraybuffer");
        let binary = "";
        const len = fallbackBytes.byteLength;
        const finalUint = new Uint8Array(fallbackBytes);
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(finalUint[i]);
        }
        const base64Str = btoa(binary);
        const dataUrl = "data:application/pdf;base64," + base64Str;

        await fetch("/api/saved-pdfs", {
          method: "POST",
          headers: {
            ...apiHeaders,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requestId: r.id,
            fileName,
            category: r.category || "Generated PDF",
            fileContent: dataUrl
          })
        });
      } catch (fallbackPostVal) {
        console.error("Fallback PDF upload failed:", fallbackPostVal);
      }
    }
  }
}

export async function generateRequestPDF(incomingRequest: RequestForm) {
  let request = { ...incomingRequest };
  if (request.status === "Partially Approved" && request.approvedAmount !== undefined) {
    if (request.totals) {
      request.totals = {
        ...request.totals,
        grandTotal: request.approvedAmount
      };
    }
  }
  // Create a new PDF instance (Standard A4 portrait size)
  const doc = new jsPDF("p", "mm", "a4");

  // Margin configuration
  let currentY = 15;
  const marginX = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper: horizontal line separator
  const drawLine = (y: number, color = 220) => {
    doc.setDrawColor(color, color, color);
    doc.setLineWidth(0.4);
    doc.line(marginX, y, pageWidth - marginX, y);
  };

  // 1. Corporate Header
  doc.setFillColor(30, 41, 59); // deep corporate blue-grey
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 22, "F");

  const entName = (request.enterpriseName || "PROFLOW ENTERPRISE").toUpperCase();
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(`APROFLOW APPROVALS - ${entName}`, marginX + 6, currentY + 9);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Digitized Corporate Travel Itinerary & Expense Claim Form", marginX + 6, currentY + 15);

  // Status Badge in Header
  const statusColors: { [key: string]: [number, number, number] } = {
    Approved: [22, 163, 74], // green
    "Partially Approved": [217, 119, 6], // orange/amber
    Rejected: [220, 38, 38], // red
    "Revision Requested": [217, 119, 6], // orange
    Pending: [37, 99, 235], // blue
    Draft: [107, 114, 128], // grey
    Submitted: [79, 70, 229]
  };
  const badgeColor = statusColors[request.status] || [79, 70, 229];
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.rect(pageWidth - marginX - 45, currentY + 5, 40, 11, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(request.status.toUpperCase(), pageWidth - marginX - 25, currentY + 12, { align: "center" });

  currentY += 28;

  // 2. Report metadata header
  doc.setTextColor(50, 50, 50);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  const docSerialCode = request.documentNumber || request.id || "N/A";
  doc.text(`SERIAL NO: ${docSerialCode}`, marginX, currentY);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Type: ${request.category || "General Claim"} | Enterprise Code: ${request.enterpriseCode || "Default"}`, marginX, currentY + 4);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  const claimDate = request.dateSubmitted 
    ? new Date(request.dateSubmitted).toLocaleDateString("en-IN") 
    : new Date(request.lastUpdated).toLocaleDateString("en-IN");
  doc.text(`Submitted Date: ${claimDate}`, pageWidth - marginX - 55, currentY);

  currentY += 8;
  drawLine(currentY, 180);
  currentY += 6;

  // 3. Employee & Project Information Block (2 Columns)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("EMPLOYEE PROFILE", marginX, currentY);
  doc.text("ASSIGNMENT & PURPOSE DETAILS", pageWidth / 2 + 10, currentY);
  currentY += 4;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);

  // Column 1 values
  const profileItems = [
    { label: "Employee Name:", val: request.employeeName },
    { label: "Employee Code:", val: request.employeeCode },
    { label: "Dept / Branch:", val: request.department },
    { label: "Date of Joining:", val: request.doj ? new Date(request.doj).toLocaleDateString("en-IN") : "N/A" }
  ];

  // Column 2 values
  const projectItems = [
    { label: "Project Title:", val: request.projectName },
    { label: "Mill / Site Location:", val: request.assignedLocation },
    { label: "Purpose of Visit:", val: request.purpose }
  ];

  let leftColY = currentY;
  profileItems.forEach(item => {
    doc.setFont("Helvetica", "bold");
    doc.text(item.label, marginX, leftColY);
    doc.setFont("Helvetica", "normal");
    doc.text(item.val || "N/A", marginX + 32, leftColY);
    leftColY += 5;
  });

  let rightColY = currentY;
  projectItems.forEach(item => {
    doc.setFont("Helvetica", "bold");
    doc.text(item.label, pageWidth / 2 + 10, rightColY);
    doc.setFont("Helvetica", "normal");
    
    // Auto wrap for laundry/purpose if too long
    const splitText = doc.splitTextToSize(item.val || "N/A", pageWidth / 2 - 20);
    doc.text(splitText, pageWidth / 2 + 42, rightColY);
    rightColY += (splitText.length * 4) + 1;
  });

  currentY = Math.max(leftColY, rightColY) + 4;
  drawLine(currentY, 200);
  currentY += 8;

  // 4. Detailed Travel Itinerary Table
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("DETAILED TRAVEL ITINERARY & BREAKDOWN", marginX, currentY);
  currentY += 5;

  // Table header
  const headers = ["Day/Date", "From Routing", "To Routing", "Lodging (Rs.)", "Food (Rs.)", "Transport/Type", "Total (Rs.)"];
  const colWidths = [22, 28, 28, 24, 22, 36, 22]; // Total = 182 max standard usable area is 182mm (210 - 28)
  
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, "F");
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  
  let tempX = marginX;
  headers.forEach((h, idx) => {
    doc.text(h, tempX + 2, currentY + 4.5);
    tempX += colWidths[idx];
  });
  
  currentY += 7;

  // Table Rows
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);

  if (!request.travelEntries || request.travelEntries.length === 0) {
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8);
    doc.text("No travel itinerary lines logged.", marginX + 10, currentY + 5);
    currentY += 8;
  } else {
    request.travelEntries.forEach((entry, rIdx) => {
      // Row Background striping
      if (rIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, currentY, pageWidth - (marginX * 2), 9, "F");
      }
      
      // Draw grid borders
      doc.setDrawColor(230, 230, 230);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 9);

      let rowX = marginX;
      
      // Col 1: Day & Date
      doc.setFont("Helvetica", "bold");
      doc.text(`D${entry.day} / ${entry.date ? entry.date.substr(5) : ""}`, rowX + 2, currentY + 5.5);
      rowX += colWidths[0];

      // Col 2: From & Departure
      doc.setFont("Helvetica", "normal");
      doc.text(entry.fromCity || "-", rowX + 2, currentY + 4);
      doc.setTextColor(120, 120, 120);
      doc.text(entry.departureTime || "-", rowX + 2, currentY + 7.5);
      doc.setTextColor(60, 60, 60);
      rowX += colWidths[1];

      // Col 3: To & Arrival
      doc.text(entry.toCity || "-", rowX + 2, currentY + 4);
      doc.setTextColor(120, 120, 120);
      doc.text(entry.arrivalTime || "-", rowX + 2, currentY + 7.5);
      doc.setTextColor(60, 60, 60);
      rowX += colWidths[2];

      // Col 4: Lodging Expense
      doc.text(`Rs. ${entry.lodgingCost.toLocaleString("en-IN")}`, rowX + 2, currentY + 4);
      doc.setTextColor(120, 120, 120);
      doc.text(entry.lodgingDetails ? entry.lodgingDetails.substr(0, 14) : "-", rowX + 2, currentY + 7.5);
      doc.setTextColor(60, 60, 60);
      rowX += colWidths[3];

      // Col 5: Food Cost & Type
      doc.text(`Rs. ${entry.foodCost.toLocaleString("en-IN")}`, rowX + 2, currentY + 4);
      doc.setTextColor(120, 120, 120);
      doc.text(entry.foodType ? entry.foodType.substr(0, 14) : "-", rowX + 2, currentY + 7.5);
      doc.setTextColor(60, 60, 60);
      rowX += colWidths[4];

      // Col 6: Conveyance Transport details
      let transportText = entry.conveyanceType || "-";
      if (entry.remarks) {
        transportText += ` (${entry.remarks.substr(0, 16)})`;
      }
      const splitTransport = doc.splitTextToSize(transportText, colWidths[5] - 4);
      doc.text(splitTransport, rowX + 2, currentY + 4);
      rowX += colWidths[5];

      // Col 7: Conveyance expense sum
      const rowSum = entry.lodgingCost + entry.foodCost + entry.expenseAmount;
      doc.setFont("Helvetica", "bold");
      doc.text(`Rs. ${rowSum.toLocaleString("en-IN")}`, rowX + 2, currentY + 5.5);
      doc.setFont("Helvetica", "normal");

      currentY += 9;
    });
  }

  currentY += 4;

  // 5. Totals block
  doc.setFillColor(248, 250, 252);
  doc.rect(pageWidth - marginX - 80, currentY, 80, 26, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(pageWidth - marginX - 80, currentY, 80, 26);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  const totalsY = currentY + 4;
  doc.text("Conveyance / Travel Total:", pageWidth - marginX - 76, totalsY);
  doc.text(`Rs. ${request.totals.travelTotal.toLocaleString("en-IN")}`, pageWidth - marginX - 25, totalsY, { align: "right" });

  doc.text("Food & Meals Allowance:", pageWidth - marginX - 76, totalsY + 5);
  doc.text(`Rs. ${request.totals.foodTotal.toLocaleString("en-IN")}`, pageWidth - marginX - 25, totalsY + 5, { align: "right" });

  doc.text("Lodging Accommodations:", pageWidth - marginX - 76, totalsY + 10);
  doc.text(`Rs. ${request.totals.lodgingTotal.toLocaleString("en-IN")}`, pageWidth - marginX - 25, totalsY + 10, { align: "right" });

  drawLine(totalsY + 13, 210);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("GRAND CLAIM TOTAL:", pageWidth - marginX - 76, totalsY + 18);
  doc.text(`Rs. ${request.totals.grandTotal.toLocaleString("en-IN")}`, pageWidth - marginX - 25, totalsY + 18, { align: "right" });

  currentY += 31;

  // 6. Signatures and QR Code Blocks
  drawLine(currentY, 190);
  currentY += 8;

  // Left Signature: Submitting employee
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text("SUBMITTING EMPLOYEE", marginX, currentY);
  
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("Digitally authenticated via company login", marginX, currentY + 6);
  doc.setFont("Helvetica", "normal");
  doc.text(`Name: ${request.employeeName}`, marginX, currentY + 11);
  doc.text(`Date & Time: ${claimDate}`, marginX, currentY + 15);

  // Right Signature: Supervisor/Admin approval signoff
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text("SUPER ADMINISTRATOR SIGN-OFF", pageWidth / 2 - 10, currentY);

  if (request.status === "Approved" || request.status === "Partially Approved") {
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(request.status === "Partially Approved" ? 217 : 22, request.status === "Partially Approved" ? 119 : 163, request.status === "Partially Approved" ? 6 : 74);
    doc.text(request.status === "Partially Approved" ? `[ PARTIALLY APPROVED ]` : `[ APPROVED ]`, pageWidth / 2 - 10, currentY + 6);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Signee: ${request.approvalDetails.digitalSignature || "Super Admin"}`, pageWidth / 2 - 10, currentY + 11);
    doc.text(`Timestamp: ${request.approvalDetails.timestamp ? new Date(request.approvalDetails.timestamp).toLocaleString("en-IN") : claimDate}`, pageWidth / 2 - 10, currentY + 15);
  } else {
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text(`Approval Signature Pending`, pageWidth / 2 - 10, currentY + 6);
    doc.setTextColor(110, 110, 110);
    doc.text("Status: " + request.status, pageWidth / 2 - 10, currentY + 11);
  }

  // Draw simulated Verification QR Code box on bottom right
  const qrX = pageWidth - marginX - 28;
  const qrY = currentY - 2;
  doc.setDrawColor(180, 180, 180);
  doc.rect(qrX, qrY, 28, 28);
  
  // Simulated QR Code lines/grid pattern
  doc.setFillColor(100, 100, 100);
  // Borders squares
  doc.rect(qrX + 2, qrY + 2, 6, 6, "F");
  doc.rect(qrX + 20, qrY + 2, 6, 6, "F");
  doc.rect(qrX + 2, qrY + 20, 6, 6, "F");
  // Dots pattern
  doc.rect(qrX + 10, qrY + 4, 3, 3, "F");
  doc.rect(qrX + 15, qrY + 7, 3, 3, "F");
  doc.rect(qrX + 8, qrY + 12, 5, 2, "F");
  doc.rect(qrX + 16, qrY + 15, 3, 4, "F");
  doc.rect(qrX + 11, qrY + 19, 4, 3, "F");
  doc.rect(qrX + 21, qrY + 11, 4, 4, "F");

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text("SCAN TO VERIFY", qrX + 14, qrY + 31, { align: "center" });

  // Save the PDF with supporting files compiled
  await finalizeAndSavePDF(doc, request, `Claim_${request.id}_${request.employeeName.replace(/\s+/g, "_")}.pdf`);
}
