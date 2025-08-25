-- Fix handle_new_user trigger to handle NULL or empty metadata
-- This is the REAL source of "Database error saving new user"

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile data with proper NULL handling for metadata
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, avatar_url)
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
    END
  );
  
  -- Create default subscription
  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;