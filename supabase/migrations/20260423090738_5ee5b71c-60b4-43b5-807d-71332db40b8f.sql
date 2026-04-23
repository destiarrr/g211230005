-- 1. Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supplier';

-- 2. Add wallet_address to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- 3. Stock items: min_qty for low-stock alert
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS min_qty INTEGER NOT NULL DEFAULT 10;

-- 4. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  address TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'owner')) WITH CHECK (has_role(auth.uid(),'owner'));

-- 5. Stock movements (supply chain tracking)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  from_location TEXT NOT NULL, -- 'supplier:<id>' | 'pusat' | 'cabang:<id>'
  to_location TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  branch_id UUID REFERENCES public.branches(id),
  tx_hash TEXT, -- mock blockchain hash
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or Mitra insert movements" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'owner') OR has_role(auth.uid(),'mitra'));

-- 6. Loyalty accounts (per customer)
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  user_id UUID PRIMARY KEY,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_redeemed NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own loyalty" ON public.loyalty_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'owner'));
CREATE POLICY "System manage loyalty" ON public.loyalty_accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'owner'))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(),'owner'));

-- 7. Loyalty transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  tx_type TEXT NOT NULL, -- 'earn' | 'redeem'
  reference TEXT, -- sale_id or voucher_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own loyalty tx" ON public.loyalty_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'owner'));

-- 8. Vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cost_points NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read vouchers" ON public.vouchers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner manage vouchers" ON public.vouchers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'owner')) WITH CHECK (has_role(auth.uid(),'owner'));

-- 9. Voucher redemptions
CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id),
  points_spent NUMERIC NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own redemptions" ON public.voucher_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'owner'));
CREATE POLICY "Users insert own redemptions" ON public.voucher_redemptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 10. Payment proofs (manual transfer upload)
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  payment_type TEXT NOT NULL, -- 'franchise_fee' | 'royalty' | 'supply'
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL DEFAULT 'transfer', -- 'transfer' | 'qris' | 'crypto'
  proof_url TEXT,
  reference_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'verified' | 'rejected'
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payment_proofs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'owner'));
CREATE POLICY "Users insert own payments" ON public.payment_proofs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner verify payments" ON public.payment_proofs FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'owner'));

-- 11. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info', -- 'info' | 'success' | 'warning' | 'error'
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- 12. Storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs','payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own proof" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own proof" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='payment-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(),'owner')));

-- 13. Trigger: notify all owners on new payment proof
CREATE OR REPLACE FUNCTION public.notify_owners_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT ur.user_id,
         'Bukti pembayaran baru',
         'Pembayaran ' || NEW.payment_type || ' sebesar Rp ' || NEW.amount::text || ' menunggu verifikasi.',
         'info',
         '/admin/payments'
  FROM public.user_roles ur WHERE ur.role = 'owner';
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_payment ON public.payment_proofs;
CREATE TRIGGER trg_notify_payment AFTER INSERT ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.notify_owners_on_payment();

-- 14. Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;