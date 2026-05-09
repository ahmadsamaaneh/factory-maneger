import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ReceiptText } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../design-system/components/organisms/DataTable';
import Modal from '../../design-system/components/organisms/Modal';
import Button from '../../design-system/components/atoms/Button';
import { Input } from '../../design-system/components/atoms/Input';
import { PageSpinner } from '../../design-system/components/atoms/Spinner';
import { StatCard } from '../../design-system/components/organisms/Card';
import { getCustomers } from '../../services/salesService';
import {
  createCashVanSale,
  getCashVanSaleById,
  getCashVanReconciliations,
  getCashVanSales,
  getCashVanVehicleStock,
  getCashVanVehicles,
} from '../../services/cashVanService';
import { errMsg, fmt } from '../../utils/formatters';
import {
  enqueueCashVanSale,
  listQueuedCashVanSales,
  syncQueuedCashVanSales,
} from '../../utils/offlineCashVanQueue';
import useAuthStore from '../../store/authStore';

const emptyItem = () => ({ product_id: '', quantity: '', unit_price: '', discount_amount: '', tax_amount: '' });

const todayISO = () => new Date().toISOString().slice(0, 10);

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Wait for receipt images then print once (popup or iframe). */
function scheduleReceiptPrint(contentWindow) {
  const run = () => {
    const imgs = [...(contentWindow.document.images || [])];
    let printed = false;
    const firePrint = () => {
      if (printed) return;
      printed = true;
      try {
        contentWindow.focus();
        contentWindow.print();
      } catch {
        /* ignore */
      }
    };
    if (!imgs.length) {
      firePrint();
      return;
    }
    Promise.all(
      imgs.map(
        (img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              })
      )
    ).then(() => firePrint());
    setTimeout(firePrint, 4000);
  };
  setTimeout(run, 120);
}

export default function CashVanSalesPosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehicleStock, setVehicleStock] = useState([]);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [queuedCount, setQueuedCount] = useState(0);
  /** null أثناء التحقق؛ true = يومية مفتوحة لتاريخ اليوم */
  const [posDailyOpen, setPosDailyOpen] = useState(null);

  const [form, setForm] = useState({
    vehicle_id: '',
    customer_id: '',
    sale_type: 'cash',
    discount_amount: '',
    tax_amount: '',
    paid_amount: '',
    payment_method: 'cash',
    notes: '',
    items: [emptyItem()],
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [v, c, s] = await Promise.all([getCashVanVehicles(), getCustomers({ active_only: true }), getCashVanSales()]);
      setVehicles(v);
      setCustomers(c);
      setSales(s);
      if (!selectedVehicleId && v.length) setSelectedVehicleId(v[0].id);
      setQueuedCount((await listQueuedCashVanSales()).length);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const onOnline = () => {
      handleSyncQueue(false);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setVehicleStock([]);
      return;
    }
    getCashVanVehicleStock(selectedVehicleId).then(setVehicleStock).catch((e) => toast.error(errMsg(e)));
  }, [selectedVehicleId]);

  useEffect(() => {
    if (!modal || !form.vehicle_id) {
      setPosDailyOpen(null);
      return undefined;
    }
    let cancelled = false;
    setPosDailyOpen(null);
    getCashVanReconciliations({
      vehicle_id: form.vehicle_id,
      business_date: todayISO(),
      status: 'open',
    })
      .then((rows) => {
        if (!cancelled) setPosDailyOpen(Array.isArray(rows) && rows.length > 0);
      })
      .catch(() => {
        if (!cancelled) setPosDailyOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modal, form.vehicle_id]);

  const stockByProduct = useMemo(
    () =>
      vehicleStock.reduce((acc, row) => {
        acc[row.product_id] = row;
        return acc;
      }, {}),
    [vehicleStock]
  );

  const setItem = (index, key, value) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  };

  const onProductChange = (index, productId) => {
    const stockRow = stockByProduct[productId];
    setForm((f) => ({
      ...f,
      items: f.items.map((row, i) =>
        i === index
          ? {
              ...row,
              product_id: productId,
              unit_price: stockRow?.product?.selling_price ?? '',
              discount_amount: row.discount_amount || '',
              tax_amount: row.tax_amount || '',
            }
          : row
      ),
    }));
  };

  const subtotal = form.items.reduce((sum, row) => sum + (parseFloat(row.unit_price || 0) * parseFloat(row.quantity || 0)), 0);
  const total = subtotal - parseFloat(form.discount_amount || 0) + parseFloat(form.tax_amount || 0);

  const isNetworkError = (e) => !e?.response;

  const handleSyncQueue = async (withToast = true) => {
    try {
      const synced = await syncQueuedCashVanSales((payload) => createCashVanSale(payload));
      const left = (await listQueuedCashVanSales()).length;
      setQueuedCount(left);
      if (withToast) {
        toast.success(synced > 0 ? `تمت مزامنة ${synced} فاتورة مؤجلة.` : 'لا توجد فواتير مؤجلة للمزامنة.');
      }
      if (synced > 0) {
        await loadAll();
      }
    } catch (e) {
      if (withToast) toast.error(`فشل المزامنة: ${errMsg(e)}`);
    }
  };

  const createSale = async () => {
    if (!form.vehicle_id) return toast.error('اختر السيارة.');
    if (posDailyOpen !== true) {
      return toast.error('يجب فتح يومية لهذه السيارة لهذا اليوم من «جرد وإقفال الكاش فان» قبل البيع.');
    }
    if (form.items.some((r) => !r.product_id || !r.quantity || Number(r.quantity) <= 0)) {
      return toast.error('أكمل أصناف الفاتورة.');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        customer_id: form.customer_id || null,
        discount_amount: Number(form.discount_amount || 0),
        tax_amount: Number(form.tax_amount || 0),
        paid_amount: Number(form.paid_amount || 0),
        items: form.items.map((r) => ({
          ...r,
          quantity: Number(r.quantity),
          unit_price: Number(r.unit_price || 0),
          discount_amount: Number(r.discount_amount || 0),
          tax_amount: Number(r.tax_amount || 0),
        })),
      };
      await createCashVanSale(payload);
      toast.success('تم إنشاء فاتورة الكاش فان وتحديث المخزون.');
      setModal(false);
      setForm({
        vehicle_id: '',
        customer_id: '',
        sale_type: 'cash',
        discount_amount: '',
        tax_amount: '',
        paid_amount: '',
        payment_method: 'cash',
        notes: '',
        items: [emptyItem()],
      });
      await loadAll();
      if (selectedVehicleId) {
        const st = await getCashVanVehicleStock(selectedVehicleId);
        setVehicleStock(st);
      }
    } catch (e) {
      if (isNetworkError(e)) {
        try {
          await enqueueCashVanSale({
            ...form,
            customer_id: form.customer_id || null,
            discount_amount: Number(form.discount_amount || 0),
            tax_amount: Number(form.tax_amount || 0),
            paid_amount: Number(form.paid_amount || 0),
            items: form.items.map((r) => ({
              ...r,
              quantity: Number(r.quantity),
              unit_price: Number(r.unit_price || 0),
              discount_amount: Number(r.discount_amount || 0),
              tax_amount: Number(r.tax_amount || 0),
            })),
          });
          setQueuedCount((await listQueuedCashVanSales()).length);
          toast.success('لا يوجد اتصال. تم حفظ الفاتورة في Offline Queue للمزامنة لاحقًا.');
          setModal(false);
        } catch (queueErr) {
          toast.error(`فشل حفظ الفاتورة أوفلاين: ${errMsg(queueErr)}`);
        }
      } else {
        toast.error(errMsg(e));
      }
    } finally {
      setSaving(false);
    }
  };

  const printSale = (sale, thermal = false) => {
    if (!sale) return;
    const popup = window.open('about:blank', '_blank');
    const factory = useAuthStore.getState().factory();
    const factoryName = escapeHtml(factory?.name || 'المصنع');
    const factoryInitial = escapeHtml((factory?.name || 'م').trim().charAt(0) || 'م');
    const origin = window.location.origin || '';
    const verifyUrl = `${origin}/cash-van/pos?invoice=${encodeURIComponent(sale.id)}`;
    const qrText = verifyUrl;
    const barcodeText = String(sale.sale_number || sale.id || '').slice(0, 48);
    const qrImgSrc = `https://quickchart.io/qr?text=${encodeURIComponent(qrText)}&size=${thermal ? 140 : 180}&margin=1`;
    const barcodeImgSrc = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeText)}&scale=${thermal ? 2 : 3}&height=12&includetext`;

    const paidTotal = (sale.payments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    const itemsHtml = (sale.items || [])
      .map(
        (i) => `
        <tr>
          <td>${escapeHtml(i.product?.name || '-')}</td>
          <td>${fmt.number(i.quantity, 2)}</td>
          <td>${escapeHtml(fmt.currency(i.unit_price))}</td>
          <td>${escapeHtml(fmt.currency(i.line_total))}</td>
        </tr>`
      )
      .join('');

    const policyFooter = `
      <div class="policy">
        <p class="policy-title">سياسة الاسترجاع والاستبدال</p>
        <ul>
          <li>المرتجعات خلال 48 ساعة من تاريخ الفاتورة وبنفس حالة العبوة الأصلية.</li>
          <li>لا يُستبدل أو يُسترد المنتج بعد فتح العبوة أو التلف نتيجة سوء الاستخدام.</li>
          <li>يُخصم من قيمة المرتجع أي خصومات أو عروض تم تطبيقها وقت الشراء.</li>
          <li>يُسترد المبلغ بنفس طريقة الدفع أو كرصيد حسب سياسة المصنع.</li>
        </ul>
        <p class="policy-note">شكراً لتعاملكم معنا — ${factoryName}</p>
      </div>
    `;

    const headerBlock = `
      <header class="inv-header">
        <div class="brand">
          <div class="logo-badge" aria-hidden="true">${factoryInitial}</div>
          <div class="brand-text">
            <p class="factory-name">${factoryName}</p>
            <p class="doc-title">فاتورة مبيعات — كاش فان</p>
          </div>
        </div>
        <div class="codes">
          <div class="code-block">
            <span class="code-label">مسح للتحقق</span>
            <img class="qr-img" src="${qrImgSrc}" alt="QR" crossorigin="anonymous" />
          </div>
          <div class="code-block barcode-wrap">
            <span class="code-label">باركود الفاتورة</span>
            <img class="barcode-img" src="${barcodeImgSrc}" alt="Barcode" crossorigin="anonymous" />
            <span class="barcode-caption">${escapeHtml(barcodeText)}</span>
          </div>
        </div>
      </header>
    `;

    const metaBlock = `
      <section class="meta">
        <div class="meta-row"><span>رقم الفاتورة</span><strong>${escapeHtml(sale.sale_number)}</strong></div>
        <div class="meta-row"><span>السيارة</span><strong>${escapeHtml(`${sale.vehicle?.code || '-'} / ${sale.vehicle?.plate_number || '-'}`)}</strong></div>
        <div class="meta-row"><span>التاريخ</span><strong>${escapeHtml(fmt.dateTime(sale.issued_at))}</strong></div>
        <div class="meta-row"><span>العميل</span><strong>${escapeHtml(sale.customer?.name || 'بيع مباشر')}</strong></div>
        <div class="meta-row"><span>نوع البيع</span><strong>${sale.sale_type === 'cash' ? 'نقدي' : 'آجل'}</strong></div>
        <div class="meta-row"><span>المحصل</span><strong>${escapeHtml(fmt.currency(paidTotal))}</strong></div>
      </section>
    `;

    const thermalCss = `
      @page { size: 80mm auto; margin: 4mm; }
      body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 11px; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .wrap { width: 72mm; max-width: 100%; margin: 0 auto; box-sizing: border-box; }
      .inv-header { border-bottom: 1px dashed #bbb; padding-bottom: 8px; margin-bottom: 8px; }
      .brand { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .logo-badge { width: 40px; height: 40px; border-radius: 10px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; flex-shrink: 0; }
      .factory-name { font-weight: 800; font-size: 13px; margin: 0; }
      .doc-title { margin: 2px 0 0; font-size: 10px; color: #444; }
      .codes { display: flex; justify-content: space-between; gap: 6px; align-items: flex-start; flex-wrap: wrap; }
      .code-block { text-align: center; flex: 1; min-width: 48%; }
      .code-label { display: block; font-size: 9px; color: #555; margin-bottom: 4px; }
      .qr-img { width: 56mm; max-width: 100%; height: auto; image-rendering: pixelated; }
      .barcode-img { width: 100%; max-height: 42px; object-fit: contain; }
      .barcode-caption { font-size: 9px; display: block; margin-top: 2px; letter-spacing: 0.02em; }
      .meta { margin: 8px 0; font-size: 10px; }
      .meta-row { display: flex; justify-content: space-between; gap: 8px; padding: 3px 0; border-bottom: 1px dotted #ddd; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
      th, td { border-bottom: 1px solid #eee; padding: 4px 2px; text-align: right; vertical-align: top; }
      th { font-size: 9px; color: #444; }
      .totals { margin-top: 8px; font-weight: 700; font-size: 11px; border-top: 1px dashed #bbb; padding-top: 6px; }
      .policy { margin-top: 10px; font-size: 8.5px; line-height: 1.45; color: #333; border-top: 1px dashed #bbb; padding-top: 6px; }
      .policy-title { font-weight: 700; margin: 0 0 4px; }
      .policy ul { margin: 0; padding-right: 14px; }
      .policy li { margin-bottom: 2px; }
      .policy-note { margin: 6px 0 0; font-size: 8px; color: #555; text-align: center; }
    `;

    const a4Css = `
      @page { size: A4 portrait; margin: 14mm; }
      body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 13px; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .wrap { max-width: 190mm; margin: 0 auto; }
      .inv-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 14px; margin-bottom: 14px; }
      .brand { display: flex; align-items: center; gap: 12px; }
      .logo-badge { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg,#2563eb,#4f46e5); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(37,99,235,0.25); }
      .factory-name { font-weight: 800; font-size: 20px; margin: 0; }
      .doc-title { margin: 4px 0 0; font-size: 13px; color: #4b5563; }
      .codes { display: flex; gap: 18px; align-items: flex-start; }
      .code-block { text-align: center; }
      .code-label { display: block; font-size: 11px; color: #6b7280; margin-bottom: 6px; }
      .qr-img { width: 140px; height: 140px; image-rendering: pixelated; }
      .barcode-img { width: 220px; max-height: 56px; object-fit: contain; }
      .barcode-caption { font-size: 11px; display: block; margin-top: 4px; letter-spacing: 0.03em; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-bottom: 16px; background: #f9fafb; padding: 12px 14px; border-radius: 10px; border: 1px solid #e5e7eb; }
      .meta-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
      .meta-row span { color: #6b7280; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: right; font-size: 12px; }
      th { background: #f3f4f6; font-weight: 600; color: #374151; }
      .totals { margin-top: 14px; text-align: left; font-size: 15px; font-weight: 800; padding-top: 10px; border-top: 2px solid #111827; }
      .policy { margin-top: 22px; font-size: 11px; line-height: 1.55; color: #374151; border-top: 1px solid #e5e7eb; padding-top: 14px; }
      .policy-title { font-weight: 700; margin: 0 0 8px; font-size: 12px; }
      .policy ul { margin: 0; padding-right: 18px; }
      .policy li { margin-bottom: 4px; }
      .policy-note { margin: 12px 0 0; font-size: 10px; color: #6b7280; text-align: center; }
    `;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>فاتورة ${escapeHtml(sale.sale_number)}</title>
        <style>${thermal ? thermalCss : a4Css}</style>
      </head>
      <body>
        <div class="wrap">
          ${headerBlock}
          ${metaBlock}
          <table>
            <thead>
              <tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p class="totals">الإجمالي النهائي: ${escapeHtml(fmt.currency(sale.total_amount))}</p>
          ${policyFooter}
        </div>
      </body>
      </html>
    `;

    const writeAndSchedulePrint = (contentWindow) => {
      contentWindow.document.open();
      contentWindow.document.write(html);
      contentWindow.document.close();
      scheduleReceiptPrint(contentWindow);
    };

    if (popup) {
      writeAndSchedulePrint(popup);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'print');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      opacity: '0',
      pointerEvents: 'none',
    });
    document.body.appendChild(iframe);
    const iw = iframe.contentWindow;
    if (!iw) {
      iframe.remove();
      toast.error('تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع أو جرّب متصفحًا آخر.');
      return;
    }
    writeAndSchedulePrint(iw);
    setTimeout(() => iframe.remove(), 3000);
  };

  const openDetail = async (saleId) => {
    try {
      setDetail(await getCashVanSaleById(saleId));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  if (loading) return <PageSpinner label="جار تحميل مبيعات الكاش فان..." />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>مبيعات الكاش فان (POS)</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Workflow: فتح يومية (جرد وإقفال) ← اختيار السيارة ← البيع من مخزون السيارة ← التحصيل وإقفال اليومية.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleSyncQueue(true)}>
            مزامنة الفواتير المؤجلة ({queuedCount})
          </Button>
          <Button icon={Plus} onClick={() => setModal(true)}>فاتورة جديدة</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="عدد الفواتير" value={sales.length} icon={ReceiptText} colorClass="bg-indigo-100 text-indigo-600" />
        <StatCard label="إجمالي المبيعات" value={fmt.currency(sales.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0))} icon={ReceiptText} colorClass="bg-emerald-100 text-emerald-600" />
        <StatCard label="إجمالي التحصيلات" value={fmt.currency(sales.reduce((s, r) => s + (r.payments || []).reduce((x, p) => x + parseFloat(p.amount || 0), 0), 0))} icon={ReceiptText} colorClass="bg-blue-100 text-blue-600" />
      </div>

      <DataTable
        columns={[
          { key: 'sale_number', label: 'رقم الفاتورة' },
          { key: 'vehicle', label: 'السيارة', render: (r) => `${r.vehicle?.code || '-'} / ${r.vehicle?.plate_number || '-'}` },
          { key: 'sale_type', label: 'النوع', render: (r) => (r.sale_type === 'cash' ? 'نقدي' : 'آجل') },
          { key: 'customer', label: 'العميل', render: (r) => r.customer?.name || 'بيع مباشر' },
          { key: 'total_amount', label: 'الإجمالي', render: (r) => <span className="font-semibold">{fmt.currency(r.total_amount)}</span> },
          { key: 'paid', label: 'المحصل', render: (r) => fmt.currency((r.payments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)) },
          { key: 'issued_at', label: 'التاريخ', render: (r) => fmt.dateTime(r.issued_at) },
          { key: 'actions', label: '', width: 240, render: (r) => (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => openDetail(r.id)}>عرض</Button>
              <Button variant="secondary" size="sm" onClick={() => printSale(r, false)}>A4</Button>
              <Button variant="secondary" size="sm" onClick={() => printSale(r, true)}>حراري</Button>
            </div>
          ) },
        ]}
        data={sales}
        emptyMessage="لا توجد فواتير كاش فان بعد."
      />

      <Modal open={modal} onClose={() => setModal(false)} title="فاتورة كاش فان جديدة" size="lg">
        <div className="space-y-4">
          {form.vehicle_id && posDailyOpen === false && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/25 dark:border-amber-800 p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              لا توجد يومية مفتوحة لهذه السيارة اليوم. افتح يومية من{' '}
              <Link to="/cash-van/reconciliation" className="text-primary-600 dark:text-primary-400 font-medium underline underline-offset-2">
                جرد وإقفال الكاش فان
              </Link>
              {' '}قبل إصدار الفاتورة.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">السيارة *</label>
              <select className="ds-input h-9 text-sm mt-1" value={form.vehicle_id} onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
                <option value="">اختر سيارة...</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.code} - {v.plate_number}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">النوع</label>
              <select className="ds-input h-9 text-sm mt-1" value={form.sale_type} onChange={(e) => setForm((f) => ({ ...f, sale_type: e.target.value }))}>
                <option value="cash">نقدي</option>
                <option value="credit">آجل</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">العميل (اختياري)</label>
              <select className="ds-input h-9 text-sm mt-1" value={form.customer_id} onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}>
                <option value="">بيع مباشر</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">أصناف الفاتورة *</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={() => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))}>
                إضافة صف
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_90px_100px_85px_85px_30px] gap-2 items-end">
                  <select className="ds-input h-9 text-sm" value={row.product_id} onChange={(e) => onProductChange(index, e.target.value)}>
                    <option value="">اختر منتج...</option>
                    {vehicleStock.map((s) => (
                      <option key={s.product_id} value={s.product_id}>
                        {s.product?.name} (متاح: {fmt.number(s.quantity, 0)})
                      </option>
                    ))}
                  </select>
                  <input type="number" className="ds-input h-9 text-sm" min="0.001" step="0.001" placeholder="كمية" value={row.quantity} onChange={(e) => setItem(index, 'quantity', e.target.value)} />
                  <input type="number" className="ds-input h-9 text-sm" min="0" step="0.01" placeholder="سعر" value={row.unit_price} onChange={(e) => setItem(index, 'unit_price', e.target.value)} />
                  <input type="number" className="ds-input h-9 text-sm" min="0" step="0.01" placeholder="خصم" value={row.discount_amount} onChange={(e) => setItem(index, 'discount_amount', e.target.value)} />
                  <input type="number" className="ds-input h-9 text-sm" min="0" step="0.01" placeholder="ضريبة" value={row.tax_amount} onChange={(e) => setItem(index, 'tax_amount', e.target.value)} />
                  <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))} className="text-neutral-400 hover:text-danger-500 pb-2 text-lg font-medium">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input label="خصم الفاتورة" type="number" min="0" value={form.discount_amount} onChange={(e) => setForm((f) => ({ ...f, discount_amount: e.target.value }))} />
            <Input label="ضريبة الفاتورة" type="number" min="0" value={form.tax_amount} onChange={(e) => setForm((f) => ({ ...f, tax_amount: e.target.value }))} />
            <Input label="المبلغ المحصل" type="number" min="0" value={form.paid_amount} onChange={(e) => setForm((f) => ({ ...f, paid_amount: e.target.value }))} />
            <div>
              <label className="text-sm font-medium">طريقة الدفع</label>
              <select className="ds-input h-9 text-sm mt-1" value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}>
                <option value="cash">نقدي</option>
                <option value="transfer">تحويل</option>
                <option value="card">بطاقة</option>
              </select>
            </div>
          </div>

          <Input label="ملاحظات" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />

          <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--bg-subtle)' }}>
            <div className="flex justify-between"><span>المجموع الفرعي</span><strong>{fmt.currency(subtotal)}</strong></div>
            <div className="flex justify-between"><span>الإجمالي النهائي</span><strong>{fmt.currency(total)}</strong></div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>إلغاء</Button>
            <Button
              className="flex-1"
              loading={saving}
              disabled={!form.vehicle_id || posDailyOpen !== true}
              onClick={createSale}
            >
              إصدار الفاتورة
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`تفاصيل الفاتورة: ${detail?.sale_number || ''}`} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => printSale(detail, false)}>طباعة A4</Button>
              <Button size="sm" variant="secondary" onClick={() => printSale(detail, true)}>طباعة حراري 80mm</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="card p-3"><p className="text-xs text-neutral-500">السيارة</p><p className="font-medium">{detail.vehicle?.code} - {detail.vehicle?.plate_number}</p></div>
              <div className="card p-3"><p className="text-xs text-neutral-500">النوع</p><p className="font-medium">{detail.sale_type === 'cash' ? 'نقدي' : 'آجل'}</p></div>
              <div className="card p-3"><p className="text-xs text-neutral-500">العميل</p><p className="font-medium">{detail.customer?.name || 'بيع مباشر'}</p></div>
              <div className="card p-3"><p className="text-xs text-neutral-500">الإجمالي</p><p className="font-medium">{fmt.currency(detail.total_amount)}</p></div>
            </div>
            <DataTable
              columns={[
                { key: 'product', label: 'المنتج', render: (r) => r.product?.name || '—' },
                { key: 'quantity', label: 'الكمية', render: (r) => fmt.number(r.quantity, 2) },
                { key: 'unit_price', label: 'سعر الوحدة', render: (r) => fmt.currency(r.unit_price) },
                { key: 'line_total', label: 'الإجمالي', render: (r) => fmt.currency(r.line_total) },
              ]}
              data={detail.items || []}
              emptyMessage="لا توجد أصناف."
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
