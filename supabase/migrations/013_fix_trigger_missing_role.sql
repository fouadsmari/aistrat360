-- Fix trigger to include required role field (NOT NULL constraint)
-- This was the REAL cause of "Database error saving new user"

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile data with ROLE field (required NOT NULL)
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data IS NOT NULL THEN NEW.raw_user_meta_data->>'full_name'
        ELSE NULL
      END,
      CASE 
        WHEN NEW.raw_user_meta_data IS NOT NULL THEN
          CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            CASE WHEN NEW.raw_user_meta_data->>'last_name' IS NOT NULL 
                 THEN ' ' || NEW.raw_user_meta_data->>'last_name'
                 ELSE ''
            END
          )
        ELSE NULL
      END
    ),
    CASE 
      WHEN NEW.raw_user_meta_data IS NOT NULL THEN NEW.raw_user_meta_data->>'first_name'
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data IS NOT NULL THEN NEW.raw_user_meta_data->>'last_name'
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data IS NOT NULL THEN NEW.raw_user_meta_data->>'avatar_url'
      ELSE NULL
    END,
    -- ADD THE MISSING ROLE FIELD!
    COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data IS NOT NULL THEN (NEW.raw_user_meta_data->>'role')::user_role
        ELSE NULL
      END,
      'subscriber'::user_role  -- Default role
    )
  );
  
  -- Create default subscription
  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;