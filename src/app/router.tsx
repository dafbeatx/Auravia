import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { FoundationStatus } from '@/app/FoundationStatus';

/**
 * Konfigurasi rute awal Aurovia.
 * Pada tahap Foundation, hanya rute dasar yang didaftarkan.
 * Halaman produk penuh (storefront, dashboard, editor, public invitation)
 * akan diimplementasikan pada fase berikutnya sesuai roadmap.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <FoundationStatus />,
      },
    ],
  },
]);
