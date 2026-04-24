
-- Update default status to 'pending' and update trigger to use lifecycle
ALTER TABLE public.royalty_transactions ALTER COLUMN status SET DEFAULT 'pending';

-- Update trigger to insert as 'pending' (mitra harus bayar dulu)
CREATE OR REPLACE FUNCTION public.create_royalty_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  royalty_matic NUMERIC;
  hash_part TEXT;
BEGIN
  royalty_matic := ROUND((NEW.total_amount * 0.05) / 12000, 4);
  hash_part := substr(md5(NEW.id::text || now()::text), 1, 8) || '...' || substr(md5(random()::text), 1, 4);

  INSERT INTO public.royalty_transactions (branch_id, tx_hash, tx_type, amount, currency, status)
  VALUES (NEW.branch_id, '0x' || hash_part, 'royalty', royalty_matic, 'MATIC', 'pending');

  RETURN NEW;
END;
$function$;

-- Allow owner to update royalty status (verify / mark paid)
DROP POLICY IF EXISTS "Owner update royalty" ON public.royalty_transactions;
CREATE POLICY "Owner update royalty"
ON public.royalty_transactions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));
