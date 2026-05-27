// src/pages/Movements.jsx
import { useState } from 'react';
import { movements as movApi } from '../lib/api';
import { useFetch } from '../hooks/useFetch';

export default function Movements() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading } = useFetch(
    () => movApi.list({ type, page, limit: 50 }),
    [type, page]
  );

  const movs  = data?.data  || [];
  const total = data?.total || 0;
  const pages = Math.ceil(total / 50);

  const exportCSV = () => {
    const rows = [['Data','Código','Tipo','Quantidade','Motivo','Usuário']];
    movs.forEach(m => rows.push([
      new Date(m.created_at).toLocaleString('pt-BR'),
      m.key_code, m.type, m.quantity, m.reason || '', m.user_name || ''
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'movimentacoes-chaveiro-pro.csv';
    a.click();
  };

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          style={{ padding:'9px 12px', border:'1px solid var(--gray2)', borderRadius:'var(--r)', fontSize:13, background:'var(--white)', fontFamily:'var(--font)', color:'var(--gray4)' }}>
          <option value="">Todos os tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="ajuste">Ajuste</option>
        </select>
        <div style={{ fontSize:12, color:'var(--gray3)', marginLeft:4 }}>
          {loading ? 'Carregando…' : `${total} registro${total!==1?'s':''}`}
        </div>
        <button className="hbtn" style={{ marginLeft:'auto' }} onClick={exportCSV}>
          <i className="ti ti-download"></i> Exportar CSV
        </button>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Código</th><th>Aplicação</th>
              <th>Tipo</th><th>Qtd.</th><th>Motivo</th><th>Usuário</th>
            </tr>
          </thead>
          <tbody>
            {movs.map(m => {
              const isIn = m.type === 'entrada';
              const isAdj = m.type === 'ajuste';
              return (
                <tr key={m.id}>
                  <td className="tbl-mfr">{new Date(m.created_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  <td className="tbl-code">{m.key_code}</td>
                  <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'var(--gray3)' }}>{m.application}</td>
                  <td>
                    <span className={`badge ${isIn?'b-green':isAdj?'b-gray':'b-red'}`}>
                      <span className="dot"></span>
                      {m.type.charAt(0).toUpperCase()+m.type.slice(1)}
                    </span>
                  </td>
                  <td>
                    <b style={{ color: isIn?'var(--green)':isAdj?'var(--gray4)':'var(--red)', fontSize:14 }}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </b>
                  </td>
                  <td style={{ fontSize:12, color:'var(--gray4)' }}>{m.reason || '—'}</td>
                  <td className="tbl-mfr">{m.user_name || '—'}</td>
                </tr>
              );
            })}
            {!loading && movs.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--gray3)', padding:32 }}>Nenhuma movimentação registrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pages > 1 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
          <button className="action-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Anterior</button>
          <span style={{ padding:'4px 12px', fontSize:12, color:'var(--gray4)' }}>Página {page} de {pages}</span>
          <button className="action-btn" disabled={page===pages} onClick={() => setPage(p=>p+1)}>Próxima →</button>
        </div>
      )}
    </div>
  );
}
