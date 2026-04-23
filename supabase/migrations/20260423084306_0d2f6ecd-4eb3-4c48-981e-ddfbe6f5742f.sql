
-- Branches (cabang franchise)
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  manager_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  wallet_address TEXT,
  opened_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily sales entries from mitra
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total_amount NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_branch_date ON public.sales(branch_id, sale_date DESC);

-- Stock items per branch
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  current_qty INTEGER NOT NULL DEFAULT 0,
  max_qty INTEGER NOT NULL DEFAULT 100,
  unit TEXT NOT NULL DEFAULT 'kg',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- On-chain royalty / blockchain transactions (mock)
CREATE TABLE public.royalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  tx_hash TEXT NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('royalty','profit_share','reward_token','franchise_fee')),
  amount NUMERIC(18,6) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MATIC',
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_royalty_created ON public.royalty_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_transactions ENABLE ROW LEVEL SECURITY;

-- MVP demo policies: anyone can read; anyone can insert (auth akan ditambahkan tahap berikutnya)
CREATE POLICY "Public read branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Public insert branches" ON public.branches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update branches" ON public.branches FOR UPDATE USING (true);
CREATE POLICY "Public delete branches" ON public.branches FOR DELETE USING (true);

CREATE POLICY "Public read sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Public insert sales" ON public.sales FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read stock" ON public.stock_items FOR SELECT USING (true);
CREATE POLICY "Public insert stock" ON public.stock_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update stock" ON public.stock_items FOR UPDATE USING (true);

CREATE POLICY "Public read royalty" ON public.royalty_transactions FOR SELECT USING (true);
CREATE POLICY "Public insert royalty" ON public.royalty_transactions FOR INSERT WITH CHECK (true);

-- Trigger: auto generate royalty (5%) when sales inserted
CREATE OR REPLACE FUNCTION public.create_royalty_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  royalty_matic NUMERIC;
  hash_part TEXT;
BEGIN
  -- 5% royalty, convert IDR -> MATIC at mock rate 1 MATIC = 12000 IDR
  royalty_matic := ROUND((NEW.total_amount * 0.05) / 12000, 4);
  hash_part := substr(md5(NEW.id::text || now()::text), 1, 8) || '...' || substr(md5(random()::text), 1, 4);

  INSERT INTO public.royalty_transactions (branch_id, tx_hash, tx_type, amount, currency)
  VALUES (NEW.branch_id, '0x' || hash_part, 'royalty', royalty_matic, 'MATIC');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sales_royalty
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.create_royalty_on_sale();
