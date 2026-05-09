import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Lock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { StatCard } from '../../design-system/components/organisms/Card';
import {
  closeCashVanReconciliation,
  getCashVanReconciliationById,
  getCashVanReconciliations,
  getCashVanVehicleStock,
  getCashVanVehicles,
  openCashVanReconciliation,
} from '../../services/cashVanService';
import { errMsg, fmt } from '../../utils/formatters';

export default function CashVanReconciliationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [rows, setRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [detail, setDetail] = useState(null);

  const [openForm, setOpenForm] = useState({ vehicle_id: '', business_date: new Date().toISOString().slice(0, 10) });
  const [closeForm, setCloseForm] = useState({ reconciliation_id: '', cash_collected: '', notes: '', items: [] });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [v, r] = await Promise.all([getCashVanVehicles(), getCashVanReconciliations()]);
      setVehicles(v);
      setRows(r);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openNewReconciliation = async () => {
    if (!openForm.vehicle_id || !openForm.business_date) return toast.error('اختر السيارة والتاريخ.');
    setSaving(true);
    try {
      await openCashVanReconciliation(openForm);
      toast.success('تم فتح يومية الكاش فان.');
      setOpenModal(false);
      await loadAll();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const openCloseModal = async (row) => {
    try {
      const stocks = await getCashVanVehicleStock(row.vehicle_id);
      setCloseForm({
        reconciliation_id: row.id,
        cash_collected: '',
        notes: '',
        items: stocks.map((s) => ({
          product_id: s.product_id,
          product_name: s.product?.name || '—',
          system_qty: parseFloat(s.quantity || 0),
          physical_qty: parseFloat(s.quantity || 0),
          unit_cost: parseFloat(s.product?.cost || 0),
        })),
      });
      setCloseModal(true);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const closeCurrentReconciliation = async () => {
    if (!closeForm.reconciliation_id) return;
    setSaving(true);
    try {
      await closeCashVanReconciliation(closeForm.reconciliation_id, {
        cash_collected: Number(closeForm.cash_collected || 0),
        notes: closeForm.notes || null,
        items: closeForm.items.map((i) => ({
          product_id: i.product_id,
          physical_qty: Number(i.physical_qty || 0),
        })),
      });
      toast.success('تم إقفال اليومية وحساب الفروقات.');
      setCloseModal(false);
      await loadAll();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const varianceTotal = useMemo(
    () =>
      closeForm.items.reduce((sum, i) => {
        const varianceQty = Number(i.physical_qty || 0) - Number(i.system_qty || 0);
        return sum + varianceQty * Number(i.unit_cost || 0);
      }, 0),
    [closeForm.items]
  );

  if (loading) return <PageSpinner label="جار تحميل الجرد والإقفال..." />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>جرد وإقفال الكاش فان</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Workflow: فتح يومية ← إدخال الجرد الفعلي ← مقارنة بالنظام ← إقفال اليومية وتسجيل التحصيل.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setOpenModal(true)}>فتح يومية</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="إجمالي اليوميات" value={rows.length} icon={ClipboardCheck} colorClass="bg-indigo-100 text-indigo-600" />
        <StatCard label="مفتوحة" value={rows.filter((r) => r.status === 'open').length} icon={ClipboardCheck} colorClass="bg-amber-100 text-amber-600" />
        <StatCard label="مقفلة" value={rows.filter((r) => r.status === 'closed').length} icon={Lock} colorClass="bg-emerald-100 text-emerald-600" />
      </div>

      <DataTable
        columns={[
          { key: 'business_date', label: 'تاريخ اليومية' },
          { key: 'vehicle', label: 'السيارة', render: (r) => `${r.vehicle?.code || '-'} / ${r.vehicle?.plate_number || '-'}` },
          { key: 'status', label: 'الحالة', render: (r) => (r.status === 'closed' ? 'مقفلة' : 'مفتوحة') },
          { key: 'cash_collected', label: 'التحصيل النقدي', render: (r) => fmt.currency(r.cash_collected) },
          { key: 'variance_value', label: 'قيمة الفروقات', render: (r) => fmt.currency(r.variance_value) },
          {
            key: 'actions',
            label: '',
            width: 160,
            render: (r) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={async () => setDetail(await getCashVanReconciliationById(r.id))}>عرض</Button>
                {r.status === 'open' && <Button variant="secondary" size="sm" onClick={() => openCloseModal(r)}>إقفال</Button>}
              </div>
            ),
          },
        ]}
        data={rows}
        emptyMessage="لا توجد يوميات جرد."
      />

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="فتح يومية كاش فان" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">السيارة *</label>
            <select className="ds-input h-9 text-sm mt-1" value={openForm.vehicle_id} onChange={(e) => setOpenForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">اختر سيارة...</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.code} - {v.plate_number}</option>)}
            </select>
          </div>
          <Input label="تاريخ اليومية" type="date" value={openForm.business_date} onChange={(e) => setOpenForm((f) => ({ ...f, business_date: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpenModal(false)}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={openNewReconciliation}>فتح اليومية</Button>
          </div>
        </div>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="إقفال يومية الكاش فان" size="lg">
        <div className="space-y-4">
          <Input
            label="التحصيل النقدي"
            type="number"
            min="0"
            step="0.01"
            value={closeForm.cash_collected}
            onChange={(e) => setCloseForm((f) => ({ ...f, cash_collected: e.target.value }))}
          />
          <div>
            <p className="text-sm font-semibold mb-2">الجرد الفعلي مقابل النظام</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {closeForm.items.map((item, idx) => (
                <div key={item.product_id} className="grid grid-cols-[1fr_120px_120px_120px] gap-2 items-end">
                  <div className="text-sm">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      النظام: {fmt.number(item.system_qty, 2)}
                    </p>
                  </div>
                  <input
                    className="ds-input h-9 text-sm"
                    type="number"
                    min="0"
                    step="0.001"
                    value={item.physical_qty}
                    onChange={(e) =>
                      setCloseForm((f) => ({
                        ...f,
                        items: f.items.map((row, i) =>
                          i === idx ? { ...row, physical_qty: e.target.value } : row
                        ),
                      }))
                    }
                  />
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    فرق الكمية: {fmt.number(Number(item.physical_qty || 0) - Number(item.system_qty || 0), 2)}
                  </div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    فرق القيمة: {fmt.currency((Number(item.physical_qty || 0) - Number(item.system_qty || 0)) * Number(item.unit_cost || 0))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Input label="ملاحظات الإقفال" value={closeForm.notes} onChange={(e) => setCloseForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--bg-subtle)' }}>
            إجمالي الفروقات (قيمة): <strong>{fmt.currency(varianceTotal)}</strong>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCloseModal(false)}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={closeCurrentReconciliation}>إقفال اليومية</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`تفاصيل اليومية: ${detail?.business_date || ''}`} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="card p-3"><p className="text-xs text-neutral-500">السيارة</p><p className="font-medium">{detail.vehicle?.code} - {detail.vehicle?.plate_number}</p></div>
              <div className="card p-3"><p className="text-xs text-neutral-500">الحالة</p><p className="font-medium">{detail.status === 'closed' ? 'مقفلة' : 'مفتوحة'}</p></div>
              <div className="card p-3"><p className="text-xs text-neutral-500">التحصيل</p><p className="font-medium">{fmt.currency(detail.cash_collected)}</p></div>
              <div className="card p-3"><p className="text-xs text-neutral-500">الفروقات</p><p className="font-medium">{fmt.currency(detail.variance_value)}</p></div>
            </div>
            <DataTable
              columns={[
                { key: 'product', label: 'المنتج', render: (r) => r.product?.name || '—' },
                { key: 'system_qty', label: 'كمية النظام', render: (r) => fmt.number(r.system_qty, 2) },
                { key: 'physical_qty', label: 'الكمية الفعلية', render: (r) => fmt.number(r.physical_qty, 2) },
                { key: 'variance_qty', label: 'فرق الكمية', render: (r) => fmt.number(r.variance_qty, 2) },
                { key: 'variance_value', label: 'فرق القيمة', render: (r) => fmt.currency(r.variance_value) },
              ]}
              data={detail.items || []}
              emptyMessage="لا توجد بنود جرد."
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
