'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, User, Loader2 } from 'lucide-react';
import { clientApi } from '@/lib/clientApi';
import { useDebounce } from '@/hooks/useDebounce';
import type { Client } from '@/types';

interface ClientSearchInputProps {
  value: Client | null;
  onChange: (client: Client | null) => void;
  error?: string;
}

export function ClientSearchInput({ value, onChange, error }: ClientSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setLoading(true);
    clientApi
      .search({ phone: debouncedQuery, name: debouncedQuery })
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  if (value) {
    return (
      <div className="flex items-center justify-between input-base">
        <div>
          <p className="text-sm font-medium text-white">{value.full_name}</p>
          <p className="text-xs text-gray-400">{value.phone}{value.email ? ` · ${value.email}` : ''}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />}
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or phone…"
          className={`input-base w-full pl-9 ${error ? 'border-red-500/60' : ''}`}
        />
      </div>

      {open && (query.trim() || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 glass border border-white/10 rounded-xl shadow-lg z-50 max-h-52 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {loading ? 'Searching…' : 'No clients found'}
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => { onChange(c); setQuery(''); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{c.full_name}</p>
                  <p className="text-xs text-gray-400">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
