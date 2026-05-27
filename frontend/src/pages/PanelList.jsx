// src/pages/PanelList.jsx
import { useState } from 'react';
import { keys as keysApi } from '../lib/api';
import { useFetch } from '../hooks/useFetch';

const STATUS_BADGE = {
  disponivel: <span className="badge b-green"><span className="dot"></span>Disponível</span>,
  pouco:      <span className="badge b-yellow"><span className="dot"></span>Poucas un.</span>,
  esgotado:   <span className="badge b-red"><span className="dot"></span>Esgotado</span>,
};

export default function PanelList({ onNavigate, onDetail }) {
  const [status, setStatus]   = useState('');
  const [column, setColumn]   = useState('');

  const { data, loading } = useFetch(
    () => keysApi.list({ status, column, limit: 100 }),
    [status, column]
  );
  const keys = data?.data || [];

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <button className="hbtn" onClick={() => onNavigate('panel')}>
          <i className="ti ti-grid-dots"></i> Ver visual
        </button>
        <select value={column} onChange={e => setColumn(e.target.value)}
          style={{ padding:'9px 12px', border:'1px solid var(--gray2)', borderRadius:'var(--r)', fontSize:13, background:'var(--white)', fontFamily:'var(--font)', color:'var(--gray4)' }}>
          <option value="">Todas as colunas</option>
          {['A','B','C','D','E','F','G','H'].map(c => <option key={c} value={c}>Coluna {c}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding:'9px 12px', border:'1px solid var(--gray2)', borderRadius:'var(--r)', fontSize:13, background:'var(--white)', fontFamily:'var(--font)', color:'var(--gray4)' }}>
          <option value="">Toda situação</option>
          <option value="disponivel">Disponível</option>
          <option value="pouco">Poucas unidades</option>
          <option value="esgotado">Esgotado</option>
        </select>
        <div style={{ fontSize:12, color:'var(--gray3)', marginLeft:4 }}>
          {loading ? 'Carregando…' : `${keys.length} posição${keys.length!==1?'es':''} ocupada${keys.length!==1?'s':''}`}
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Local</th><th>Código</th><th>Aplicação</th>
              <th>Fabricante</th><th>Estoque</th><th>Situação</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id}>
                <td><span className="loc-badge">{k.panel_column}{k.panel_row}</span></td>
                <td className="tbl-code">{k.code}</td>
                <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k.application}</td>
                <td className="tbl-mfr">{k.manufacturer || '—'}</td>
                <td><b style={{ color:'var(--navy2)' }}>{k.stock}</b> un.</td>
                <td>{STATUS_BADGE[k.status]}</td>
                <td>
                  <button className="action-btn" onClick={() => onDetail(k.id)}>
                    <i className="ti ti-eye"></i> Ver
                  </button>
                </td>
              </tr>
            ))}
            {!loading && keys.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--gray3)', padding:32 }}>Nenhuma chave encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
