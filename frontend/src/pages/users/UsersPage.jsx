import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input, Select } from '../../design-system/components/atoms/Input';
import Badge from '../../design-system/components/atoms/Badge';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/userService';
import { fmt, errMsg } from '../../utils/formatters';
import { ROLES } from '../../utils/constants';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';

const EMPTY = { name: '', email: '', password: '', role: 'factory_owner' };

const ROLE_COLORS = {
  admin:              'bg-purple-100 text-purple-700',
  factory_owner:      'bg-indigo-100 text-indigo-700',
  inventory_manager:  'bg-blue-100 text-blue-700',
  production_manager: 'bg-amber-100 text-amber-700',
  sales_manager:      'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: me } = useAuthStore();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [deleting, setDeleting] = useState(false);

  const creatableRoles = me?.role === ROLES.ADMIN
    ? ['factory_owner']
    : ['inventory_manager', 'production_manager', 'sales_manager'];

  const load = async () => {
    setLoading(true);
    try { setUsers(await getUsers()); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email are required.');
    if (!selected && !form.password) return toast.error('Password is required for new users.');
    setSaving(true);
    try {
      if (selected) {
        const payload = { name: form.name, is_active: form.is_active };
        await updateUser(selected.id, payload);
        toast.success('User updated.');
      } else {
        await createUser(form);
        toast.success('User created.');
      }
      closeModal(); load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteUser(confirm.id); toast.success('User deleted.'); setConfirm(null); load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setDeleting(false); }
  };

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: 'name',       label: 'Name',   render: (r) => (
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
    { key: 'role',       label: 'Role',   render: (r) => <Badge label={fmt.role(r.role)} className={ROLE_COLORS[r.role]} size="sm" /> },
    { key: 'is_active',  label: 'Status', render: (r) => <Badge label={r.is_active ? 'Active' : 'Inactive'} variant={r.is_active ? 'success' : 'neutral'} dot /> },
    { key: 'created_at', label: 'Joined', render: (r) => fmt.date(r.createdAt) },
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
        <Button icon={Plus} onClick={openCreate}>Add User</Button>
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

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found." searchable searchPlaceholder="Search users…" striped />

      <Modal open={modal} onClose={closeModal} title={selected ? 'Edit User' : 'New User'}>
        <div className="space-y-4">
          <Input label="Full Name *" placeholder="John Doe" value={form.name} onChange={field('name')} />
          <Input label="Email *" type="email" placeholder="john@example.com" value={form.email} onChange={field('email')} disabled={!!selected} />
          {!selected && (
            <Input label="Password *" type="password" placeholder="Min. 8 characters" value={form.password} onChange={field('password')} />
          )}
          {!selected && (
            <Select label="Role *" value={form.role} onChange={field('role')}>
              {creatableRoles.map((r) => <option key={r} value={r}>{fmt.role(r)}</option>)}
            </Select>
          )}
          {selected && (
            <Select label="Status" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{selected ? 'Save Changes' : 'Create User'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete User"
        message={`Delete "${confirm?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
