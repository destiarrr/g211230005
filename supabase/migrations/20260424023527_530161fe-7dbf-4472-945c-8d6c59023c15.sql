
-- 1) Auto loyalty trigger from sales
CREATE OR REPLACE FUNCTION public.auto_loyalty_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  earner UUID;
  pts NUMERIC;
BEGIN
  -- Find a profile linked to this branch (mitra). If none, skip.
  SELECT user_id INTO earner FROM public.profiles WHERE branch_id = NEW.branch_id LIMIT 1;
  IF earner IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1% loyalty points (1 point per Rp 100)
  pts := FLOOR(NEW.total_amount / 100);
  IF pts <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.loyalty_accounts (user_id, balance, total_earned)
  VALUES (earner, pts, pts)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.loyalty_accounts.balance + EXCLUDED.balance,
        total_earned = public.loyalty_accounts.total_earned + EXCLUDED.total_earned,
        updated_at = now();

  INSERT INTO public.loyalty_transactions (user_id, amount, tx_type, reference)
  VALUES (earner, pts, 'earn', 'sale:' || NEW.id::text);

  RETURN NEW;
END;
$$;

-- Add unique constraint for loyalty_accounts upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_accounts_user_id_key'
  ) THEN
    ALTER TABLE public.loyalty_accounts ADD CONSTRAINT loyalty_accounts_user_id_key UNIQUE (user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_auto_loyalty_on_sale ON public.sales;
CREATE TRIGGER trg_auto_loyalty_on_sale
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.auto_loyalty_on_sale();

-- 2) Notify uploader when payment status changes
CREATE OR REPLACE FUNCTION public.notify_user_on_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      CASE NEW.status
        WHEN 'verified' THEN 'Pembayaran diverifikasi ✓'
        WHEN 'rejected' THEN 'Pembayaran ditolak'
        ELSE 'Status pembayaran diperbarui'
      END,
      'Pembayaran ' || NEW.payment_type || ' sebesar Rp ' || NEW.amount::text || ' kini berstatus ' || NEW.status,
      CASE NEW.status WHEN 'verified' THEN 'success' WHEN 'rejected' THEN 'error' ELSE 'info' END,
      '/payments'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_payment_status ON public.payment_proofs;
CREATE TRIGGER trg_notify_payment_status
AFTER UPDATE ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_on_payment_status();

-- 3) Notify owners when new payment proof uploaded (attach trigger - function already exists)
DROP TRIGGER IF EXISTS trg_notify_owners_payment ON public.payment_proofs;
CREATE TRIGGER trg_notify_owners_payment
AFTER INSERT ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.notify_owners_on_payment();

-- 4) Storage policies for payment-proofs bucket (per-user folders)
DROP POLICY IF EXISTS "Users upload own proofs" ON storage.objects;
CREATE POLICY "Users upload own proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users read own proofs" ON storage.objects;
CREATE POLICY "Users read own proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'owner'::public.app_role))
);
