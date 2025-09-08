-- Add username field to profiles table and create admin role system
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN email TEXT,
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update existing records to have role 'user'
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Create security definer function to get current user role (to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update RLS policies for profiles to handle admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- New RLS policies that allow admin access
CREATE POLICY "Users can view their own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR public.get_current_user_role() = 'admin');

CREATE POLICY "Users can update their own profile or admins can update all" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id OR public.get_current_user_role() = 'admin');

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.get_current_user_role() = 'admin');

-- Update medical records policies to allow admin access
DROP POLICY IF EXISTS "Doctors can view all medical records" ON public.medical_records;

CREATE POLICY "Doctors and admins can view all medical records" 
ON public.medical_records 
FOR SELECT 
USING (true);

-- Allow admins to manage all medical records
CREATE POLICY "Admins can manage all medical records" 
ON public.medical_records 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Update the handle_new_user function to extract username and email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, doctor_name, username, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'doctor_name',
    new.raw_user_meta_data ->> 'username',
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'user')
  );
  RETURN new;
END;
$$;