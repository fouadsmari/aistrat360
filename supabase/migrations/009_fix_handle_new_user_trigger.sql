-- Fix handle_new_user trigger to avoid RLS recursion issues

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile data
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        CASE WHEN NEW.raw_user_meta_data->>'last_name' IS NOT NULL 
             THEN ' ' || NEW.raw_user_meta_data->>'last_name'
             ELSE ''
        END
      )
    ),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default subscription for all users (no role checking to avoid recursion)
  -- Admin roles can be managed separately through the admin panel
  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add RLS bypass for service role on subscriptions to prevent issues
CREATE POLICY "service_role_subscriptions_bypass" ON public.subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);