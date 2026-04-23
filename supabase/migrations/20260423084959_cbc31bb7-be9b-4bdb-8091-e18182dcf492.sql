-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'mitra', 'investor');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. RLS for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- 6. Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_role public.app_role;
BEGIN
  -- Read role from user metadata, default to investor
  selected_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'investor'::public.app_role
  );

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Update profile timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Replace permissive RLS policies on existing tables

-- BRANCHES: read for all authenticated, write owner only
DROP POLICY IF EXISTS "Public read branches" ON public.branches;
DROP POLICY IF EXISTS "Public insert branches" ON public.branches;
DROP POLICY IF EXISTS "Public update branches" ON public.branches;
DROP POLICY IF EXISTS "Public delete branches" ON public.branches;

CREATE POLICY "Authenticated read branches"
  ON public.branches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner insert branches"
  ON public.branches FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner update branches"
  ON public.branches FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner delete branches"
  ON public.branches FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- SALES: read all authenticated, insert owner+mitra
DROP POLICY IF EXISTS "Public read sales" ON public.sales;
DROP POLICY IF EXISTS "Public insert sales" ON public.sales;

CREATE POLICY "Authenticated read sales"
  ON public.sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner or Mitra insert sales"
  ON public.sales FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'mitra')
  );

-- STOCK: read all, write owner+mitra
DROP POLICY IF EXISTS "Public read stock" ON public.stock_items;
DROP POLICY IF EXISTS "Public insert stock" ON public.stock_items;
DROP POLICY IF EXISTS "Public update stock" ON public.stock_items;

CREATE POLICY "Authenticated read stock"
  ON public.stock_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner or Mitra insert stock"
  ON public.stock_items FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'mitra')
  );

CREATE POLICY "Owner or Mitra update stock"
  ON public.stock_items FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'mitra')
  );

-- ROYALTY: read all authenticated; insert via trigger only (no direct writes needed)
DROP POLICY IF EXISTS "Public read royalty" ON public.royalty_transactions;
DROP POLICY IF EXISTS "Public insert royalty" ON public.royalty_transactions;

CREATE POLICY "Authenticated read royalty"
  ON public.royalty_transactions FOR SELECT TO authenticated USING (true);

-- Trigger function runs as SECURITY DEFINER so no INSERT policy needed for users
-- but we need one for the trigger context
CREATE POLICY "System insert royalty"
  ON public.royalty_transactions FOR INSERT TO authenticated
  WITH CHECK (true);

-- 9. Re-attach the royalty trigger to sales table (it was missing)
DROP TRIGGER IF EXISTS trg_sales_royalty ON public.sales;
CREATE TRIGGER trg_sales_royalty
  AFTER INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.create_royalty_on_sale();