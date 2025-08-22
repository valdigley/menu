/*
  # Fix get_all_users function return type

  1. Problem
    - Function return type mismatch between declared and actual types
    - Second column (email) has type mismatch: character varying(255) vs text

  2. Solution
    - Update function to use consistent TEXT types for all string columns
    - Ensure RETURNS TABLE matches actual SELECT output types
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_all_users();

-- Recreate function with correct return types
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
    au.email::text,
    COALESCE(u.name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Sem nome')::text,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.id
  ORDER BY au.created_at DESC;
END;
$$;