-- 1. Remove the strict foreign key to auth.users from profiles.id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Make profiles.email optional (nullable)
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 3. Set a default UUID generation for profiles.id
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Re-configure the foreign key from expense_reports to profiles to add ON UPDATE CASCADE
ALTER TABLE public.expense_reports DROP CONSTRAINT IF EXISTS expense_reports_user_id_fkey;
ALTER TABLE public.expense_reports ADD CONSTRAINT expense_reports_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Add RLS policy for inserting profiles manually (admin only)
DROP POLICY IF EXISTS "Profiles can be inserted by admin" ON public.profiles;
CREATE POLICY "Profiles can be inserted by admin"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- 6. Add RLS policy for inserting expense reports (owner or admin)
DROP POLICY IF EXISTS "Reports can be inserted by owner" ON public.expense_reports;
DROP POLICY IF EXISTS "Reports can be inserted by owner or admin" ON public.expense_reports;
CREATE POLICY "Reports can be inserted by owner or admin"
  ON public.expense_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 7. Update handle_new_user() trigger to link and merge existing email profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_profile_id UUID;
BEGIN
  -- Search for existing profile with the same email (case-insensitive)
  SELECT id INTO existing_profile_id
  FROM public.profiles
  WHERE LOWER(email) = LOWER(NEW.email);

  IF existing_profile_id IS NOT NULL THEN
    -- Match found! Update the existing profile ID to match the new user ID.
    -- This cascades to update expense_reports.user_id automatically!
    UPDATE public.profiles
    SET id = NEW.id,
        full_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), full_name),
        updated_at = NOW()
    WHERE id = existing_profile_id;
  ELSE
    -- No matching profile, insert a new one
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add a trigger to handle deleting a user in auth.users
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();
