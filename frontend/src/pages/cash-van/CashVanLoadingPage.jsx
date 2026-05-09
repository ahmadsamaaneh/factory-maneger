import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Truck, UserPlus, PackagePlus, PackageMinus, Boxes } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { StatCard } from '../../design-system/components/organisms/Card';
import { getProducts } from '../../services/productService';
import { getUsers } from '../../services/userService';
import {
  createCashVanAssignment,
  createCashVanLoad,
  createCashVanUnload,
  createCashVanVehicle,
  getCashVanAssignments,
  getCashVanLoads,
  getCashVanReconciliations,
  getCashVanUnloads,
  getCashVanVehicleStock,
  getCashVanVehicles,
} from '../../services/cashVanService';
import { errMsg, fmt } from '../../utils/formatters';

const emptyLoadItem = () => ({ product_id: '', quantity: '' });
const emptyUnloadItem = () => ({ product_id: '', quantity: '' });

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function CashVanLoadingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loads, setLoads] = useState([]);
  const [unloads, setUnloads] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehicleStock, setVehicleStock] = useState([]);

  const [vehicleModal, setVehicleModal] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [loadModal, setLoadModal] = useState(false);
  const [unloadModal, setUnloadModal] = useState(false);
  /** null = جارٍ التحقق أو لم يُختر مركبة؛ true/false = يومية مفتوحة لهذا اليوم */
  const [loadDailyOpen, setLoadDailyOpen] = useState(null);
  /** بحث وتصفية منتجات المخزن في نافذة التحميل */
  const [loadStockSearch, setLoadStockSearch] = useState('');
  const [loadOnlyStocked, setLoadOnlyStocked] = useState(true);
  const [quickStockQty, setQuickStockQty] = useState({});
  const [unloadDailyOpen, setUnloadDailyOpen] = useState(null);
  const [unloadVehicleStock, setUnloadVehicleStock] = useState([]);

  const [vehicleForm, setVehicleForm] = useState({
    code: '',
    plate_number: '',
    model: '',
    notes: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    vehicle_id: '',
    rep_id: '',
    driver_id: '',
  });
  const [loadForm, setLoadForm] = useState({
    vehicle_id: '',
    notes: '',
    items: [emptyLoadItem()],
  });
  const [unloadForm, setUnloadForm] = useState({
    vehicle_id: '',
    notes: '',
    items: [emptyUnloadItem()],
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [v, a, l, ul, p, u] = await Promise.all([
        getCashVanVehicles(),
        getCashVanAssignments(),
        getCashVanLoads(),
        getCashVanUnloads(),
        getProducts(),
        getUsers(),
      ]);
      setVehicles(v);
      setAssignments(a);
      setLoads(l);
      setUnloads(ul);
      setProducts(p);
      setUsers(u);
      if (!selectedVehicleId && v.length) setSelectedVehicleId(v[0].id);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setVehicleStock([]);
      return;
    }
    getCashVanVehicleStock(selectedVehicleId).then(setVehicleStock).catch((e) => toast.error(errMsg(e)));
  }, [selectedVehicleId]);

  useEffect(() => {
    if (!loadModal || !loadForm.vehicle_id) {
      setLoadDailyOpen(null);
      return undefined;
    }
    let cancelled = false;
    setLoadDailyOpen(null);
    getCashVanReconciliations({
      vehicle_id: loadForm.vehicle_id,
      business_date: todayISO(),
      status: 'open',
    })
      .then((rows) => {
        if (!cancelled) setLoadDailyOpen(Array.isArray(rows) && rows.length > 0);
      })
      .catch(() => {
        if (!cancelled) setLoadDailyOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadModal, loadForm.vehicle_id]);

  useEffect(() => {
    if (!unloadModal || !unloadForm.vehicle_id) {
      setUnloadDailyOpen(null);
      return undefined;
    }
    let cancelled = false;
    setUnloadDailyOpen(null);
    getCashVanReconciliations({
      vehicle_id: unloadForm.vehicle_id,
      business_date: todayISO(),
      status: 'open',
    })
      .then((rows) => {
        if (!cancelled) setUnloadDailyOpen(Array.isArray(rows) && rows.length > 0);
      })
      .catch(() => {
        if (!cancelled) setUnloadDailyOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unloadModal, unloadForm.vehicle_id]);

  useEffect(() => {
    if (!unloadModal || !unloadForm.vehicle_id) {
      setUnloadVehicleStock([]);
      return undefined;
    }
    let cancelled = false;
    getCashVanVehicleStock(unloadForm.vehicle_id)
      .then((st) => {
        if (!cancelled) setUnloadVehicleStock(st);
      })
      .catch((e) => {
        if (!cancelled) toast.error(errMsg(e));
      });
    return () => {
      cancelled = true;
    };
  }, [unloadModal, unloadForm.vehicle_id]);

  useEffect(() => {
    if (loadModal) {
      setLoadStockSearch('');
      setLoadOnlyStocked(true);
      setQuickStockQty({});
    }
  }, [loadModal]);

  const inventoryPickProducts = useMemo(() => {
    let rows = products || [];
    const q = loadStockSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          String(p.sku || '')
            .toLowerCase()
            .includes(q)
      );
    }
    if (loadOnlyStocked) {
      rows = rows.filter((p) => parseFloat(p.stock_quantity || 0) > 0);
    }
    return [...rows].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
  }, [products, loadStockSearch, loadOnlyStocked]);

  const loadRows = useMemo(
    () =>
      loads.map((l) => ({
        id: l.id,
        load_number: l.load_number,
        vehicle: `${l.vehicle?.code || '-'} / ${l.vehicle?.plate_number || '-'}`,
        items_count: l.items?.length || 0,
        loaded_at: l.loaded_at,
        creator: l.creator?.name || '—',
      })),
    [loads]
  );

  const unloadRows = useMemo(
    () =>
      unloads.map((x) => ({
        id: x.id,
        unload_number: x.unload_number,
        vehicle: `${x.vehicle?.code || '-'} / ${x.vehicle?.plate_number || '-'}`,
        items_count: x.items?.length || 0,
        unloaded_at: x.unloaded_at,
        creator: x.creator?.name || '—',
      })),
    [unloads]
  );

  const stockRows = useMemo(
    () =>
      vehicleStock.map((s) => ({
        id: s.id,
        product: s.product?.name || '—',
        sku: s.product?.sku || '—',
        quantity: s.quantity,
        cost: s.product?.cost || 0,
        value: parseFloat(s.quantity || 0) * parseFloat(s.product?.cost || 0),
      })),
    [vehicleStock]
  );

  const createVehicle = async () => {
    if (!vehicleForm.code || !vehicleForm.plate_number) return toast.error('أدخل كود السيارة ورقم اللوحة.');
    setSaving(true);
    try {
      await createCashVanVehicle(vehicleForm);
      toast.success('تم إنشاء سيارة الكاش فان.');
      setVehicleModal(false);
      setVehicleForm({ code: '', plate_number: '', model: '', notes: '' });
      await loadAll();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const createAssignment = async () => {
    if (!assignmentForm.vehicle_id || !assignmentForm.rep_id) return toast.error('اختر السيارة والمندوب.');
    setSaving(true);
    try {
      await createCashVanAssignment({
        ...assignmentForm,
        driver_id: assignmentForm.driver_id || null,
      });
      toast.success('تم ربط السيارة بالمندوب.');
      setAssignmentModal(false);
      setAssignmentForm({ vehicle_id: '', rep_id: '', driver_id: '' });
      await loadAll();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const setLoadItem = (index, key, value) => {
    setLoadForm((f) => ({
      ...f,
      items: f.items.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  };
  const addLoadItem = () => setLoadForm((f) => ({ ...f, items: [...f.items, emptyLoadItem()] }));
  const removeLoadItem = (index) =>
    setLoadForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const mergeLoadLine = (productId, qtyAdd) => {
    const q = parseFloat(qtyAdd);
    if (!productId || !Number.isFinite(q) || q <= 0) return;
    setLoadForm((f) => {
      const idx = f.items.findIndex((row) => row.product_id === productId);
      if (idx >= 0) {
        const prev = parseFloat(f.items[idx].quantity || 0);
        const nextQty = prev + q;
        return {
          ...f,
          items: f.items.map((row, i) =>
            i === idx ? { ...row, quantity: String(nextQty) } : row
          ),
        };
      }
      if (f.items.length === 1 && !f.items[0].product_id && !f.items[0].quantity) {
        return {
          ...f,
          items: [{ product_id: productId, quantity: String(q) }],
        };
      }
      return { ...f, items: [...f.items, { product_id: productId, quantity: String(q) }] };
    });
  };

  const addProductFromWarehouseStock = (p) => {
    const raw = quickStockQty[p.id] ?? '';
    const qty = parseFloat(raw);
    const max = parseFloat(p.stock_quantity || 0);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('أدخل كمية أكبر من صفر.');
      return;
    }
    if (qty > max) {
      toast.error(`الكمية أكبر من المتاح في المخزن (${fmt.number(max, 2)}).`);
      return;
    }
    mergeLoadLine(p.id, qty);
    setQuickStockQty((prev) => ({ ...prev, [p.id]: '' }));
  };

  const setUnloadItem = (index, key, value) => {
    setUnloadForm((f) => ({
      ...f,
      items: f.items.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  };
  const addUnloadItem = () => setUnloadForm((f) => ({ ...f, items: [...f.items, emptyUnloadItem()] }));
  const removeUnloadItem = (index) =>
    setUnloadForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const createLoad = async () => {
    if (!loadForm.vehicle_id) return toast.error('اختر السيارة.');
    if (loadDailyOpen !== true) {
      return toast.error('يجب فتح يومية لهذه السيارة لهذا اليوم من «جرد وإقفال الكاش فان» قبل إذن التحميل.');
    }
    if (loadForm.items.some((i) => !i.product_id || !i.quantity || Number(i.quantity) <= 0)) {
      return toast.error('أكمل عناصر التحميل بشكل صحيح.');
    }
    setSaving(true);
    try {
      await createCashVanLoad({
        ...loadForm,
        items: loadForm.items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
      });
      toast.success('تم اعتماد إذن التحميل وتحديث مخزون السيارة.');
      setLoadModal(false);
      setLoadForm({ vehicle_id: '', notes: '', items: [emptyLoadItem()] });
      await loadAll();
      if (selectedVehicleId) {
        const st = await getCashVanVehicleStock(selectedVehicleId);
        setVehicleStock(st);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const createUnload = async () => {
    if (!unloadForm.vehicle_id) return toast.error('اختر السيارة.');
    if (unloadDailyOpen !== true) {
      return toast.error('يجب فتح يومية لهذه السيارة لهذا اليوم من «جرد وإقفال الكاش فان» قبل إذن التنزيل.');
    }
    if (unloadForm.items.some((i) => !i.product_id || !i.quantity || Number(i.quantity) <= 0)) {
      return toast.error('أكمل عناصر التنزيل بشكل صحيح.');
    }
    const availMap = Object.fromEntries(
      unloadVehicleStock.map((s) => [s.product_id, parseFloat(s.quantity || 0)])
    );
    for (const row of unloadForm.items) {
      const q = Number(row.quantity);
      const max = availMap[row.product_id] ?? 0;
      if (q > max) {
        return toast.error(`الكمية المطلوبة أكبر من المتاح على السيارة لهذا الصنف (متاح: ${max}).`);
      }
    }
    setSaving(true);
    try {
      await createCashVanUnload({
        ...unloadForm,
        items: unloadForm.items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
      });
      toast.success('تم اعتماد إذن التنزيل وإرجاع البضاعة للمخزن الرئيسي.');
      setUnloadModal(false);
      setUnloadForm({ vehicle_id: '', notes: '', items: [emptyUnloadItem()] });
      await loadAll();
      if (selectedVehicleId) {
        const st = await getCashVanVehicleStock(selectedVehicleId);
        setVehicleStock(st);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner label="جار تحميل بيانات الكاش فان..." />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>تحميل وتنزيل الكاش فان</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Workflow: فتح يومية ← تعريف السيارة ← ربط المندوب ← إذن تحميل من المخزن للسيارة ← إذن تنزيل من السيارة للمخزن ← متابعة المخزون.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Truck} onClick={() => setVehicleModal(true)}>سيارة جديدة</Button>
          <Button variant="secondary" icon={UserPlus} onClick={() => setAssignmentModal(true)}>ربط مندوب</Button>
          <Button icon={PackagePlus} onClick={() => setLoadModal(true)}>إذن تحميل</Button>
          <Button variant="outline" icon={PackageMinus} onClick={() => setUnloadModal(true)}>إذن تنزيل</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="عدد السيارات" value={vehicles.length} icon={Truck} colorClass="bg-blue-100 text-blue-600" />
        <StatCard label="الربط الفعال" value={assignments.filter((a) => a.status === 'active').length} icon={UserPlus} colorClass="bg-indigo-100 text-indigo-600" />
        <StatCard label="أذون التحميل" value={loads.length} icon={PackagePlus} colorClass="bg-emerald-100 text-emerald-600" />
        <StatCard label="أذون التنزيل" value={unloads.length} icon={PackageMinus} colorClass="bg-orange-100 text-orange-600" />
        <StatCard label="قيمة مخزون السيارة المحددة" value={fmt.currency(stockRows.reduce((s, r) => s + r.value, 0))} icon={PackagePlus} colorClass="bg-purple-100 text-purple-600" />
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <label className="text-sm font-medium">عرض مخزون السيارة:</label>
          <select
            className="ds-input h-9 text-sm w-72"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
          >
            <option value="">اختر سيارة...</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.code} - {v.plate_number}
              </option>
            ))}
          </select>
        </div>
        <DataTable
          columns={[
            { key: 'product', label: 'المنتج' },
            { key: 'sku', label: 'SKU' },
            { key: 'quantity', label: 'الكمية', render: (r) => fmt.number(r.quantity, 2) },
            { key: 'cost', label: 'تكلفة الوحدة', render: (r) => fmt.currency(r.cost) },
            { key: 'value', label: 'القيمة', render: (r) => <span className="font-semibold">{fmt.currency(r.value)}</span> },
          ]}
          data={stockRows}
          emptyMessage="لا يوجد مخزون لهذه السيارة."
        />
      </div>

      <div>
        <h2 className="text-base font-semibold mb-2">أذون التحميل (من المخزن الرئيسي إلى السيارة)</h2>
        <DataTable
        columns={[
          { key: 'load_number', label: 'رقم إذن التحميل' },
          { key: 'vehicle', label: 'السيارة' },
          { key: 'items_count', label: 'عدد الأصناف' },
          { key: 'creator', label: 'أنشأ بواسطة' },
          { key: 'loaded_at', label: 'تاريخ التحميل', render: (r) => fmt.dateTime(r.loaded_at) },
        ]}
        data={loadRows}
        emptyMessage="لا توجد أذونات تحميل بعد."
      />
      </div>

      <div>
        <h2 className="text-base font-semibold mb-2">أذون التنزيل (من السيارة إلى المخزن الرئيسي)</h2>
        <DataTable
          columns={[
            { key: 'unload_number', label: 'رقم إذن التنزيل' },
            { key: 'vehicle', label: 'السيارة' },
            { key: 'items_count', label: 'عدد الأصناف' },
            { key: 'creator', label: 'أنشأ بواسطة' },
            { key: 'unloaded_at', label: 'تاريخ التنزيل', render: (r) => fmt.dateTime(r.unloaded_at) },
          ]}
          data={unloadRows}
          emptyMessage="لا توجد أذونات تنزيل بعد."
        />
      </div>

      <Modal open={vehicleModal} onClose={() => setVehicleModal(false)} title="إضافة سيارة كاش فان" size="md">
        <div className="space-y-4">
          <Input label="كود السيارة *" value={vehicleForm.code} onChange={(e) => setVehicleForm((f) => ({ ...f, code: e.target.value }))} />
          <Input label="رقم اللوحة *" value={vehicleForm.plate_number} onChange={(e) => setVehicleForm((f) => ({ ...f, plate_number: e.target.value }))} />
          <Input label="الموديل" value={vehicleForm.model} onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))} />
          <Input label="ملاحظات" value={vehicleForm.notes} onChange={(e) => setVehicleForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setVehicleModal(false)}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={createVehicle}>حفظ السيارة</Button>
          </div>
        </div>
      </Modal>

      <Modal open={assignmentModal} onClose={() => setAssignmentModal(false)} title="ربط سيارة بمندوب/سائق" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">السيارة *</label>
            <select className="ds-input h-9 text-sm mt-1" value={assignmentForm.vehicle_id} onChange={(e) => setAssignmentForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">اختر سيارة...</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.code} - {v.plate_number}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">المندوب *</label>
            <select className="ds-input h-9 text-sm mt-1" value={assignmentForm.rep_id} onChange={(e) => setAssignmentForm((f) => ({ ...f, rep_id: e.target.value }))}>
              <option value="">اختر مندوب...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">السائق (اختياري)</label>
            <select className="ds-input h-9 text-sm mt-1" value={assignmentForm.driver_id} onChange={(e) => setAssignmentForm((f) => ({ ...f, driver_id: e.target.value }))}>
              <option value="">بدون سائق محدد</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAssignmentModal(false)}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={createAssignment}>حفظ الربط</Button>
          </div>
        </div>
      </Modal>

      <Modal open={loadModal} onClose={() => setLoadModal(false)} title="إنشاء إذن تحميل من المخزن إلى السيارة" size="lg">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed rounded-lg p-3 border" style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            يتم التحميل من <strong className="text-neutral-800 dark:text-neutral-200">مخزون المنتجات الجاهزة</strong> في المصنع (المخزون الرئيسي). الخصم يطبّق على كمية المنتج كما في صفحة المنتجات. لمخزون المواد الخام استخدم صفحة الجرد ثم الإنتاج لتحويلها إلى منتجات.
            {' '}
            <Link to="/products" className="text-primary-600 dark:text-primary-400 font-medium underline underline-offset-2">المنتجات والمخزون</Link>
          </p>

          <div>
            <label className="text-sm font-medium">السيارة *</label>
            <select className="ds-input h-9 text-sm mt-1" value={loadForm.vehicle_id} onChange={(e) => setLoadForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">اختر سيارة...</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.code} - {v.plate_number}</option>)}
            </select>
          </div>

          {loadForm.vehicle_id && loadDailyOpen === false && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/25 dark:border-amber-800 p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              لا توجد يومية مفتوحة لهذه السيارة اليوم. افتح يومية من{' '}
              <Link to="/cash-van/reconciliation" className="text-primary-600 dark:text-primary-400 font-medium underline underline-offset-2">
                جرد وإقفال الكاش فان
              </Link>
              {' '}ثم أعد المحاولة.
            </div>
          )}

          <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-start gap-2">
              <Boxes size={18} className="mt-0.5 shrink-0 text-primary-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">تحميل من مخزون المنتجات</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  اختر صنفًا متوفرًا في المخزن وأضف الكمية، أو استخدم الجدول يدويًا بالأسفل.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                className="ds-input h-9 text-sm flex-1"
                placeholder="بحث بالاسم أو SKU..."
                value={loadStockSearch}
                onChange={(e) => setLoadStockSearch(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer shrink-0 px-1">
                <input
                  type="checkbox"
                  checked={loadOnlyStocked}
                  onChange={(e) => setLoadOnlyStocked(e.target.checked)}
                />
                المتوفرة في المخزن فقط
              </label>
            </div>
            <div className="max-h-52 overflow-auto rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
              {inventoryPickProducts.length === 0 ? (
                <p className="text-sm p-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  لا توجد منتجات مطابقة. غيّر البحث أو ألغِ «المتوفر فقط» لعرض كل المنتجات.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-neutral-50/80 dark:bg-neutral-900/50" style={{ borderColor: 'var(--border-default)' }}>
                      <th className="text-right py-2 px-2 font-medium">المنتج</th>
                      <th className="text-right py-2 px-2 font-medium w-24">المتاح</th>
                      <th className="text-right py-2 px-2 font-medium w-28">الكمية</th>
                      <th className="w-20 px-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryPickProducts.map((p) => (
                      <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className="py-1.5 px-2">
                          <span className="font-medium">{p.name}</span>
                          {p.sku ? <span className="text-xs block opacity-70">{p.sku}</span> : null}
                        </td>
                        <td className="py-1.5 px-2 tabular-nums">{fmt.number(p.stock_quantity, 2)}</td>
                        <td className="py-1.5 px-2">
                          <input
                            className="ds-input h-8 text-sm w-full"
                            type="number"
                            min="0"
                            step="0.001"
                            placeholder="0"
                            value={quickStockQty[p.id] ?? ''}
                            onChange={(e) =>
                              setQuickStockQty((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                          />
                        </td>
                        <td className="py-1.5 px-1">
                          <Button type="button" size="sm" variant="secondary" onClick={() => addProductFromWarehouseStock(p)}>
                            إضافة
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">أصناف الإذن (يدويًا)</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addLoadItem}>إضافة صف</Button>
            </div>
            <div className="space-y-2">
              {loadForm.items.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_140px_32px] gap-2 items-end">
                  <select className="ds-input h-9 text-sm" value={row.product_id} onChange={(e) => setLoadItem(index, 'product_id', e.target.value)}>
                    <option value="">اختر منتج...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (المخزون: {fmt.number(p.stock_quantity, 2)})
                      </option>
                    ))}
                  </select>
                  <input
                    className="ds-input h-9 text-sm"
                    type="number"
                    min="0.001"
                    step="0.001"
                    placeholder="الكمية"
                    value={row.quantity}
                    onChange={(e) => setLoadItem(index, 'quantity', e.target.value)}
                  />
                  <button onClick={() => removeLoadItem(index)} className="text-neutral-400 hover:text-danger-500 pb-2 text-lg font-medium">×</button>
                </div>
              ))}
            </div>
          </div>

          <Input label="ملاحظات" value={loadForm.notes} onChange={(e) => setLoadForm((f) => ({ ...f, notes: e.target.value }))} />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setLoadModal(false)}>إلغاء</Button>
            <Button
              className="flex-1"
              loading={saving}
              disabled={!loadForm.vehicle_id || loadDailyOpen !== true}
              onClick={createLoad}
            >
              اعتماد التحميل
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={unloadModal} onClose={() => setUnloadModal(false)} title="إذن تنزيل بضاعة من السيارة للمخزن" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">السيارة *</label>
            <select
              className="ds-input h-9 text-sm mt-1"
              value={unloadForm.vehicle_id}
              onChange={(e) => setUnloadForm((f) => ({ ...f, vehicle_id: e.target.value }))}
            >
              <option value="">اختر سيارة...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code} - {v.plate_number}
                </option>
              ))}
            </select>
          </div>

          {unloadForm.vehicle_id && unloadDailyOpen === false && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/25 dark:border-amber-800 p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              لا توجد يومية مفتوحة لهذه السيارة اليوم. افتح يومية من{' '}
              <Link to="/cash-van/reconciliation" className="text-primary-600 dark:text-primary-400 font-medium underline underline-offset-2">
                جرد وإقفال الكاش فان
              </Link>
              {' '}ثم أعد المحاولة.
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">أصناف التنزيل * (من مخزون السيارة)</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addUnloadItem}>
                إضافة صف
              </Button>
            </div>
            <div className="space-y-2">
              {unloadForm.items.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_140px_32px] gap-2 items-end">
                  <select
                    className="ds-input h-9 text-sm"
                    value={row.product_id}
                    onChange={(e) => setUnloadItem(index, 'product_id', e.target.value)}
                  >
                    <option value="">اختر منتجًا على السيارة...</option>
                    {unloadVehicleStock
                      .filter((s) => parseFloat(s.quantity || 0) > 0)
                      .map((s) => (
                        <option key={s.product_id} value={s.product_id}>
                          {s.product?.name} (على السيارة: {fmt.number(s.quantity, 2)})
                        </option>
                      ))}
                  </select>
                  <input
                    className="ds-input h-9 text-sm"
                    type="number"
                    min="0.001"
                    step="0.001"
                    placeholder="الكمية"
                    value={row.quantity}
                    onChange={(e) => setUnloadItem(index, 'quantity', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeUnloadItem(index)}
                    className="text-neutral-400 hover:text-danger-500 pb-2 text-lg font-medium"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Input label="ملاحظات" value={unloadForm.notes} onChange={(e) => setUnloadForm((f) => ({ ...f, notes: e.target.value }))} />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setUnloadModal(false)}>
              إلغاء
            </Button>
            <Button
              className="flex-1"
              loading={saving}
              disabled={!unloadForm.vehicle_id || unloadDailyOpen !== true}
              onClick={createUnload}
            >
              اعتماد التنزيل
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
