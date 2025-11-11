'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToWarehouse: () => void;
  onBackToQueue: () => void;
}

export default function ApprovalDialog({ isOpen, onClose, onGoToWarehouse, onBackToQueue }: ApprovalDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div 
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Request Approved!</h3>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            The request has been successfully approved and is now ready for fulfillment.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onGoToWarehouse}
              className="flex-1 px-6 py-3 text-white rounded-md font-medium transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              Go to Warehouse
            </button>
            <button
              onClick={onBackToQueue}
              className="flex-1 px-6 py-3 rounded-md font-medium transition-all border hover:bg-gray-50"
              style={{ borderColor: '#E5E7EB', color: '#4B5563' }}
            >
              Back to Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
