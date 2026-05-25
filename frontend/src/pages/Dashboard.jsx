// src/pages/Dashboard.jsx
import { useFetch } from '../hooks/useFetch';
import { keys as keysApi, movements as movApi } from '../lib/api';

const STATUS_COLOR = { disponivel: 'green', pouco: 'yellow', esgotado: 'red' };
const STATUS_LABEL = { disponivel: 'Disponível', pouco: 'Poucas un.', esgotado: 'Esgotado' };

export default function Dashboard({ onNavigate }) {
  const { data: stats,   loading: lStats }   = useFetch(() => keysApi.stats());
  const { data: movData, loading: lMov }     = useFetch(() => movApi.list({ limit: 6 }));
  const { data: alertData }                  = useFetch(() => keysApi.list({ status: 'esgotado', limit: 3 }));
  const { data: lowData }                    = useFetch(() => keysApi.list({ status: 'pouco', limit: 3 }));

  const summary   = stats?.summary || {};
  const byMfr     = stats?.by_manufacturer || [];
  const recentMov = movData?.data || [];
  const alerts    = [...(alertData?.data || []), ...(lowData?.data || [])];

  const maxQty = Math.max(...byMfr.map(m => Number(m.qty)), 1);

  return (
    <div>
      {/* Stat cards */}
      <div className="stats-grid">
        {[
          { label: 'Total de Modelos', val: summary.total ?? '—', sub: 'no catálogo', cls: 'si-blue', icon: 'ti-key' },
          { label: 'Disponíveis',      val: summary.available ?? '—', sub: `${summary.total ? Math.round(summary.available/summary.total*100) : 0}% do catálogo`, cls: 'si-green', icon: 'ti-check' },
          { label: 'Poucas Unidades',  val: summary.low_stock ?? '—', sub: 'reposição necessária', cls: 'si-yellow', icon: 'ti-alert-triangle' },
          { label: 'Esgotadas',        val: summary.out_of_stock ?? '—', sub: 'atenção imediata', cls: 'si-red', icon: 'ti-x' },
        ].map(c => (
          <div className="stat-card" key={c.label}>
            <div className="stat-top">
              <span className="stat-label">{c.label}</span>
              <div className={`stat-icon ${c.cls}`}><i className={`ti ${c.icon}`}></i></div>
            </div>
            <div className="stat-val">{lStats ? '…' : c.val}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="row3">
        <div>
          {/* Movimentações */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">Movimentações Recentes</span>
              <span className="card-action" onClick={() => onNavigate('movements')}>Ver todas →</span>
            </div>
            {lMov ? <p style={{ color: 'var(--gray3)', fontSize: 13 }}>Carregando…</p> : (
              <div className="mv-list">
                {recentMov.length === 0 && <p style={{ color: 'var(--gray3)', fontSize: 13 }}>Nenhuma movimentação.</p>}
                {recentMov.map(m => {
                  const isIn = m.type === 'entrada';
                  return (
                    <div className="mv-item" key={m.id}>
                      <div className={`mv-type ${isIn ? 'mv-in' : 'mv-out'}`}>
                        <i className={`ti ${isIn ? 'ti-arrow-down' : 'ti-arrow-up'}`}></i>
                      </div>
                      <div className="mv-info">
                        <div className="mv-code">{m.key_code}</div>
                        <div className="mv-desc">{m.application} — {m.reason}</div>
                      </div>
                      <span className={`mv-qty ${isIn ? 'qty-in' : 'qty-out'}`}>
                        {isIn ? '+' : ''}{m.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gráfico por fabricante */}
          <div className="card">
            <div className="card-header"><span className="card-title">Categorias Mais Usadas</span></div>
            <div className="chart-bars">
              {byMfr.map((m, i) => {
                const h = Math.round((m.qty / maxQty) * 80);
                const colors = ['#3B82F6','#6366F1','#8B5CF6','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899'];
                return (
                  <div className="bar-wrap" key={m.name}>
                    <div className="bar-val">{m.qty}</div>
                    <div className="bar" style={{ height: h, background: colors[i % colors.length] }}></div>
                    <div className="bar-label">{m.name?.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-alert-circle" style={{ color: 'var(--yellow)' }}></i>
                Alertas de Estoque
              </span>
            </div>
            <div className="alert-list">
              {alerts.length === 0 && <p style={{ fontSize: 12, color: 'var(--gray3)' }}>Tudo em ordem!</p>}
              {alerts.map(k => (
                <div key={k.id} className={`alert-item ${k.status === 'esgotado' ? 'al-red' : 'al-yellow'}`}>
                  <i className={`ti ${k.status === 'esgotado' ? 'ti-x' : 'ti-alert-triangle'}`} style={{ flexShrink: 0 }}></i>
                  <div><b>{k.code}</b> — {k.application?.split('/')[0].trim()} {k.status === 'esgotado' ? 'esgotado' : `(${k.stock} un.)`}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, borderTop: '1px solid var(--gray2)', paddingTop: 14 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>Acesso Rápido</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: 'ti-search',    label: 'Buscar chave',      screen: 'search' },
                  { icon: 'ti-camera',    label: 'Busca por imagem',  screen: 'imgsearch' },
                  { icon: 'ti-grid-dots', label: 'Ver painel',        screen: 'panel' },
                ].map(b => (
                  <button key={b.screen} className="hbtn" style={{ justifyContent: 'flex-start', width: '100%' }} onClick={() => onNavigate(b.screen)}>
                    <i className={`ti ${b.icon}`}></i> {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
