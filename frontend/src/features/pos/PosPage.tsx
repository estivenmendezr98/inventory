import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, apiPatch, apiPost } from '../../lib/api';
import { useCashSession } from '../../hooks/useCashSession';
import { PAYMENT_METHOD_LABEL } from '../sales/saleStatus';
import { AlertTriangle, DollarSign, Monitor, Pause, Plus, RotateCcw, ShoppingBag, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PrintThermalTicketButton } from '../../components/printing/PrintThermalTicketButton';
import {
  cop,
  parseCopInput,
  parsePercentInput,
  roundCop,
  sanitizeCopDraft,
} from '../../lib/money';
import { cashChangeFromReceived } from '../../lib/sale-payments';
import {
  formatQtyWithUnit,
  minQtyForUnit,
  parseQtyInput,
  qtyInputStep,
  roundQtyForUnit,
  type UnitOfMeasureDto,
  validateQtyForUnit,
} from '../../lib/units-of-measure';
import {
  fromBaseQuantity,
  listSaleUnits,
  toBaseQuantity,
  unitForSale,
  type ProductUnitsProfile,
} from '../../lib/product-units';

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  barcode?: string | null;
  salePrice: string;
  taxRate: string;
  stock: number;
  reservedQty?: number;
  availableStock?: number;
  availableContentStock?: number | null;
  isActive: boolean;
  unitOfMeasureId: string;
  unitOfMeasure?: UnitOfMeasureDto | null;
  contentPerUnit?: number | null;
  contentUnitId?: string | null;
  contentUnit?: UnitOfMeasureDto | null;
  saleUnits?: ProductUnitsProfile['saleUnits'];
}

function productProfile(p: ProductRow): ProductUnitsProfile {
  const base = p.unitOfMeasure ?? {
    id: p.unitOfMeasureId,
    code: '',
    name: 'Unidad',
    symbol: 'und',
    category: 'COUNT',
    categoryLabel: '',
    allowsDecimals: false,
    decimalPlaces: 0,
  };
  return {
    unitOfMeasureId: p.unitOfMeasureId,
    unitOfMeasure: base,
    contentPerUnit: p.contentPerUnit ?? null,
    contentUnitId: p.contentUnitId ?? null,
    contentUnit: p.contentUnit ?? null,
    alternateUnits: undefined,
    saleUnits: p.saleUnits,
  };
}

function productAvailable(p: ProductRow): number {
  if (p.availableStock !== undefined) return p.availableStock;
  return Math.max(0, p.stock - (p.reservedQty ?? 0));
}

/**
 * Máximo en esta línea del carrito.
 * Con `excludeCartId` en catálogo, `availableStock` ya es el tope del carrito actual.
 */
function maxQtyForCartLine(
  p: ProductRow,
  currentCartQty: number,
  saleUnitId: string,
  catalogExcludesCart: boolean
): number {
  const profile = productProfile(p);
  const availBase = productAvailable(p);
  const currentBase = toBaseQuantity(currentCartQty, saleUnitId, profile);
  const maxBase = catalogExcludesCart ? availBase : availBase + currentBase;
  return fromBaseQuantity(maxBase, saleUnitId, profile);
}

function validateCartQuantity(
  p: ProductRow,
  newQty: number,
  currentCartQty: number,
  saleUnitId: string,
  catalogExcludesCart: boolean
): string | null {
  const profile = productProfile(p);
  const unit = unitForSale(profile, saleUnitId);
  const unitErr = validateQtyForUnit(newQty, unit, 'Cantidad');
  if (unitErr) return unitErr;
  const max = maxQtyForCartLine(p, currentCartQty, saleUnitId, catalogExcludesCart);
  if (newQty > max) {
    return `Stock insuficiente para ${p.name}: disponible ${formatQtyWithUnit(max, unit)}`;
  }
  return null;
}

interface CartItem {
  productId: string;
  quantity: number;
  saleUnitId: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

interface CartDetail {
  id: string;
  number: string;
  status: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  updatedAt?: string;
  customer: { id: string; name: string; documentNumber: string } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: string;
    discount: string;
    taxRate: string;
    subtotal: string;
    saleUnitId?: string | null;
    product: ProductRow;
  }>;
}

interface CustomerOpt {
  id: string;
  name: string;
  documentNumber: string;
}

interface SuspendedRow {
  id: string;
  number: string;
  total: string;
  status: string;
  createdAt: string;
  customer: { id: string; name: string } | null;
  user: { id: string; name: string };
  lineCount: number;
}

type DiscountMode = 'amount' | 'percent';

function lineAmounts(
  unitPrice: number,
  quantity: number,
  unitDiscount: number,
  taxRate: number
) {
  const price = roundCop(unitPrice);
  const disc = roundCop(Math.min(unitDiscount, price));
  const netUnit = Math.max(0, price - disc);
  const base = roundCop(quantity * netUnit);
  const tax = roundCop(base * (taxRate / 100));
  return {
    unitDiscount: disc,
    netUnit,
    base,
    tax,
    total: roundCop(base + tax),
  };
}

function unitDiscountFromInput(raw: number, mode: DiscountMode, unitPrice: number): number {
  const price = roundCop(unitPrice);
  if (mode === 'percent') {
    const pct = Math.min(100, Math.max(0, Math.round(raw)));
    return roundCop((price * pct) / 100);
  }
  return roundCop(Math.min(raw, price));
}

function discountInputFromStored(unitDiscount: number, mode: DiscountMode, unitPrice: number): string {
  const disc = roundCop(unitDiscount);
  if (mode === 'percent' && unitPrice > 0) {
    return String(Math.round((disc / roundCop(unitPrice)) * 100));
  }
  if (disc === 0) return '';
  return String(disc);
}

function buildPaymentReference(
  cart: CartDetail,
  method: string,
  total: number,
  received: number,
  change: number
): string {
  const ts = new Date().toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const methodLabel = PAYMENT_METHOD_LABEL[method] ?? method;
  const customer = cart.customer?.name ?? 'Contado';
  let text = `POS ${cart.number} | ${methodLabel} | ${customer} | total ${total}`;
  if (method === 'CASH') {
    text += ` | recibido ${received} | cambio ${change}`;
  }
  text += ` | ${ts}`;
  return text.slice(0, 120);
}

function cartToPatchItems(
  cart: CartDetail,
  saleUnits: Record<string, string>
): CartItem[] {
  return cart.items.map((it) => ({
    productId: it.productId,
    quantity: it.quantity,
    saleUnitId:
      saleUnits[it.productId] ??
      it.saleUnitId ??
      it.product.unitOfMeasureId,
    unitPrice: roundCop(Number(it.unitPrice)),
    discount: roundCop(Number(it.discount)),
    taxRate: Number(it.taxRate),
  }));
}

export function PosPage() {
  const { hasPermission } = useAuthStore();
  const canAccess = hasPermission('pos.access');
  const canSuspend = hasPermission('pos.suspend_sale');
  const canResume = hasPermission('pos.resume_sale');
  const canDiscount = hasPermission('pos.apply_discount');
  const canCheckout = hasPermission('sales.create');

  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catalogExcludesCart = Boolean(cartId);

  const { data: cashSession, isPending: cashSessionLoading } = useCashSession();
  const cashOpen = cashSession?.status === 'OPEN';
  const canSell = cashOpen;

  const { data: products = [] } = useQuery({
    queryKey: ['pos', 'products', cartId],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '200' });
      if (cartId) params.set('excludeCartId', cartId);
      const r = await apiFetch<{ data: ProductRow[] }>(`/products?${params.toString()}`);
      return r.data.filter((p) => p.isActive);
    },
    enabled: canAccess,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['pos', 'customers'],
    queryFn: async () => {
      const r = await apiFetch<{ data: CustomerOpt[] }>('/customers?limit=100');
      return r.data;
    },
    enabled: canAccess,
  });

  const [suspendedOpen, setSuspendedOpen] = useState(false);
  const [suspendedRows, setSuspendedRows] = useState<SuspendedRow[]>([]);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payAmount, setPayAmount] = useState(0);

  const cartRef = useRef<CartDetail | null>(null);
  cartRef.current = cart;

  const [discountDraft, setDiscountDraft] = useState<Record<string, string>>({});
  const [discountMode, setDiscountMode] = useState<Record<string, DiscountMode>>({});
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
  const [saleUnitDraft, setSaleUnitDraft] = useState<Record<string, string>>({});

  const totalNum = useMemo(() => (cart ? roundCop(Number(cart.total)) : 0), [cart]);
  const discountTotalNum = useMemo(
    () => (cart ? roundCop(Number(cart.discountTotal)) : 0),
    [cart]
  );

  const refreshPosCatalog = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['pos', 'products'] });
    void queryClient.invalidateQueries({ queryKey: ['pos', 'customers'] });
  }, [queryClient]);

  const refreshCart = useCallback(async (id: string) => {
    const c = await apiFetch<CartDetail>(`/pos/carts/${id}`);
    setCart(c);
  }, []);

  useEffect(() => {
    if (!cartId) {
      setCart(null);
      return;
    }
    refreshCart(cartId).catch((e) =>
      setError(e instanceof Error ? e.message : 'Error al cargar carrito')
    );
  }, [cartId, refreshCart]);

  useEffect(() => {
    if (!cart) {
      setDiscountDraft({});
      setDiscountMode({});
      setQtyDraft({});
      setSaleUnitDraft({});
      return;
    }
    const drafts: Record<string, string> = {};
    const qtys: Record<string, string> = {};
    const units: Record<string, string> = {};
    for (const it of cart.items) {
      const mode = discountMode[it.productId] ?? 'amount';
      drafts[it.productId] = discountInputFromStored(
        Number(it.discount),
        mode,
        Number(it.unitPrice)
      );
      qtys[it.productId] = String(it.quantity);
      units[it.productId] =
        it.saleUnitId ?? it.product.unitOfMeasureId;
    }
    setDiscountDraft(drafts);
    setDiscountMode((prev) => {
      const next = { ...prev };
      for (const it of cart.items) {
        if (!next[it.productId]) next[it.productId] = 'amount';
      }
      return next;
    });
    setQtyDraft(qtys);
    setSaleUnitDraft(units);
    // Solo re-sincronizar borradores cuando cambia el carrito desde el servidor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id, cart?.updatedAt, cart?.items.length]);

  const filteredProducts = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        (p.barcode && p.barcode.toLowerCase().includes(s))
    );
  }, [products, search]);

  const patchCart = async (nextItems: CartItem[], customerPatch?: string | null) => {
    if (!cartId) return;
    setBusy(true);
    setError(null);
    try {
      const body: { items: unknown[]; customerId?: string | null } = {
        items: nextItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          saleUnitId: it.saleUnitId,
          unitPrice: roundCop(Number(it.unitPrice)),
          discount: roundCop(Number(it.discount) || 0),
          taxRate: Number(it.taxRate) || 0,
        })),
      };
      if (customerPatch !== undefined) body.customerId = customerPatch;
      const updated = await apiPatch<CartDetail>(`/pos/carts/${cartId}`, body);
      setCart(updated);
      refreshPosCatalog();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      const c = cartRef.current;
      if (c) {
        const qtys: Record<string, string> = {};
        for (const it of c.items) {
          qtys[it.productId] = String(it.quantity);
        }
        setQtyDraft(qtys);
      }
    } finally {
      setBusy(false);
    }
  };

  const startNewSale = async () => {
    setBusy(true);
    setError(null);
    try {
      const c = await apiPost<CartDetail>('/pos/carts', {});
      setCartId(c.id);
      setCart(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  /** Descarta carrito (con confirmación si hay líneas) y abre otro. */
  const newSaleOrReplace = async () => {
    if (!cartId) {
      await startNewSale();
      return;
    }
    if (!cart) return;
    if (cart.items.length > 0) {
      if (!window.confirm('¿Descartar el carrito actual y abrir uno nuevo?')) return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/pos/carts/${cartId}/discard`, {});
      setCartId(null);
      setCart(null);
      const c = await apiPost<CartDetail>('/pos/carts', {});
      setCartId(c.id);
      setCart(c);
      refreshPosCatalog();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const patchItemsFromCurrent = async (
    updater: (items: CartItem[]) => CartItem[],
    customerPatch?: string | null
  ) => {
    const current = cartRef.current;
    if (!current || !cartId) return;
    await patchCart(updater(cartToPatchItems(current, saleUnitDraft)), customerPatch);
  };

  const addProduct = async (p: ProductRow) => {
    if (!cartRef.current || !cartId) return;
    const base = cartToPatchItems(cartRef.current, saleUnitDraft);
    const saleUnitId = saleUnitDraft[p.id] ?? p.unitOfMeasureId;
    const saleUnit = unitForSale(productProfile(p), saleUnitId);
    const idx = base.findIndex((i) => i.productId === p.id);
    const currentInCart = idx >= 0 ? base[idx].quantity : 0;
    const step = minQtyForUnit(saleUnit);
    const needQty = roundQtyForUnit(currentInCart + step, saleUnit);
    const qtyError = validateCartQuantity(
      p,
      needQty,
      currentInCart,
      saleUnitId,
      catalogExcludesCart
    );
    if (qtyError) {
      setError(qtyError);
      return;
    }
    let next: CartItem[];
    if (idx >= 0) {
      next = base.map((row, i) =>
        i === idx
          ? {
              ...row,
              quantity: roundQtyForUnit(row.quantity + step, saleUnit),
              saleUnitId,
            }
          : row
      );
    } else {
      next = [
        ...base,
        {
          productId: p.id,
          quantity: minQtyForUnit(saleUnit),
          saleUnitId,
          unitPrice: roundCop(Number(p.salePrice)),
          discount: 0,
          taxRate: Number(p.taxRate),
        },
      ];
    }
    await patchCart(next);
  };

  const commitQty = async (productId: string) => {
    const row = cartRef.current?.items.find((i) => i.productId === productId);
    const catalogProduct = products.find((x) => x.id === productId);
    if (!row || !catalogProduct) return;

    const saleUnitId =
      saleUnitDraft[productId] ?? catalogProduct.unitOfMeasureId;
    const saleUnit = unitForSale(productProfile(catalogProduct), saleUnitId);
    const qty = roundQtyForUnit(
      parseQtyInput(qtyDraft[productId] ?? String(row.quantity), row.quantity),
      saleUnit
    );
    const qtyError = validateCartQuantity(
      catalogProduct,
      qty,
      row.quantity,
      saleUnitId,
      catalogExcludesCart
    );
    if (qtyError) {
      setError(qtyError);
      setQtyDraft((d) => ({ ...d, [productId]: String(row.quantity) }));
      return;
    }
    if (qty === row.quantity) {
      setError(null);
      return;
    }
    setError(null);
    await patchItemsFromCurrent((base) =>
      base.map((r) =>
        r.productId === productId ? { ...r, quantity: qty, saleUnitId } : r
      )
    );
  };

  const setLineSaleUnit = async (productId: string, saleUnitId: string) => {
    setSaleUnitDraft((d) => ({ ...d, [productId]: saleUnitId }));
    const catalogProduct = products.find((x) => x.id === productId);
    const row = cartRef.current?.items.find((i) => i.productId === productId);
    if (!catalogProduct || !row) return;
    const saleUnit = unitForSale(productProfile(catalogProduct), saleUnitId);
    const qty = roundQtyForUnit(row.quantity, saleUnit);
    await patchItemsFromCurrent((base) =>
      base.map((r) =>
        r.productId === productId ? { ...r, saleUnitId, quantity: qty } : r
      )
    );
  };

  const commitDiscount = async (productId: string) => {
    const current = cartRef.current;
    const row = current?.items.find((i) => i.productId === productId);
    if (!row) return;

    const unitPrice = roundCop(Number(row.unitPrice));
    const mode = discountMode[productId] ?? 'amount';
    const raw =
      mode === 'percent'
        ? parsePercentInput(discountDraft[productId] ?? '')
        : parseCopInput(discountDraft[productId] ?? '');
    let unitDiscount = unitDiscountFromInput(raw, mode, unitPrice);

    if (unitDiscount > unitPrice) {
      setError('El descuento no puede superar el precio unitario');
      unitDiscount = unitPrice;
    }

    await patchItemsFromCurrent((base) =>
      base.map((r) =>
        r.productId === productId ? { ...r, discount: unitDiscount } : r
      )
    );
  };

  const removeLine = async (productId: string) => {
    await patchItemsFromCurrent((base) => base.filter((r) => r.productId !== productId));
  };

  const setCustomer = async (customerId: string) => {
    await patchItemsFromCurrent((items) => items, customerId || null);
  };

  const loadSuspended = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: SuspendedRow[] }>('/pos/carts?status=SUSPENDED&limit=50');
      setSuspendedRows(res.data);
      setSuspendedOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const resumeSale = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/pos/carts/${id}/resume`, {});
      setCartId(id);
      setSuspendedOpen(false);
      await refreshCart(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const suspendSale = async () => {
    if (!cartId) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/pos/carts/${cartId}/suspend`, {});
      setCartId(null);
      setCart(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const discardSale = async () => {
    if (!cartId || !window.confirm('¿Descartar este carrito?')) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/pos/carts/${cartId}/discard`, {});
      setCartId(null);
      setCart(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const openCheckout = () => {
    if (!cart || totalNum <= 0) return;
    setPayMethod('CASH');
    setPayAmount(0);
    setCheckoutOpen(true);
  };

  const isCash = payMethod === 'CASH';

  const { payChange, payRef } = useMemo(() => {
    if (!cart) return { payChange: 0, payRef: '' };
    if (payMethod === 'CASH') {
      const change = cashChangeFromReceived(payAmount, totalNum);
      return {
        payChange: change,
        payRef: buildPaymentReference(cart, 'CASH', totalNum, payAmount, change),
      };
    }
    const amount = totalNum;
    return {
      payChange: 0,
      payRef: buildPaymentReference(cart, payMethod, totalNum, amount, 0),
    };
  }, [cart, payMethod, payAmount, totalNum]);

  const payNet = roundCop(payAmount - payChange);
  const cashInsufficient = isCash && payAmount > 0 && payAmount < totalNum;

  const doCheckout = async () => {
    if (!cartId || !cart) return;
    if (isCash && payAmount < totalNum) {
      setError(`Efectivo insuficiente: faltan ${cop.format(totalNum - payAmount)}`);
      return;
    }
    const net = roundCop(payAmount - payChange);
    if (Math.abs(net - totalNum) > 0) {
      setError('El valor neto del pago debe igualar el total de la venta');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saleResult = await apiPost<{
        invoice: { id: string; number: string } | null;
      }>(`/pos/carts/${cartId}/checkout`, {
        payments: [
          {
            method: payMethod,
            amount: isCash ? payAmount : totalNum,
            change: payChange,
            reference: payRef.trim() || undefined,
          },
        ],
      });
      setCheckoutOpen(false);
      setCartId(null);
      setCart(null);
      if (saleResult.invoice?.id) {
        setReceiptInvoiceId(saleResult.invoice.id);
      }
      refreshPosCatalog();
      void queryClient.invalidateQueries({ queryKey: ['cash-register', 'sessions', 'current'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cobrar');
    } finally {
      setBusy(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No tiene permiso para acceder al POS (<code className="text-xs">pos.access</code>).
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Monitor className="h-7 w-7 text-primary" />
            Punto de venta
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Requiere caja abierta. Al cobrar se registra la venta, efectivo en caja e inventario.
          </p>
          {cashOpen && cashSession && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-600 dark:text-green-400">
              <DollarSign className="h-3.5 w-3.5" />
              {cashSession.cashRegisterName} · turno abierto
              {cashSession.salesCount != null && cashSession.salesCount > 0
                ? ` · ${cashSession.salesCount} venta(s)`
                : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !canSell}
            onClick={() => void newSaleOrReplace()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadSuspended()}
            className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Suspendidas
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!cashSessionLoading && !canSell && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Caja cerrada</p>
              <p className="text-muted-foreground mt-0.5">
                Abra un turno en Caja antes de crear ventas o cobrar en el POS.
              </p>
            </div>
          </div>
          <Link
            to="/cash-register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shrink-0"
          >
            <DollarSign className="h-4 w-4" />
            Abrir caja
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-3">
          <input
            type="search"
            placeholder="Buscar por nombre, SKU o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const avail = productAvailable(p);
              return (
              <button
                key={p.id}
                type="button"
                disabled={!canSell || !cartId || busy || productAvailable(p) <= 0}
                onClick={() => void addProduct(p)}
                className={cn(
                  'rounded-xl border border-border p-3 text-left text-sm transition hover:bg-muted/40 disabled:opacity-40'
                )}
              >
                <div className="font-medium line-clamp-2">{p.name}</div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{p.sku}</span>
                  <span>
                    Disp. {formatQtyWithUnit(avail, p.unitOfMeasure)}
                    {(p.reservedQty ?? 0) > 0
                      ? ` · res. ${formatQtyWithUnit(p.reservedQty ?? 0, p.unitOfMeasure)}`
                      : ''}
                  </span>
                </div>
                <div className="mt-2 text-primary font-semibold tabular-nums">
                  {cop.format(Number(p.salePrice))}
                </div>
              </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 min-h-[280px]">
            {!canSell ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Abra la caja en{' '}
                <Link to="/cash-register" className="text-primary underline">
                  Caja registradora
                </Link>{' '}
                para iniciar ventas.
              </p>
            ) : !cartId ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Pulse <strong>Nueva venta</strong> para abrir un carrito.
              </p>
            ) : !cart ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Cargando carrito…</p>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{cart.number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cart.status === 'SUSPENDED'
                      ? 'Suspendida — puede editar, cobrar o reactivar para volver a estado activo.'
                      : 'Activa'}
                  </p>
                </div>
                {canResume && cart.status === 'SUSPENDED' && cartId && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      try {
                        await apiPost(`/pos/carts/${cartId}/resume`, {});
                        await refreshCart(cartId);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Error');
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="text-xs rounded-lg border border-input px-2 py-1"
                  >
                    Reactivar carrito
                  </button>
                )}

                <label className="mt-3 block text-xs text-muted-foreground">
                  Cliente (opcional)
                  <select
                    className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-2 text-sm"
                    value={cart.customer?.id ?? ''}
                    onChange={(e) => void setCustomer(e.target.value)}
                    disabled={busy}
                  >
                    <option value="">— Sin cliente —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.documentNumber} — {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-4 space-y-2 max-h-[45vh] overflow-y-auto">
                  {cart.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Agregue productos desde la izquierda.
                    </p>
                  ) : (
                    cart.items.map((it) => {
                      const catalogProduct = products.find((x) => x.id === it.productId);
                      const saleUnitId =
                        saleUnitDraft[it.productId] ??
                        catalogProduct?.unitOfMeasureId ??
                        '';
                      const unitOpts = catalogProduct
                        ? listSaleUnits(productProfile(catalogProduct))
                        : [];
                      const lineUnit = catalogProduct
                        ? unitForSale(productProfile(catalogProduct), saleUnitId)
                        : null;
                      const maxQty = catalogProduct
                        ? maxQtyForCartLine(
                            catalogProduct,
                            it.quantity,
                            saleUnitId,
                            catalogExcludesCart
                          )
                        : it.quantity;
                      const qtyMin = minQtyForUnit(lineUnit);
                      const qtyStep = qtyInputStep(lineUnit);
                      return (
                      <div
                        key={it.id}
                        className="flex flex-wrap items-end gap-2 border-b border-border/60 pb-2 text-sm"
                      >
                        <div className="flex-1 min-w-[120px]">
                          <div className="font-medium">{it.product.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {it.product.sku} · P. lista {cop.format(Number(it.unitPrice))}
                          </div>
                          {unitOpts.length > 1 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {unitOpts.map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  disabled={busy}
                                  className={cn(
                                    'rounded px-1.5 py-0.5 text-[10px] border',
                                    saleUnitId === u.id
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-input text-muted-foreground'
                                  )}
                                  onClick={() => void setLineSaleUnit(it.productId, u.id)}
                                >
                                  {u.symbol}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <label className="text-xs">
                          Cant.{lineUnit ? ` (${lineUnit.symbol})` : ''}
                          <input
                            type="number"
                            min={qtyMin}
                            max={maxQty}
                            step={qtyStep}
                            title={`Máximo ${formatQtyWithUnit(maxQty, lineUnit)}`}
                            className="mt-0.5 w-16 rounded border border-input bg-background px-2 py-1"
                            value={qtyDraft[it.productId] ?? String(it.quantity)}
                            onChange={(e) =>
                              setQtyDraft((d) => ({
                                ...d,
                                [it.productId]: e.target.value,
                              }))
                            }
                            onBlur={() => void commitQty(it.productId)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void commitQty(it.productId);
                            }}
                            disabled={busy}
                          />
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            Máx. {formatQtyWithUnit(maxQty, lineUnit)}
                          </span>
                        </label>
                        {canDiscount && (
                          <div className="flex items-end gap-1">
                            <label className="text-xs">
                              Desc.{' '}
                              {(discountMode[it.productId] ?? 'amount') === 'percent' ? '%' : '$/ud'}
                              <input
                                type="number"
                                min={0}
                                max={
                                  (discountMode[it.productId] ?? 'amount') === 'percent'
                                    ? 100
                                    : Number(it.unitPrice)
                                }
                                step={1}
                                inputMode="numeric"
                                className="mt-0.5 w-24 rounded border border-input bg-background px-2 py-1"
                                value={discountDraft[it.productId] ?? ''}
                                onChange={(e) => {
                                  const mode = discountMode[it.productId] ?? 'amount';
                                  const next =
                                    mode === 'percent'
                                      ? String(parsePercentInput(e.target.value))
                                      : sanitizeCopDraft(e.target.value);
                                  setDiscountDraft((d) => ({
                                    ...d,
                                    [it.productId]: next,
                                  }));
                                }}
                                onBlur={() => void commitDiscount(it.productId)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') void commitDiscount(it.productId);
                                }}
                                disabled={busy}
                                placeholder="0"
                              />
                            </label>
                            <button
                              type="button"
                              title="Alternar descuento en % o en pesos por unidad"
                              className={cn(
                                'mb-0.5 rounded border px-2 py-1 text-xs font-medium',
                                (discountMode[it.productId] ?? 'amount') === 'percent'
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-input text-muted-foreground'
                              )}
                              onClick={() => {
                                const pid = it.productId;
                                const nextMode: DiscountMode =
                                  (discountMode[pid] ?? 'amount') === 'percent'
                                    ? 'amount'
                                    : 'percent';
                                setDiscountMode((m) => ({ ...m, [pid]: nextMode }));
                                setDiscountDraft((d) => ({ ...d, [pid]: '' }));
                              }}
                              disabled={busy}
                            >
                              %
                            </button>
                          </div>
                        )}
                        <div className="text-xs tabular-nums text-muted-foreground self-center text-right min-w-[5rem]">
                          {(() => {
                            const unitPrice = roundCop(Number(it.unitPrice));
                            const mode = discountMode[it.productId] ?? 'amount';
                            const raw =
                              mode === 'percent'
                                ? parsePercentInput(discountDraft[it.productId] ?? '')
                                : parseCopInput(discountDraft[it.productId] ?? '');
                            const qty =
                              roundQtyForUnit(
                                parseQtyInput(
                                  qtyDraft[it.productId] ?? String(it.quantity),
                                  it.quantity
                                ),
                                lineUnit
                              ) || it.quantity;
                            const disc = unitDiscountFromInput(raw, mode, unitPrice);
                            const { total } = lineAmounts(
                              unitPrice,
                              qty,
                              disc,
                              Number(it.taxRate)
                            );
                            return cop.format(total);
                          })()}
                        </div>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-destructive"
                          onClick={() => void removeLine(it.productId)}
                          disabled={busy}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                  {discountTotalNum > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Descuentos</span>
                      <span className="tabular-nums">−{cop.format(discountTotalNum)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold tabular-nums">{cop.format(totalNum)}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {canSuspend && (
                    <button
                      type="button"
                      disabled={busy || cart.status !== 'PENDING'}
                      onClick={() => void suspendSale()}
                      className="inline-flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm disabled:opacity-40"
                    >
                      <Pause className="h-4 w-4" />
                      Suspender
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void discardSale()}
                    className="rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive"
                  >
                    Descartar
                  </button>
                  {canCheckout && (
                    <button
                      type="button"
                      disabled={!canSell || busy || cart.items.length === 0 || totalNum <= 0}
                      onClick={openCheckout}
                      className="ml-auto inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-600/90 disabled:opacity-40"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Cobrar
                    </button>
                  )}
                </div>
                {!canCheckout && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sin permiso <code>sales.create</code> no puede finalizar cobro.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {suspendedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ventas suspendidas</h2>
              <button
                type="button"
                className="rounded border border-input px-2 py-1 text-sm"
                onClick={() => setSuspendedOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {suspendedRows.length === 0 ? (
                <li className="text-sm text-muted-foreground">No hay suspendidas.</li>
              ) : (
                suspendedRows.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <div className="font-mono text-xs">{r.number}</div>
                      <div className="text-muted-foreground text-xs">
                        {r.user.name} · {r.lineCount} líneas
                      </div>
                      <div className="font-semibold tabular-nums mt-1">{cop.format(Number(r.total))}</div>
                    </div>
                    <button
                      type="button"
                      disabled={busy || !canResume}
                      onClick={() => void resumeSale(r.id)}
                      className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-40"
                    >
                      Reanudar
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {receiptInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl text-center">
            <h2 className="text-lg font-semibold text-green-600">Venta cobrada</h2>
            <p className="text-sm text-muted-foreground mt-2">
              ¿Desea imprimir el ticket en la impresora térmica?
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <PrintThermalTicketButton
                invoiceId={receiptInvoiceId}
                label="Imprimir ticket"
                variant="primary"
                className="w-full justify-center py-2.5"
              />
              <button
                type="button"
                className="rounded-lg border border-input px-4 py-2 text-sm"
                onClick={() => setReceiptInvoiceId(null)}
              >
                Cerrar sin imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && cart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Cobrar</h2>
            <p className="text-sm text-muted-foreground mt-1 font-mono">{cart.number}</p>

            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total venta</span>
                <span className="font-semibold tabular-nums">{cop.format(totalNum)}</span>
              </div>
              {isCash && payAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Efectivo recibido</span>
                    <span className="tabular-nums">{cop.format(payAmount)}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Cambio a devolver</span>
                    <span className="font-semibold tabular-nums">{cop.format(payChange)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border/60 pt-2">
                <span className="font-medium">Neto aplicado</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    payNet === totalNum ? 'text-green-600' : 'text-destructive'
                  )}
                >
                  {cop.format(payNet)}
                </span>
              </div>
            </div>

            {cashInsufficient && (
              <p className="mt-2 text-sm text-destructive">
                Efectivo insuficiente. Faltan {cop.format(totalNum - payAmount)}.
              </p>
            )}

            <div className="mt-4 space-y-3">
              <label className="block text-xs text-muted-foreground">
                Método
                <select
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={payMethod}
                  onChange={(e) => {
                    const m = e.target.value;
                    setPayMethod(m);
                    if (m === 'CASH') {
                      setPayAmount(0);
                    } else {
                      setPayAmount(totalNum);
                    }
                  }}
                >
                  {Object.entries(PAYMENT_METHOD_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                {isCash ? 'Efectivo recibido del cliente' : 'Monto del pago'}
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  placeholder={isCash ? `Mín. ${cop.format(totalNum)}` : undefined}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={payAmount === 0 ? '' : String(payAmount)}
                  onChange={(e) => setPayAmount(parseCopInput(e.target.value))}
                  readOnly={!isCash}
                />
              </label>
              {isCash && (
                <label className="block text-xs text-muted-foreground">
                  Cambio a devolver (automático)
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    className="mt-1 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-semibold text-primary"
                    value={payChange > 0 ? cop.format(payChange) : '—'}
                  />
                </label>
              )}
              <label className="block text-xs text-muted-foreground">
                Referencia (automática)
                <textarea
                  readOnly
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-xs leading-snug"
                  value={payRef}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-input px-4 py-2 text-sm"
                onClick={() => setCheckoutOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy || cashInsufficient || payAmount <= 0}
                onClick={() => void doCheckout()}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Confirmar cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
