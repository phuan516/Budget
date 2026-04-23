'use client';

import { Check, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { SheetMetadata } from '@/lib/google/sheets';

interface SheetSelectorProps {
  onSelectSheet: (sheetId: string) => void;
  onCreateSheet: () => void;
  accessToken: string;
}

export default function SheetSelector({ onSelectSheet, onCreateSheet, accessToken }: SheetSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadTrigger, setLoadTrigger] = useState(0);
  const availableSheets = useStore((state) => state.availableSheets);
  const setAvailableSheets = useStore((state) => state.setAvailableSheets);
  const selectedSheet = useStore((state) => state.selectedSheet);

  const loadSheets = async () => {
    setIsLoading(true);
    try {
      const sheets: SheetMetadata[] = []
      // const response = await fetch('/api/sheets/list', {
      //   headers: {
      //     'Authorization': `Bearer ${accessToken}`,
      //   },
      // });
      // const sheets = await response.json();
      setAvailableSheets(sheets);
    } catch (error) {
      console.error('Failed to load sheets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSheet) {
      // If already have a selected sheet, don't load
      return;
    }
    loadSheets();
  }, [selectedSheet, loadTrigger]);

  const filteredSheets = availableSheets.filter(sheet =>
    sheet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSheet = (sheet: typeof availableSheets[0]) => {
    onSelectSheet(sheet.id);
  };

  const handleCreateNew = () => {
    onCreateSheet();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          Select Your Budget Sheet
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Choose an existing budget sheet or create a new one to get started
        </p>
      </div>

      {/* Create New Section */}
      <div className="mb-8">
        <button
          onClick={handleCreateNew}
          className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 hover:border-primary-600 dark:hover:border-primary-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-200 group flex flex-col items-center justify-center gap-4"
        >
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
            <Plus className="w-8 h-8 text-zinc-600 dark:text-zinc-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
              Create New Budget Sheet
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Start fresh with a new budget tracker
            </p>
          </div>
        </button>
      </div>

      {/* Existing Sheets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Your Sheets
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search sheets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">Loading your sheets...</p>
          </div>
        ) : filteredSheets.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <FileSpreadsheet className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">
              {searchTerm ? 'No sheets match your search' : 'No budget sheets found'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => handleSelectSheet(sheet)}
                className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all duration-200 text-left"
              >
                {sheet.thumbnailLink ? (
                  <img
                    src={sheet.thumbnailLink}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white truncate">
                    {sheet.name}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {sheet.modifiedTime
                      ? `Modified ${new Date(sheet.modifiedTime).toLocaleDateString()}`
                      : 'Last modified Unknown'}
                  </p>
                </div>
                {selectedSheet?.id === sheet.id && (
                  <Check className="w-5 h-5 text-primary-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
