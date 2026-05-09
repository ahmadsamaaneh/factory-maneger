import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input, Select } from '../../design-system/components/atoms/Input';
import Badge from '../../design-system/components/atoms/Badge';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/userService';
import { getEmployees } from '../../services/hrService';
import { fmt, errMsg } from '../../utils/formatters';
import { ROLES } from '../../utils/constants';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';

const EMPTY = { name: '', email: '', password: '', role: 'factory_owner', employee_id: '' };

const ROLE_COLORS = {
  admin:              'bg-purple-100 text-purple-700',
  factory_owner:      'bg-indigo-100 text-indigo-700',
  hr_manager:         'bg-pink-100 text-pink-700',
  inventory_manager:  'bg-blue-100 text-blue-700',
  production_manager: 'bg-amber-100 text-amber-700',
  sales_manager:      'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: me } = useAuthStore();
  const [users,    setUsers]    = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [deleting, setDeleting] = useState(false);

  const creatableRoles = me?.role === ROLES.ADMIN
    ? ['factory_owner']
    : ['hr_manager', 'inventory_manager', 'production_manager', 'sales_manager'];

  const load = async () => {
    setLoading(true);
    try { setUsers(await getUsers()); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => { load(); loadEmployees(); }, []);

  const openCreate = () => {
    setForm({ ...EMPTY, role: creatableRoles[0] });
    setSelected(null);
    setModal(true);
  };

  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, is_active: u.is_active });
    setSelected(u);
    setModal(true);
  };

  const closeModal = () => { setModal(false); setSelected(null); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('الاسم والبريد الإلكتروني مطلوبان.');
    if (!selected && !form.password) return toast.error('كلمة المرور مطلوبة للمستخدم الجديد.');
    setSaving(true);
    try {
      if (selected) {
        const payload = { name: form.name, is_active: form.is_active };
        await updateUser(selected.id, payload);
        toast.success('تم تحديث المستخدم.');
      } else {
        await createUser({ ...form, employee_id: form.employee_id || undefined });
        toast.success('تم إنشاء المستخدم.');
      }
      closeModal(); load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteUser(confirm.id); toast.success('تم حذف المستخدم.'); setConfirm(null); load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setDeleting(false); }
  };

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const employeeOptions = useMemo(() => employees.filter((e) => !e.user_id), [employees]);

  const handleEmployeeSelect = (e) => {
    const employee_id = e.target.value;
    const selectedEmployee = employeeOptions.find((emp) => emp.id === employee_id);
    setForm((prev) => ({
      ...prev,
      employee_id,
      // Autofill only if the user hasn't typed values already.
      name: prev.name?.trim() ? prev.name : (selectedEmployee?.full_name || ''),
      email: prev.email?.trim() ? prev.email : (selectedEmployee?.email || ''),
    }));
  };

  const columns = [
    { key: 'name',       label: 'الاسم',   render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
          {r.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.email}</p>
        </div>
      </div>
    )},
    { key: 'role',       label: 'الدور',   render: (r) => <Badge label={fmt.role(r.role)} className={ROLE_COLORS[r.role]} size="sm" /> },
    { key: 'employee',   label: 'الموظف', render: (r) => r.employeeProfile?.full_name || '—' },
    { key: 'is_active',  label: 'الحالة', render: (r) => <Badge label={r.is_active ? 'نشط' : 'غير نشط'} variant={r.is_active ? 'success' : 'neutral'} dot /> },
    { key: 'created_at', label: 'تاريخ الانضمام', render: (r) => fmt.date(r.createdAt) },
    { key: 'actions',    label: '', width: 90, render: (r) => (
      r.id === me?.id ? null : (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(r)} />
          {me?.role === ROLES.ADMIN && (
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirm(r)} className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50" />
          )}
        </div>
      )
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>{t('pages.users.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.users.subtitle')}</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>إضافة مستخدم</Button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_COLORS).map(([role, cls]) => (
          <span key={role} className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${cls}`}>
            <ShieldCheck size={11} />
            {fmt.role(role)}
          </span>
        ))}
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="لا يوجد مستخدمون." searchable searchPlaceholder="ابحث عن مستخدم…" striped />

      <Modal open={modal} onClose={closeModal} title={selected ? 'تعديل المستخدم' : 'مستخدم جديد'}>
        <div className="space-y-4">
          <Input label="الاسم الكامل *" placeholder="الاسم الكامل" value={form.name} onChange={field('name')} />
          <Input label="البريد الإلكتروني *" type="email" placeholder="name@example.com" value={form.email} onChange={field('email')} disabled={!!selected} />
          {!selected && (
            <Input label="كلمة المرور *" type="password" placeholder="8 أحرف على الأقل" value={form.password} onChange={field('password')} />
          )}
          {!selected && (
            <Select label="الدور *" value={form.role} onChange={field('role')}>
              {creatableRoles.map((r) => <option key={r} value={r}>{fmt.role(r)}</option>)}
            </Select>
          )}
          {!selected && (
            <Select label="ربط بموظف (اختياري)" value={form.employee_id} onChange={handleEmployeeSelect}>
              <option value="">بدون ربط</option>
              {employeeOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
              ))}
            </Select>
          )}
          {selected && (
            <Select label="الحالة" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'true' }))}>
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </Select>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeModal}>إلغاء</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{selected ? 'حفظ التغييرات' : 'إنشاء مستخدم'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="حذف المستخدم"
        message={`حذف "${confirm?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </div>
  );
}
