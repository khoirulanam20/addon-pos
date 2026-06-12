import { formatCurrency, formatDateTime } from '@/lib/format'

export function printReceipt(data: {
  storeName: string
  orderNumber: string
  createdAt: string
  customerName: string
  items: Array<{ productName: string; qty: number; subtotal: number }>
  subtotal: number
  taxAmount: number
  grandTotal: number
  payments?: Array<{ method: string; amount: number }>
}) {
  const root = document.createElement('div')
  root.className = 'receipt-print'
  root.innerHTML = `
    <div style="font-family: monospace; font-size: 12px; padding: 8px;">
      <div style="text-align:center;font-weight:bold;margin-bottom:8px;">${data.storeName}</div>
      <div>No: ${data.orderNumber}</div>
      <div>${formatDateTime(data.createdAt)}</div>
      <div>Pelanggan: ${data.customerName}</div>
      <hr />
      ${data.items
        .map(
          (item) =>
            `<div>${item.productName} x${item.qty}<br/><span style="float:right">${formatCurrency(item.subtotal)}</span></div>`,
        )
        .join('')}
      <hr />
      <div>Subtotal <span style="float:right">${formatCurrency(data.subtotal)}</span></div>
      <div>Pajak <span style="float:right">${formatCurrency(data.taxAmount)}</span></div>
      <div style="font-weight:bold">TOTAL <span style="float:right">${formatCurrency(data.grandTotal)}</span></div>
      ${
        data.payments
          ?.map((p) => `<div>${p.method}: ${formatCurrency(p.amount)}</div>`)
          .join('') ?? ''
      }
      <hr />
      <div style="text-align:center;margin-top:8px;">Terima kasih</div>
    </div>
  `
  document.body.appendChild(root)
  window.print()
  document.body.removeChild(root)
}
