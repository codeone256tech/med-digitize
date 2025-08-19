-- Create user profiles table for doctors
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create medical records table
CREATE TABLE public.medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  age integer,
  gender text,
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  diagnosis text,
  prescription text,
  raw_text text,
  image_url text,
  doctor_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on medical records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Create medical records policies
CREATE POLICY "Doctors can view all medical records" 
ON public.medical_records 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Doctors can create medical records" 
ON public.medical_records 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update medical records" 
ON public.medical_records 
FOR UPDATE 
TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete medical records" 
ON public.medical_records 
FOR DELETE 
TO authenticated
USING (auth.uid() = doctor_id);

-- Add updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for medical records
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, doctor_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'doctor_name');
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage policies for medical images
CREATE POLICY "Doctors can upload medical images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'medical-images');

CREATE POLICY "Doctors can view medical images" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'medical-images');

CREATE POLICY "Doctors can update medical images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'medical-images');

CREATE POLICY "Doctors can delete medical images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'medical-images');