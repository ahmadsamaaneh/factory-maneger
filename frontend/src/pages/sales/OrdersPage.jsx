import { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import { getOrders, createOrder, getOrderById, updateOrderStatus } from '../../services/salesService';
import { getCustomers } from '../../services/salesService';
import { getProducts } from '../../services/productService';
import { fmt, errMsg } from '../../utils/formatters';
import { STATUS_COLORS, ORDER_STATUSES } from '../../utils/constants';
import { useTranslation } from 'react-i18next';

const emptyItem = () => ({ product_id: '', quantity: '', unit_price: '' });

const ORDER_STATUS_AR = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكّد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders,    setOrders]    = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [detail,    setDetail]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('');
  const [statusSaving, setStatusSaving] = useState(null);

  const [form, setForm] = useState({
    customer_id: '', discount: '', notes: '', status: 'pending',
    items: [emptyItem()],
  });

  useEffect(() => {
    Promise.all([
      getOrders().then(setOrders),
      getCustomers({ active_only: true }).then(setCustomers),
      getProducts().then(setProducts),
    ]).finally(() => setLoading(false));
  }, []);

  const reload = () => getOrders({ status: filter || undefined }).then(setOrders);

  const openDetail = async (order) => {
    try {
      const full = await getOrderById(order.id);
      setDetail(full);
    } catch (e) { toast.error(errMsg(e)); }
  };

  const addItem    = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem    = (i, key, val) =>
    setForm((f) => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }));

  const onProductChange = (i, productId) => {
    const product = products.find((p) => p.id === productId);
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) =>
        idx === i ? { ...it, product_id: productId, unit_price: product?.selling_price || '' } : it
      ),
    }));
  };

  const orderTotal = () => {
    const subtotal = form.items.reduce((sum, it) => {
      return sum + parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0);
    }, 0);
    return subtotal - parseFloat(form.discount || 0);
  };

  const handleCreate = async () => {
    if (!form.customer_id) return toast.error('اختر عميلًا.');
    if (form.items.some((it) => !it.product_id || !it.quantity)) return toast.error('أكمل جميع عناصر الطلب.');
    setSaving(true);
    try {
      await createOrder(form);
      toast.success('تم إنشاء الطلب بنجاح.');
      setModal(false);
      setForm({ customer_id: '', discount: '', notes: '', status: 'pending', items: [emptyItem()] });
      reload();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (orderId, status, { fromTable = false } = {}) => {
    if (fromTable) setStatusSaving(orderId);
    try {
      await updateOrderStatus(orderId, status);
      toast.success('تم تحديث حالة الطلب.');
      await reload();
      if (detail?.id === orderId) {
        setDetail((d) => (d ? { ...d, status } : d));
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      if (fromTable) setStatusSaving(null);
    }
  };

  const filteredOrders = filter ? orders.filter((o) => o.status === filter) : orders;

  const columns = [
    { key: 'order_number', label: 'رقم الطلب',    render: (r) => <span className="font-mono text-xs font-medium">{r.order_number}</span> },
    { key: 'customer',     label: 'العميل',   render: (r) => r.customer?.name || '—' },
    { key: 'total_amount', label: 'الإجمالي',      render: (r) => <span className="font-semibold">{fmt.currency(r.total_amount)}</span> },
    {
      key: 'status',
      label: 'الحالة',
      width: 168,
      render: (r) => (
        <select
          className="ds-input h-9 text-sm min-w-[9.5rem]"
          value={r.status}
          disabled={statusSaving === r.id}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const next = e.target.value;
            if (next === r.status) return;
            handleStatusChange(r.id, next, { fromTable: true });
          }}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_AR[s] || s}</option>
          ))}
        </select>
      ),
    },
    { key: 'created_at',   label: 'التاريخ',       render: (r) => fmt.date(r.created_at) },
    { key: 'actions',      label: '', width: 60, render: (r) => (
      <Button variant="ghost" size="sm" icon={Eye} onClick={() => openDetail(r)} />
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.sales.orders')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.sales.title')}</p>
        </div>
        <Button icon={Plus} onClick={() => setModal(true)}>طلب جديد</Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['', ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); getOrders({ status: s || undefined }).then(setOrders); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === s
                ? 'bg-primary-600 text-white'
                : 'border text-sm font-medium hover:opacity-80'
            }`}
            style={filter !== s ? { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' } : {}}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'الكل'}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filteredOrders} loading={loading} emptyMessage="لا توجد طلبات." />

      {/* Create Order Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="طلب مبيعات جديد" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">العميل *</label>
              <select
                value={form.customer_id}
                onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">اختر عميلًا…</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input
              label="الخصم"
              type="number" min="0" step="0.01" placeholder="0.00"
              value={form.discount}
              onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">حالة الطلب</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_AR[s] || s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">عناصر الطلب *</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addItem}>إضافة عنصر</Button>
            </div>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_100px_32px] gap-2 items-end">
                  <select
                    value={it.product_id}
                    onChange={(e) => onProductChange(i, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر منتجًا…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (المخزون: {fmt.number(p.stock_quantity, 0)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number" min="0.001" step="0.001" placeholder="الكمية"
                    value={it.quantity}
                    onChange={(e) => setItem(i, 'quantity', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number" min="0" step="0.01" placeholder="السعر"
                    value={it.unit_price}
                    onChange={(e) => setItem(i, 'unit_price', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 pb-2 text-lg font-medium">×</button>
                </div>
              ))}
            </div>
          </div>

          <Input
            label="ملاحظات (اختياري)"
            placeholder="ملاحظات الطلب أو تعليمات التسليم"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي</span>
              <span>{fmt.currency(form.items.reduce((s, it) => s + parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0), 0))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>الخصم</span>
              <span className="text-red-500">- {fmt.currency(form.discount || 0)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-2">
              <span>الإجمالي</span>
              <span className="text-indigo-600 text-base">{fmt.currency(orderTotal())}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreate}>تأكيد الطلب</Button>
          </div>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`الطلب: ${detail?.order_number}`} size="lg">
        {detail && (
          <div className="space-y-5 text-sm">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Customer',   detail.customer?.name],
                ['Status',     detail.status],
                ['Date',       fmt.dateTime(detail.created_at)],
                ['Created by', detail.creator?.name || '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-800 capitalize">{val}</p>
                </div>
              ))}
            </div>

            {/* Items table */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Product', 'Qty', 'Unit Price', 'Subtotal'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items?.map((item) => (
                      <tr key={item.id} className="border-t border-gray-50">
                        <td className="px-4 py-3">{item.product?.name}</td>
                        <td className="px-4 py-3">{fmt.number(item.quantity, 2)}</td>
                        <td className="px-4 py-3">{fmt.currency(item.unit_price)}</td>
                        <td className="px-4 py-3 font-medium">{fmt.currency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-100 bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-semibold text-right text-gray-600">Total</td>
                      <td className="px-4 py-3 font-bold text-indigo-600 text-base">{fmt.currency(detail.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {detail.notes && (
              <p className="text-gray-500 text-xs bg-gray-50 rounded-lg p-3">📝 {detail.notes}</p>
            )}

            {/* Status update */}
            {detail.status !== 'cancelled' && detail.status !== 'delivered' && (
              <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500">Update status:</span>
                <div className="flex gap-2 flex-wrap">
                  {ORDER_STATUSES.filter((s) => s !== detail.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(detail.id, s)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${STATUS_COLORS[s]} border-transparent hover:border-current`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
