import * as XLSX from 'xlsx'
import type { ReportExportData } from '@/api/reports'
import { formatDateTime } from '@/lib/format'

const PERIOD_LABELS: Record<ReportExportData['period'], string> = {
  day: 'Harian',
  week: 'Mingguan',
  month: 'Bulanan',
}

export function exportReportExcel(data: ReportExportData) {
  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Laporan POS'],
    ['Periode', `${data.from} s/d ${data.to}`],
    ['Tampilan', PERIOD_LABELS[data.period]],
    [],
    ['Metrik', 'Nilai'],
    ['Total Order', data.orders],
    ['Rata-rata Nilai Order', data.averageOrderValue],
    ['Rata-rata Item per Order', data.averageItemsPerOrder],
    ['Total Diskon', data.discountTotal],
    ['Pembayaran Tunai', data.cashPayments],
    ['Pembayaran Transfer', data.transferPayments],
  ])
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

  const dailySheet = XLSX.utils.aoa_to_sheet([
    ['Tanggal', 'Jumlah Order', 'Pendapatan'],
    ...data.sparkline.map((row) => [row.date, row.orders, row.revenue]),
  ])
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Harian')

  const ordersSheet = XLSX.utils.aoa_to_sheet([
    [
      'No. Order',
      'Pelanggan',
      'Telepon',
      'Total',
      'Qty',
      'Metode Bayar',
      'Status Bayar',
      'Status Order',
      'Waktu',
    ],
    ...data.orderList.map((order) => [
      order.orderNumber,
      order.customerName,
      order.customerPhone,
      order.grandTotal,
      order.totalQty,
      order.paymentMethod,
      order.paymentStatus,
      order.orderStatus,
      formatDateTime(order.createdAt),
    ]),
  ])
  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Transaksi')

  XLSX.writeFile(workbook, `laporan-pos-${data.from}-${data.to}.xlsx`)
}
