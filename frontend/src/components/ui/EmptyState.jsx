import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No data available.', icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="p-4 bg-gray-100 rounded-full">
        <Icon size={28} className="text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 max-w-xs">{message}</p>
      {action}
    </div>
  );
}
