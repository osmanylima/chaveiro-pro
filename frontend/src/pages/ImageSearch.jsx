// src/pages/ImageSearch.jsx
import { useState, useRef } from 'react';

const BASE = import.meta.env.VITE_API_URL || '/api';

const STATUS_BADGE = {
  disponivel: <span className="badge b-green"><span className="dot"></span>Disponível</span>,
  pouco:      <span className="badge b-yellow"><span className="dot"></span>Poucas un.</span>,
  esgotado:   <span className="badge b-red"><span className="dot"></span>Esgotado</span>,
};

export default function ImageSearch({ onDetail }) {
  const [preview,  setPreview]  = useState(null);
  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleSearch = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('cp_token');
      const fd = new FormData();
      fd.append('image', file);

      const res = await fetch(`${BASE}/ai-search`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na busca');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Área de upload */}
      {!result && (
        <div>
          <div
            style={{
              background: 'var(--white)', border: `2px dashed ${preview ? 'var(--blue2)' : 'var(--gray2)'}`,
              borderRadius: 16, padding: preview ? 24 : 48, textAlign: 'center',
              cursor: 'pointer', transition: 'all .2s',
              background: preview ? '#EFF6FF' : 'var(--white)',
            }}
            onClick={() => !preview && fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            {preview ? (
              <div>
                <img src={preview} alt="preview"
                  style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', borderRadius: 10, marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn-detail" onClick={handleSearch} disabled={loading}
                    style={{ padding: '10px 24px', fontSize: 14 }}>
                    {loading
                      ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', marginRight: 6 }}></i>Analisando com IA…</>
                      : <><i className="ti ti-sparkles"></i> Identificar chave</>}
                  </button>
                  <button className="action-btn" onClick={reset}>
                    <i className="ti ti-x"></i> Trocar imagem
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 52, color: 'var(--gray3)', marginBottom: 12 }}>
                  <i className="ti ti-camera"></i>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy2)', marginBottom: 6 }}>
                  Identificar chave por imagem
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray3)', marginBottom: 24 }}>
                  Arraste uma foto aqui ou clique para escolher
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <label className="btn-detail" style={{ cursor: 'pointer', padding: '10px 20px' }}>
                    <i className="ti ti-upload"></i> Escolher imagem
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files[0])} />
                  </label>
                  <label className="action-btn" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 13 }}>
                    <i className="ti ti-camera"></i> Câmera
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files[0])} />
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ marginTop: 20, background: 'var(--white)', border: '1px solid var(--gray2)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-brain" style={{ color: 'var(--blue2)', fontSize: 20 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy2)' }}>Claude IA analisando a chave…</div>
                  <div style={{ fontSize: 12, color: 'var(--gray3)' }}>Comparando com {' '}
                    <b>todas as chaves do catálogo</b></div>
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--gray2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--blue2)', borderRadius: 2, width: '60%', animation: 'progress 2s ease-in-out infinite' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, background: 'var(--red-bg)', color: 'var(--red-text)', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
              <i className="ti ti-alert-circle"></i> {error}
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--gray3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="ti ti-sparkles" style={{ color: 'var(--blue2)' }}></i>
            Powered by Claude Vision AI — análise inteligente de chaves
          </div>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="action-btn" onClick={reset}>
              <i className="ti ti-arrow-left"></i> Nova busca
            </button>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy2)' }}>
              Resultado da análise por IA
            </div>
          </div>

          {/* Análise da IA */}
          <div style={{ background: 'var(--navy)', borderRadius: 12, padding: 18, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <img src={preview} alt="chave"
              style={{ width: 100, height: 60, objectFit: 'contain', borderRadius: 8, background: '#1A2640', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--gray3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                <i className="ti ti-sparkles" style={{ color: 'var(--blue3)', marginRight: 4 }}></i>
                Análise Claude AI
              </div>
              {result.descricao && (
                <div style={{ fontSize: 13, color: 'var(--white)', marginBottom: 4 }}>{result.descricao}</div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {result.fabricante_provavel && (
                  <span style={{ background: '#1A2640', color: 'var(--blue3)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                    <i className="ti ti-building-factory-2"></i> {result.fabricante_provavel}
                  </span>
                )}
                {result.perfil && (
                  <span style={{ background: '#1A2640', color: 'var(--blue3)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                    <i className="ti ti-key"></i> {result.perfil}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Correspondências */}
          {result.correspondencias?.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy2)', marginBottom: 12 }}>
                {result.correspondencias.length} correspondência{result.correspondencias.length !== 1 ? 's' : ''} encontrada{result.correspondencias.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.correspondencias.map((k, i) => (
                  <div key={k.id} className="result-item" onClick={() => onDetail(k.id)}
                    style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                    {/* Barra de similaridade no fundo */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${k.similaridade}%`,
                      background: k.similaridade >= 80 ? 'rgba(16,185,129,.06)' : k.similaridade >= 60 ? 'rgba(245,158,11,.06)' : 'rgba(148,163,184,.04)',
                      pointerEvents: 'none',
                    }}></div>

                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy2)', width: 24, textAlign: 'center', flexShrink: 0 }}>
                      #{i + 1}
                    </span>

                    {/* Foto da chave */}
                    <div className="key-thumb" style={{ width: 70, height: 42 }}>
                      {k.image_url ? (
                        <img src={k.image_url} alt={k.code} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <i className="ti ti-key" style={{ fontSize: 20, color: 'var(--gray3)' }}></i>
                      )}
                    </div>

                    <div className="ri-info" style={{ flex: 1 }}>
                      <div className="ri-code">{k.code}</div>
                      <div className="ri-app">{k.application}</div>
                      {k.motivo && <div style={{ fontSize: 11, color: 'var(--blue2)', marginTop: 2 }}>
                        <i className="ti ti-info-circle"></i> {k.motivo}
                      </div>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 80, height: 6, background: 'var(--gray2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${k.similaridade}%`,
                            background: k.similaridade >= 80 ? 'var(--green)' : k.similaridade >= 60 ? 'var(--yellow)' : 'var(--gray3)',
                          }}></div>
                        </div>
                        <span style={{
                          fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'right',
                          color: k.similaridade >= 80 ? 'var(--green)' : k.similaridade >= 60 ? 'var(--yellow)' : 'var(--gray3)',
                        }}>{k.similaridade}%</span>
                      </div>
                      {STATUS_BADGE[k.status]}
                      <span className="loc-badge">{k.panel_column}{k.panel_row}</span>
                    </div>

                    <button className="btn-detail" onClick={e => { e.stopPropagation(); onDetail(k.id); }}
                      style={{ flexShrink: 0 }}>
                      Ver detalhes
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray3)' }}>
              <i className="ti ti-search-off" style={{ fontSize: 40 }}></i>
              <p style={{ marginTop: 8 }}>Nenhuma correspondência encontrada.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Tente uma foto mais clara ou com melhor iluminação.</p>
              <button className="btn-detail" style={{ marginTop: 16 }} onClick={reset}>Tentar novamente</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
