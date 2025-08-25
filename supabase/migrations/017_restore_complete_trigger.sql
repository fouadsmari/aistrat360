-- Restore complete trigger with all user data now that email validation is fixed

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert complete profile data
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    first_name,
    last_name,
    avatar_url,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      CASE WHEN NEW.raw_user_meta_data IS NOT NULL 
           THEN NEW.raw_user_meta_data->>'full_name'
           ELSE NULL END,
      CASE WHEN NEW.raw_user_meta_data IS NOT NULL 
           THEN CONCAT(
             COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
             CASE WHEN NEW.raw_user_meta_data->>'last_name' IS NOT NULL 
                  THEN ' ' || NEW.raw_user_meta_data->>'last_name'
                  ELSE '' END
           )
           ELSE NULL END
    ),
    CASE WHEN NEW.raw_user_meta_data IS NOT NULL 
         THEN NEW.raw_user_meta_data->>'first_name'
         ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data IS NOT NULL 
         THEN NEW.raw_user_meta_data->>'last_name'
         ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data IS NOT NULL 
         THEN NEW.raw_user_meta_data->>'avatar_url'
         ELSE NULL END,
    COALESCE(
      CASE WHEN NEW.raw_user_meta_data IS NOT NULL 
           THEN (NEW.raw_user_meta_data->>'role')::user_role
           ELSE NULL END,
      'subscriber'::user_role
    )
  );
  
  -- Create subscription
  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If error, log but don't block user creation
  RAISE LOG 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;