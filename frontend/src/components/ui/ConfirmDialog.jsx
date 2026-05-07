import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-3 bg-red-50 rounded-full">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-gray-600">{message || 'Are you sure? This action cannot be undone.'}</p>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
