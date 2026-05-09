import { useMemo } from 'react';
import { fmt } from '../../utils/formatters';
import { STATUS_COLORS } from '../../utils/constants';

const MIN_DAY = 24 * 60;

function parseHHmm(s) {
  if (!s || typeof s !== 'string') return null;
  const m = String(s).trim().match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function minutesToHHmm(total) {
  const m = Math.max(0, Math.min(MIN_DAY - 1, total));
  const h = Math.floor(m / 60);
  const mi = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

/** نطاق الدفعة بالدقائق من منتصف الليل (0–1439). */
export function batchTimeRange(b) {
  let s = parseHHmm(b.start_time);
  let e = parseHHmm(b.end_time);
  if (s == null && b.created_at) {
    const d = new Date(b.created_at);
    s = d.getHours() * 60 + d.getMinutes();
  }
  if (s == null) s = 9 * 60;
  if (e == null || e <= s) e = Math.min(s + 60, MIN_DAY - 1);
  e = Math.min(e, MIN_DAY - 1);
  return { s, e };
}

function assignLanes(items) {
  const sorted = [...items].sort((a, b) => a.s - b.s);
  const laneEnds = [];
  return sorted.map((item) => {
    let assigned = -1;
    for (let lane = 0; lane < laneEnds.length; lane += 1) {
      if (item.s >= laneEnds[lane]) {
        assigned = lane;
        break;
      }
    }
    if (assigned === -1) {
      laneEnds.push(item.e);
      assigned = laneEnds.length - 1;
    } else {
      laneEnds[assigned] = Math.max(laneEnds[assigned], item.e);
    }
    return { ...item, lane: assigned };
  });
}

const HOUR_LABELS = Array.from({ length: 25 }, (_, i) => i);

/**
 * مخطط يومي 24 ساعة (اتجاه LTR للأرقام داخل الشريط).
 */
export default function BatchDayTimeline({ batches, statusLabels, onSelectBatch }) {
  const layout = useMemo(() => {
    const items = batches.map((b) => {
      const { s, e } = batchTimeRange(b);
      return { b, s, e };
    });
    return assignLanes(items);
  }, [batches]);

  const maxLane = layout.reduce((m, x) => Math.max(m, x.lane), -1);
  const trackHeight = Math.max(120, (maxLane + 1) * 52 + 8);

  const pct = (mins) => (mins / MIN_DAY) * 100;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="px-3 py-2 text-xs font-medium border-b" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}>
        المخطط الزمني (24 ساعة) — اضغط على دفعة للتعديل
      </div>

      <div className="overflow-x-auto" dir="ltr">
        <div className="min-w-[720px] px-2 pb-2">
          {/* ساعات */}
          <div className="relative h-7 mt-2 mb-1 text-[10px] font-medium text-neutral-500">
            {HOUR_LABELS.filter((h) => h % 2 === 0).map((h) => (
              <span
                key={h}
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${pct(h * 60)}%` }}
              >
                {String(h).padStart(2, '0')}
              </span>
            ))}
          </div>

          {/* خطوط عمودية كل ساعتين */}
          <div className="relative h-2 mb-1">
            {HOUR_LABELS.filter((h) => h % 2 === 0).map((h) => (
              <div
                key={h}
                className="absolute top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700"
                style={{ left: `${pct(h * 60)}%` }}
              />
            ))}
          </div>

          <div className="relative" style={{ height: `${trackHeight}px` }}>
            {layout.map(({ b, s, e, lane }) => {
              const w = Math.max(pct(e - s), 0.35);
              const left = pct(s);
              const label = b.recipe?.name || b.batch_number;
              const st = statusLabels?.[b.status] || b.status;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBatch(b)}
                  className={`absolute rounded-lg px-2 py-1 text-left text-xs font-medium shadow-sm border transition hover:opacity-95 hover:ring-2 hover:ring-primary-400/40 ${STATUS_COLORS[b.status] || 'bg-neutral-100 text-neutral-800'}`}
                  style={{
                    left: `${left}%`,
                    width: `${w}%`,
                    top: 4 + lane * 52,
                    height: 44,
                    minWidth: 4,
                  }}
                  title={`${label} — ${minutesToHHmm(s)}–${minutesToHHmm(e)}`}
                >
                  <div className="truncate font-semibold leading-tight">{label}</div>
                  <div className="truncate opacity-90 text-[10px] mt-0.5">
                    {minutesToHHmm(s)} – {minutesToHHmm(e)} · {st}
                  </div>
                  <div className="truncate text-[10px] opacity-80 mt-0.5">{fmt.currency(b.total_cost)}</div>
                </button>
              );
            })}

            {layout.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                لا توجد دفعات في هذا اليوم.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
