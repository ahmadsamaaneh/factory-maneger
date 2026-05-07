import { useEffect, useState } from 'react';
import { Play, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Button from '../../design-system/components/atoms/Button';
import Modal from '../../design-system/components/organisms/Modal';
import { Input } from '../../design-system/components/atoms/Input';
import Badge from '../../design-system/components/atoms/Badge';
import { getBatches, getRecipes, runBatch } from '../../services/productionService';
import { fmt, errMsg } from '../../utils/formatters';
import { STATUS_COLORS } from '../../utils/constants';
import { useTranslation } from 'react-i18next';

export default function BatchesPage() {
  const { t } = useTranslation();
  const [batches,  setBatches]  = useState([]);
  const [recipes,  setRecipes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [detail,   setDetail]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ recipe_id: '', quantity_multiplier: 1, notes: '' });

  useEffect(() => {
    Promise.all([
      getBatches().then(setBatches),
      getRecipes().then(setRecipes),
    ]).finally(() => setLoading(false));
  }, []);

  const reload = () => getBatches().then(setBatches);

  const selectedRecipe = recipes.find((r) => r.id === form.recipe_id);

  const estimatedCost = () => {
    if (!selectedRecipe) return 0;
    const matCost = selectedRecipe.recipeMaterials?.reduce((sum, rm) => {
      return sum + parseFloat(rm.quantity_required || 0) * parseFloat(rm.rawMaterial?.cost_per_unit || 0);
    }, 0) || 0;
    return (matCost + parseFloat(selectedRecipe.production_cost || 0)) * parseFloat(form.quantity_multiplier || 1);
  };

  const handleRun = async () => {
    if (!form.recipe_id) return toast.error('Select a recipe.');
    if (Number(form.quantity_multiplier) <= 0) return toast.error('Multiplier must be > 0.');
    setSaving(true);
    try {
      await runBatch(form);
      toast.success('Production batch completed!');
      setModal(false);
      reload();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'batch_number', label: 'Batch #',     render: (r) => <span className="font-mono text-xs">{r.batch_number}</span> },
    { key: 'recipe',       label: 'Recipe',       render: (r) => r.recipe?.name || '—' },
    { key: 'multiplier',   label: '× Qty',        render: (r) => `×${r.quantity_multiplier}` },
    { key: 'raw_cost',     label: 'Materials',    render: (r) => fmt.currency(r.raw_materials_cost) },
    { key: 'total_cost',   label: 'Total Cost',   render: (r) => <span className="font-semibold">{fmt.currency(r.total_cost)}</span> },
    { key: 'cost_per_unit',label: 'Cost/Unit',    render: (r) => fmt.currency(r.cost_per_unit) },
    { key: 'status',       label: 'Status',       render: (r) => <Badge label={r.status} className={STATUS_COLORS[r.status]} size="sm" dot /> },
    { key: 'created_at',   label: 'Date',         render: (r) => fmt.date(r.created_at) },
    { key: 'actions',      label: '',   width: 60, render: (r) => (
      <Button variant="ghost" size="sm" icon={Eye} onClick={() => setDetail(r)} />
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.production.batches')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.production.title')}</p>
        </div>
        <Button icon={Play} onClick={() => setModal(true)}>Run Batch</Button>
      </div>

      <DataTable columns={columns} data={batches} loading={loading} emptyMessage="No batches yet. Run your first production batch." striped />

      {/* Run Batch Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Run Production Batch">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Recipe *</label>
            <select
              value={form.recipe_id}
              onChange={(e) => setForm((f) => ({ ...f, recipe_id: e.target.value }))}
              className="ds-input h-9 text-sm"
            >
              <option value="">Select a recipe…</option>
              {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {selectedRecipe && (
            <div className="rounded-lg p-3 text-xs space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Recipe details</p>
              {selectedRecipe.recipeMaterials?.map((rm) => (
                <div key={rm.id} className="flex justify-between">
                  <span>{rm.rawMaterial?.name}</span>
                  <span>{fmt.number(rm.quantity_required, 2)} {rm.rawMaterial?.unit_type} (avail: {fmt.number(rm.rawMaterial?.quantity, 2)})</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <span>Outputs</span>
                <span>{selectedRecipe.outputs?.map((o) => `${fmt.number(o.quantity_produced, 0)} × ${o.product?.name}`).join(', ')}</span>
              </div>
            </div>
          )}

          <Input
            label="Quantity Multiplier"
            type="number" min="0.01" step="0.01"
            value={form.quantity_multiplier}
            onChange={(e) => setForm((f) => ({ ...f, quantity_multiplier: e.target.value }))}
          />
          <Input
            label="Notes (optional)"
            placeholder="e.g. Priority batch"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          {estimatedCost() > 0 && (
            <div className="bg-primary-50 dark:bg-primary-950/40 rounded-lg px-4 py-3 text-sm">
              <div className="flex justify-between text-primary-700 dark:text-primary-300">
                <span>Estimated Total Cost</span>
                <strong>{fmt.currency(estimatedCost())}</strong>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" icon={Play} loading={saving} onClick={handleRun}>Run Batch</Button>
          </div>
        </div>
      </Modal>

      {/* Batch Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Batch: ${detail?.batch_number}`}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Recipe',          detail.recipe?.name],
                ['Multiplier',      `×${detail.quantity_multiplier}`],
                ['Status',          detail.status],
                ['Date',            fmt.date(detail.created_at)],
                ['Materials Cost',  fmt.currency(detail.raw_materials_cost)],
                ['Production Cost', fmt.currency(detail.production_cost)],
                ['Total Cost',      fmt.currency(detail.total_cost)],
                ['Cost per Unit',   fmt.currency(detail.cost_per_unit)],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{val}</p>
                </div>
              ))}
            </div>
            {detail.notes && <p className="text-xs rounded-lg p-3" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>📝 {detail.notes}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
