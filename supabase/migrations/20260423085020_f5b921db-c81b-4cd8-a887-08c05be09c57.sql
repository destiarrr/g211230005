-- Remove overly permissive insert; royalty inserts happen via SECURITY DEFINER trigger
-- which bypasses RLS automatically, so no user-facing INSERT policy is needed.
DROP POLICY IF EXISTS "System insert royalty" ON public.royalty_transactions;