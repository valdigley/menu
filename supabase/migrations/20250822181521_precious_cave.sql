/*
  # Fix ambiguous column reference in get_all_users function

  1. Updates
    - Fix the get_all_users function to properly qualify column references
    - Remove ambiguity by using table aliases consistently
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_all_users();

-- Create the corrected function with proper column qualification
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(u.name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Sem nome') as name,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.id
  ORDER BY au.created_at DESC;
END;
$$;