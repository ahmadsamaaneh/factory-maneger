const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const {
  sequelize,
  OperationalExpense,
  ExpenseBudget,
  Department,
  Employee,
  User,
} = require('../models');

function monthStartStr(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-01`;
}

function computeFuel(meta, explicitAmount) {
  const m = meta && typeof meta === 'object' ? meta : {};
  if (explicitAmount != null && parseFloat(explicitAmount) > 0) {
    return {
      ...m,
      computed_liters: m.liters != null ? parseFloat(m.liters) : null,
      amount: parseFloat(explicitAmount),
    };
  }
  const price = parseFloat(m.price_per_liter || 0);
  let liters = parseFloat(m.liters || 0);
  if (m.calculation_mode === 'from_distance') {
    const dist = parseFloat(m.distance_km || 0);
    const cons = parseFloat(m.consumption_liters_per_100km || 0);
    liters = (dist * cons) / 100;
  }
  const amount = liters * price;
  return {
    ...m,
    computed_liters: liters,
    calculation_note:
      m.calculation_mode === 'from_distance'
        ? `مسافة ${m.distance_km}كم × استهلاك ${m.consumption_liters_per_100km} ل/100كم`
        : null,
    amount: Number.isFinite(amount) ? amount : 0,
  };
}

function computeElectricity(meta, explicitAmount) {
  const m = meta && typeof meta === 'object' ? meta : {};
  if (explicitAmount != null && parseFloat(explicitAmount) > 0) {
    return { ...m, kwh: m.kwh != null ? parseFloat(m.kwh) : null, amount: parseFloat(explicitAmount) };
  }
  const prev = parseFloat(m.prev_reading || 0);
  const curr = parseFloat(m.curr_reading || 0);
  const kwh = Math.max(0, curr - prev);
  const unit = parseFloat(m.unit_price_kwh || 0);
  const extra = parseFloat(m.extra_fees || 0);
  const tax = parseFloat(m.tax_amount || 0);
  const amount = kwh * unit + extra + tax;
  return { ...m, kwh, amount: Number.isFinite(amount) ? amount : 0 };
}

function resolveAmountAndMeta(expense_type, meta, amountInput) {
  const explicit = amountInput != null && amountInput !== '' ? parseFloat(amountInput) : null;
  if (expense_type === 'fuel') {
    const r = computeFuel(meta, explicit && explicit > 0 ? explicit : null);
    return { meta: r, amount: parseFloat(r.amount || 0) };
  }
  if (expense_type === 'electricity') {
    const r = computeElectricity(meta, explicit && explicit > 0 ? explicit : null);
    return { meta: r, amount: parseFloat(r.amount || 0) };
  }
  const amt = explicit != null && !Number.isNaN(explicit) ? explicit : parseFloat(meta?.manual_amount || 0);
  return { meta: meta || {}, amount: Number.isFinite(amt) ? amt : 0 };
}

const expenseInclude = [
  { association: 'department', attributes: ['id', 'name', 'code'] },
  { association: 'employee', attributes: ['id', 'full_name', 'employee_code'] },
  { association: 'creator', attributes: ['id', 'name', 'role'] },
];

async function createExpense(data, userId, factoryId) {
  const {
    expense_date,
    expense_type,
    accounting_class,
    accounting_label,
    description,
    amount: amountInput,
    department_id,
    employee_id,
    employee_name,
    payment_method,
    status,
    meta,
  } = data;

  const { meta: resolvedMeta, amount } = resolveAmountAndMeta(expense_type, meta, amountInput);

  const st = status || 'complete';
  if (st === 'complete' && (!Number.isFinite(amount) || amount <= 0)) {
    const err = new Error('المبلغ يجب أن يكون أكبر من صفر، أو اختر حالة «مسودة».');
    err.statusCode = 400;
    throw err;
  }

  if (expense_type === 'electricity' && meta?.curr_reading != null && meta?.prev_reading != null) {
    if (parseFloat(meta.curr_reading) < parseFloat(meta.prev_reading)) {
      const err = new Error('قراءة العداد الحالية يجب أن تكون أكبر أو تساوي السابقة.');
      err.statusCode = 400;
      throw err;
    }
  }

  return OperationalExpense.create({
    factory_id: factoryId,
    expense_date,
    expense_type,
    accounting_class: accounting_class || 'operational',
    accounting_label: accounting_label || null,
    description: description || null,
    amount,
    department_id: department_id || null,
    employee_id: employee_id || null,
    employee_name: employee_name || null,
    payment_method: payment_method || 'cash',
    status: status || 'complete',
    meta: resolvedMeta,
    created_by: userId,
  });
}

async function updateExpense(id, data, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const row = await OperationalExpense.findOne({ where });
  if (!row) {
    const err = new Error('Expense not found.');
    err.statusCode = 404;
    throw err;
  }

  const expense_type = data.expense_type ?? row.expense_type;
  const meta = data.meta !== undefined ? data.meta : row.meta;
  const amountInput = data.amount !== undefined ? data.amount : undefined;

  const { meta: resolvedMeta, amount } = resolveAmountAndMeta(expense_type, meta, amountInput ?? row.amount);

  const newStatus = data.status !== undefined ? data.status : row.status;
  if (newStatus === 'complete' && (!Number.isFinite(amount) || amount <= 0)) {
    const err = new Error('المبلغ يجب أن يكون أكبر من صفر، أو اختر حالة «مسودة».');
    err.statusCode = 400;
    throw err;
  }

  const patchKeys = [
    'expense_date',
    'expense_type',
    'accounting_class',
    'accounting_label',
    'description',
    'department_id',
    'employee_id',
    'employee_name',
    'payment_method',
    'status',
  ];
  const patch = {};
  for (const k of patchKeys) {
    if (data[k] !== undefined) patch[k] = data[k];
  }
  patch.expense_type = expense_type;
  patch.meta = resolvedMeta;
  patch.amount =
    data.amount !== undefined || data.meta !== undefined || data.expense_type !== undefined ? amount : row.amount;

  await row.update(patch);
  return OperationalExpense.findByPk(row.id, { include: expenseInclude });
}

async function deleteExpense(id, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const n = await OperationalExpense.destroy({ where });
  if (!n) {
    const err = new Error('Expense not found.');
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true };
}

async function getExpenseById(id, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const row = await OperationalExpense.findOne({
    where,
    include: expenseInclude,
  });
  if (!row) {
    const err = new Error('Expense not found.');
    err.statusCode = 404;
    throw err;
  }
  return row;
}

async function listExpenses(query = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  if (query.expense_type) where.expense_type = query.expense_type;
  if (query.accounting_class) where.accounting_class = query.accounting_class;
  if (query.status) where.status = query.status;
  if (query.payment_method) where.payment_method = query.payment_method;
  if (query.department_id) where.department_id = query.department_id;
  if (query.employee_id) where.employee_id = query.employee_id;
  if (query.from_date || query.to_date) {
    where.expense_date = {};
    if (query.from_date) where.expense_date[Op.gte] = query.from_date;
    if (query.to_date) where.expense_date[Op.lte] = query.to_date;
  }
  if (query.search) {
    const q = `%${query.search}%`;
    where[Op.or] = [
      { description: { [Op.iLike]: q } },
      { accounting_label: { [Op.iLike]: q } },
      { employee_name: { [Op.iLike]: q } },
    ];
  }

  return OperationalExpense.findAll({
    where,
    include: expenseInclude,
    order: [['expense_date', 'DESC'], ['created_at', 'DESC']],
  });
}

async function sumForPeriod(factoryId, from, to, extraWhere = {}) {
  const where = {
    factory_id: factoryId,
    expense_date: { [Op.between]: [from, to] },
    ...extraWhere,
  };
  const row = await OperationalExpense.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
    where,
    raw: true,
  });
  return parseFloat(row?.total || 0);
}

async function getDashboardSummary(factoryId, referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const dayStr = d.toISOString().slice(0, 10);
  const monthStart = monthStartStr(d);
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const monthEnd = new Date(nextMonth.getTime() - 86400000).toISOString().slice(0, 10);

  const [dayTotal, monthTotal, byType, topTypes, pettyByDay] = await Promise.all([
    sumForPeriod(factoryId, dayStr, dayStr),
    sumForPeriod(factoryId, monthStart, monthEnd),
    OperationalExpense.findAll({
      attributes: ['expense_type', [fn('SUM', col('amount')), 'total']],
      where: {
        factory_id: factoryId,
        expense_date: { [Op.between]: [monthStart, monthEnd] },
      },
      group: ['expense_type'],
      raw: true,
    }),
    OperationalExpense.findAll({
      attributes: ['expense_type', [fn('SUM', col('amount')), 'total']],
      where: { factory_id: factoryId, expense_date: { [Op.between]: [monthStart, monthEnd] } },
      group: ['expense_type'],
      order: [[literal('total'), 'DESC']],
      raw: true,
      limit: 10,
    }),
    sequelize
      .query(
        `
        SELECT DATE(expense_date) AS day, SUM(amount)::numeric AS total
        FROM operational_expenses
        WHERE factory_id = :factory_id
          AND expense_type = 'petty_meals'
          AND expense_date BETWEEN :from_d AND :to_d
        GROUP BY DATE(expense_date)
        ORDER BY DATE(expense_date)
        `,
        {
          replacements: { factory_id: factoryId, from_d: monthStart, to_d: monthEnd },
          type: QueryTypes.SELECT,
        }
      )
      .then((rows) => rows || []),
  ]);

  const typeMap = Object.fromEntries((byType || []).map((r) => [r.expense_type, parseFloat(r.total || 0)]));

  return {
    day_str: dayStr,
    month_start: monthStart,
    month_end: monthEnd,
    total_daily: dayTotal,
    total_monthly: monthTotal,
    by_expense_type: typeMap,
    top_expense_types: topTypes.map((r) => ({
      expense_type: r.expense_type,
      total: parseFloat(r.total || 0),
    })),
    petty_daily_series: pettyByDay.map((r) => ({
      day: r.day,
      total: parseFloat(r.total || 0),
    })),
  };
}

async function getAlerts(factoryId) {
  const alerts = [];
  const drafts = await OperationalExpense.count({
    where: { factory_id: factoryId, status: 'draft' },
  });
  if (drafts > 0) {
    alerts.push({
      code: 'INCOMPLETE',
      severity: 'warning',
      message: `يوجد ${drafts} مصروف بحالة مسودة — أكمل البيانات أو اعتمادها.`,
    });
  }

  const monthStart = monthStartStr(new Date());
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const monthEnd = new Date(nextMonth.getTime() - 86400000).toISOString().slice(0, 10);

  const budgets = await ExpenseBudget.findAll({ where: { factory_id: factoryId, period_month: monthStart } });
  const spentTotal = await sumForPeriod(factoryId, monthStart, monthEnd);

  for (const b of budgets) {
    let spent = spentTotal;
    if (b.scope === 'expense_type' && b.scope_value) {
      spent = await sumForPeriod(factoryId, monthStart, monthEnd, { expense_type: b.scope_value });
    } else if (b.scope === 'accounting_class' && b.scope_value) {
      spent = await sumForPeriod(factoryId, monthStart, monthEnd, { accounting_class: b.scope_value });
    }
    const limit = parseFloat(b.limit_amount || 0);
    const ratio = limit > 0 ? spent / limit : 0;
    if (limit > 0 && spent > limit) {
      alerts.push({
        code: 'BUDGET_EXCEEDED',
        severity: 'danger',
        message: `تجاوز الميزانية (${b.scope}/${b.scope_value || 'الكل'}): المصروف ${spent.toFixed(2)} والحد ${limit.toFixed(2)}.`,
        budget_id: b.id,
      });
    } else if (limit > 0 && ratio >= (parseFloat(b.warn_percent || 80) / 100)) {
      alerts.push({
        code: 'BUDGET_WARNING',
        severity: 'warning',
        message: `اقتراب من سقف الميزانية (${b.scope}): ${(ratio * 100).toFixed(0)}% مستخدم.`,
        budget_id: b.id,
      });
    }
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const prevStart = new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10);
  const prevEnd = new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10);

  const [weekSpend, prevSpend] = await Promise.all([
    sumForPeriod(factoryId, weekAgo, today),
    sumForPeriod(factoryId, prevStart, prevEnd),
  ]);
  const prevAvg = prevSpend / 4;
  if (prevAvg > 0 && weekSpend > prevAvg * 1.5) {
    alerts.push({
      code: 'SPENDING_SPIKE',
      severity: 'warning',
      message: `ارتفاع ملحوظ في المصاريف هذا الأسبوع مقارنة بالمتوسط السابق.`,
    });
  }

  return alerts;
}

async function reportAggregate(factoryId, query) {
  const { from_date, to_date, group_by } = query;
  if (!from_date || !to_date) {
    const err = new Error('from_date و to_date مطلوبان.');
    err.statusCode = 400;
    throw err;
  }

  const extra = {};
  if (query.expense_type) extra.expense_type = query.expense_type;
  if (query.accounting_class) extra.accounting_class = query.accounting_class;
  if (query.department_id) extra.department_id = query.department_id;

  const total = await sumForPeriod(factoryId, from_date, to_date, extra);

  const gb = group_by || 'expense_type';

  if (gb === 'day') {
    const rep = { factory_id: factoryId, from_date, to_date };
    let cond =
      'factory_id = :factory_id AND expense_date BETWEEN :from_date AND :to_date';
    if (query.expense_type) {
      cond += ' AND expense_type = :expense_type';
      rep.expense_type = query.expense_type;
    }
    if (query.accounting_class) {
      cond += ' AND accounting_class = :accounting_class';
      rep.accounting_class = query.accounting_class;
    }
    if (query.department_id) {
      cond += ' AND department_id = :department_id';
      rep.department_id = query.department_id;
    }
    const groups = await sequelize.query(
      `
      SELECT DATE(expense_date) AS bucket, SUM(amount)::numeric AS total
      FROM operational_expenses
      WHERE ${cond}
      GROUP BY DATE(expense_date)
      ORDER BY DATE(expense_date)
      `,
      { replacements: rep, type: QueryTypes.SELECT }
    );
    return {
      from_date,
      to_date,
      total,
      groups: (groups || []).map((r) => ({
        bucket: r.bucket,
        total: parseFloat(r.total || 0),
      })),
    };
  }

  const field =
    gb === 'department'
      ? 'department_id'
      : gb === 'employee'
        ? 'employee_id'
        : gb === 'accounting_class'
          ? 'accounting_class'
          : 'expense_type';

  const where = {
    factory_id: factoryId,
    expense_date: { [Op.between]: [from_date, to_date] },
    ...extra,
  };

  const rows = await OperationalExpense.findAll({
    attributes: [field, [fn('SUM', col('amount')), 'total']],
    where,
    group: [field],
    raw: true,
  });

  return {
    from_date,
    to_date,
    total,
    groups: rows.map((r) => ({
      bucket: r[field],
      total: parseFloat(r.total || 0),
    })),
  };
}

async function upsertBudget(data, userId, factoryId) {
  const { period_month, scope, scope_value, limit_amount, warn_percent, notes } = data;
  const [row] = await ExpenseBudget.findOrCreate({
    where: {
      factory_id: factoryId,
      period_month,
      scope: scope || 'all',
      scope_value: scope_value || null,
    },
    defaults: {
      factory_id: factoryId,
      period_month,
      scope: scope || 'all',
      scope_value: scope_value || null,
      limit_amount,
      warn_percent: warn_percent ?? 80,
      notes: notes || null,
      created_by: userId,
    },
  });
  if (!row.isNewRecord) {
    await row.update({
      limit_amount,
      warn_percent: warn_percent ?? row.warn_percent,
      notes: notes !== undefined ? notes : row.notes,
    });
  }
  return row;
}

async function listBudgets(factoryId, period_month) {
  const where = { factory_id: factoryId };
  if (period_month) where.period_month = period_month;
  return ExpenseBudget.findAll({ where, order: [['period_month', 'DESC']] });
}

async function listDepartments(factoryId) {
  return Department.findAll({
    where: { factory_id: factoryId },
    attributes: ['id', 'name', 'code'],
    order: [['name', 'ASC']],
  });
}

async function listEmployeesLite(factoryId) {
  return Employee.findAll({
    where: { factory_id: factoryId, status: 'active' },
    attributes: ['id', 'full_name', 'employee_code', 'department_id'],
    order: [['full_name', 'ASC']],
    limit: 500,
  });
}

async function exportCsvRows(factoryId, query) {
  const rows = await listExpenses(query, factoryId);
  const header = [
    'تاريخ',
    'النوع',
    'التصنيف المحاسبي',
    'البيان',
    'المبلغ',
    'القسم',
    'الموظف',
    'الدفع',
    'الحالة',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    const line = [
      r.expense_date,
      r.expense_type,
      r.accounting_class,
      `"${String(r.description || '').replace(/"/g, '""')}"`,
      r.amount,
      r.department?.name || '',
      r.employee?.full_name || r.employee_name || '',
      r.payment_method,
      r.status,
    ];
    lines.push(line.join(','));
  }
  return '\ufeff' + lines.join('\n');
}

module.exports = {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseById,
  listExpenses,
  getDashboardSummary,
  getAlerts,
  reportAggregate,
  upsertBudget,
  listBudgets,
  exportCsvRows,
  monthStartStr,
  listDepartments,
  listEmployeesLite,
};
