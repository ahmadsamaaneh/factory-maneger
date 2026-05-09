import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Spinner from '../atoms/Spinner';
import { cn } from '../../utils/cn';

function EmptyState({ message, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="p-4 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <Icon size={28} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-tertiary)' }}>{message}</p>
      {action}
    </div>
  );
}

function SortIcon({ direction }) {
  if (!direction) return <ChevronsUpDown size={12} className="opacity-30" />;
  return direction === 'asc'
    ? <ChevronUp size={12} className="text-primary-500" />
    : <ChevronDown size={12} className="text-primary-500" />;
}

export default function DataTable({
  columns,
  data = [],
  loading,
  emptyMessage = 'No records found.',
  emptyIcon,
  emptyAction,
  searchable,
  searchPlaceholder = 'Search…',
  stickyHeader,
  striped,
  compact,
  className,
}) {
  const { t } = useTranslation();
  const [search,   setSearch]   = useState('');
  const [sortKey,  setSortKey]  = useState(null);
  const [sortDir,  setSortDir]  = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const processed = useMemo(() => {
    let rows = [...data];

    if (search && searchable) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      rows.sort((a, b) => {
        const va = col?.sortValue ? col.sortValue(a) : a[sortKey] ?? '';
        const vb = col?.sortValue ? col.sortValue(b) : b[sortKey] ?? '';
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [data, search, sortKey, sortDir, columns, searchable]);

  const cellPy = compact ? 'py-2' : 'py-3';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {searchable && (
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || t('common.searchPlaceholder')}
            className="ds-input pl-8 h-8 text-xs"
          />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className={cn('overflow-x-auto', stickyHeader && 'max-h-[600px] overflow-y-auto')}>
          <table className="ds-table">
            <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : {}}
                    className={cn(col.sortable && 'cursor-pointer select-none hover:opacity-80')}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && <SortIcon direction={sortKey === col.key ? sortDir : null} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="flex justify-center py-16">
                      <Spinner size="lg" />
                    </div>
                  </td>
                </tr>
              ) : processed.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState message={emptyMessage} icon={emptyIcon} action={emptyAction} />
                  </td>
                </tr>
              ) : (
                processed.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className={cn(striped && i % 2 === 1 && 'bg-neutral-50/50 dark:bg-neutral-800/30')}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(cellPy, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                      >
                        {col.render ? col.render(row, i) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && processed.length > 0 && (
          <div className="px-4 py-2.5 border-t text-xs flex items-center justify-between" style={{ borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}>
            <span>
              {search
                ? t('common.filteredRecords', { filtered: processed.length, total: data.length })
                : t('common.recordsCount', { count: data.length })}
            </span>
            {search && (
              <button onClick={() => setSearch('')} className="hover:underline text-primary-500">
                {t('common.clearSearch')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
