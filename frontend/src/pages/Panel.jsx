// src/pages/Panel.jsx
import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { keys as keysApi } from '../lib/api';

const COLS = ['A','B','C','D','E','F','G','H'];
const ROWS = [1,2,3,4,5,6,7,8];

const STATUS_COLOR = { disponivel: 'pc-green', pouco: 'pc-yellow', esgotado: 'pc-red' };
const STATUS_LABEL = { disponivel: 'Disponível', pouco: 'Poucas un.', esgotado: 'Esgotado' };
const STATUS_BADGE = { disponivel: 'b-green', pouco: 'b-yellow', esgotado: 'b-red' };

export default function Panel({ onNavigate, onDetail }) {
  const [selected, setSelected] = useState(null);
  const { data, loading, refetch } = useFetch(() => keysApi.panel());

  const grid = data?.grid || {};

  const getCell = (col, row) => grid[col]?.[row] || null;

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Grid */}
      <div style={{ flex: 1 }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {[['#D1FAE5','#A7F3D0','Disponível'],['#FEF3C7','#FDE68A','Poucas un.'],['#FEE2E2','#FCA5A5','Esgotado'],['#F1F5F9','#E2E8F0','Vazio']].map(([bg,border,label]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--gray4)' }}>
              <div style={{ width:12, height:12, borderRadius:2, background:bg, border:`1.5px solid ${border}` }}></div>
              {label}
            </div>
          ))}
          <button className="hbtn" style={{ marginLeft:'auto' }} onClick={() => onNavigate('panellist')}>
            <i className="ti ti-list"></i> Ver em lista
          </button>
        </div>

        {/* Panel grid */}
        <div style={{ background:'var(--white)', border:'1px solid var(--gray2)', borderRadius:'var(--r2)', overflow:'hidden' }}>
          {/* Header row */}
          <div style={{ display:'grid', gridTemplateColumns:'32px repeat(8,1fr)', background:'var(--navy)', padding:'8px 12px', gap:6 }}>
            <div></div>
            {COLS.map(c => <div key={c} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--gray3)', fontFamily:'var(--mono)' }}>{c}</div>)}
          </div>

          {/* Body */}
          <div style={{ padding:12 }}>
            {loading && <div style={{ textAlign:'center', padding:40, color:'var(--gray3)' }}>Carregando painel…</div>}
            {!loading && ROWS.map(row => (
              <div key={row} style={{ display:'grid', gridTemplateColumns:'32px repeat(8,1fr)', gap:6, marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--gray3)', fontFamily:'var(--mono)' }}>{row}</div>
                {COLS.map(col => {
                  const k = getCell(col, row);
                  const isSelected = selected?.panel_column === col && selected?.panel_row === row;
                  return (
                    <div
                      key={col}
                      onClick={() => setSelected(k ? k : { panel_column: col, panel_row: row, empty: true })}
                      style={{
                        aspectRatio: '1.2',
                        borderRadius: 6,
                        border: isSelected ? '2px solid var(--blue2)' : `1.5px solid ${k ? (k.status==='disponivel'?'#A7F3D0':k.status==='pouco'?'#FDE68A':'#FCA5A5') : 'var(--gray2)'}`,
                        background: k ? (k.status==='disponivel'?'#ECFDF5':k.status==='pouco'?'#FFFBEB':'#FEF2F2') : 'var(--gray1)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        transition: 'all .15s',
                        transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                        boxShadow: isSelected ? '0 0 0 3px rgba(59,130,246,.2)' : 'none',
                      }}
                    >
                      {k ? (
                        <>
                          <div style={{ fontSize:9, fontWeight:700, fontFamily:'var(--mono)', color:'var(--navy2)', textAlign:'center', lineHeight:1.2 }}>{k.code}</div>
                          <div style={{ fontSize:8, color:'var(--gray4)' }}>{k.stock} un</div>
                        </>
                      ) : (
                        <div style={{ fontSize:9, color:'#CBD5E1' }}>—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview sidebar */}
      {selected && (
        <div style={{ width:260, flexShrink:0 }}>
          <div className="card" style={{ position:'sticky', top:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--navy2)' }}>
                Posição <span style={{ fontFamily:'var(--mono)', background:'var(--navy2)', color:'#fff', padding:'2px 8px', borderRadius:4 }}>{selected.panel_column}{selected.panel_row}</span>
              </div>
              <i className="ti ti-x" style={{ cursor:'pointer', color:'var(--gray3)', fontSize:16 }} onClick={() => setSelected(null)}></i>
            </div>

            {selected.empty ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                <div style={{ fontSize:13, color:'var(--gray3)', marginBottom:16 }}>Posição vazia</div>
                <button className="btn-detail" style={{ width:'100%' }} onClick={() => onNavigate('catalog-new')}>
                  <i className="ti ti-plus"></i> Cadastrar chave aqui
                </button>
              </div>
            ) : (
              <>
                {/* Key SVG */}
                <div style={{ background:'var(--gray1)', borderRadius:'var(--r)', padding:'16px', textAlign:'center', marginBottom:12 }}>
                  <svg viewBox="0 0 140 56" width="120" height="48">
                    <path d="M14 28 Q26 11 38 11 L126 11 L126 45 L38 45 Q26 45 14 28Z" fill="none" stroke="#3B82F6" strokeWidth="1.8"/>
                    <circle cx="26" cy="28" r="8" fill="none" stroke="#3B82F6" strokeWidth="1.8"/>
                    <circle cx="26" cy="28" r="3" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1"/>
                    <line x1="48" y1="11" x2="48" y2="45" stroke="#93C5FD" strokeWidth="1"/>
                    <line x1="62" y1="11" x2="62" y2="38" stroke="#93C5FD" strokeWidth="1"/>
                    <line x1="76" y1="11" x2="76" y2="45" stroke="#93C5FD" strokeWidth="1"/>
                  </svg>
                </div>

                <div style={{ fontSize:18, fontWeight:700, fontFamily:'var(--mono)', color:'var(--navy2)', marginBottom:4 }}>{selected.code}</div>
                <div style={{ fontSize:12, color:'var(--gray3)', marginBottom:12 }}>{selected.application}</div>

                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                  <div className="di-field"><div className="di-flabel">Fabricante</div><div className="di-fval">{selected.manufacturer || '—'}</div></div>
                  <div className="di-field"><div className="di-flabel">Estoque</div>
                    <div className="di-fval" style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span className={`badge ${STATUS_BADGE[selected.status]}`}><span className="dot"></span>{STATUS_LABEL[selected.status]}</span>
                      <strong>{selected.stock} un.</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <button className="btn-detail" style={{ width:'100%' }} onClick={() => onDetail(selected.id)}>
                    <i className="ti ti-eye"></i> Ver detalhes
                  </button>
                  <button className="hbtn" style={{ width:'100%', justifyContent:'center' }} onClick={() => onNavigate('catalog-edit-'+selected.id)}>
                    <i className="ti ti-edit"></i> Editar chave
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
