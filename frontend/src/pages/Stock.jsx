// src/pages/Stock.jsx
import { useState, useCallback } from 'react';
import { keys as keysApi, movements as movApi } from '../lib/api';
import { useFetch } from '../hooks/useFetch';

const STATUS_BADGE = {
  disponivel: <span className="badge b-green"><span className="dot"></span>Disponível</span>,
  pouco:      <span className="badge b-yellow"><span className="dot"></span>Poucas un.</span>,
  esgotado:   <span className="badge b-red"><span className="dot"></span>Esgotado</span>,
};

export default function Stock({ onDetail }) {
  const [q,       setQ]       = useState('');
  const [status,  setStatus]  = useState('');
  const [movModal, setMovModal] = useState(null); // key object
  const [movType,  setMovType]  = useState('entrada');
  const [movQty,   setMovQty]   = useState(1);
  const [movReason,setMovReason]= useState('');
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  const { data, loading, refetch } = useFetch(
    () => keysApi.list({ q, status, limit: 100 }),
    [q, status]
  );

  const keys = data?.data || [];

  const handleMov = async () => {
    if (!movReason.trim()) { setMsg('Informe o motivo.'); return; }
    setSaving(true); setMsg('');
    try {
      await movApi.create({ key_id: movModal.id, type: movType, quantity: movQty, reason: movReason });
      setMovModal(null);
      setMovQty(1); setMovReason('');
      refetch();
    } catch (err) {
      setMsg(err.message);
    } finally { setSaving(false); }
  };

  const exportCSV = () => {
    const rows = [['Código','Aplicação','Fabricante','Estoque','Status','Local']];
    keys.forEach(k => rows.push([k.code, k.application, k.manufacturer, k.stock, k.status, `${k.panel_column}${k.panel_row}`]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'estoque-chaveiro-pro.csv';
    a.click();
  };

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div className="search-box" style={{ flex:1, marginBottom:0 }}>
          <i className="ti ti-search si"></i>
          <input type="text" placeholder="Filtrar estoque..." value={q}
            onChange={e => setQ(e.target.value)} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding:'9px 12px', border:'1px solid var(--gray2)', borderRadius:'var(--r)', fontSize:13, background:'var(--white)', fontFamily:'var(--font)', color:'var(--gray4)' }}>
          <option value="">Toda situação</option>
          <option value="disponivel">Disponível</option>
          <option value="pouco">Poucas unidades</option>
          <option value="esgotado">Esgotado</option>
        </select>
        <button className="hbtn" onClick={exportCSV}><i className="ti ti-download"></i> Exportar CSV</button>
      </div>

      <div style={{ fontSize:12, color:'var(--gray3)', marginBottom:12 }}>
        {loading ? 'Carregando…' : `${keys.length} item${keys.length!==1?'s':''}`}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Aplicação</th><th>Fabricante</th>
              <th>Qtd.</th><th>Nível</th><th>Situação</th><th>Local</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => {
              const pct = Math.min(100, Math.round((k.stock / (k.low_stock_threshold * 4)) * 100));
              const color = k.status==='disponivel'?'var(--green)':k.status==='pouco'?'var(--yellow)':'var(--red)';
              return (
                <tr key={k.id}>
                  <td className="tbl-code">{k.code}</td>
                  <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k.application}</td>
                  <td className="tbl-mfr">{k.manufacturer || '—'}</td>
                  <td><b style={{ color:'var(--navy2)', fontSize:15 }}>{k.stock}</b></td>
                  <td>
                    <div className="qty-bar">
                      <div className="qb-fill" style={{ width:`${pct}%`, background:color }}></div>
                    </div>
                  </td>
                  <td>{STATUS_BADGE[k.status]}</td>
                  <td><span className="loc-badge">{k.panel_column}{k.panel_row}</span></td>
                  <td>
                    <button className="action-btn" onClick={() => onDetail(k.id)}><i className="ti ti-eye"></i></button>
                    <button className="action-btn" style={{ color:'var(--green)' }}
                      onClick={() => { setMovModal(k); setMovType('entrada'); setMovReason(''); setMsg(''); }}>
                      <i className="ti ti-arrow-down"></i> Entrada
                    </button>
                    <button className="action-btn" style={{ color:'var(--red)' }}
                      onClick={() => { setMovModal(k); setMovType('saida'); setMovReason(''); setMsg(''); }}>
                      <i className="ti ti-arrow-up"></i> Saída
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && keys.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--gray3)', padding:32 }}>Nenhuma chave encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal movimentação */}
      {movModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--white)', borderRadius:16, padding:28, width:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--navy2)' }}>
                Movimentação — <span style={{ fontFamily:'var(--mono)' }}>{movModal.code}</span>
              </div>
              <button className="action-btn" onClick={() => setMovModal(null)}>✕</button>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Tipo</label>
              <div style={{ display:'flex', gap:8 }}>
                {['entrada','saida','ajuste'].map(t => (
                  <button key={t} onClick={() => setMovType(t)}
                    style={{ flex:1, padding:'8px', borderRadius:'var(--r)', border:'1.5px solid', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:500,
                      borderColor: movType===t ? 'var(--blue)' : 'var(--gray2)',
                      background: movType===t ? '#EFF6FF' : 'var(--white)',
                      color: movType===t ? 'var(--blue)' : 'var(--gray4)',
                    }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Quantidade</label>
              <input type="number" min="1" value={movQty} onChange={e => setMovQty(Number(e.target.value))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid var(--gray2)', borderRadius:'var(--r)', fontSize:13, fontFamily:'var(--font)' }} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Motivo</label>
              <input type="text" value={movReason} onChange={e => setMovReason(e.target.value)}
                placeholder="ex: Venda balcão, Compra fornecedor, Ajuste inventário"
                style={{ width:'100%', padding:'9px 12px', border:'1px solid var(--gray2)', borderRadius:'var(--r)', fontSize:13, fontFamily:'var(--font)' }} />
            </div>

            <div style={{ background:'var(--gray1)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:12, color:'var(--gray4)', marginBottom:16 }}>
              Estoque atual: <b style={{ color:'var(--navy2)' }}>{movModal.stock} un.</b>
              {' → '}
              <b style={{ color: movType==='saida'?'var(--red)':'var(--green)' }}>
                {movType==='saida' ? movModal.stock - movQty : movModal.stock + movQty} un.
              </b>
            </div>

            {msg && <div style={{ background:'var(--red-bg)', color:'var(--red-text)', padding:'8px 12px', borderRadius:8, fontSize:12, marginBottom:12 }}>{msg}</div>}

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="action-btn" onClick={() => setMovModal(null)}>Cancelar</button>
              <button className="btn-detail" onClick={handleMov} disabled={saving}>
                {saving ? 'Registrando…' : 'Confirmar movimentação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display:'block', fontSize:11, color:'var(--gray3)', fontWeight:500, marginBottom:6, textTransform:'uppercase', letterSpacing:'.4px' };
