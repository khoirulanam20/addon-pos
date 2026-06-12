# YClothes POS

Web app Point of Sale terpisah untuk YClothes — mirip Bagisto POS dengan dukungan **offline mode** dan sinkronisasi otomatis.

## Setup

```bash
cp .env.example .env
# Set VITE_API_BASE_URL ke backend yclothes, contoh:
# VITE_API_BASE_URL=http://localhost:8000/api/pos

npm install
npm run dev
```

## Backend yclothes

Pastikan migrasi POS sudah dijalankan dan `.env` backend memuat:

```env
APP_URL=http://localhost:8000
POS_ALLOWED_ORIGINS=http://localhost:5173
```

Staff harus punya permission `pos.access`, `pos.sell`, dan `pos.manage` (void).

## Alur kasir

1. Login dengan akun admin/staff
2. Buka shift — pilih outlet/gudang
3. Jual produk (grid, search, barcode)
4. Hold / bayar (tunai, transfer, split)
5. Offline: transaksi disimpan IndexedDB, sync saat online
6. Tutup shift

## Deploy

- **POS frontend:** Vercel, Netlify, atau static host (`npm run build` → `dist/`)
- **API:** tetap di server yclothes (Laravel)
- Set `VITE_API_BASE_URL` saat build production
- Tambahkan domain POS ke `POS_ALLOWED_ORIGINS` di backend

## Fitur

- PWA installable (vite-plugin-pwa)
- IndexedDB (Dexie) untuk katalog & order offline
- Auto-sync katalog dan order saat kembali online
- Hold sales (server + lokal)
- Cetak struk via browser print
