import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../design-system/components/atoms/Button';
import { Input, Select } from '../../design-system/components/atoms/Input';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import {
  getDailyAttendance,
  lockAttendanceDay,
  unlockAttendanceDay,
  upsertEmployeeAttendance,
} from '../../services/hrService';
import { errMsg, fmt } from '../../utils/formatters';

const STATUSES = [
  { value: 'present', label: 'داوم' },
  { value: 'absent', label: 'لم يداوم' },
  { value: 'sick_leave', label: 'إجازة مرضية' },
  { value: 'leave', label: 'إجازة' },
  { value: 'half_day', label: 'نصف دوام' },
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function toYmd(d) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function fromYmd(ymd) {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d);
}

function monthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0 sun
  const start = new Date(year, month, 1 - startDay);
  return Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function HrAttendancePage() {
  const [date, setDate] = useState(todayValue());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);
  const [autoFillToday, setAutoFillToday] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(fromYmd(todayValue()));
  const isFutureSelected = date > todayValue();
  const isFridaySelected = fromYmd(date).getDay() === 5;

  const load = async (workDate = date, allowAutoFill = true) => {
    setLoading(true);
    try {
      const data = await getDailyAttendance(workDate);
      setIsLocked(Boolean(data.is_locked));
      setRows(
        data.items.map((r) => ({
          ...r,
          status: r.status === 'late' ? 'present' : (r.status || (isFridaySelected ? 'leave' : 'present')),
          late_minutes: String(r.late_minutes || 0),
          overtime_minutes: String(r.overtime_minutes || 0),
          special_case: Boolean(r.special_case),
          notes: r.notes || '',
        }))
      );

      if (allowAutoFill && autoFillToday && workDate === todayValue() && !data.is_locked) {
        setBulkSaving(true);
        await Promise.all(
          data.items.map((r) =>
            upsertEmployeeAttendance(r.employee_id, {
              work_date: workDate,
              status: 'present',
              late_minutes: 0,
              overtime_minutes: 0,
            })
          )
        );
        toast.success('تم إدخال حضور اليوم تلقائيًا.');
        setAutoFillToday(false);
        await load(workDate, false);
        return;
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    setCalendarMonth(fromYmd(date));
  }, [date]);

  const stats = useMemo(() => {
    const acc = { present: 0, absent: 0, sick: 0, late: 0, overtimeMinutes: 0 };
    for (const r of rows) {
      if (['present', 'late', 'half_day'].includes(r.status)) acc.present += 1;
      if (r.status === 'absent') acc.absent += 1;
      if (r.status === 'sick_leave') acc.sick += 1;
      if ((parseInt(r.late_minutes || 0, 10) || 0) > 0) acc.late += 1;
      acc.overtimeMinutes += parseInt(r.overtime_minutes || 0, 10) || 0;
    }
    return acc;
  }, [rows]);

  const updateLocal = (employeeId, key, value) => {
    setRows((prev) => prev.map((r) => (r.employee_id === employeeId ? { ...r, [key]: value } : r)));
  };

  const saveRow = async (row) => {
    if (isFutureSelected) {
      toast.error('لا يمكن تعديل أيام مستقبلية.');
      return;
    }
    if (isLocked) {
      toast.error('تم اعتماد هذا اليوم ولا يمكن التعديل عليه.');
      return;
    }
    setSavingId(row.employee_id);
    try {
      const payload = {
        work_date: date,
        status: isFridaySelected && !row.special_case ? 'leave' : row.status,
        late_minutes: Math.max(0, parseInt(row.late_minutes || 0, 10) || 0),
        overtime_minutes: Math.max(0, parseInt(row.overtime_minutes || 0, 10) || 0),
        special_case: Boolean(row.special_case),
        notes: row.notes?.trim() || undefined,
      };
      const saved = await upsertEmployeeAttendance(row.employee_id, payload);
      updateLocal(row.employee_id, 'deduction_amount', saved.deduction_amount);
      updateLocal(row.employee_id, 'overtime_amount', saved.overtime_amount);
      updateLocal(row.employee_id, 'paid_minutes', saved.paid_minutes);
      toast.success(`تم حفظ دوام ${row.full_name}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSavingId(null);
    }
  };

  const saveAllRows = async () => {
    if (isFutureSelected) {
      toast.error('لا يمكن تعديل أيام مستقبلية.');
      return;
    }
    if (isLocked) {
      toast.error('تم اعتماد هذا اليوم ولا يمكن التعديل عليه.');
      return;
    }
    setBulkSaving(true);
    try {
      await Promise.all(
        rows.map((row) =>
          upsertEmployeeAttendance(row.employee_id, {
            work_date: date,
            status: isFridaySelected && !row.special_case ? 'leave' : row.status,
            late_minutes: Math.max(0, parseInt(row.late_minutes || 0, 10) || 0),
            overtime_minutes: Math.max(0, parseInt(row.overtime_minutes || 0, 10) || 0),
            special_case: Boolean(row.special_case),
            notes: row.notes?.trim() || undefined,
          })
        )
      );
      toast.success('تم حفظ بيانات جميع الموظفين.');
      await load(date);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBulkSaving(false);
    }
  };

  const lockDay = async () => {
    if (isFutureSelected) {
      toast.error('لا يمكن اعتماد يوم مستقبلي.');
      return;
    }
    setLockBusy(true);
    try {
      await lockAttendanceDay(date);
      setIsLocked(true);
      toast.success('تم اعتماد/إقفال حضور هذا اليوم.');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLockBusy(false);
    }
  };

  const unlockDay = async () => {
    if (isFutureSelected) {
      toast.error('لا يمكن تعديل يوم مستقبلي.');
      return;
    }
    setLockBusy(true);
    try {
      await unlockAttendanceDay(date);
      setIsLocked(false);
      toast.success('تم إلغاء الاعتماد ويمكن التعديل الآن.');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLockBusy(false);
    }
  };

  if (loading) return <PageSpinner label="جار تحميل حضور الموظفين..." />;

  return (
    <div className="space-y-5">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1>الحضور اليومي</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            تسجيل الدوام، الغياب، الإجازة المرضية، التأخير، والإضافي مع احتساب الخصم تلقائيًا.
          </p>
        </div>
        <div className="w-full sm:w-72 relative">
          <label className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>التاريخ</label>
          <button
            type="button"
            onClick={() => setCalendarOpen((v) => !v)}
            className="mt-1 w-full h-9 px-3 rounded-lg border flex items-center justify-between text-sm bg-white dark:bg-neutral-900"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          >
            <span>{fmt.date(date)}</span>
            <CalendarDays size={16} style={{ color: 'var(--text-tertiary)' }} />
          </button>
          {calendarOpen && (
            <div
              className="absolute z-20 mt-2 p-3 rounded-xl border shadow-lg w-[320px] bg-white dark:bg-neutral-900"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                >
                  <ChevronRight size={16} className="rtl-flip" />
                </button>
                <p className="text-sm font-semibold">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                >
                  <ChevronLeft size={16} className="rtl-flip" />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d} className="py-1">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthGrid(calendarMonth).map((d) => {
                  const ymd = toYmd(d);
                  const inMonth = d.getMonth() === calendarMonth.getMonth();
                  const isActive = ymd === date;
                  const isToday = ymd === todayValue();
                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => {
                        setAutoFillToday(isToday);
                        setDate(ymd);
                        setCalendarOpen(false);
                      }}
                      className={`h-9 rounded-md text-sm transition ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : inMonth
                            ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            : 'opacity-35 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-end">
          <Button variant="secondary" loading={bulkSaving} disabled={isLocked || isFutureSelected} onClick={saveAllRows}>
            حفظ الكل
          </Button>
        </div>
        <div className="flex items-end">
          {isLocked ? (
            <Button variant="secondary" loading={lockBusy} disabled={isFutureSelected} onClick={unlockDay}>
              إلغاء الاعتماد
            </Button>
          ) : (
            <Button variant="success" loading={lockBusy} disabled={isFutureSelected} onClick={lockDay}>
              اعتماد اليوم
            </Button>
          )}
        </div>
      </div>
      <div className="text-sm">
        {isFutureSelected ? (
          <span className="text-amber-700 font-medium">اليوم المستقبلي للعرض فقط - التعديل غير مسموح.</span>
        ) : isFridaySelected ? (
          <span className="text-indigo-700 font-medium">الجمعة عطلة افتراضيًا. فعّل "حالة خاصة" فقط لمن يداوم.</span>
        ) : isLocked ? (
          <span className="text-danger-600 font-medium">اليوم مقفل (معتمد) - التعديل معطل.</span>
        ) : (
          <span className="text-success-700 font-medium">اليوم مفتوح للتعديل.</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-3"><p className="text-xs text-neutral-500">حاضرين</p><p className="text-xl font-bold">{stats.present}</p></div>
        <div className="card p-3"><p className="text-xs text-neutral-500">غائبين</p><p className="text-xl font-bold">{stats.absent}</p></div>
        <div className="card p-3"><p className="text-xs text-neutral-500">إجازة مرضية</p><p className="text-xl font-bold">{stats.sick}</p></div>
        <div className="card p-3"><p className="text-xs text-neutral-500">متأخرين</p><p className="text-xl font-bold">{stats.late}</p></div>
        <div className="card p-3"><p className="text-xs text-neutral-500">دقائق إضافي</p><p className="text-xl font-bold">{stats.overtimeMinutes}</p></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
              <th className="text-start p-3">الموظف</th>
              <th className="text-start p-3">الحالة</th>
              <th className="text-start p-3">دقائق التأخير</th>
              <th className="text-start p-3">دقائق الإضافي</th>
              <th className="text-start p-3">حالة خاصة</th>
              <th className="text-start p-3">الخصم</th>
              <th className="text-start p-3">الإضافي (مالي)</th>
              <th className="text-start p-3">ملاحظات</th>
              <th className="text-start p-3">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employee_id} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <td className="p-3">
                  <p className="font-medium">{row.full_name}</p>
                  <p className="text-xs text-neutral-500">{row.employee_code} {row.department?.name ? `- ${row.department.name}` : ''}</p>
                </td>
                <td className="p-3 min-w-[150px]">
                  <Select disabled={isLocked || isFutureSelected} value={row.status} onChange={(e) => updateLocal(row.employee_id, 'status', e.target.value)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>
                </td>
                <td className="p-3 min-w-[120px]">
                  <Input
                    type="number"
                    min="0"
                    disabled={isLocked || isFutureSelected}
                    value={row.late_minutes}
                    onChange={(e) => updateLocal(row.employee_id, 'late_minutes', e.target.value)}
                  />
                </td>
                <td className="p-3 min-w-[120px]">
                  <Input
                    type="number"
                    min="0"
                    disabled={isLocked || isFutureSelected}
                    value={row.overtime_minutes}
                    onChange={(e) => updateLocal(row.employee_id, 'overtime_minutes', e.target.value)}
                  />
                </td>
                <td className="p-3 min-w-[110px]">
                  <input
                    type="checkbox"
                    disabled={isLocked || isFutureSelected || !isFridaySelected}
                    checked={Boolean(row.special_case)}
                    onChange={(e) => updateLocal(row.employee_id, 'special_case', e.target.checked)}
                  />
                </td>
                <td className="p-3">{fmt.currency(row.deduction_amount || 0)}</td>
                <td className="p-3">{fmt.currency(row.overtime_amount || 0)}</td>
                <td className="p-3 min-w-[180px]">
                  <Input disabled={isLocked || isFutureSelected} value={row.notes} onChange={(e) => updateLocal(row.employee_id, 'notes', e.target.value)} />
                </td>
                <td className="p-3">
                  <Button disabled={isLocked || isFutureSelected} loading={savingId === row.employee_id} onClick={() => saveRow(row)}>
                    حفظ
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
