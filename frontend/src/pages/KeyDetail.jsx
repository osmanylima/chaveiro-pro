// src/pages/KeyDetail.jsx
import { useEffect, useState } from 'react';
import { keys as keysApi, movements as movApi } from '../lib/api';

const STATUS_BADGE = {
  disponivel: <span className="badge b-green"><span className="dot"></span>Disponível</span>,
  pouco:      <span className="badge b-yellow"><span className="dot"></span>Poucas un.</span>,
  esgotado:   <span className="badge b-red"><span className="dot"></span>Esgotado</span>,
};

export default function KeyDetail({ keyId, onBack, onPanel }) {
  const [key,       setKey]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [movQty,    setMovQty]    = useState(1);
  const [movType,   setMovType]   = useState('saida');
  const [movReason, setMovReason] = useState('');
  const [movLoading, setMovLoading] = useState(false);
  const [msg,       setMsg]       = useState('');

  useEffect(() => {
    setLoading(true);
    keysApi.get(keyId).then(setKey).catch(console.error).finally(() => setLoading(false));
  }, [keyId]);

  const handleMovement = async () => {
    if (!movReason.trim()) { setMsg('Informe o motivo.'); return; }
    setMovLoading(true);
    setMsg('');
    try {
      await movApi.create({ key_id: keyId, type: movType, quantity: movQty, reason: movReason });
      const updated = await keysApi.get(keyId);
      setKey(updated);
      setMsg(`✓ Movimentação registrada. Estoque atual: ${updated.stock} un.`);
      setMovQty(1); setMovReason('');
    } catch (err) {
      setMsg(`Erro: ${err.message}`);
    } finally {
      setMovLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray3)' }}>Carregando…</div>;
  if (!key) return <div style={{ padding: 40, color: 'var(--red)' }}>Chave não encontrada.</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button className="action-btn" onClick={onBack}><i className="ti ti-arrow-left"></i> Voltar</button>
        <span style={{ fontSize: 12, color: 'var(--gray3)' }}>Detalhes da chave</span>
      </div>

      <div className="detail-layout">
        <div>
          {/* Imagem */}
          <div className="key-img-big" style={{ marginBottom: 16 }}>
            {key.image_url
              ? <img src={key.image_url} alt={key.code} style={{ maxHeight: 140, objectFit: 'contain' }}/>
              : (
                <svg viewBox="0 0 200 80" width="180" height="72">
                  <path d="M20 40 Q36 16 56 16 L180 16 L180 64 L56 64 Q36 64 20 40Z" fill="none" stroke="#3B82F6" strokeWidth="2"/>
                  <circle cx="38" cy="40" r="12" fill="none" stroke="#3B82F6" strokeWidth="2"/>
                  <circle cx="38" cy="40" r="5" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5"/>
                  <line x1="68" y1="16" x2="68" y2="64" stroke="#93C5FD" strokeWidth="1.5"/>
                  <line x1="84" y1="16" x2="84" y2="52" stroke="#93C5FD" strokeWidth="1.5"/>
                  <line x1="100" y1="16" x2="100" y2="64" stroke="#93C5FD" strokeWidth="1.5"/>
                  <line x1="116" y1="16" x2="116" y2="58" stroke="#93C5FD" strokeWidth="1.5"/>
                  <line x1="132" y1="16" x2="132" y2="64" stroke="#93C5FD" strokeWidth="1.5"/>
                </svg>
              )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <div className="di-title">{key.code}</div>
            <div className="di-sub">{key.application}</div>
            <div className="di-grid">
              <div className="di-field"><div className="di-flabel">Fabricante</div><div className="di-fval">{key.manufacturer || '—'}</div></div>
              <div className="di-field"><div className="di-flabel">Categoria</div><div className="di-fval">{key.category || '—'}</div></div>
              <div className="di-field"><div className="di-flabel">Perfil</div><div className="di-fval">{key.profile || '—'}</div></div>
              <div className="di-field"><div className="di-flabel">Estoque</div><div className="di-fval">{STATUS_BADGE[key.status]} {key.stock} un.</div></div>
            </div>
            {key.notes && (
              <div className="di-field" style={{ marginBottom: 10 }}>
                <div className="di-flabel">Observação</div>
                <div className="di-fval">{key.notes}</div>
              </div>
            )}
            {key.cross_refs?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div className="di-flabel" style={{ fontSize: 10, color: 'var(--gray3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Referências cruzadas</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {key.cross_refs.map(r => <span key={r} className="badge b-gray">{r}</span>)}
                </div>
              </div>
            )}

            {/* Movimentação rápida */}
            <div style={{ marginTop: 16, borderTop: '1px solid var(--gray2)', paddingTop: 14 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>Registrar movimentação</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={movType} onChange={e => setMovType(e.target.value)}
                  style={{ padding: '7px 10px', border: '1px solid var(--gray2)', borderRadius: 'var(--r)', fontSize: 12, background: 'var(--white)', fontFamily: 'var(--font)' }}>
                  <option value="saida">Saída</option>
                  <option value="entrada">Entrada</option>
                  <option value="ajuste">Ajuste</option>
                </select>
                <input type="number" min="1" value={movQty} onChange={e => setMovQty(Number(e.target.value))}
                  style={{ width: 70, padding: '7px 10px', border: '1px solid var(--gray2)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--font)' }}/>
                <input type="text" placeholder="Motivo (ex: venda balcão)" value={movReason} onChange={e => setMovReason(e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--gray2)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--font)' }}/>
                <button className="btn-detail" onClick={handleMovement} disabled={movLoading}>
                  {movLoading ? '…' : 'OK'}
                </button>
              </div>
              {msg && <div style={{ fontSize: 12, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}
            </div>
          </div>
        </div>

        <div>
          <div className="loc-card">
            <div className="lc-label">Localização no Painel</div>
            <div className="lc-val">{key.panel_column}{key.panel_row}</div>
            <div className="lc-sub">Coluna {key.panel_column} — Linha {key.panel_row}</div>
            <button className="btn-panel" onClick={onPanel}>
              <i className="ti ti-grid-dots"></i> Ver no Painel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
