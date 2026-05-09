import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { getMonthlyPayrollReport, getEmployeeMonthlyPayrollDetail } from '../../services/hrService';
import { errMsg, fmt } from '../../utils/formatters';

function thisMonth() {
  return new Date().toISOString().slice(0, 7);
}

function toArabicDigits(v) {
  return String(v).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

function monthLabelAr(yyyyMm) {
  const [, mm] = yyyyMm.split('-').map((x) => parseInt(x, 10));
  const names = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  return names[(mm || 1) - 1] || '';
}

export default function HrPayrollReportPage() {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfId, setPdfId] = useState(null);

  const load = async (m = month) => {
    setLoading(true);
    try {
      setData(await getMonthlyPayrollReport(m));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  if (loading || !data) return <PageSpinner label="جار تحميل تقرير الرواتب..." />;

  const esc = (v) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const downloadEmployeePdf = async (employeeId) => {
    setPdfId(employeeId);
    try {
      const detail = await getEmployeeMonthlyPayrollDetail(employeeId, month);
      const [year] = detail.month.split('-');
      const title = `راتب شهر ${monthLabelAr(detail.month)} ${toArabicDigits(year)}`;
      const fileName = `salary-${detail.employee.employee_code}-${detail.month}.pdf`;
      const rowsHtml = detail.days
        .map((d) => `
          <tr>
            <td>${esc(d.work_date)}</td>
            <td>${esc(d.status)}</td>
            <td>${esc(d.late_minutes)}</td>
            <td>${esc(d.overtime_minutes)}</td>
            <td>${esc(fmt.currency(d.deduction_amount))}</td>
            <td>${esc(fmt.currency(d.overtime_amount))}</td>
            <td>${esc(fmt.currency(d.friday_bonus_amount))}</td>
            <td>${esc(d.notes || '-')}</td>
          </tr>
        `)
        .join('');

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '1000px';
      container.style.background = '#fff';
      container.style.padding = '20px';
      container.style.direction = 'rtl';
      container.style.fontFamily = '"Segoe UI", Tahoma, Arial, sans-serif';
      container.lang = 'ar';
      container.innerHTML = `
        <div style="color:#111">
          <h1 style="margin:0 0 8px;text-align:right;direction:rtl;unicode-bidi:isolate;font-size:32px;line-height:1.2;font-weight:700;letter-spacing:0;word-spacing:0">${esc(title)}</h1>
          <p style="margin:0 0 12px;color:#555;font-size:13px">الفترة: ${esc(detail.period.start)} إلى ${esc(detail.period.end)}</p>
          <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin-bottom:12px">
            <strong>بيانات الموظف</strong>
            <p>الاسم: ${esc(detail.employee.full_name)}</p>
            <p>الكود: ${esc(detail.employee.employee_code)}</p>
            <p>القسم: ${esc(detail.employee.department?.name || '-')}</p>
            <p>المسمى: ${esc(detail.employee.job_title || '-')}</p>
            <p>الراتب الأساسي: ${esc(fmt.currency(detail.employee.salary_base))}</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
            <div style="border:1px solid #ddd;border-radius:8px;padding:8px">الخصومات<br/><b>${esc(fmt.currency(detail.summary.deductions))}</b></div>
            <div style="border:1px solid #ddd;border-radius:8px;padding:8px">الإضافي<br/><b>${esc(fmt.currency(detail.summary.overtime_pay))}</b></div>
            <div style="border:1px solid #ddd;border-radius:8px;padding:8px">بدل الجمعة<br/><b>${esc(fmt.currency(detail.summary.friday_bonus))}</b></div>
            <div style="border:1px solid #ddd;border-radius:8px;padding:8px">الصافي<br/><b>${esc(fmt.currency(detail.summary.net_salary))}</b></div>
          </div>
          <div style="border:1px solid #ddd;border-radius:10px;padding:12px">
            <strong>تفاصيل الدوام</strong>
            <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px">
              <thead>
                <tr style="background:#4f46e5;color:#fff">
                  <th style="border:1px solid #ddd;padding:7px">التاريخ</th>
                  <th style="border:1px solid #ddd;padding:7px">الحالة</th>
                  <th style="border:1px solid #ddd;padding:7px">تأخير</th>
                  <th style="border:1px solid #ddd;padding:7px">إضافي</th>
                  <th style="border:1px solid #ddd;padding:7px">خصم</th>
                  <th style="border:1px solid #ddd;padding:7px">إضافي مالي</th>
                  <th style="border:1px solid #ddd;padding:7px">بدل الجمعة</th>
                  <th style="border:1px solid #ddd;padding:7px">ملاحظات</th>
                </tr>
              </thead>
            <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      document.body.removeChild(container);

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const printableW = pageW - margin * 2;
      const printableH = pageH - margin * 2;

      const ratio = printableW / canvas.width;
      const sliceHeightPx = Math.floor(printableH / ratio);
      let renderedHeightPx = 0;
      let pageIndex = 0;

      while (renderedHeightPx < canvas.height) {
        const h = Math.min(sliceHeightPx, canvas.height - renderedHeightPx);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = h;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, renderedHeightPx, canvas.width, h, 0, 0, canvas.width, h);
        const img = pageCanvas.toDataURL('image/png');
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(img, 'PNG', margin, margin, printableW, h * ratio, undefined, 'FAST');
        renderedHeightPx += h;
        pageIndex += 1;
      }

      pdf.save(fileName);
      toast.success('تم تنزيل ملف PDF بنجاح.');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setPdfId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1>تقرير الرواتب الشهري</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            صافي الراتب = الأساسي - الخصومات + الإضافي (تلقائي من سجلات الحضور)
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-44">
            <Input type="month" label="الشهر" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={() => load(month)}>تحديث</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card p-3"><p className="text-xs text-neutral-500">إجمالي الأساسي</p><p className="text-lg font-bold">{fmt.currency(data.totals.base_salary)}</p></div>
        <div className="card p-3"><p className="text-xs text-neutral-500">إجمالي الخصومات</p><p className="text-lg font-bold text-danger-600">{fmt.currency(data.totals.deductions)}</p></div>
        <div className="card p-3"><p className="text-xs text-neutral-500">إجمالي الإضافي</p><p className="text-lg font-bold text-success-600">{fmt.currency(data.totals.overtime_pay)}</p></div>
        <div className="card p-3"><p className="text-xs text-neutral-500">بدل دوام الجمعة</p><p className="text-lg font-bold text-indigo-600">{fmt.currency(data.totals.friday_bonus)}</p></div>
        <div className="card p-3"><p className="text-xs text-neutral-500">صافي الرواتب</p><p className="text-lg font-bold">{fmt.currency(data.totals.net_salary)}</p></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
              <th className="text-start p-3">الموظف</th>
              <th className="text-start p-3">الراتب الأساسي</th>
              <th className="text-start p-3">أيام حضور</th>
              <th className="text-start p-3">أيام غياب</th>
              <th className="text-start p-3">إجازة مرضية</th>
              <th className="text-start p-3">دقائق تأخير</th>
              <th className="text-start p-3">دقائق إضافي</th>
              <th className="text-start p-3">الخصومات</th>
              <th className="text-start p-3">الإضافي</th>
              <th className="text-start p-3">بدل الجمعة</th>
              <th className="text-start p-3">الصافي</th>
              <th className="text-start p-3">PDF</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.employee_id} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <td className="p-3">
                  <p className="font-medium">{row.full_name}</p>
                  <p className="text-xs text-neutral-500">{row.employee_code} {row.department?.name ? `- ${row.department.name}` : ''}</p>
                </td>
                <td className="p-3">{fmt.currency(row.base_salary)}</td>
                <td className="p-3">{row.attendance_days}</td>
                <td className="p-3">{row.absent_days}</td>
                <td className="p-3">{row.sick_leave_days}</td>
                <td className="p-3">{row.late_minutes}</td>
                <td className="p-3">{row.overtime_minutes}</td>
                <td className="p-3 text-danger-600">{fmt.currency(row.deductions)}</td>
                <td className="p-3 text-success-600">{fmt.currency(row.overtime_pay)}</td>
                <td className="p-3 text-indigo-700">{fmt.currency(row.friday_bonus)}</td>
                <td className="p-3 font-semibold">{fmt.currency(row.net_salary)}</td>
                <td className="p-3">
                  <Button size="sm" variant="secondary" loading={pdfId === row.employee_id} onClick={() => downloadEmployeePdf(row.employee_id)}>
                    تحميل PDF
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
