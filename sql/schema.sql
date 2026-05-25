-- ============================================================
-- CHAVEIRO PRO — Schema PostgreSQL / Supabase
-- ============================================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- CATEGORIAS
-- ------------------------------------------------------------
CREATE TABLE categories (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name) VALUES
  ('Automotiva'),
  ('Fechadura residencial'),
  ('Fechadura comercial'),
  ('Motocicleta'),
  ('Cofre');

-- ------------------------------------------------------------
-- FABRICANTES
-- ------------------------------------------------------------
CREATE TABLE manufacturers (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO manufacturers (name) VALUES
  ('Honda'),('Volkswagen'),('Toyota'),('Ford'),
  ('Hyundai'),('Kia'),('GM'),('Fiat'),('Renault'),
  ('Schlage'),('Haga'),('Master Lock');

-- ------------------------------------------------------------
-- CHAVES VIRGENS
-- ------------------------------------------------------------
CREATE TABLE keys (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          VARCHAR(30)  NOT NULL UNIQUE,
  model         VARCHAR(100),
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE SET NULL,
  application   TEXT,                       -- ex: "Civic / Fit / HRV 2007-2022"
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  profile       VARCHAR(50),               -- ex: "Simples", "Duplo", "Laser"
  image_url     TEXT,
  panel_column  CHAR(1)      NOT NULL,     -- A-H
  panel_row     SMALLINT     NOT NULL CHECK (panel_row BETWEEN 1 AND 8),
  stock         INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  notes         TEXT,
  cross_refs    TEXT[],                    -- ex: ARRAY['YH35','YH35-L']
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (panel_column, panel_row)
);

CREATE INDEX idx_keys_code ON keys(code);
CREATE INDEX idx_keys_panel ON keys(panel_column, panel_row);
CREATE INDEX idx_keys_manufacturer ON keys(manufacturer_id);

-- status calculado como coluna gerada
ALTER TABLE keys ADD COLUMN status TEXT GENERATED ALWAYS AS (
  CASE
    WHEN stock = 0 THEN 'esgotado'
    WHEN stock <= low_stock_threshold THEN 'pouco'
    ELSE 'disponivel'
  END
) STORED;

-- trigger para updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_keys_updated_at
  BEFORE UPDATE ON keys
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- MOVIMENTAÇÕES DE ESTOQUE
-- ------------------------------------------------------------
CREATE TABLE movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_id      UUID NOT NULL REFERENCES keys(id) ON DELETE CASCADE,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('entrada','saida','ajuste')),
  quantity    INTEGER NOT NULL,            -- positivo=entrada, negativo=saída
  reason      VARCHAR(200),               -- ex: "Venda balcão", "Compra fornecedor"
  user_id     UUID,                        -- FK para users (nullable)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movements_key ON movements(key_id);
CREATE INDEX idx_movements_date ON movements(created_at DESC);

-- função que aplica movimentação e atualiza estoque atomicamente
CREATE OR REPLACE FUNCTION apply_movement(
  p_key_id  UUID,
  p_type    VARCHAR,
  p_qty     INTEGER,
  p_reason  VARCHAR,
  p_user_id UUID DEFAULT NULL
) RETURNS movements LANGUAGE plpgsql AS $$
DECLARE
  v_delta INT;
  v_row   movements;
BEGIN
  v_delta := CASE p_type WHEN 'saida' THEN -ABS(p_qty) ELSE ABS(p_qty) END;

  UPDATE keys SET stock = stock + v_delta WHERE id = p_key_id;

  INSERT INTO movements (key_id, type, quantity, reason, user_id)
  VALUES (p_key_id, p_type, v_delta, p_reason, p_user_id)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- ------------------------------------------------------------
-- USUÁRIOS
-- ------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'operador'
                CHECK (role IN ('admin','gerente','operador')),
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- SEED — dados de exemplo
-- ------------------------------------------------------------
DO $$
DECLARE
  honda_id  UUID; vw_id UUID; toyota_id UUID;
  ford_id   UUID; hyundai_id UUID; kia_id UUID; gm_id UUID;
  auto_id   UUID; fech_id UUID; schlage_id UUID; haga_id UUID;
BEGIN
  SELECT id INTO honda_id   FROM manufacturers WHERE name='Honda';
  SELECT id INTO vw_id      FROM manufacturers WHERE name='Volkswagen';
  SELECT id INTO toyota_id  FROM manufacturers WHERE name='Toyota';
  SELECT id INTO ford_id    FROM manufacturers WHERE name='Ford';
  SELECT id INTO hyundai_id FROM manufacturers WHERE name='Hyundai';
  SELECT id INTO kia_id     FROM manufacturers WHERE name='Kia';
  SELECT id INTO gm_id      FROM manufacturers WHERE name='GM';
  SELECT id INTO auto_id    FROM categories WHERE name='Automotiva';
  SELECT id INTO fech_id    FROM categories WHERE name='Fechadura residencial';
  SELECT id INTO schlage_id FROM manufacturers WHERE name='Schlage';
  SELECT id INTO haga_id    FROM manufacturers WHERE name='Haga';

  INSERT INTO keys (code, application, manufacturer_id, category_id, profile, panel_column, panel_row, stock, low_stock_threshold, notes, cross_refs) VALUES
    ('YH35R',  'Civic / Fit / HRV 2007-2022',     honda_id,   auto_id, 'Simples', 'C', 4,  2, 5,  'Compatível sem transponder', ARRAY['YH35','YH35-L','CP-HON35']),
    ('YH36',   'Accord / CR-V 2009-2020',          honda_id,   auto_id, 'Simples', 'C', 5, 15, 5,  NULL, NULL),
    ('YH28',   'City / Jazz 2003-2015',             honda_id,   auto_id, 'Simples', 'D', 2,  8, 5,  NULL, NULL),
    ('HU66',   'Golf / Polo / Jetta 2003-2020',     vw_id,      auto_id, 'Duplo',   'B', 3,  0, 5,  NULL, ARRAY['HU66R','HU66T']),
    ('HU100',  'Gol / Fox / Voyage',                vw_id,      auto_id, 'Simples', 'B', 1,  0, 5,  NULL, NULL),
    ('GT10',   'Corolla / Yaris 2002-2019',         toyota_id,  auto_id, 'Simples', 'E', 2,  0, 3,  NULL, NULL),
    ('SY6R',   'HB20 / Creta 2012+',               hyundai_id, auto_id, 'Simples', 'F', 1, 22, 5,  NULL, NULL),
    ('FO38',   'Ka / Fiesta 2008-2021',             ford_id,    auto_id, 'Duplo',   'A', 3,  3, 5,  NULL, ARRAY['FO38R']),
    ('KIA-7R', 'Cerato / Sportage 2013-2020',       kia_id,     auto_id, 'Simples', 'G', 4,  1, 3,  NULL, NULL),
    ('GM-W',   'Onix / Cruze 2012-2022',            gm_id,      auto_id, 'Simples', 'D', 5,  9, 5,  NULL, NULL),
    ('SCH01',  'Fechadura residencial série 400',   schlage_id, fech_id, 'Cilíndrico','H',1, 30, 8, NULL, NULL),
    ('HK-P',   'Porta blindada linha premium',      haga_id,    fech_id, 'Alta seg.','H',2, 12, 5, NULL, NULL);
END;
$$;
