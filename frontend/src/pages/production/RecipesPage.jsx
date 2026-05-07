import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../design-system/components/atoms/Button';
import Modal from '../../design-system/components/organisms/Modal';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import { Input, Textarea } from '../../design-system/components/atoms/Input';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { getRecipes, createRecipe, deleteRecipe } from '../../services/productionService';
import { getMaterials } from '../../services/inventoryService';
import { getProducts } from '../../services/productService';
import { fmt, errMsg } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const emptyMaterial = () => ({ raw_material_id: '', quantity_required: '' });
const emptyOutput   = () => ({ product_id: '', quantity_produced: '' });

export default function RecipesPage() {
  const { t } = useTranslation();
  const [recipes,   setRecipes]   = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [confirm,   setConfirm]   = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [expanded,  setExpanded]  = useState({});

  const [form, setForm] = useState({
    name: '', description: '', production_cost: '',
    materials: [emptyMaterial()],
    outputs:   [emptyOutput()],
  });

  useEffect(() => {
    Promise.all([
      getRecipes().then(setRecipes),
      getMaterials().then(setMaterials),
      getProducts().then(setProducts),
    ]).finally(() => setLoading(false));
  }, []);

  const reload = () => getRecipes().then(setRecipes);

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const addMaterialRow = () => setForm((f) => ({ ...f, materials: [...f.materials, emptyMaterial()] }));
  const addOutputRow   = () => setForm((f) => ({ ...f, outputs: [...f.outputs, emptyOutput()] }));

  const removeMaterialRow = (i) => setForm((f) => ({ ...f, materials: f.materials.filter((_, idx) => idx !== i) }));
  const removeOutputRow   = (i) => setForm((f) => ({ ...f, outputs:   f.outputs.filter((_, idx) => idx !== i) }));

  const setMaterialRow = (i, key, val) =>
    setForm((f) => ({ ...f, materials: f.materials.map((m, idx) => idx === i ? { ...m, [key]: val } : m) }));
  const setOutputRow = (i, key, val) =>
    setForm((f) => ({ ...f, outputs: f.outputs.map((o, idx) => idx === i ? { ...o, [key]: val } : o) }));

  const estimatedCost = () => {
    const matCost = form.materials.reduce((sum, m) => {
      const mat = materials.find((x) => x.id === m.raw_material_id);
      return sum + (mat ? parseFloat(mat.cost_per_unit || 0) * parseFloat(m.quantity_required || 0) : 0);
    }, 0);
    return matCost + parseFloat(form.production_cost || 0);
  };

  const handleSave = async () => {
    if (!form.name || !form.production_cost) return toast.error('Name and production cost are required.');
    if (form.materials.some((m) => !m.raw_material_id || !m.quantity_required)) return toast.error('Fill all material rows.');
    if (form.outputs.some((o) => !o.product_id || !o.quantity_produced)) return toast.error('Fill all output rows.');
    setSaving(true);
    try {
      await createRecipe(form);
      toast.success('Recipe created.');
      setModal(false);
      reload();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteRecipe(confirm.id); toast.success('Recipe deleted.'); setConfirm(null); reload(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setDeleting(false); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.production.recipes')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.production.title')}</p>
        </div>
        <Button icon={Plus} onClick={() => setModal(true)}>New Recipe</Button>
      </div>

      {recipes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No recipes yet. Create your first production recipe.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => (
            <div key={r.id} className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer transition"
                style={{ '--hover': 'var(--bg-subtle)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                onClick={() => toggleExpand(r.id)}
              >
                <div className="flex items-center gap-3">
                  {expanded[r.id] ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />}
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                    {r.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{r.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Production Cost</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt.currency(r.production_cost)}</p>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirm(r)} className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50" />
                  </div>
                </div>
              </div>

              {expanded[r.id] && (
                <div className="px-5 pb-4 border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Raw Materials</p>
                    <div className="space-y-1.5">
                      {r.recipeMaterials?.map((rm) => (
                        <div key={rm.id} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>{rm.rawMaterial?.name}</span>
                          <span className="font-medium" style={{ color: 'var(--text-tertiary)' }}>{fmt.number(rm.quantity_required, 2)} {rm.rawMaterial?.unit_type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Output Products</p>
                    <div className="space-y-1.5">
                      {r.outputs?.map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>{o.product?.name}</span>
                          <span className="text-primary-600 dark:text-primary-400 font-medium">{fmt.number(o.quantity_produced, 2)} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Recipe Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Recipe" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Recipe Name *" placeholder="e.g. Steel Beam Production" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Production Cost (overhead) *" type="number" min="0" step="0.01" placeholder="0.00" value={form.production_cost} onChange={(e) => setForm((f) => ({ ...f, production_cost: e.target.value }))} />
          </div>
          <Textarea label="Description" placeholder="Optional notes about this recipe" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

          {/* Materials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Raw Materials *</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addMaterialRow}>Add row</Button>
            </div>
            <div className="space-y-2">
              {form.materials.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_32px] gap-2 items-end">
                  <select
                    value={m.raw_material_id}
                    onChange={(e) => setMaterialRow(i, 'raw_material_id', e.target.value)}
                    className="ds-input h-9 text-sm"
                  >
                    <option value="">Select material…</option>
                    {materials.map((mat) => <option key={mat.id} value={mat.id}>{mat.name} ({mat.unit_type})</option>)}
                  </select>
                  <input
                    type="number" min="0.001" step="0.001" placeholder="Qty"
                    value={m.quantity_required}
                    onChange={(e) => setMaterialRow(i, 'quantity_required', e.target.value)}
                    className="ds-input h-9 text-sm"
                  />
                  <button onClick={() => removeMaterialRow(i)} className="text-neutral-400 hover:text-danger-500 pb-2 text-lg font-medium">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Output Products *</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addOutputRow}>Add row</Button>
            </div>
            <div className="space-y-2">
              {form.outputs.map((o, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_32px] gap-2 items-end">
                  <select
                    value={o.product_id}
                    onChange={(e) => setOutputRow(i, 'product_id', e.target.value)}
                    className="ds-input h-9 text-sm"
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    type="number" min="0.001" step="0.001" placeholder="Units"
                    value={o.quantity_produced}
                    onChange={(e) => setOutputRow(i, 'quantity_produced', e.target.value)}
                    className="ds-input h-9 text-sm"
                  />
                  <button onClick={() => removeOutputRow(i)} className="text-neutral-400 hover:text-danger-500 pb-2 text-lg font-medium">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Cost estimate */}
          {estimatedCost() > 0 && (
            <div className="bg-primary-50 dark:bg-primary-950/40 rounded-lg px-4 py-3 text-sm text-primary-700 dark:text-primary-300">
              Estimated total batch cost: <strong>{fmt.currency(estimatedCost())}</strong>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Create Recipe</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={deleting} title="Delete Recipe" message={`Delete "${confirm?.name}"? This action cannot be undone.`} />
    </div>
  );
}
