import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProductsPage } from './features/products/ProductsPage';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { KardexPage } from './features/kardex/KardexPage';
import { SuppliersPage } from './features/suppliers/SuppliersPage';
import { PurchasesPage } from './features/purchases/PurchasesPage';
import { CustomersPage } from './features/customers/CustomersPage';
import { SalesPage } from './features/sales/SalesPage';
import { PosPage } from './features/pos/PosPage';
import { CashRegisterPage } from './features/cash-register/CashRegisterPage';
import { CashSessionDetailPage } from './features/cash-register/CashSessionDetailPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { UsersPage } from './features/users/UsersPage';
import { RolesPage } from './features/roles/RolesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { MonitoringPage } from './features/monitoring/MonitoringPage';
import { BackupsPage } from './features/backups/BackupsPage';
import { AuditPage } from './features/audit/AuditPage';
import { DocumentsPage } from './features/documents/DocumentsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'kardex', element: <KardexPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'purchases', element: <PurchasesPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'sales', element: <SalesPage /> },
      { path: 'pos', element: <PosPage /> },
      { path: 'cash-register', element: <CashRegisterPage /> },
      { path: 'cash-register/sessions/:id', element: <CashSessionDetailPage /> },
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'roles', element: <RolesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'monitoring', element: <MonitoringPage /> },
      { path: 'backups', element: <BackupsPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
