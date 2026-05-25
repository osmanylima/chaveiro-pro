// src/App.jsx
import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SearchKeys from './pages/SearchKeys';
import KeyDetail from './pages/KeyDetail';

// Lazy imports (same-bundle for now)
const TITLES = {
  dashboard:   'Dashboard',
  search:      'Buscar Chave',
  imgsearch:   'Busca por Imagem',
  detail:      'Detalhes da Chave',
  panel:       'Painel Visual',
  panellist:   'Painel em Lista',
  catalog:     'Catálogo de Chaves',
  stock:       'Estoque',
  movements:   'Movimentações',
  settings:    'Configurações',
};

const NAV = [
  { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { id: 'search',    icon: 'ti-search',            label: 'Buscar Chave' },
  { id: 'imgsearch', icon: 'ti-camera',            label: 'Busca por Imagem' },
  null, // separator
  { id: 'catalog',   icon: 'ti-book',              label: 'Catálogo',       section: 'Catálogo' },
  { id: 'panel',     icon: 'ti-grid-dots',         label: 'Painel Visual' },
  { id: 'panellist', icon: 'ti-list',              label: 'Painel em Lista' },
  null,
  { id: 'stock',     icon: 'ti-box',               label: 'Estoque',        section: 'Operação', badge: 'alerts' },
  { id: 'movements', icon: 'ti-arrows-exchange',   label: 'Movimentações' },
  null,
  { id: 'settings',  icon: 'ti-settings',          label: 'Configurações',  section: 'Sistema' },
];

function AppInner() {
  const { user, loading, logout } = useAuth();
  const [screen,    setScreen]    = useState('dashboard');
  const [detailId,  setDetailId]  = useState(null);
  const [prevScreen, setPrev]     = useState('search');

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
      Carregando…
    </div>
  );

  if (!user) return <Login />;

  const go = (s) => { setPrev(screen); setScreen(s); };

  const openDetail = (id) => { setDetailId(id); setPrev(screen); setScreen('detail'); };

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':  return <Dashboard onNavigate={go} />;
      case 'search':     return <SearchKeys onDetail={openDetail} />;
      case 'detail':     return <KeyDetail keyId={detailId} onBack={() => go(prevScreen)} onPanel={() => go('panel')} />;
      case 'imgsearch':  return <ImgSearchPlaceholder />;
      case 'panel':      return <PanelPlaceholder onNavigate={go} />;
      case 'panellist':  return <PanelListPlaceholder onNavigate={go} />;
      case 'catalog':    return <CatalogPlaceholder openDetail={openDetail} />;
      case 'stock':      return <StockPlaceholder />;
      case 'movements':  return <MovementsPlaceholder />;
      case 'settings':   return <SettingsPlaceholder logout={logout} user={user} />;
      default:           return null;
    }
  };

  let sectionLabel = null;
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div id="sidebar">
        <div id="logo">
          <div className="brand">
            <div className="icon">🔑</div>
            <div>
              <div className="name">Chaveiro Pro</div>
              <div className="sub">Gestão de Chaves</div>
            </div>
          </div>
        </div>
        <nav>
          {NAV.map((item, i) => {
            if (!item) return <div key={i} style={{ height: 4 }} />;
            const heading = item.section && item.section !== sectionLabel;
            if (heading) sectionLabel = item.section;
            return (
              <div key={item.id}>
                {heading && <div className="nav-label">{item.section}</div>}
                <div
                  className={`nav-item${screen === item.id ? ' active' : ''}`}
                  onClick={() => go(item.id)}
                >
                  <i className={`ti ${item.icon}`}></i>
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>
        <div id="sidebar-footer">
          <div className="user-pill">
            <div className="avatar">{user.name?.slice(0,2).toUpperCase()}</div>
            <div className="user-info">
              <div className="uname">{user.name}</div>
              <div className="urole">{user.role}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div id="main">
        <div id="header">
          <h1 id="page-title">{TITLES[screen] || screen}</h1>
          <div className="header-right">
            <button className="hbtn" onClick={() => go('search')}><i className="ti ti-search"></i> Buscar</button>
            <button className="hbtn primary" onClick={() => go('catalog')}><i className="ti ti-plus"></i> Nova Chave</button>
            <button className="hbtn" onClick={logout} title="Sair"><i className="ti ti-logout"></i></button>
          </div>
        </div>
        <div id="content">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

// ── Placeholder pages (substituir por implementação completa) ──

function ImgSearchPlaceholder() {
  const [done, setDone] = useState(false);
  return !done ? (
    <div>
      <div className="img-search-area" style={{ background:'var(--white)',border:'2px dashed var(--gray2)',borderRadius:16,padding:'48px 24px',textAlign:'center',cursor:'pointer' }}>
        <div style={{ fontSize:48, color:'var(--gray3)', marginBottom:12 }}><i className="ti ti-camera"></i></div>
        <div style={{ fontSize:16, fontWeight:600, color:'var(--navy2)', marginBottom:6 }}>Identificar chave por imagem</div>
        <div style={{ fontSize:13, color:'var(--gray3)', marginBottom:20 }}>Centralize a chave no enquadramento e tire uma foto, ou envie uma imagem</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="btn-detail" onClick={() => setDone(true)}><i className="ti ti-camera"></i> Tirar foto</button>
          <button className="action-btn" onClick={() => setDone(true)}><i className="ti ti-upload"></i> Enviar imagem</button>
        </div>
      </div>
      <div style={{ marginTop:16, textAlign:'center', fontSize:12, color:'var(--gray3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <i className="ti ti-sparkles" style={{ color:'var(--blue2)' }}></i>
        Arquitetura preparada para IA / Computer Vision
      </div>
    </div>
  ) : (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <button className="action-btn" onClick={() => setDone(false)}><i className="ti ti-arrow-left"></i> Nova busca</button>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--navy2)' }}>Possíveis correspondências</div>
      </div>
      {[{code:'YH35R',app:'Honda Civic / Fit',pct:92,loc:'C4'},{code:'YH36',app:'Honda Accord',pct:84,loc:'C5'},{code:'YH28',app:'Honda City',pct:70,loc:'D2'}].map((m,i) => (
        <div className="match-item" key={m.code} style={{ background:'var(--white)',border:'1px solid var(--gray2)',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:14,marginBottom:10,cursor:'pointer' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--navy2)', width:20, textAlign:'center' }}>#{i+1}</span>
          <div className="ri-info"><div className="ri-code">{m.code}</div><div className="ri-app">{m.app}</div></div>
          <div style={{ flex:1, height:6, background:'var(--gray2)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:'var(--blue2)', width:`${m.pct}%` }}></div>
          </div>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--blue2)', minWidth:36, textAlign:'right' }}>{m.pct}%</span>
          <span className="loc-badge">{m.loc}</span>
        </div>
      ))}
    </div>
  );
}

function PanelPlaceholder({ onNavigate }) {
  return <div style={{ padding:40, textAlign:'center', color:'var(--gray3)' }}>
    <i className="ti ti-grid-dots" style={{ fontSize:40 }}></i>
    <p style={{ marginTop:8 }}>Painel visual — implementar com dados da API <code>/api/keys/panel</code></p>
    <button className="btn-detail" style={{ marginTop:16 }} onClick={() => onNavigate('panellist')}>Ver em lista</button>
  </div>;
}
function PanelListPlaceholder({ onNavigate }) {
  return <div style={{ padding:40, textAlign:'center', color:'var(--gray3)' }}>
    <i className="ti ti-list" style={{ fontSize:40 }}></i>
    <p style={{ marginTop:8 }}>Painel em lista — conectar ao endpoint <code>/api/keys</code></p>
    <button className="btn-detail" style={{ marginTop:16 }} onClick={() => onNavigate('panel')}>Ver visual</button>
  </div>;
}
function CatalogPlaceholder({ openDetail }) {
  return <div style={{ padding:40, textAlign:'center', color:'var(--gray3)' }}>
    <i className="ti ti-book" style={{ fontSize:40 }}></i>
    <p style={{ marginTop:8 }}>Catálogo — CRUD completo via <code>/api/keys</code></p>
  </div>;
}
function StockPlaceholder() {
  return <div style={{ padding:40, textAlign:'center', color:'var(--gray3)' }}>
    <i className="ti ti-box" style={{ fontSize:40 }}></i>
    <p style={{ marginTop:8 }}>Estoque — filtros via <code>/api/keys?status=</code></p>
  </div>;
}
function MovementsPlaceholder() {
  return <div style={{ padding:40, textAlign:'center', color:'var(--gray3)' }}>
    <i className="ti ti-arrows-exchange" style={{ fontSize:40 }}></i>
    <p style={{ marginTop:8 }}>Movimentações — paginação via <code>/api/movements</code></p>
  </div>;
}
function SettingsPlaceholder({ logout, user }) {
  return <div>
    <div className="config-grid">
      {[['ti-building','Empresa','Dados da oficina e logotipo'],['ti-users','Usuários','Acesso e permissões'],['ti-grid-dots','Painel Físico','Configurar colunas e linhas'],['ti-tag','Categorias','Gerenciar categorias'],['ti-database','Backup','Exportar e importar dados'],['ti-adjustments','Geral','Preferências do sistema']].map(([icon,title,desc]) => (
        <div className="cfg-card" key={title}>
          <div className="cfg-icon"><i className={`ti ${icon}`}></i></div>
          <div className="cfg-title">{title}</div>
          <div className="cfg-desc">{desc}</div>
        </div>
      ))}
    </div>
    <div className="card" style={{ marginTop:20, maxWidth:400 }}>
      <div className="card-title" style={{ marginBottom:10 }}>Sobre o Chaveiro Pro</div>
      <div style={{ fontSize:12, color:'var(--gray3)', lineHeight:1.7 }}>
        <div>Versão: <b style={{ color:'var(--gray5)' }}>1.0.0</b></div>
        <div>Backend: <b style={{ color:'var(--gray5)' }}>Node.js + PostgreSQL</b></div>
        <div>Auth: <b style={{ color:'var(--gray5)' }}>JWT ({user.role})</b></div>
        <div style={{ marginTop:8, padding:8, background:'var(--green-bg)', borderRadius:'var(--r)', color:'var(--green-text)', display:'flex', alignItems:'center', gap:6 }}>
          <i className="ti ti-circle-check"></i> Preparado para IA / Computer Vision
        </div>
      </div>
      <button className="action-btn danger" style={{ marginTop:14 }} onClick={logout}>
        <i className="ti ti-logout"></i> Sair da conta
      </button>
    </div>
  </div>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
