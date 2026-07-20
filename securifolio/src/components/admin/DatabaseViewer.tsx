'use client';

import { useState, useEffect } from 'react';
import { getProfilesData, getTitresFonciersData, getAntiFolioHistoryData, getSmartArchiveHistoryData } from '@/app/admin/actions';
import { Loader2, Search, Database, Users, FileText, History, ShieldAlert } from 'lucide-react';

type TableKey = 'profiles' | 'titres_fonciers' | 'anti_folio_history' | 'smart_archive_history';

export function DatabaseViewer() {
  const [activeTable, setActiveTable] = useState<TableKey>('profiles');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTableData = async (table: TableKey) => {
    setLoading(true);
    setError(null);
    setData([]);
    let result;

    switch (table) {
      case 'profiles': result = await getProfilesData(); break;
      case 'titres_fonciers': result = await getTitresFonciersData(); break;
      case 'anti_folio_history': result = await getAntiFolioHistoryData(); break;
      case 'smart_archive_history': result = await getSmartArchiveHistoryData(); break;
    }

    if (result?.error) {
      setError(result.error);
    } else if (result?.data) {
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTableData(activeTable);
  }, [activeTable]);

  const filteredData = data.filter(row => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    // Recursively search all object values
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchLower)
    );
  });

  const getColumns = () => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  const columns = getColumns();

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Table Selector & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-brand-surface/80 border border-slate-200 dark:border-brand-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveTable('profiles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTable === 'profiles' ? 'bg-red-500 text-white shadow-md' : 'bg-brand-bg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users size={14} /> Profils
          </button>
          <button
            onClick={() => setActiveTable('titres_fonciers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTable === 'titres_fonciers' ? 'bg-red-500 text-white shadow-md' : 'bg-brand-bg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={14} /> Titres Fonciers
          </button>
          <button
            onClick={() => setActiveTable('anti_folio_history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTable === 'anti_folio_history' ? 'bg-red-500 text-white shadow-md' : 'bg-brand-bg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert size={14} /> Anti-Folio
          </button>
          <button
            onClick={() => setActiveTable('smart_archive_history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTable === 'smart_archive_history' ? 'bg-red-500 text-white shadow-md' : 'bg-brand-bg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History size={14} /> Archives
          </button>
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-brand-bg border border-slate-200 dark:border-brand-border rounded-xl px-4 py-2 pl-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        </div>
      </div>

      {/* Data Viewer */}
      <div className="flex-1 bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-2xl shadow-sm overflow-hidden flex flex-col relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-brand-surface/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Chargement...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 flex flex-col items-center">
            <ShieldAlert className="w-8 h-8 mb-2" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center h-full justify-center">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">Aucune donnée trouvée dans la table {activeTable}.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 w-full h-full custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-max">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="p-3 border-b border-slate-200 dark:border-brand-border font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-brand-border/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    {columns.map((col) => (
                      <td key={`${i}-${col}`} className="p-3 text-slate-700 dark:text-slate-300 max-w-[300px] truncate" title={String(row[col])}>
                        {typeof row[col] === 'boolean' 
                          ? (row[col] ? 'OUI' : 'NON') 
                          : typeof row[col] === 'object' 
                            ? JSON.stringify(row[col]) 
                            : String(row[col] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="text-right text-xs text-slate-500 font-medium">
        {filteredData.length} enregistrement(s)
      </div>
    </div>
  );
}
