-- 1. Create Profiles Table (Linked to auth.users)
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  iban TEXT NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Categories Table
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Expense Reports Table
CREATE TYPE public.report_status AS ENUM ('offen', 'in_auftrag', 'ausbezahlt', 'abgelehnt');

CREATE TABLE public.expense_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status public.report_status NOT NULL DEFAULT 'offen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  admin_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT status_paid_at_check CHECK (
    (status = 'ausbezahlt' AND paid_at IS NOT NULL) OR 
    (status <> 'ausbezahlt' AND paid_at IS NULL)
  )
);

-- 4. Create Expense Items Table
CREATE TABLE public.expense_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.expense_reports(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  purpose TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
  receipt_url TEXT NOT NULL,
  team TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger: Automatically Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email IN ('laurin.scheuber@volleymutschellen.ch', 'anna.schneiter@volleymutschellen.ch') THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Trigger: Protect Profile Role from Non-Admins
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Restrict role modification unless admin, running via SQL Editor/migration (auth.uid() is null), or service_role
  IF NEW.role <> OLD.role AND NOT (
    public.is_admin() OR
    auth.uid() IS NULL OR
    current_setting('role', true) = 'service_role'
  ) THEN
    NEW.role = OLD.role;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

-- 8. Trigger: Handle Report Update Constraints
CREATE OR REPLACE FUNCTION public.handle_expense_report_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    -- Must own the report
    IF OLD.user_id <> auth.uid() OR NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Fehler: Sie dürfen nur Ihre eigenen Berichte bearbeiten.';
    END IF;
    
    -- Cannot edit if not 'offen'
    IF OLD.status <> 'offen' THEN
      RAISE EXCEPTION 'Fehler: Berichte, die nicht offen sind, können nicht mehr bearbeitet werden.';
    END IF;

    -- Cannot change admin columns
    IF NEW.status <> OLD.status OR NEW.paid_at IS DISTINCT FROM OLD.paid_at OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
      RAISE EXCEPTION 'Fehler: Nur Administratoren dürfen den Status, das Auszahlungsdatum oder Admin-Notizen ändern.';
    END IF;
  ELSE
    -- Admin modifications
    IF NEW.status = 'ausbezahlt' AND OLD.status <> 'ausbezahlt' THEN
      NEW.paid_at = COALESCE(NEW.paid_at, NOW());
    ELSIF NEW.status <> 'ausbezahlt' THEN
      NEW.paid_at = NULL;
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_expense_report_update
  BEFORE UPDATE ON public.expense_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_expense_report_update();

-- 9. Trigger: Handle Report Delete Constraints
CREATE OR REPLACE FUNCTION public.handle_expense_report_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF OLD.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Fehler: Sie dürfen nur Ihre eigenen Berichte löschen.';
    END IF;
    IF OLD.status <> 'offen' THEN
      RAISE EXCEPTION 'Fehler: Nur offene Berichte können gelöscht werden.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_expense_report_delete
  BEFORE DELETE ON public.expense_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_expense_report_delete();

-- 10. Trigger: Handle Item Modifications (Inserts and Updates)
CREATE OR REPLACE FUNCTION public.handle_expense_item_modification()
RETURNS TRIGGER AS $$
DECLARE
  v_report_user_id UUID;
  v_report_status public.report_status;
BEGIN
  SELECT user_id, status INTO v_report_user_id, v_report_status
  FROM public.expense_reports
  WHERE id = NEW.report_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fehler: Der verknüpfte Spesenbericht existiert nicht.';
  END IF;
  
  IF NOT public.is_admin() THEN
    IF v_report_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Fehler: Sie können nur Positionen zu Ihren eigenen Berichten hinzufügen.';
    END IF;
    IF v_report_status <> 'offen' THEN
      RAISE EXCEPTION 'Fehler: Positionen können nur zu offenen Berichten hinzugefügt oder geändert werden.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_expense_item_modification
  BEFORE INSERT OR UPDATE ON public.expense_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_expense_item_modification();

-- 11. Trigger: Handle Item Deletions
CREATE OR REPLACE FUNCTION public.handle_expense_item_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_report_user_id UUID;
  v_report_status public.report_status;
BEGIN
  SELECT user_id, status INTO v_report_user_id, v_report_status
  FROM public.expense_reports
  WHERE id = OLD.report_id;
  
  IF NOT public.is_admin() THEN
    IF v_report_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Fehler: Sie können nur Positionen aus Ihren eigenen Berichten löschen.';
    END IF;
    IF v_report_status <> 'offen' THEN
      RAISE EXCEPTION 'Fehler: Positionen können nur aus offenen Berichten gelöscht werden.';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_expense_item_delete
  BEFORE DELETE ON public.expense_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_expense_item_delete();

-- 12. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- 13. Define RLS Policies
-- Profiles Policies
CREATE POLICY "Profiles are viewable by owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles can be updated by owner or admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Categories Policies
CREATE POLICY "Categories are readable by authenticated users"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Categories are fully manageable by admin only"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- Expense Reports Policies
CREATE POLICY "Reports are viewable by owner or admin"
  ON public.expense_reports FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Reports can be inserted by owner"
  ON public.expense_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reports can be updated by owner or admin"
  ON public.expense_reports FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Reports can be deleted by owner or admin"
  ON public.expense_reports FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- Expense Items Policies
CREATE POLICY "Items are viewable by owner or admin"
  ON public.expense_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_reports r 
      WHERE r.id = report_id AND r.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Items can be inserted by owner or admin"
  ON public.expense_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expense_reports r 
      WHERE r.id = report_id AND r.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Items can be updated by owner or admin"
  ON public.expense_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_reports r 
      WHERE r.id = report_id AND r.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Items can be deleted by owner or admin"
  ON public.expense_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expense_reports r 
      WHERE r.id = report_id AND r.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- 14. Seed Initial Categories
INSERT INTO public.categories (name, is_active) VALUES
  ('Hallenmiete / Platzkosten', true),
  ('Schiedsrichtergebühren', true),
  ('Turnieranmeldung & Lizenzen', true),
  ('Verpflegung / Team-Event', true),
  ('Material / Bälle / Trikots', true),
  ('Fahrtkosten / Transport', true),
  ('Sonstiges', true)
ON CONFLICT (name) DO NOTHING;

-- 15. Create Storage Bucket and Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated uploads to receipts" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow public reads of receipts" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'receipts');

