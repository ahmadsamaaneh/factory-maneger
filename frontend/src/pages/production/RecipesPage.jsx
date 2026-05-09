import { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

const emptyMaterial = () => ({ input_type: 'raw_material', raw_material_id: '', product_id: '', quantity_required: '' });
const emptyOutput   = () => ({ product_id: '', quantity_produced: '' });

/** مجموع تكلفة صفوف مواد: (كمية × تكلفة الوحدة من المخزون أو من بيانات المادة المضمّنة). */
function materialLinesTotalCost(lines, inventoryMaterials, productsList = []) {
  if (!lines?.length) return 0;
  return lines.reduce((sum, m) => {
    const inputType = m.input_type || (m.product_id ? 'product' : 'raw_material');
    let cpu = 0;
    if (inputType === 'product') {
      const pid = m.product_id || m.inputProduct?.id;
      const p = productsList.find((x) => x.id === pid) || m.inputProduct;
      cpu = parseFloat(p?.cost ?? 0);
    } else {
      const id = m.raw_material_id;
      const inv = inventoryMaterials.find((x) => x.id === id);
      cpu =
        inv != null
          ? parseFloat(inv.cost_per_unit ?? 0)
          : parseFloat(m.rawMaterial?.cost_per_unit ?? 0);
    }
    return sum + cpu * parseFloat(m.quantity_required ?? 0);
  }, 0);
}

function recipeMaterialsTotalCost(recipe, inventoryMaterials, productsList = []) {
  if (!recipe?.recipeMaterials?.length) return 0;
  const lines = recipe.recipeMaterials.map((rm) => ({
    input_type: rm.input_type || (rm.product_id ? 'product' : 'raw_material'),
    raw_material_id: rm.raw_material_id || rm.rawMaterial?.id,
    product_id: rm.product_id || rm.inputProduct?.id,
    quantity_required: rm.quantity_required,
    rawMaterial: rm.rawMaterial,
    inputProduct: rm.inputProduct,
  }));
  return materialLinesTotalCost(lines, inventoryMaterials, productsList);
}

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
    name: '', description: '',
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

  const estimatedCost = () => materialLinesTotalCost(form.materials, materials, products);

  const totalOutputUnits = () => form.outputs.reduce((sum, o) => sum + parseFloat(o.quantity_produced || 0), 0);
  const estimatedCostPerUnit = () => {
    const units = totalOutputUnits();
    if (units <= 0) return 0;
    return estimatedCost() / units;
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('اسم الوصفة مطلوب.');
    if (form.materials.some((m) => {
      if (!m.quantity_required) return true;
      const type = m.input_type || 'raw_material';
      if (type === 'product') return !m.product_id;
      return !m.raw_material_id;
    })) return toast.error('أكمل كل صفوف مدخلات الوصفة.');
    if (form.outputs.some((o) => !o.product_id || !o.quantity_produced)) return toast.error('أكمل كل صفوف المنتجات الناتجة.');
    setSaving(true);
    try {
      await createRecipe({ ...form, production_cost: 0 });
      toast.success('تم إنشاء الوصفة.');
      setModal(false);
      reload();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteRecipe(confirm.id); toast.success('تم حذف الوصفة.'); setConfirm(null); reload(); }
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
        <Button icon={Plus} onClick={() => setModal(true)}>وصفة جديدة</Button>
      </div>

      {recipes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>لا توجد وصفات بعد. أنشئ أول وصفة إنتاج.</p>
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
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>تكلفة الإنتاج</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }} title="مجموع (الكمية × تكلفة الوحدة) لمواد الوصفة من المخزون">
                      {fmt.currency(recipeMaterialsTotalCost(r, materials, products))}
                    </p>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirm(r)} className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50" />
                  </div>
                </div>
              </div>

              {expanded[r.id] && (
                <div className="px-5 pb-4 border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>مدخلات الوصفة</p>
                    <div className="space-y-1.5">
                      {r.recipeMaterials?.map((rm) => (
                        <div key={rm.id} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {rm.input_type === 'product' ? rm.inputProduct?.name : rm.rawMaterial?.name}
                            <span className="text-xs ms-1" style={{ color: 'var(--text-tertiary)' }}>
                              ({rm.input_type === 'product' ? 'منتج' : 'مادة خام'})
                            </span>
                          </span>
                          <span className="font-medium" style={{ color: 'var(--text-tertiary)' }}>
                            {fmt.number(rm.quantity_required, 2)} {rm.input_type === 'product' ? 'وحدة' : rm.rawMaterial?.unit_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>المنتجات الناتجة</p>
                    <div className="space-y-1.5">
                      {r.outputs?.map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>{o.product?.name}</span>
                          <span className="text-primary-600 dark:text-primary-400 font-medium">{fmt.number(o.quantity_produced, 2)} وحدة</span>
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
      <Modal open={modal} onClose={() => setModal(false)} title="وصفة جديدة" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="اسم الوصفة *" placeholder="مثال: إنتاج..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input
              label="تكلفة المدخلات (تلقائي)"
              value={fmt.currency(estimatedCost())}
              readOnly
            />
          </div>
          <Textarea label="الوصف" placeholder="ملاحظات اختيارية عن الوصفة" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

          {/* Materials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>مدخلات الوصفة *</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addMaterialRow}>إضافة صف</Button>
            </div>
            <div className="space-y-2">
              {form.materials.map((m, i) => (
                <div key={i} className="grid grid-cols-[140px_1fr_120px_32px] gap-2 items-end">
                  <select
                    value={m.input_type || 'raw_material'}
                    onChange={(e) => {
                      const type = e.target.value;
                      setForm((f) => ({
                        ...f,
                        materials: f.materials.map((row, idx) => idx === i
                          ? { ...row, input_type: type, raw_material_id: '', product_id: '' }
                          : row),
                      }));
                    }}
                    className="ds-input h-9 text-sm"
                  >
                    <option value="raw_material">مادة خام</option>
                    <option value="product">منتج</option>
                  </select>
                  <select
                    value={(m.input_type || 'raw_material') === 'product' ? (m.product_id || '') : (m.raw_material_id || '')}
                    onChange={(e) => {
                      const type = m.input_type || 'raw_material';
                      if (type === 'product') {
                        setMaterialRow(i, 'product_id', e.target.value);
                      } else {
                        setMaterialRow(i, 'raw_material_id', e.target.value);
                      }
                    }}
                    className="ds-input h-9 text-sm"
                  >
                    {(m.input_type || 'raw_material') === 'product' ? (
                      <>
                        <option value="">اختر منتجًا…</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </>
                    ) : (
                      <>
                        <option value="">اختر مادة خام…</option>
                        {materials.map((mat) => <option key={mat.id} value={mat.id}>{mat.name} ({mat.unit_type})</option>)}
                      </>
                    )}
                  </select>
                  <input
                    type="number" min="0.001" step="0.001" placeholder="الكمية"
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
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>المنتجات الناتجة *</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addOutputRow}>إضافة صف</Button>
            </div>
            <div className="space-y-2">
              {form.outputs.map((o, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_32px] gap-2 items-end">
                  <select
                    value={o.product_id}
                    onChange={(e) => setOutputRow(i, 'product_id', e.target.value)}
                    className="ds-input h-9 text-sm"
                  >
                    <option value="">اختر منتجًا…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    type="number" min="0.001" step="0.001" placeholder="وحدات"
                    value={o.quantity_produced}
                    onChange={(e) => setOutputRow(i, 'quantity_produced', e.target.value)}
                    className="ds-input h-9 text-sm"
                  />
                  <button onClick={() => removeOutputRow(i)} className="text-neutral-400 hover:text-danger-500 pb-2 text-lg font-medium">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Cost + margin estimate */}
          {estimatedCost() > 0 && (
            <div className="bg-primary-50 dark:bg-primary-950/40 rounded-lg px-4 py-3 text-sm text-primary-700 dark:text-primary-300">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span>التكلفة التقديرية الإجمالية للدفعة: <strong>{fmt.currency(estimatedCost())}</strong></span>
                <span>تكلفة الحبة التقديرية: <strong>{fmt.currency(estimatedCostPerUnit())}</strong></span>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {form.outputs.map((o, idx) => {
                  const product = products.find((p) => p.id === o.product_id);
                  if (!product) return null;
                  const costPerUnit = estimatedCostPerUnit();
                  const sell = parseFloat(product.selling_price || 0);
                  const profit = sell - costPerUnit;
                  const marginPct = sell > 0 ? (profit / sell) * 100 : 0;
                  return (
                    <div key={`${o.product_id}-${idx}`}>
                      {product.name}: ربح/حبة <strong>{fmt.currency(profit)}</strong> ({fmt.number(marginPct, 1)}%)
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>إنشاء الوصفة</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={deleting} title="حذف الوصفة" message={`حذف "${confirm?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`} />
    </div>
  );
}
