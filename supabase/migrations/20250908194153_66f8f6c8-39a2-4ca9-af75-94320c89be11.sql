-- Add username field to profiles table and create admin role system
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN email TEXT,
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update existing records to have role 'user'
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Create admin user (this will be the default admin account)
-- Note: You'll need to create the actual auth user separately, this just prepares the profile
INSERT INTO public.profiles (user_id, doctor_name, username, email, role) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'System Administrator', 'admin', 'admin@meddigitize.com', 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- Update RLS policies for profiles to handle admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- New RLS policies that allow admin access
CREATE POLICY "Users can view their own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can update their own profile or admins can update all" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

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
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

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