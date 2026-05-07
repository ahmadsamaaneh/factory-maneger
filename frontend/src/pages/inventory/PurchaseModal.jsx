import { useMemo, useState } from 'react';
import { Plus, Trash2, Package, DollarSign, Calculator, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import { createPurchase } from '../../services/inventoryService';
import { fmt, errMsg } from '../../utils/formatters';

/**
 * Template presets so users don't have to think about structure.
 * Each level: { label, quantity, placeholder? }
 * First level = count you're purchasing (e.g. number of sacks).
 * Subsequent levels = "per parent" ratio (e.g. kg per sack).
 */
const PRESETS = {
  single: {
    name: 'Single Unit',
    hint: 'You buy directly in the base unit (no conversion).',
    build: (baseUnit) => [{ label: baseUnit, quantity: '' }],
  },
  weight: {
    name: 'Sack / Container → Weight',
    hint: 'E.g. buy 10 sacks, each weighing 25 kg.',
    build: (baseUnit) => [
      { label: 'Sacks',                 quantity: '' },
      { label: `${baseUnit} per sack`,  quantity: '' },
    ],
  },
  packaging: {
    name: 'Master Pack → Bundle → Carton',
    hint: 'E.g. buy 5 master packs, 10 bundles each, 12 cartons per bundle.',
    build: () => [
      { label: 'Master Packs',          quantity: '' },
      { label: 'Bundles per Master',    quantity: '' },
      { label: 'Cartons per Bundle',    quantity: '' },
    ],
  },
  custom: {
    name: 'Custom Levels',
    hint: 'Add as many conversion levels as you need.',
    build: (baseUnit) => [
      { label: 'Outer Unit',            quantity: '' },
      { label: `${baseUnit} per outer`, quantity: '' },
    ],
  },
};

export default function PurchaseModal({ open, material, onClose, onSuccess }) {
  const [presetKey, setPresetKey] = useState('weight');
  const [levels, setLevels]       = useState(() => PRESETS.weight.build(material?.unit_type || 'kg'));
  const [totalCost, setTotalCost] = useState('');
  const [supplier, setSupplier]   = useState('');
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);

  // Reset form when material changes / modal re-opens
  const resetForm = (preset = 'weight') => {
    setPresetKey(preset);
    setLevels(PRESETS[preset].build(material?.unit_type || 'kg'));
    setTotalCost('');
    setSupplier('');
    setNote('');
  };

  const baseUnit = material?.unit_type || 'unit';

  // ─── Live calculation preview ───────────────────────────────────
  const preview = useMemo(() => {
    const qtys = levels.map((l) => Number(l.quantity));
    if (qtys.some((q) => !Number.isFinite(q) || q <= 0)) return null;

    const cost = Number(totalCost);
    if (!Number.isFinite(cost) || cost <= 0) return null;

    const totalBase = qtys.reduce((a, b) => a * b, 1);
    const unitCost  = cost / totalBase;

    const eQty  = Number(material?.quantity)      || 0;
    const eCost = Number(material?.cost_per_unit) || 0;
    const newQty  = eQty + totalBase;
    const newCost = newQty > 0 ? (eQty * eCost + cost) / newQty : unitCost;

    return { totalBase, unitCost, newQty, newCost, eQty, eCost };
  }, [levels, totalCost, material]);

  // ─── Level manipulation ─────────────────────────────────────────
  const updateLevel = (i, patch) => {
    setLevels((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addLevel = () => setLevels((ls) => [...ls, { label: '', quantity: '' }]);
  const removeLevel = (i) => {
    if (levels.length <= 1) return;
    setLevels((ls) => ls.filter((_, idx) => idx !== i));
  };

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!preview) return toast.error('Fill all quantities and total cost with valid numbers.');
    if (levels.some((l) => !l.label.trim())) return toast.error('Each level needs a label.');

    setSaving(true);
    try {
      await createPurchase(material.id, {
        levels: levels.map((l) => ({ label: l.label.trim(), quantity: Number(l.quantity) })),
        total_cost: Number(totalCost),
        supplier: supplier.trim() || null,
        note: note.trim() || null,
      });
      toast.success(`Purchase recorded. New stock: ${fmt.number(preview.newQty, 2)} ${baseUnit}.`);
      onSuccess?.();
      resetForm('weight');
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (!material) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Package size={18} />
          Record Purchase — {material.name}
        </span>
      }
      size="lg"
    >
      <div className="space-y-5">
        {/* ─── Current stock snapshot ─── */}
        <div
          className="rounded-lg p-3 text-sm grid grid-cols-2 gap-3"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Current Stock</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {fmt.number(material.quantity, 2)} {baseUnit}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Current Cost / {baseUnit}</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {fmt.currency(material.cost_per_unit)}
            </p>
          </div>
        </div>

        {/* ─── Preset picker ─── */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Purchase Structure
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(PRESETS).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => resetForm(key)}
                className={`text-left p-2 rounded-lg border text-xs transition-colors ${
                  presetKey === key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
                style={presetKey !== key ? { borderColor: 'var(--border-subtle)' } : {}}
              >
                <div className="font-medium">{cfg.name}</div>
              </button>
            ))}
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            {PRESETS[presetKey].hint}
          </p>
        </div>

        {/* ─── Levels ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Conversion Levels
            </label>
            <Button variant="ghost" size="sm" icon={Plus} onClick={addLevel}>
              Add Level
            </Button>
          </div>

          {levels.map((lvl, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label={i === 0 ? 'Unit Label' : undefined}
                  placeholder={i === 0 ? 'e.g. Sacks' : `Per ${levels[i - 1]?.label || 'parent'} — e.g. ${baseUnit}`}
                  value={lvl.label}
                  onChange={(e) => updateLevel(i, { label: e.target.value })}
                />
              </div>
              <div className="w-32">
                <Input
                  label={i === 0 ? 'Quantity' : undefined}
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0"
                  value={lvl.quantity}
                  onChange={(e) => updateLevel(i, { quantity: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => removeLevel(i)}
                disabled={levels.length <= 1}
                className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50 mb-0.5"
              />
            </div>
          ))}

          {/* Chain visual */}
          {levels.length > 1 && (
            <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {levels.map((l, i) => `${l.quantity || '?'} ${l.label || '?'}`).join(' × ')}
              {' '}= {preview ? fmt.number(preview.totalBase, 2) : '?'} {baseUnit}
            </p>
          )}
        </div>

        {/* ─── Cost inputs ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Total Cost"
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            prefix={<DollarSign size={13} />}
          />
          <Input
            label="Supplier"
            placeholder="Optional"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </div>
        <Input
          label="Note"
          placeholder="Optional notes about this purchase…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* ─── Live preview panel ─── */}
        {preview && (
          <div
            className="rounded-lg border p-4 space-y-3"
            style={{
              borderColor: 'var(--color-primary-200)',
              backgroundColor: 'var(--color-primary-50)',
            }}
          >
            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--color-primary-700)' }}>
              <Calculator size={16} />
              Live Calculation
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Base Quantity</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {fmt.number(preview.totalBase, 2)} {baseUnit}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Cost per {baseUnit} (this purchase)</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {fmt.currency(preview.unitCost)}
                </p>
              </div>
            </div>

            <div
              className="pt-3 border-t grid grid-cols-2 gap-x-4 gap-y-2 text-sm"
              style={{ borderColor: 'var(--color-primary-200)' }}
            >
              <div>
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                  <TrendingUp size={11} /> New Total Stock
                </p>
                <p className="font-bold" style={{ color: 'var(--color-success-600)' }}>
                  {fmt.number(preview.newQty, 2)} {baseUnit}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  New Weighted-Avg Cost / {baseUnit}
                </p>
                <p className="font-bold" style={{ color: 'var(--color-success-600)' }}>
                  {fmt.currency(preview.newCost)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Actions ─── */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            icon={Package}
            loading={saving}
            disabled={!preview}
            onClick={handleSubmit}
          >
            Record Purchase
          </Button>
        </div>
      </div>
    </Modal>
  );
}
