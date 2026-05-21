import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { apiFetch } from '../lib/api';

export interface CashSessionInfo {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  openingAmount: string;
  status: string;
  openedAt: string;
  salesCount?: number;
  salesTotal?: string;
}

export function useCashSession() {
  const { hasPermission } = useAuthStore();
  const canRead = hasPermission('cash_register.open');

  return useQuery({
    queryKey: ['cash-register', 'sessions', 'current'],
    queryFn: async () => {
      const res = await apiFetch<{ data: CashSessionInfo | null }>(
        '/cash-register/sessions/current',
      );
      return res.data;
    },
    enabled: canRead,
    staleTime: 15_000,
  });
}
