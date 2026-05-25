// src/pages/SearchKeys.jsx
import { useState, useEffect, useCallback } from 'react';
import { keys as keysApi } from '../lib/api';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const STATUS_BADGE = {
  disponivel: <span className="badge b-green"><span className="dot"></span>Disponível</span>,
  pouco:      <span className="badge b-yellow"><span className="dot"></span>Poucas un.</span>,
  esgotado:   <span className="badge b-red"><span className="dot"></span>Esgotado</span>,
};

const KEY_SVG = (
  <svg viewBox="0 0 60 30" width="50" height="25">
    <path d="M8 15 Q14 8 22 8 L52 8 L52 22 L22 22 Q14 22 8 15Z" fill="none" stroke="#94A3B8" strokeWidth="1.5"/>
    <circle cx="15" cy="15" r="4" fill="none" stroke="#94A3B8" strokeWidth="1.5"/>
    <line x1="28" y1="8" x2="28" y2="22" stroke="#94A3B8" strokeWidth="1"/>
    <line x1="36" y1="8" x2="36" y2="19" stroke="#94A3B8" strokeWidth="1"/>
    <line x1="44" y1="8" x2="44" y2="22" stroke="#94A3B8" strokeWidth="1"/>
  </svg>
);

const CHIPS = [
  { label: 'Todos', value: '' },
  { label: 'Honda', value: 'honda' },
  { label: 'Volkswagen', value: 'volkswagen' },
  { label: 'Toyota', value: 'toyota' },
  { label: 'Ford', value: 'ford' },
  { label: 'Hyundai', value: 'hyundai' },
  { label: 'Fechaduras', value: 'fechadura' },
];

export default function SearchKeys({ onDetail }) {
  const [q,       setQ]       = useState('');
  const [chip,    setChip]    = useState('');
  const [results, setResults] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(
    debounce(async (query, chipFilter) => {
      setLoading(true);
      try {
        const res = await keysApi.list({ q: query || chipFilter, limit: 60 });
        setResults(res.data);
        setTotal(res.total);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280),
    []
  );

  useEffect(() => { doSearch(q, chip); }, [q, chip, doSearch]);

  return (
    <div>
      <div className="search-box">
        <i className="ti ti-search si"></i>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Digite código, fabricante, veículo ou aplicação..."
          autoFocus
        />
      </div>

      <div className="filter-row">
        {CHIPS.map(c => (
          <span
            key={c.value}
            className={`filter-chip${chip === c.value && !q ? ' on' : ''}`}
            onClick={() => { setChip(c.value); setQ(''); }}
          >
            {c.label}
          </span>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--gray3)', marginBottom: 12 }}>
        {loading ? 'Buscando…' : `Mostrando ${results.length} de ${total} resultado${total !== 1 ? 's' : ''}`}
      </div>

      <div className="results-list">
        {results.map(k => (
          <div className="result-item" key={k.id} onClick={() => onDetail(k.id)}>
            <div className="key-thumb">{KEY_SVG}</div>
            <div className="ri-info">
              <div className="ri-code">{k.code}</div>
              <div className="ri-app">{k.application}</div>
              <div className="ri-mfr">{k.manufacturer}</div>
            </div>
            <div className="ri-right">
              {STATUS_BADGE[k.status]}
              <div className="ri-loc">
                <i className="ti ti-map-pin" style={{ fontSize: 12 }}></i>
                <span className="loc-badge">{k.panel_column}{k.panel_row}</span>
              </div>
            </div>
            <button className="btn-detail" onClick={e => { e.stopPropagation(); onDetail(k.id); }}>
              Ver detalhes
            </button>
          </div>
        ))}

        {!loading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray3)' }}>
            <i className="ti ti-search" style={{ fontSize: 32 }}></i>
            <p style={{ marginTop: 8 }}>Nenhuma chave encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
