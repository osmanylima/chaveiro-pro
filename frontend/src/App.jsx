// src/App.jsx
import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SearchKeys from './pages/SearchKeys';
import ImageSearch from './pages/ImageSearch';
import KeyDetail from './pages/KeyDetail';
import Catalog from './pages/Catalog';
import Panel from './pages/Panel';
import PanelList from './pages/PanelList';
import Stock from './pages/Stock';
import Movements from './pages/Movements';

const TITLES = {
  dashboard:'Dashboard', search:'Buscar Chave', imgsearch:'Busca por Imagem',
  detail:'Detalhes da Chave', panel:'Painel Visual', panellist:'Painel em Lista',
  catalog:'Catálogo de Chaves', stock:'Estoque', movements:'Movimentações', settings:'Configurações',
};

const NAV = [
  { id:'dashboard',  icon:'ti-layout-dashboard', label:'Dashboard' },
  { id:'search',     icon:'ti-search',            label:'Buscar Chave' },
  { id:'imgsearch',  icon:'ti-camera',            label:'Busca por Imagem' },
  { id:'catalog',    icon:'ti-book',              label:'Catálogo',        section:'Catálogo' },
  { id:'panel',      icon:'ti-grid-dots',         label:'Painel Visual' },
  { id:'panellist',  icon:'ti-list',              label:'Painel em Lista' },
  { id:'stock',      icon:'ti-box',               label:'Estoque',         section:'Operação' },
  { id:'movements',  icon:'ti-arrows-exchange',   label:'Movimentações' },
  { id:'settings',   icon:'ti-settings',          label:'Configurações',   section:'Sistema' },
];

function AppInner() {
  const { user, loading, logout } = useAuth();
  const [screen,     setScreen]   = useState('dashboard');
  const [detailId,   setDetailId] = useState(null);
  const [prevScreen, setPrev]     = useState('search');

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8', fontFamily:'sans-serif' }}>
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
      case 'imgsearch':  return <ImageSearch onDetail={openDetail} />;
      case 'panel':      return <Panel onNavigate={go} onDetail={openDetail} />;
      case 'panellist':  return <PanelList onNavigate={go} onDetail={openDetail} />;
      case 'catalog':    return <Catalog onDetail={openDetail} />;
      case 'stock':      return <Stock onDetail={openDetail} />;
      case 'movements':  return <Movements />;
      case 'settings':   return <Settings logout={logout} user={user} />;
      default:           return null;
    }
  };

  let lastSection = null;
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
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
          {NAV.map((item) => {
            const showSection = item.section && item.section !== lastSection;
            if (showSection) lastSection = item.section;
            return (
              <div key={item.id}>
                {showSection && <div className="nav-label" style={{ marginTop:8 }}>{item.section}</div>}
                <div className={`nav-item${screen===item.id?' active':''}`} onClick={() => go(item.id)}>
                  <i className={`ti ${item.icon}`}></i> {item.label}
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

      <div id="main">
        <div id="header">
          <h1>{TITLES[screen] || screen}</h1>
          <div className="header-right">
            <button className="hbtn" onClick={() => go('search')}><i className="ti ti-search"></i> Buscar</button>
            <button className="hbtn primary" onClick={() => go('catalog')}><i className="ti ti-plus"></i> Nova Chave</button>
            <button className="hbtn" onClick={logout} title="Sair"><i className="ti ti-logout"></i></button>
          </div>
        </div>
        <div id="content">{renderScreen()}</div>
      </div>
    </div>
  );
}

function ImgSearch() {
  const [done, setDone] = useState(false);
  return !done ? (
    <div>
      <div style={{ background:'var(--white)', border:'2px dashed var(--gray2)', borderRadius:16, padding:'48px 24px', textAlign:'center' }}>
        <div style={{ fontSize:48, color:'var(--gray3)', marginBottom:12 }}><i className="ti ti-camera"></i></div>
        <div style={{ fontSize:16, fontWeight:600, color:'var(--navy2)', marginBottom:6 }}>Identificar chave por imagem</div>
        <div style={{ fontSize:13, color:'var(--gray3)', marginBottom:20 }}>Centralize a chave no enquadramento e tire uma foto, ou envie uma imagem</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="btn-detail" onClick={() => setDone(true)}><i className="ti ti-camera"></i> Tirar foto</button>
          <label className="action-btn" style={{ cursor:'pointer', padding:'6px 14px', fontSize:12 }}>
            <i className="ti ti-upload"></i> Enviar imagem
            <input type="file" style={{ display:'none' }} accept="image/*" onChange={() => setDone(true)} />
          </label>
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
      {[{code:'YH35R',app:'Honda Civic / Fit',pct:92,loc:'C4'},{code:'YH36',app:'Honda Accord',pct:84,loc:'C5'},{code:'YH28',app:'Honda City',pct:70,loc:'D2'}].map((m,i)=>(
        <div key={m.code} style={{ background:'var(--white)', border:'1px solid var(--gray2)', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, marginBottom:10, cursor:'pointer' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--navy2)', width:20 }}>#{i+1}</span>
          <div style={{ flex:1 }}><div className="tbl-code">{m.code}</div><div style={{ fontSize:12, color:'var(--gray3)' }}>{m.app}</div></div>
          <div style={{ width:100, height:6, background:'var(--gray2)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:'var(--blue2)', width:`${m.pct}%` }}></div>
          </div>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--blue2)', minWidth:36 }}>{m.pct}%</span>
          <span className="loc-badge">{m.loc}</span>
        </div>
      ))}
    </div>
  );
}

function Settings({ logout, user }) {
  return (
    <div>
      <div className="config-grid">
        {[['ti-building','Empresa','Dados da oficina e logotipo'],['ti-users','Usuários','Acesso e permissões'],['ti-grid-dots','Painel Físico','Configurar colunas e linhas'],['ti-tag','Categorias','Gerenciar categorias'],['ti-database','Backup','Exportar e importar dados'],['ti-adjustments','Geral','Preferências do sistema']].map(([icon,title,desc])=>(
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
          <div>Backend: <b style={{ color:'var(--gray5)' }}>Node.js + PostgreSQL (Railway)</b></div>
          <div>Usuário: <b style={{ color:'var(--gray5)' }}>{user.name} ({user.role})</b></div>
          <div style={{ marginTop:8, padding:8, background:'var(--green-bg)', borderRadius:'var(--r)', color:'var(--green-text)', display:'flex', alignItems:'center', gap:6 }}>
            <i className="ti ti-circle-check"></i> Sistema operacional
          </div>
        </div>
        <button className="action-btn danger" style={{ marginTop:14 }} onClick={logout}>
          <i className="ti ti-logout"></i> Sair da conta
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
