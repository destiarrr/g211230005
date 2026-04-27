
-- =====================================================
-- PRODUCTS (katalog dinamis)
-- =====================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  default_price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read products" ON public.products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed katalog awal (sesuai DapurKu)
INSERT INTO public.products (name, category, default_price, unit) VALUES
  ('Cimol','Snack',7000,'pcs'),
  ('Kentang','Snack',5000,'pcs'),
  ('Otak-otak','Snack',6000,'pcs'),
  ('Tahu','Snack',5000,'pcs'),
  ('Sosis','Snack',5000,'pcs'),
  ('Bakso','Snack',8000,'pcs');

-- =====================================================
-- ORDERS + ORDER_ITEMS (kasir multi-item)
-- =====================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('offline','shopeefood','gofood')),
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_branch ON public.orders(branch_id);
CREATE INDEX idx_orders_date ON public.orders(order_date);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read orders" ON public.orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or Mitra insert orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'mitra'));
CREATE POLICY "Owner update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC GENERATED ALWAYS AS (quantity * price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or Mitra insert order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'mitra'));

-- =====================================================
-- STOCK RECORDS (pembukaan/penutupan harian)
-- =====================================================
CREATE TABLE public.stock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_type TEXT NOT NULL CHECK (record_type IN ('pembukaan','penutupan')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_records_branch_date ON public.stock_records(branch_id, record_date);
ALTER TABLE public.stock_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read stock records" ON public.stock_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or Mitra insert stock records" ON public.stock_records
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'mitra'));
CREATE POLICY "Owner or Mitra update stock records" ON public.stock_records
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'mitra'));

-- =====================================================
-- PRODUCTION RECORDS (belanja bahan baku)
-- =====================================================
CREATE TABLE public.production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  place TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_production_branch_date ON public.production_records(branch_id, purchase_date);
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read production" ON public.production_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or Mitra insert production" ON public.production_records
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'mitra'));
CREATE POLICY "Owner or Mitra update production" ON public.production_records
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'mitra'));

CREATE TRIGGER trg_production_updated_at
  BEFORE UPDATE ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- OPERATIONAL TOOLS (alat masak + periode ganti)
-- =====================================================
CREATE TABLE public.operational_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  brand TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  purchase_place TEXT,
  replace_period_months INT NOT NULL DEFAULT 0,
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operational_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read tools" ON public.operational_tools
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or Mitra insert tools" ON public.operational_tools
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'mitra'));
CREATE POLICY "Owner or Mitra update tools" ON public.operational_tools
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'mitra'));
CREATE POLICY "Owner delete tools" ON public.operational_tools
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'owner'));

CREATE TRIGGER trg_tools_updated_at
  BEFORE UPDATE ON public.operational_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGER: orders → royalty & loyalty (gantikan sales triggers)
-- =====================================================
DROP TRIGGER IF EXISTS trg_create_royalty_on_sale ON public.sales;
DROP TRIGGER IF EXISTS trg_auto_loyalty_on_sale ON public.sales;

CREATE OR REPLACE FUNCTION public.create_royalty_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  royalty_matic NUMERIC;
  hash_part TEXT;
BEGIN
  IF NEW.total IS NULL OR NEW.total <= 0 THEN RETURN NEW; END IF;
  royalty_matic := ROUND((NEW.total * 0.05) / 12000, 4);
  hash_part := substr(md5(NEW.id::text || now()::text), 1, 8) || '...' || substr(md5(random()::text), 1, 4);
  INSERT INTO public.royalty_transactions (branch_id, tx_hash, tx_type, amount, currency, status)
  VALUES (NEW.branch_id, '0x' || hash_part, 'royalty', royalty_matic, 'MATIC', 'pending');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_create_royalty_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_royalty_on_order();

CREATE OR REPLACE FUNCTION public.auto_loyalty_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  earner UUID;
  pts NUMERIC;
BEGIN
  SELECT user_id INTO earner FROM public.profiles WHERE branch_id = NEW.branch_id LIMIT 1;
  IF earner IS NULL THEN RETURN NEW; END IF;
  pts := FLOOR(NEW.total / 100);
  IF pts <= 0 THEN RETURN NEW; END IF;

  INSERT INTO public.loyalty_accounts (user_id, balance, total_earned)
  VALUES (earner, pts, pts)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.loyalty_accounts.balance + EXCLUDED.balance,
        total_earned = public.loyalty_accounts.total_earned + EXCLUDED.total_earned,
        updated_at = now();

  INSERT INTO public.loyalty_transactions (user_id, amount, tx_type, reference)
  VALUES (earner, pts, 'earn', 'order:' || NEW.id::text);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_auto_loyalty_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.auto_loyalty_on_order();
