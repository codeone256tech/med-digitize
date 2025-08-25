-- Create storage bucket for medical images
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-images', 'medical-images', true);

-- Create storage policies for medical images
CREATE POLICY "Users can view medical images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical-images');

CREATE POLICY "Doctors can upload medical images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medical-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Doctors can update their own medical images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'medical-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Doctors can delete their own medical images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medical-images' AND auth.uid() IS NOT NULL);