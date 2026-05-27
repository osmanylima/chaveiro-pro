// src/pages/Catalog.jsx
import { useState, useEffect, useCallback } from 'react';
import { keys as keysApi, catalog as catalogApi } from '../lib/api';

const STATUS_BADGE = {
  disponivel: <span className="badge b-green"><span className="dot"></span>Disponível</span>,
  pouco:      <span className="badge b-yellow"><span className="dot"></span>Poucas un.</span>,
  esgotado:   <span className="badge b-red"><span className="dot"></span>Esgotado</span>,
};

const COLS = ['A','B','C','D','E','F','G','H'];
const ROWS = [1,2,3,4,5,6,7,8];

const EMPTY_FORM = {
  code:'', model:'', manufacturer_id:'', application:'', category_id:'',
  profile:'', panel_column:'A', panel_row:1, stock:0, low_stock_threshold:5,
  notes:'', cross_refs:'', image_url:''
};

export default function Catalog({ onDetail }) {
  const [keys, setKeys]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState('');
  const [manufacturers, setMfr]   = useState([]);
  const [categories, setCats]     = useState([]);
  const [modal, setModal]         = useState(false); // 'new' | 'edit' | false
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [deleteId, setDeleteId]   = useState(null);

  const load = useCallback(async (search = q) => {
    setLoading(true);
    try {
      const res = await keysApi.list({ q: search, limit: 100 });
      setKeys(res.data);
      setTotal(res.total);
    } finally { setLoading(false); }
  }, [q]);

  useEffect(() => {
    load();
    catalogApi.manufacturers().then(setMfr);
    catalogApi.categories().then(setCats);
  }, []);

  const openNew = () => { setForm(EMPTY_FORM); setError(''); setModal('new'); };
  const openEdit = (k) => {
    setForm({
      ...k,
      manufacturer_id: k.manufacturer_id || '',
      category_id: k.category_id || '',
      cross_refs: k.cross_refs?.join(', ') || '',
    });
    setError('');
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Código é obrigatório.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        panel_row: Number(form.panel_row),
        stock: Number(form.stock),
        low_stock_threshold: Number(form.low_stock_threshold),
        cross_refs: form.cross_refs ? form.cross_refs.split(',').map(s=>s.trim()).filter(Boolean) : null,
        manufacturer_id: form.manufacturer_id || null,
        category_id: form.category_id || null,
      };
      if (modal === 'new') await keysApi.create(payload);
      else await keysApi.update(form.id, payload);
      setModal(false);
      load('');
      setQ('');
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await keysApi.remove(id);
      setDeleteId(null);
      load('');
    } catch (err) { alert(err.message); }
  };

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
        <div className="search-box" style={{ flex:1, marginBottom:0 }}>
          <i className="ti ti-search si"></i>
          <input type="text" placeholder="Buscar no catálogo..." value={q}
            onChange={e => { setQ(e.target.value); load(e.target.value); }} />
        </div>
        <button className="hbtn primary" onClick={openNew}>
          <i className="ti ti-plus"></i> Nova Chave
        </button>
      </div>

      <div style={{ fontSize:12, color:'var(--gray3)', marginBottom:12 }}>
        {loading ? 'Carregando…' : `${total} chave${total!==1?'s':''} cadastrada${total!==1?'s':''}`}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Fabricante</th><th>Aplicação</th>
              <th>Categoria</th><th>Local</th><th>Estoque</th><th>Situação</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id}>
                <td className="tbl-code">{k.code}</td>
                <td>{k.manufacturer || '—'}</td>
                <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k.application}</td>
                <td><span className="badge b-gray">{k.category || '—'}</span></td>
                <td><span className="loc-badge">{k.panel_column}{k.panel_row}</span></td>
                <td><b style={{ color:'var(--navy2)' }}>{k.stock}</b></td>
                <td>{STATUS_BADGE[k.status]}</td>
                <td>
                  <button className="action-btn" onClick={() => onDetail(k.id)}><i className="ti ti-eye"></i></button>
                  <button className="action-btn" onClick={() => openEdit(k)}><i className="ti ti-edit"></i></button>
                  <button className="action-btn danger" onClick={() => setDeleteId(k.id)}><i className="ti ti-trash"></i></button>
                </td>
              </tr>
            ))}
            {!loading && keys.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--gray3)', padding:32 }}>Nenhuma chave encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edição/criação */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--white)', borderRadius:16, padding:28, width:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:600, color:'var(--navy2)' }}>
                {modal==='new' ? '+ Nova Chave' : `Editar — ${form.code}`}
              </div>
              <button className="action-btn" onClick={() => setModal(false)}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Código *" value={form.code} onChange={v=>f('code',v)} placeholder="ex: YH35R" />
              <Field label="Modelo" value={form.model} onChange={v=>f('model',v)} placeholder="ex: Honda Key" />
              <div>
                <label style={lbl}>Fabricante</label>
                <select style={sel} value={form.manufacturer_id} onChange={e=>f('manufacturer_id',e.target.value)}>
                  <option value="">— Selecionar —</option>
                  {manufacturers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Categoria</label>
                <select style={sel} value={form.category_id} onChange={e=>f('category_id',e.target.value)}>
                  <option value="">— Selecionar —</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Aplicação" value={form.application} onChange={v=>f('application',v)} placeholder="ex: Honda Civic / Fit 2007-2022" />
              </div>
              <Field label="Perfil" value={form.profile} onChange={v=>f('profile',v)} placeholder="ex: Simples, Duplo, Laser" />
              <Field label="URL da Imagem" value={form.image_url} onChange={v=>f('image_url',v)} placeholder="https://..." />
              <div>
                <label style={lbl}>Coluna no Painel</label>
                <select style={sel} value={form.panel_column} onChange={e=>f('panel_column',e.target.value)}>
                  {COLS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Linha no Painel</label>
                <select style={sel} value={form.panel_row} onChange={e=>f('panel_row',e.target.value)}>
                  {ROWS.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Field label="Estoque inicial" value={form.stock} onChange={v=>f('stock',v)} type="number" />
              <Field label="Alerta (qtd mínima)" value={form.low_stock_threshold} onChange={v=>f('low_stock_threshold',v)} type="number" />
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Referências cruzadas (separadas por vírgula)" value={form.cross_refs} onChange={v=>f('cross_refs',v)} placeholder="ex: YH35, YH35-L, CP-HON35" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Observações</label>
                <textarea value={form.notes} onChange={e=>f('notes',e.target.value)}
                  placeholder="Informações adicionais..."
                  style={{ ...sel, height:70, resize:'vertical' }} />
              </div>
            </div>

            {error && <div style={{ background:'var(--red-bg)', color:'var(--red-text)', padding:'8px 12px', borderRadius:8, fontSize:12, marginTop:12 }}>{error}</div>}

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
              <button className="action-btn" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-detail" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando…' : modal==='new' ? 'Cadastrar chave' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--white)', borderRadius:16, padding:28, width:360, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--navy2)', marginBottom:8 }}>Confirmar exclusão</div>
            <div style={{ fontSize:13, color:'var(--gray3)', marginBottom:20 }}>Esta ação não pode ser desfeita.</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button className="action-btn" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn-detail" style={{ background:'var(--red)' }} onClick={() => handleDelete(deleteId)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display:'block', fontSize:11, color:'var(--gray3)', fontWeight:500, marginBottom:5, textTransform:'uppercase', letterSpacing:'.4px' };
const sel = { width:'100%', padding:'9px 10px', border:'1px solid var(--gray2)', borderRadius:'var(--r)', fontSize:13, background:'var(--white)', fontFamily:'var(--font)', color:'var(--gray5)', outline:'none' };

function Field({ label, value, onChange, placeholder, type='text' }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'9px 10px', border:'1px solid var(--gray2)', borderRadius:'var(--r)', fontSize:13, fontFamily:'var(--font)', color:'var(--gray5)', outline:'none', background:'var(--white)' }} />
    </div>
  );
}
