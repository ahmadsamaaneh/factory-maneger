import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input, Textarea } from '../../design-system/components/atoms/Input';
import Badge from '../../design-system/components/atoms/Badge';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';
import { fmt, errMsg } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

const EMPTY = { name: '', sku: '', description: '', cost: '', selling_price: '', stock_quantity: '' };

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [confirm, setConfirm]   = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setProducts(await getProducts({ search }));
    } catch (e) {
      toast.error(errMsg(e), { id: 'products-load' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(EMPTY); setSelected(null); setModal('form'); };
  const openEdit   = (p) => { setForm({ ...p }); setSelected(p); setModal('form'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.name || !form.selling_price) return toast.error('الاسم وسعر البيع مطلوبان.');
    setSaving(true);
    try {
      if (selected) { await updateProduct(selected.id, form); toast.success('تم تحديث المنتج.'); }
      else { await createProduct(form); toast.success('تم إنشاء المنتج.'); }
      closeModal(); load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteProduct(confirm.id); toast.success('تم حذف المنتج.'); setConfirm(null); load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setDeleting(false); }
  };

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const margin = (p) => {
    const c = parseFloat(p.cost || 0);
    const s = parseFloat(p.selling_price || 0);
    return s > 0 ? (((s - c) / s) * 100).toFixed(1) + '%' : '—';
  };

  const columns = [
    { key: 'name',          label: 'المنتج' },
    { key: 'sku',           label: 'الرمز',          render: (r) => <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.sku || '—'}</span> },
    { key: 'cost',          label: 'التكلفة',         sortable: true, sortValue: (r) => parseFloat(r.cost), render: (r) => fmt.currency(r.cost) },
    { key: 'selling_price', label: 'سعر البيع',   sortable: true, sortValue: (r) => parseFloat(r.selling_price), render: (r) => <span className="font-semibold text-success-700 dark:text-success-400">{fmt.currency(r.selling_price)}</span> },
    { key: 'margin',        label: 'الهامش',       render: (r) => (
      <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold text-xs">
        <TrendingUp size={12} />{margin(r)}
      </span>
    )},
    { key: 'stock_quantity',label: 'المخزون',        sortable: true, sortValue: (r) => parseFloat(r.stock_quantity), render: (r) => (
      <Badge
        label={`${fmt.number(r.stock_quantity, 0)} وحدة`}
        variant={parseFloat(r.stock_quantity) === 0 ? 'danger' : 'neutral'}
        size="sm"
      />
    )},
    { key: 'actions', label: '', width: 90, render: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(r)} />
        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirm(r)} className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50" />
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.products.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.products.subtitle')}</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>{t('pages.products.addProduct')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="لا توجد منتجات بعد. أضف أول منتج."
        searchable
        searchPlaceholder="ابحث بالمنتج أو الرمز…"
        striped
      />

      <Modal open={modal === 'form'} onClose={closeModal} title={selected ? 'تعديل المنتج' : 'منتج جديد'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="اسم المنتج *" placeholder="مثال: منتج 2 متر" value={form.name} onChange={field('name')} />
            <Input label="الرمز" placeholder="مثال: PR-001" value={form.sku} onChange={field('sku')} />
          </div>
          <Textarea label="الوصف" placeholder="وصف اختياري" value={form.description} onChange={field('description')} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="التكلفة" type="number" min="0" step="0.01" placeholder="0.00" value={form.cost} onChange={field('cost')} />
            <Input label="سعر البيع *" type="number" min="0" step="0.01" placeholder="0.00" value={form.selling_price} onChange={field('selling_price')} />
            <Input label="كمية المخزون" type="number" min="0" placeholder="0" value={form.stock_quantity} onChange={field('stock_quantity')} />
          </div>
          {form.cost && form.selling_price && (
            <div className="bg-primary-50 dark:bg-primary-950/40 rounded-lg px-4 py-3 text-sm text-primary-700 dark:text-primary-300">
              الهامش: <strong>{margin(form)}</strong> &nbsp;|&nbsp; الربح/وحدة: <strong>{fmt.currency(parseFloat(form.selling_price) - parseFloat(form.cost))}</strong>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeModal}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{selected ? 'حفظ التغييرات' : 'إنشاء المنتج'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={deleting} title="حذف المنتج" message={`حذف "${confirm?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`} />
    </div>
  );
}
