import { useEffect, useState } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../design-system/components/atoms/Button';
import Modal from '../../design-system/components/organisms/Modal';
import { Input } from '../../design-system/components/atoms/Input';
import BatchDayTimeline from './BatchDayTimeline';
import { getBatches, getRecipes, runBatch, updateBatch } from '../../services/productionService';
import { fmt, errMsg } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function shiftDateStr(ymd, deltaDays) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  return localDateStr(dt);
}

const BATCH_STATUS_AR = {
  pending: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const BATCH_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

export default function BatchesPage() {
  const { t } = useTranslation();
  const [viewDate, setViewDate] = useState(() => localDateStr());
  const [batches, setBatches] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [editForm, setEditForm] = useState({
    schedule_date: '',
    start_time: '',
    end_time: '',
    status: 'completed',
  });

  const [form, setForm] = useState({
    product_id: '',
    recipe_id: '',
    quantity_multiplier: 1,
    notes: '',
    schedule_date: localDateStr(),
    start_time: '09:00',
    end_time: '10:00',
    status: 'completed',
  });

  const load = async () => {
    setLoading(true);
    try {
      const b = await getBatches({ date: viewDate });
      setBatches(b);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [viewDate]);

  useEffect(() => {
    getRecipes().then(setRecipes).catch(() => {});
  }, []);

  const reload = () => getBatches({ date: viewDate }).then(setBatches);

  const selectedRecipe = recipes.find((r) => r.id === form.recipe_id);
  const producibleProducts = Array.from(
    new Map(
      recipes.flatMap((r) => (r.outputs || []).map((o) => [o.product?.id, o.product])).filter(([id]) => !!id)
    ).values()
  );
  const filteredRecipes = form.product_id
    ? recipes.filter((r) => (r.outputs || []).some((o) => o.product_id === form.product_id))
    : [];

  const estimatedCost = () => {
    if (!selectedRecipe) return 0;
    const matCost = selectedRecipe.recipeMaterials?.reduce((sum, rm) => {
      return sum + parseFloat(rm.quantity_required || 0) * parseFloat(rm.rawMaterial?.cost_per_unit || 0);
    }, 0) || 0;
    return (matCost + parseFloat(selectedRecipe.production_cost || 0)) * parseFloat(form.quantity_multiplier || 1);
  };

  const openRun = () => {
    setForm({
      product_id: '',
      recipe_id: '',
      quantity_multiplier: 1,
      notes: '',
      schedule_date: viewDate,
      start_time: '09:00',
      end_time: '10:00',
      status: 'completed',
    });
    setModal(true);
  };

  const openEdit = (b) => {
    const j = typeof b.toJSON === 'function' ? b.toJSON() : { ...b };
    const sd = j.schedule_date ? String(j.schedule_date).slice(0, 10) : viewDate;
    const st = j.start_time ? String(j.start_time).slice(0, 5) : '09:00';
    const en = j.end_time ? String(j.end_time).slice(0, 5) : '10:00';
    setEditBatch(j);
    setEditForm({
      schedule_date: sd,
      start_time: st,
      end_time: en,
      status: j.status || 'completed',
    });
    setEditOpen(true);
  };

  const handleRun = async () => {
    if (!form.product_id) return toast.error('اختر منتجًا.');
    if (!form.recipe_id) return toast.error('اختر وصفة مرتبطة بالمنتج.');
    if (Number(form.quantity_multiplier) <= 0) return toast.error('المضاعف يجب أن يكون أكبر من صفر.');
    setSaving(true);
    try {
      await runBatch({
        recipe_id: form.recipe_id,
        quantity_multiplier: form.quantity_multiplier,
        notes: form.notes || undefined,
        schedule_date: form.schedule_date,
        start_time: form.start_time || undefined,
        end_time: form.end_time || undefined,
        status: form.status,
      });
      toast.success('تم تنفيذ الدفعة الإنتاجية بنجاح!');
      setModal(false);
      await reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editBatch) return;
    setEditSaving(true);
    try {
      await updateBatch(editBatch.id, {
        schedule_date: editForm.schedule_date,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        status: editForm.status,
      });
      toast.success('تم حفظ الدفعة.');
      setEditOpen(false);
      setEditBatch(null);
      await reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.production.batches')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.production.title')}</p>
        </div>
        <Button icon={Play} onClick={openRun}>تشغيل دفعة</Button>
      </div>

      {/* اختيار اليوم */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={ChevronRight} onClick={() => setViewDate((d) => shiftDateStr(d, -1))} aria-label="اليوم السابق" />
          <input
            type="date"
            value={viewDate}
            onChange={(e) => setViewDate(e.target.value)}
            className="ds-input h-9 text-sm"
          />
          <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setViewDate((d) => shiftDateStr(d, 1))} aria-label="اليوم التالي" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => setViewDate(localDateStr())}>اليوم</Button>
      </div>

      {loading ? (
        <div className="card py-16 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>جاري التحميل…</div>
      ) : (
        <BatchDayTimeline batches={batches} statusLabels={BATCH_STATUS_AR} onSelectBatch={openEdit} />
      )}

      {/* Run Batch Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="تشغيل دفعة إنتاج" size="lg">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>المنتج *</label>
            <select
              value={form.product_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  product_id: e.target.value,
                  recipe_id: '',
                }))
              }
              className="ds-input h-9 text-sm"
            >
              <option value="">اختر منتجًا…</option>
              {producibleProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>الوصفة *</label>
            <select
              disabled={!form.product_id}
              value={form.recipe_id}
              onChange={(e) => setForm((f) => ({ ...f, recipe_id: e.target.value }))}
              className="ds-input h-9 text-sm"
            >
              <option value="">{form.product_id ? 'اختر وصفة…' : 'اختر منتجًا أولًا'}</option>
              {filteredRecipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {selectedRecipe && (
            <div className="rounded-lg p-3 text-xs space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>تفاصيل الوصفة</p>
              {selectedRecipe.recipeMaterials?.map((rm) => (
                <div key={rm.id} className="flex justify-between">
                  <span>{rm.rawMaterial?.name}</span>
                  <span>{fmt.number(rm.quantity_required, 2)} {rm.rawMaterial?.unit_type} (المتاح: {fmt.number(rm.rawMaterial?.quantity, 2)})</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <span>النواتج</span>
                <span>{selectedRecipe.outputs?.map((o) => `${fmt.number(o.quantity_produced, 0)} × ${o.product?.name}`).join(', ')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>يوم الدفعة</label>
              <input
                type="date"
                value={form.schedule_date}
                onChange={(e) => setForm((f) => ({ ...f, schedule_date: e.target.value }))}
                className="ds-input h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>بداية</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="ds-input h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>نهاية</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                className="ds-input h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>الحالة</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="ds-input h-9 text-sm"
              >
                {BATCH_STATUSES.map((s) => (
                  <option key={s} value={s}>{BATCH_STATUS_AR[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="مضاعف الكمية"
            type="number" min="0.01" step="0.01"
            value={form.quantity_multiplier}
            onChange={(e) => setForm((f) => ({ ...f, quantity_multiplier: e.target.value }))}
          />
          <Input
            label="ملاحظات (اختياري)"
            placeholder="مثال: دفعة مستعجلة"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          {estimatedCost() > 0 && (
            <div className="bg-primary-50 dark:bg-primary-950/40 rounded-lg px-4 py-3 text-sm">
              <div className="flex justify-between text-primary-700 dark:text-primary-300">
                <span>التكلفة الإجمالية التقديرية</span>
                <strong>{fmt.currency(estimatedCost())}</strong>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>إلغاء</Button>
            <Button className="flex-1" icon={Play} loading={saving} onClick={handleRun}>تشغيل الدفعة</Button>
          </div>
        </div>
      </Modal>

      {/* Edit batch (time + status) */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditBatch(null); }} title={editBatch ? `تعديل: ${editBatch.batch_number}` : ''}>
        {editBatch && (
          <div className="space-y-4 text-sm">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{editBatch.recipe?.name}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>يوم الدفعة</label>
                <input
                  type="date"
                  value={editForm.schedule_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, schedule_date: e.target.value }))}
                  className="ds-input h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>الحالة</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="ds-input h-9 text-sm"
                >
                  {BATCH_STATUSES.map((s) => (
                    <option key={s} value={s}>{BATCH_STATUS_AR[s]}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>بداية</label>
                <input
                  type="time"
                  value={editForm.start_time}
                  onChange={(e) => setEditForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="ds-input h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>نهاية</label>
                <input
                  type="time"
                  value={editForm.end_time}
                  onChange={(e) => setEditForm((f) => ({ ...f, end_time: e.target.value }))}
                  className="ds-input h-9 text-sm"
                />
              </div>
            </div>
            <div className="rounded-lg p-3 text-xs space-y-1" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              <div className="flex justify-between"><span>المواد الخام</span><span>{fmt.currency(editBatch.raw_materials_cost)}</span></div>
              <div className="flex justify-between"><span>الإجمالي</span><span className="font-semibold">{fmt.currency(editBatch.total_cost)}</span></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setEditOpen(false); setEditBatch(null); }}>إلغاء</Button>
              <Button className="flex-1" loading={editSaving} onClick={handleEditSave}>حفظ</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
