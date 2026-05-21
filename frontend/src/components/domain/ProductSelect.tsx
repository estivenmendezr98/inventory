import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { cn } from '../../lib/utils';

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
}

interface ProductSelectProps {
  value: string;
  onChange: (productId: string) => void;
  className?: string;
  placeholder?: string;
  allowClear?: boolean;
}

export function ProductSelect({
  value,
  onChange,
  className,
  placeholder = 'Todos los productos',
  allowClear = true,
}: ProductSelectProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (q.trim()) params.set('q', q.trim());
      const res = await apiFetch<{ products: ProductOption[] }>(
        `/products/options/search?${params.toString()}`
      );
      setOptions(res.products);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
      return;
    }
    const found = options.find((o) => o.id === value);
    if (found) {
      setSelectedLabel(`${found.sku} — ${found.name}`);
      return;
    }
    void apiFetch<{ products: ProductOption[] }>(`/products/options/search?limit=50`).then(
      (res) => {
        const p = res.products.find((o) => o.id === value);
        if (p) setSelectedLabel(`${p.sku} — ${p.name}`);
      }
    );
  }, [value, options]);

  return (
    <label className={cn('block text-sm text-muted-foreground', className)}>
      Producto
      <div className="mt-1 flex flex-col gap-1">
        <input
          type="search"
          placeholder={placeholder}
          className="w-full min-w-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm lg:min-w-[260px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar producto"
        />
        <select
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Seleccionar producto"
        >
          {allowClear && <option value="">{placeholder}</option>}
          {value && !options.some((o) => o.id === value) && selectedLabel && (
            <option value={value}>{selectedLabel}</option>
          )}
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>
        {loading && <span className="text-xs text-muted-foreground">Buscando…</span>}
      </div>
    </label>
  );
}
