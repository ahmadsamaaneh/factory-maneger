import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Building2, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import { ConfirmModal } from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input, Select, Checkbox } from '../../design-system/components/atoms/Input';
import Badge from '../../design-system/components/atoms/Badge';
import { getUsers } from '../../services/userService';
import {
  getEmployees,
  getDepartments,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  createDepartment,
  deleteDepartment,
} from '../../services/hrService';
import { fmt, errMsg } from '../../utils/formatters';

const EMPTY_EMP = {
  employee_code: '',
  full_name: '',
  department_id: '',
  user_id: '',
  job_title: '',
  email: '',
  phone: '',
  national_id: '',
  hire_date: '',
  status: 'active',
  salary_base: '',
  daily_work_hours: '8',
  late_deduction_enabled: true,
  overtime_enabled: true,
  absent_deduction_enabled: true,
  sick_leave_deductible: false,
  avatar_url: '',
  notes: '',
};

const STATUS_VARIANT = {
  active: 'success',
  on_leave: 'warning',
  terminated: 'neutral',
};

export default function HrEmployeesPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_EMP);
  const [saving, setSaving] = useState(false);

  const [deptModal, setDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [addingDept, setAddingDept] = useState(false);

  const [confirmTerm, setConfirmTerm] = useState(null);
  const [confirmDelDept, setConfirmDelDept] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const tmr = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(tmr);
  }, [search]);

  const loadDeps = useCallback(async () => {
    try {
      setDepartments(await getDepartments());
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await getUsers());
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department_id = deptFilter;
      setEmployees(await getEmployees(params));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, deptFilter]);

  useEffect(() => {
    loadDeps();
    loadUsers();
  }, [loadDeps, loadUsers]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const openCreate = () => {
    setForm({ ...EMPTY_EMP, status: 'active' });
    setSelected(null);
    setModal(true);
  };

  const openEdit = (row) => {
    setForm({
      employee_code: row.employee_code || '',
      full_name: row.full_name || '',
      department_id: row.department_id || '',
      user_id: row.user_id || '',
      job_title: row.job_title || '',
      email: row.email || '',
      phone: row.phone || '',
      national_id: row.national_id || '',
      hire_date: row.hire_date || '',
      status: row.status || 'active',
      salary_base: row.salary_base != null ? String(row.salary_base) : '',
      daily_work_hours: row.daily_work_hours != null ? String(row.daily_work_hours) : '8',
      late_deduction_enabled: row.late_deduction_enabled ?? true,
      overtime_enabled: row.overtime_enabled ?? true,
      absent_deduction_enabled: row.absent_deduction_enabled ?? true,
      sick_leave_deductible: row.sick_leave_deductible ?? false,
      avatar_url: row.avatar_url || '',
      notes: row.notes || '',
    });
    setSelected(row);
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setSelected(null);
  };

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const buildPayload = () => {
    const payload = {
      employee_code: form.employee_code.trim(),
      full_name: form.full_name.trim(),
      job_title: form.job_title.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      national_id: form.national_id.trim() || undefined,
      hire_date: form.hire_date || undefined,
      status: form.status,
      avatar_url: form.avatar_url.trim() || undefined,
      notes: form.notes.trim() || undefined,
      late_deduction_enabled: Boolean(form.late_deduction_enabled),
      overtime_enabled: Boolean(form.overtime_enabled),
      absent_deduction_enabled: Boolean(form.absent_deduction_enabled),
      sick_leave_deductible: Boolean(form.sick_leave_deductible),
    };
    if (form.department_id) payload.department_id = form.department_id;
    else if (selected) payload.department_id = null;
    if (form.user_id) payload.user_id = form.user_id;
    else if (selected) payload.user_id = null;
    if (form.salary_base !== '' && form.salary_base != null) {
      const n = parseFloat(form.salary_base, 10);
      if (!Number.isNaN(n)) payload.salary_base = n;
    }
    if (form.daily_work_hours !== '' && form.daily_work_hours != null) {
      const n = parseFloat(form.daily_work_hours, 10);
      if (!Number.isNaN(n)) payload.daily_work_hours = n;
    }
    return payload;
  };

  const handleSave = async () => {
    if (!form.employee_code.trim() || !form.full_name.trim()) {
      toast.error(t('pages.hr.employeeCodeNameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (selected) {
        await updateEmployee(selected.id, payload);
        toast.success(t('pages.hr.employeeUpdated'));
      } else {
        await createEmployee(payload);
        toast.success(t('pages.hr.employeeCreated'));
      }
      closeModal();
      loadEmployees();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const handleTerminate = async () => {
    if (!confirmTerm) return;
    setDeleting(true);
    try {
      await terminateEmployee(confirmTerm.id);
      toast.success(t('pages.hr.employeeTerminated'));
      setConfirmTerm(null);
      loadEmployees();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddDepartment = async () => {
    const name = newDeptName.trim();
    if (!name) return;
    setAddingDept(true);
    try {
      await createDepartment({ name });
      setNewDeptName('');
      toast.success(t('pages.hr.departmentCreated'));
      loadDeps();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setAddingDept(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!confirmDelDept) return;
    setDeleting(true);
    try {
      await deleteDepartment(confirmDelDept.id);
      toast.success(t('pages.hr.departmentDeleted'));
      const id = confirmDelDept.id;
      setConfirmDelDept(null);
      if (deptFilter === id) setDeptFilter('');
      loadDeps();
      loadEmployees();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: t('pages.hr.employee'),
      sortValue: (r) => r.full_name,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          {r.avatar_url ? (
            <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
              {(r.full_name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.full_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.employee_code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: t('pages.hr.department'),
      sortValue: (r) => r.department?.name || '',
      render: (r) => <span className="text-sm">{r.department?.name || '—'}</span>,
    },
    {
      key: 'job_title',
      label: t('pages.hr.jobTitle'),
      render: (r) => <span className="text-sm">{r.job_title || '—'}</span>,
    },
    {
      key: 'daily_work_hours',
      label: 'ساعات الدوام/يوم',
      sortValue: (r) => parseFloat(r.daily_work_hours || 0),
      render: (r) => <span className="text-sm">{r.daily_work_hours || 8}</span>,
    },
    {
      key: 'salary_base',
      label: t('pages.hr.baseSalary'),
      sortValue: (r) => parseFloat(r.salary_base || 0),
      render: (r) => <span className="text-sm font-medium">{fmt.currency(r.salary_base)}</span>,
    },
    {
      key: 'status',
      label: t('common.status'),
      sortValue: (r) => r.status,
      render: (r) => (
        <Badge
          label={t(`pages.hr.status.${r.status}`, { defaultValue: r.status })}
          variant={STATUS_VARIANT[r.status] || 'neutral'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 120,
      render: (r) => (
        <div className="flex gap-1">
          <Link
            to={`/hr/employees/${r.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label={t('common.view')}
          >
            <Eye size={16} />
          </Link>
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(r)} />
          {r.status !== 'terminated' && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50"
              onClick={() => setConfirmTerm(r)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1>{t('pages.hr.staffTitle')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('pages.hr.staffSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Building2} onClick={() => setDeptModal(true)}>
            {t('pages.hr.departments')}
          </Button>
          <Button icon={Plus} onClick={openCreate}>{t('pages.hr.addEmployee')}</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3 rtl:translate-x-0" />
          <Input
            className="pl-9 rtl:pl-3 rtl:pr-9"
            placeholder={t('pages.hr.searchEmployees')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          className="w-full sm:w-44"
          label={t('common.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t('common.all')}</option>
          <option value="active">{t('pages.hr.status.active')}</option>
          <option value="on_leave">{t('pages.hr.status.on_leave')}</option>
          <option value="terminated">{t('pages.hr.status.terminated')}</option>
        </Select>
        <Select
          className="w-full sm:w-52"
          label={t('pages.hr.department')}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">{t('common.all')}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage={t('pages.hr.noEmployees')}
        striped
      />

      <Modal open={modal} onClose={closeModal} title={selected ? t('pages.hr.editEmployee') : t('pages.hr.addEmployee')}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={`${t('pages.hr.employeeCode')} *`} value={form.employee_code} onChange={field('employee_code')} />
            <Input label={`${t('common.name')} *`} value={form.full_name} onChange={field('full_name')} />
          </div>
          <Select label={t('pages.hr.department')} value={form.department_id} onChange={field('department_id')}>
            <option value="">{t('pages.hr.noDepartment')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Select label="ربط مع مستخدم النظام" value={form.user_id || ''} onChange={field('user_id')}>
            <option value="">بدون ربط</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} - {u.email}
              </option>
            ))}
          </Select>
          <Input label={t('pages.hr.jobTitle')} value={form.job_title} onChange={field('job_title')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('common.email')} type="email" value={form.email} onChange={field('email')} />
            <Input label={t('common.phone')} value={form.phone} onChange={field('phone')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('pages.hr.nationalId')} value={form.national_id} onChange={field('national_id')} />
            <Input label={t('pages.hr.hireDate')} type="date" value={form.hire_date} onChange={field('hire_date')} />
          </div>
          <Select label={t('common.status')} value={form.status} onChange={field('status')}>
            <option value="active">{t('pages.hr.status.active')}</option>
            <option value="on_leave">{t('pages.hr.status.on_leave')}</option>
            <option value="terminated">{t('pages.hr.status.terminated')}</option>
          </Select>
          <Input
            label="عدد ساعات الدوام اليومي *"
            type="number"
            step="0.25"
            min="1"
            max="24"
            value={form.daily_work_hours}
            onChange={field('daily_work_hours')}
          />
          <Input label={t('pages.hr.baseSalary')} type="number" step="0.01" min="0" value={form.salary_base} onChange={field('salary_base')} />
          <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>قواعد الراتب والحضور</p>
            <Checkbox
              label="خصم التأخير (بالدقائق)"
              checked={form.late_deduction_enabled}
              onChange={(e) => setForm((f) => ({ ...f, late_deduction_enabled: e.target.checked }))}
            />
            <Checkbox
              label="احتساب وقت إضافي عند زيادة ساعات الدوام"
              checked={form.overtime_enabled}
              onChange={(e) => setForm((f) => ({ ...f, overtime_enabled: e.target.checked }))}
            />
            <Checkbox
              label="خصم الغياب"
              checked={form.absent_deduction_enabled}
              onChange={(e) => setForm((f) => ({ ...f, absent_deduction_enabled: e.target.checked }))}
            />
            <Checkbox
              label="خصم الإجازة المرضية من الراتب"
              checked={form.sick_leave_deductible}
              onChange={(e) => setForm((f) => ({ ...f, sick_leave_deductible: e.target.checked }))}
            />
          </div>
          <Input label={t('pages.hr.avatarUrl')} value={form.avatar_url} onChange={field('avatar_url')} placeholder="https://…" />
          <Input label={t('pages.hr.notes')} value={form.notes} onChange={field('notes')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deptModal} onClose={() => setDeptModal(false)} title={t('pages.hr.departments')}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder={t('pages.hr.newDepartmentPlaceholder')}
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
            />
            <Button loading={addingDept} onClick={handleAddDepartment}>{t('common.add')}</Button>
          </div>
          <ul className="divide-y rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
            {departments.length === 0 && (
              <li className="p-4 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>{t('pages.hr.noDepartments')}</li>
            )}
            {departments.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="font-medium">{d.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="text-danger-600"
                  onClick={() => setConfirmDelDept(d)}
                />
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmTerm}
        onClose={() => setConfirmTerm(null)}
        onConfirm={handleTerminate}
        loading={deleting}
        title={t('pages.hr.terminateTitle')}
        message={t('pages.hr.terminateMessage', { name: confirmTerm?.full_name || '' })}
      />

      <ConfirmModal
        open={!!confirmDelDept}
        onClose={() => setConfirmDelDept(null)}
        onConfirm={handleDeleteDepartment}
        loading={deleting}
        title={t('pages.hr.deleteDepartmentTitle')}
        message={t('pages.hr.deleteDepartmentMessage', { name: confirmDelDept?.name || '' })}
      />
    </div>
  );
}
