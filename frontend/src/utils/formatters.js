export const fmt = {
  currency: (v) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(v ?? 0),

  number: (v, decimals = 2) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(v ?? 0),

  date: (v) =>
    v ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(v)) : '—',

  dateTime: (v) =>
    v
      ? new Intl.DateTimeFormat('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }).format(new Date(v))
      : '—',

  percent: (v) => `${Number(v ?? 0).toFixed(1)}%`,

  role: (r) =>
    ({
      admin: 'Admin',
      factory_owner: 'Factory Owner',
      hr_manager: 'HR Manager',
      inventory_manager: 'Inventory Manager',
      production_manager: 'Production Manager',
      sales_manager: 'Sales Manager',
    }[r] ?? r),
};

/** User-facing API / axios error text (Arabic-first app). */
export const errMsg = (err) => {
  const data = err?.response?.data;
  const errs = data?.errors;
  if (Array.isArray(errs) && errs.length > 0) {
    const joined = errs.map((e) => e.msg || e.message).filter(Boolean).join(' ');
    if (joined) return joined;
  }
  const apiMsg = data?.message;
  if (apiMsg) return apiMsg;
  const msg = String(err?.message || '');
  const code = err?.code;
  /** Axios: request sent but no HTTP response (backend down, wrong port, DB blocked startup). */
  const noHttpResponse = Boolean(err?.request) && !err?.response;
  const looksNetwork =
    noHttpResponse ||
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    code === 'ECONNREFUSED' ||
    msg === 'Network Error' ||
    /network/i.test(msg);

  if (looksNetwork) {
    return 'لا يمكن الاتصال بالخادم. 1) من جذر المشروع: npm run dev:all أو npm run dev للـ API. 2) في الطرفية يجب أن يظهر «Server running» بعد «Database connection established» — إن لم يظهر، غالباً PostgreSQL متوقف أو بيانات الاتصال في .env خاطئة. 3) PORT في .env يجب أن يطابق ما يتوقعه Vite (نفس ملف .env في جذر المشروع).';
  }
  return err?.message || 'حدث خطأ.';
};
