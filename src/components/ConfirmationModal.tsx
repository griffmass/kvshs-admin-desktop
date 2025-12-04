// src/components/ConfirmationModal.tsx
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  type: 'delete' | 'approve' | 'enroll';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  warning,
  confirmLabel,
  onClose,
  onConfirm,
  type
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 text-lg">{message}</p>
            {warning && <p className="text-red-600 text-sm mt-2 font-medium">{warning}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-2 text-white rounded-lg transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'delete'
                  ? 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 focus:ring-red-600'
                  : 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:ring-green-600'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}