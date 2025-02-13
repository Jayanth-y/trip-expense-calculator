import { Expense, Participant, Settlement } from './types';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function exportToPDF(): void {
  const element = document.getElementById("pdf-export"); // Capture the main container

  if (!element) {
    console.error("Element not found for PDF export!");
    return;
  }

  html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    logging: false
  }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");

    const pdfWidth = 1200;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    window.open(pdf.output("bloburl"), "_blank");

  }).catch(error => {
    console.error("Error generating PDF:", error);
  });
}

export function calculateSettlements(expenses: Expense[], participants: Participant[]): Settlement[] {
  const balances = new Map<string, number>();

  // Initialize balances
  participants.forEach(p => balances.set(p.id, 0));

  // Calculate initial balances
  expenses.forEach(expense => {
    const paidBy = expense.paidBy;
    const participantCount = expense.participants.size;
    if (participantCount === 0) return;

    const sharePerPerson = expense.amount / participantCount;
    balances.set(paidBy, (balances.get(paidBy) || 0) + expense.amount);

    expense.participants.forEach(participantId => {
      balances.set(participantId, (balances.get(participantId) || 0) - sharePerPerson);
    });
  });

  const settlements: Settlement[] = [];
  const debtors = participants.filter(p => (balances.get(p.id) || 0) < 0)
    .sort((a, b) => (balances.get(a.id) || 0) - (balances.get(b.id) || 0));
  const creditors = participants.filter(p => (balances.get(p.id) || 0) > 0)
    .sort((a, b) => (balances.get(b.id) || 0) - (balances.get(a.id) || 0));

  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];

    const debtorBalance = Math.abs(balances.get(debtor.id) || 0);
    const creditorBalance = balances.get(creditor.id) || 0;

    const amount = Math.min(debtorBalance, creditorBalance);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: Number(amount.toFixed(2))
      });
    }

    balances.set(debtor.id, (balances.get(debtor.id) || 0) + amount);
    balances.set(creditor.id, (balances.get(creditor.id) || 0) - amount);

    if (Math.abs(balances.get(debtor.id) || 0) < 0.01) debtorIdx++;
    if (Math.abs(balances.get(creditor.id) || 0) < 0.01) creditorIdx++;
  }

  return settlements;
}