-- SOLUTION DÉFINITIVE : Fix tout le bordel d'un coup
-- Nettoie toutes les policies foireuses et recrée un système qui marche

-- 1. NETTOIE TOUTES LES POLICIES FOIREUSES
DROP POLICY IF EXISTS "admin_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_access_policy" ON public.profiles;
DROP POLICY IF EXISTS "service_role_bypass" ON public.profiles;
DROP POLICY IF EXISTS "admin_all_access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. RECRÉE DES POLICIES SIMPLES QUI MARCHENT
-- Policy pour que chaque user voit son propre profil
CREATE POLICY "users_own_profile" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id);

-- Policy pour service role (bypass complet)
CREATE POLICY "service_role_full_access" ON public.profiles
  FOR ALL TO service_role
  USING (true);

-- 3. RECRÉE LE TRIGGER PROPREMENT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Crée le profil avec toutes les données
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    full_name,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      TRIM(CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      ))
    ),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'subscriber'::user_role)
  );
  
  -- Met à jour les métadonnées JWT avec le rôle
  UPDATE auth.users 
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber'),
        'full_name', COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          TRIM(CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
          ))
        )
      ),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber'))
  WHERE id = NEW.id;
  
  -- Crée l'abonnement
  INSERT INTO public.subscriptions (user_id) VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log l'erreur mais ne bloque pas la création
  RAISE LOG 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recrée le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. CRÉE UN ADMIN DEFINITIF (remplace par ton email réel)
DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'fouadsmari@gmail.com'; -- REMPLACE PAR TON VRAI EMAIL
BEGIN
    -- Trouve ou crée l'utilisateur admin
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    -- Si l'user existe, met à jour ses données
    IF admin_user_id IS NOT NULL THEN
        -- Met à jour le profil
        UPDATE public.profiles 
        SET 
            role = 'super_admin'::user_role,
            full_name = 'Super Admin',
            first_name = 'Super',
            last_name = 'Admin'
        WHERE id = admin_user_id;
        
        -- Met à jour les métadonnées JWT
        UPDATE auth.users 
        SET 
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                jsonb_build_object(
                    'role', 'super_admin',
                    'full_name', 'Super Admin',
                    'first_name', 'Super',
                    'last_name', 'Admin'
                ),
            raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                jsonb_build_object('role', 'super_admin')
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'Admin user updated: %', admin_email;
    ELSE
        RAISE NOTICE 'Admin user not found: %. Create account first, then run migration again.', admin_email;
    END IF;
END;
$$;