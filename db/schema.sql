-- Baithak counter ledger: schema. Safe to run on every deploy (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS ingredients (
  id                  serial PRIMARY KEY,
  name                text NOT NULL UNIQUE,
  unit                text NOT NULL,
  current_stock       numeric(12,2) NOT NULL DEFAULT 0,
  low_stock_threshold numeric(12,2) NOT NULL DEFAULT 0,
  cost_per_unit       numeric(12,4),
  last_change         numeric(12,3),
  last_changed_at     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id              serial PRIMARY KEY,
  name            text NOT NULL,
  category        text NOT NULL,
  price           numeric(10,2) NOT NULL DEFAULT 0,
  is_quick_tab    boolean NOT NULL DEFAULT false,
  quick_tab_order integer,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id             serial PRIMARY KEY,
  menu_item_id   integer NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id  integer NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity       numeric(12,3) NOT NULL,
  UNIQUE (menu_item_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id            serial PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  total_amount  numeric(12,2) NOT NULL DEFAULT 0,
  item_count    integer NOT NULL DEFAULT 0,
  serial_no     integer,   -- Sr. No. on the paper page; restarts every day (IST)
  table_number  integer    -- T-1, T-2 ...; NULL = counter / no table
);

CREATE TABLE IF NOT EXISTS order_items (
  id             serial PRIMARY KEY,
  order_id       integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id   integer REFERENCES menu_items(id) ON DELETE SET NULL,
  name_snapshot  text NOT NULL,
  quantity       integer NOT NULL,
  unit_price     numeric(10,2) NOT NULL,
  line_total     numeric(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id            serial PRIMARY KEY,
  ingredient_id integer NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  change        numeric(12,3) NOT NULL,
  reason        text NOT NULL,
  order_id      integer REFERENCES orders(id) ON DELETE SET NULL,
  menu_item_id  integer REFERENCES menu_items(id) ON DELETE SET NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_items_menu        ON recipe_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_ingredient  ON recipe_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order        ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_ingredient        ON inventory_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_menu              ON inventory_transactions(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created           ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_created           ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_serial_day        ON orders(serial_no);
