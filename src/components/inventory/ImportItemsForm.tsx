'use client';

import React, { useState } from 'react';

interface ImportItemsFormProps {
  onImportSuccess: () => void;
  onClose: () => void;
}

export default function ImportItemsForm({ onImportSuccess, onClose }: ImportItemsFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to import.');
      return;
    }
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/items/import', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to import items');
      }
      
      setMessage(`${data.insertedCount} items imported successfully.`);
      onImportSuccess();

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green-500 text-sm">{message}</p>}
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
          Excel File
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls" />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">XLSX, XLS up to 10MB</p>
            {file && <p className="text-sm text-gray-600 mt-2">Selected file: {file.name}</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!file || submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {submitting ? 'Importing...' : 'Import Items'}
        </button>
      </div>
    </form>
  );
}
