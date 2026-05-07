import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUpDown, Package, History, AlertTriangle, Boxes, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import Modal from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import Badge from '../../design-system/components/atoms/Badge';
import { StatCard } from '../../design-system/components/organisms/Card';
import { Input, Select } from '../../design-system/components/atoms/Input';
import {
  getMaterials, createMaterial, updateMaterial, deleteMaterial, adjustQty,
  listPurchasesForItem,
} from '../../services/inventoryService';
import { useTranslation } from 'react-i18next';
import { fmt, errMsg } from '../../utils/formatters';
import { UNIT_TYPES } from '../../utils/constants';
import PurchaseModal from './PurchaseModal';

const EMPTY = { name: '', unit_type: 'kg', quantity: '', cost_per_unit: '', quality: '', reorder_level: '' };

export default function InventoryPage() {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null); // null | 'create' | 'edit' | 'adjust'
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [adjustForm, setAdjustForm] = useState({ delta: '', operation: 'add' });
  const [purchaseFor, setPurchaseFor] = useState(null);   // material for PurchaseModal
  const [historyFor, setHistoryFor]   = useState(null);   // material for history view
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setMaterials(await getMaterials({ search })); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(EMPTY); setSelected(null); setModal('create'); };
  const openEdit   = (m) => { setForm({ ...m, quantity: m.quantity, cost_per_unit: m.cost_per_unit, reorder_level: m.reorder_level ?? '' }); setSelected(m); setModal('edit'); };
  const openAdjust = (m) => { setSelected(m); setAdjustForm({ delta: '', operation: 'add' }); setModal('adjust'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const openHistory = async (m) => {
    setHistoryFor(m);
    setHistoryLoading(true);
    try { setHistoryList(await listPurchasesForItem(m.id)); }
    catch (e) { toast.error(errMsg(e)); setHistoryList([]); }
    finally { setHistoryLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.unit_type) return toast.error('Fill required fields.');
    setSaving(true);
    try {
      if (modal === 'edit') {
        await updateMaterial(selected.id, form);
        toast.success('Material updated.');
      } else {
        await createMaterial(form);
        toast.success('Material added.');
      }
      closeModal();
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMaterial(confirm.id);
      toast.success('Material deleted.');
      setConfirm(null);
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setDeleting(false); }
  };

  const handleAdjust = async () => {
    if (!adjustForm.delta || Number(adjustForm.delta) <= 0) return toast.error('Enter a positive value.');
    setSaving(true);
    try {
      await adjustQty(selected.id, adjustForm);
      toast.success('Quantity adjusted.');
      closeModal();
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // ── Derived: low-stock + totals ───────────────────────────────
  const isLowStock = (m) => {
    const min = parseFloat(m.reorder_level || 0);
    return min > 0 && parseFloat(m.quantity) <= min;
  };
  const lowStockMaterials = materials.filter(isLowStock);
  const totalInventoryValue = materials.reduce(
    (sum, m) => sum + parseFloat(m.quantity || 0) * parseFloat(m.cost_per_unit || 0),
    0
  );

  const columns = [
    { key: 'name',          label: t('pages.inventory.material'),  sortable: true },
    { key: 'unit_type',     label: t('pages.inventory.unit'),      render: (r) => <Badge label={r.unit_type} variant="primary" size="sm" /> },
    { key: 'quantity',      label: t('pages.inventory.quantity'),  sortable: true, sortValue: (r) => parseFloat(r.quantity),
      render: (r) => {
        const low = isLowStock(r);
        return (
          <span className="font-medium">
            <span className={low ? 'text-danger-600 dark:text-danger-400 font-bold' : ''}>{fmt.number(r.quantity, 2)}</span>
            {' '}<span style={{ color: 'var(--text-tertiary)' }}>{r.unit_type}</span>
            {low && <Badge label={t('pages.inventory.low')} variant="danger" size="sm" dot className="ml-2" />}
          </span>
        );
      },
    },
    {
      key: 'cost_per_unit', label: t('pages.inventory.costPerBaseUnit'), sortable: true,
      sortValue: (r) => parseFloat(r.cost_per_unit),
      render: (r) => (
        <span className="font-medium">
          {fmt.currency(r.cost_per_unit)}
          <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>/ {r.unit_type}</span>
        </span>
      ),
    },
    {
      key: 'value', label: t('pages.inventory.value'), sortable: true,
      sortValue: (r) => parseFloat(r.quantity || 0) * parseFloat(r.cost_per_unit || 0),
      render: (r) => (
        <span className="font-semibold text-success-600 dark:text-success-400">
          {fmt.currency(parseFloat(r.quantity || 0) * parseFloat(r.cost_per_unit || 0))}
        </span>
      ),
    },
    { key: 'quality',       label: t('pages.inventory.quality'),   render: (r) => r.quality ? <Badge label={r.quality} variant="neutral" size="sm" /> : '—' },
    { key: 'actions',       label: '', width: 180, render: (r) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" icon={Package}    onClick={() => setPurchaseFor(r)} title={t('pages.inventory.recordPurchase')} />
        <Button variant="ghost" size="sm" icon={History}    onClick={() => openHistory(r)}    title={t('pages.inventory.purchaseHistory')} />
        <Button variant="ghost" size="sm" icon={ArrowUpDown} onClick={() => openAdjust(r)}    title={t('pages.inventory.adjustQuantity')} />
        <Button variant="ghost" size="sm" icon={Pencil}      onClick={() => openEdit(r)}      title={t('common.edit')} />
        <Button variant="ghost" size="sm" icon={Trash2}      onClick={() => setConfirm(r)}    title={t('common.delete')} className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50" />
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.inventory.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.inventory.subtitle')}</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>{t('pages.inventory.addMaterial')}</Button>
      </div>

      {/* Stats summary */}
      {!loading && materials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label={t('pages.inventory.totalMaterials')}
            value={materials.length}
            icon={Boxes}
            colorClass="bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400"
          />
          <StatCard
            label={t('pages.inventory.totalValue')}
            value={fmt.currency(totalInventoryValue)}
            icon={DollarSign}
            colorClass="bg-success-100 text-success-600 dark:bg-success-950/60 dark:text-success-400"
          />
          <StatCard
            label={t('pages.inventory.lowStockCount')}
            value={lowStockMaterials.length}
            icon={AlertTriangle}
            colorClass={
              lowStockMaterials.length > 0
                ? 'bg-danger-100 text-danger-600 dark:bg-danger-950/60 dark:text-danger-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
            }
          />
        </div>
      )}

      {/* Low-stock alert banner */}
      {lowStockMaterials.length > 0 && (
        <div
          className="rounded-lg border p-4 flex items-start gap-3"
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            borderColor: 'rgba(234, 179, 8, 0.35)',
          }}
        >
          <AlertTriangle size={20} className="text-warning-600 dark:text-warning-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warning-700 dark:text-warning-400 mb-1.5">
              {t('pages.inventory.lowStockAlertTitle')}
            </p>
            <ul className="space-y-0.5">
              {lowStockMaterials.map((m) => (
                <li key={m.id} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  &bull; <span className="font-semibold">{m.name}</span>
                  {' — '}
                  <span className="text-danger-600 dark:text-danger-400 font-semibold">
                    {t('pages.inventory.remaining')}: {fmt.number(m.quantity, 2)} {m.unit_type}
                  </span>
                  {' '}
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    ({t('pages.inventory.min')}: {fmt.number(m.reorder_level, 2)})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={materials}
        loading={loading}
        emptyMessage={t('pages.inventory.noMaterials')}
        searchable
        searchPlaceholder={t('pages.inventory.searchPlaceholder')}
        striped
      />

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={closeModal} title={modal === 'edit' ? t('pages.inventory.editMaterial') : t('pages.inventory.addMaterial')}>
        <div className="space-y-4">
          <Input label={t('common.name') + ' *'} placeholder="e.g. Steel Rod" value={form.name} onChange={field('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('pages.inventory.unitType') + ' *'} value={form.unit_type} onChange={field('unit_type')}>
              {UNIT_TYPES.map((u) => <option key={u}>{u}</option>)}
            </Select>
            <Input label={t('pages.inventory.quality')} placeholder="e.g. Grade A" value={form.quality} onChange={field('quality')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('pages.inventory.startingQuantity')}
              type="number" min="0" placeholder="0"
              value={form.quantity} onChange={field('quantity')}
              helperText={t('pages.inventory.startingQuantityHint')}
            />
            <Input
              label={t('pages.inventory.costPerBaseUnit')}
              type="number" min="0" step="0.01" placeholder="0.00"
              value={form.cost_per_unit} onChange={field('cost_per_unit')}
              helperText={t('pages.inventory.costHint')}
            />
          </div>
          <Input label={t('pages.inventory.reorderLevel')} type="number" min="0" placeholder="0" value={form.reorder_level} onChange={field('reorder_level')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {modal === 'edit' ? t('common.saveChanges') : t('pages.inventory.addMaterial')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Adjust Quantity Modal */}
      <Modal open={modal === 'adjust'} onClose={closeModal} title={`Adjust: ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current quantity: <strong>{fmt.number(selected?.quantity, 2)} {selected?.unit_type}</strong></p>
          <Select label="Operation" value={adjustForm.operation} onChange={(e) => setAdjustForm((f) => ({ ...f, operation: e.target.value }))}>
            <option value="add">Add stock</option>
            <option value="subtract">Remove stock</option>
            <option value="set">Set exact quantity</option>
          </Select>
          <Input label="Amount" type="number" min="0.001" step="0.001" placeholder="0.00" value={adjustForm.delta} onChange={(e) => setAdjustForm((f) => ({ ...f, delta: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleAdjust}>Apply</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t('common.delete') + ' — ' + (confirm?.name || '')}
        message={t('pages.inventory.deleteConfirm', { name: confirm?.name })}
      />

      {/* ── Record Purchase ── */}
      <PurchaseModal
        open={!!purchaseFor}
        material={purchaseFor}
        onClose={() => setPurchaseFor(null)}
        onSuccess={load}
      />

      {/* ── Purchase History ── */}
      <Modal
        open={!!historyFor}
        onClose={() => { setHistoryFor(null); setHistoryList([]); }}
        title={
          <span className="flex items-center gap-2">
            <History size={16} /> {t('pages.inventory.purchaseHistory')} — {historyFor?.name}
          </span>
        }
        size="lg"
      >
        {historyLoading ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>{t('common.loading')}</p>
        ) : historyList.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>{t('pages.inventory.noPurchases')}</p>
        ) : (
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {historyList.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border p-3 text-sm"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {fmt.currency(p.total_cost)} → {fmt.number(p.total_base_quantity, 2)} {historyFor?.unit_type}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {fmt.date(p.created_at)}
                  </span>
                </div>
                <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {(p.levels || []).map((l) => `${l.quantity} ${l.label}`).join(' × ')}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>Unit cost: <strong style={{ color: 'var(--text-primary)' }}>{fmt.currency(p.purchase_unit_cost)}</strong></span>
                  <span>After-avg: <strong style={{ color: 'var(--text-primary)' }}>{fmt.currency(p.resulting_cost_per_base_unit)}</strong></span>
                  {p.supplier && <span>Supplier: <strong style={{ color: 'var(--text-primary)' }}>{p.supplier}</strong></span>}
                </div>
                {p.note && (
                  <p className="text-xs mt-1 italic" style={{ color: 'var(--text-tertiary)' }}>“{p.note}”</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
