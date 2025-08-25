import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, Loader2, ArrowLeft, Save, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { OCRService, ExtractedFields } from '@/utils/ocrService';
import { AIService } from '@/services/aiService';
import { CameraCapture } from './CameraCapture';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ScannerProps {
  onExtracted: (text: string, imageUrl: string) => void;
  onBack: () => void;
}

export const Scanner = ({ onExtracted, onBack }: ScannerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'camera' | 'upload' | 'manual'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [manualFields, setManualFields] = useState<ExtractedFields>({
    patientName: '',
    age: '',
    gender: '',
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    prescription: ''
  });

  const processImage = async (imageSource: File | string) => {
    setIsProcessing(true);
    
    try {
      let imageUrl: string;
      let extractedText: string;

      if (typeof imageSource === 'string') {
        // Camera capture (data URL)
        imageUrl = imageSource;
        
        // Convert data URL to blob for OCR processing
        const response = await fetch(imageSource);
        const blob = await response.blob();
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        extractedText = await OCRService.extractText(file);
      } else {
        // File upload
        if (!imageSource.type.startsWith('image/')) {
          throw new Error('Please select an image file');
        }
        
        imageUrl = URL.createObjectURL(imageSource);
        setPreview(imageUrl);
        extractedText = await OCRService.extractText(imageSource);
      }
      
      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the image');
      }

      // Enhance extraction with AI
      console.log('Enhancing extraction with AI...');
      const enhancedFields = await AIService.enhanceExtraction(extractedText);
      
      // Pass enhanced data in a format that RecordForm can understand
      const enhancedText = JSON.stringify(enhancedFields);
      onExtracted(enhancedText, imageUrl);
      
      toast({
        title: "Success",
        description: "Text extracted and enhanced successfully",
      });
      
    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract text from image. Please try with a clearer image.",
        variant: "destructive"
      });
      setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    await processImage(file);
  };

  const handleCameraCapture = async (imageDataUrl: string) => {
    await processImage(imageDataUrl);
  };

  const handleManualSave = async () => {
    if (!user) return;
    
    if (!manualFields.patientName.trim()) {
      toast({
        title: "Error",
        description: "Patient name is required",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Generate patient ID
      const patientId = OCRService.generatePatientId(manualFields.patientName);

      // Save to database
      const { error } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          patient_name: manualFields.patientName,
          age: manualFields.age ? parseInt(manualFields.age) : null,
          gender: manualFields.gender || null,
          date_recorded: manualFields.date || new Date().toISOString().split('T')[0],
          diagnosis: manualFields.diagnosis || null,
          prescription: manualFields.prescription || null,
          raw_text: 'Manual entry',
          image_url: null,
          doctor_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medical record saved successfully",
      });
      
      onBack();
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save medical record",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (mode === 'camera') {
    return (
      <CameraCapture 
        onCapture={handleCameraCapture}
        onBack={() => setMode('select')}
        onUploadMode={() => setMode('upload')}
      />
    );
  }

  if (mode === 'manual') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setMode('select')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Manual Entry</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-patientName">Patient Name *</Label>
              <Input
                id="manual-patientName"
                value={manualFields.patientName}
                onChange={(e) => setManualFields({...manualFields, patientName: e.target.value})}
                placeholder="Enter patient name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-age">Age</Label>
                <Input
                  id="manual-age"
                  value={manualFields.age}
                  onChange={(e) => setManualFields({...manualFields, age: e.target.value})}
                  placeholder="Age"
                  type="number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manual-gender">Gender</Label>
                <Select
                  value={manualFields.gender}
                  onValueChange={(value) => setManualFields({...manualFields, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-date">Date</Label>
              <Input
                id="manual-date"
                type="date"
                value={manualFields.date}
                onChange={(e) => setManualFields({...manualFields, date: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-diagnosis">Diagnosis</Label>
              <Textarea
                id="manual-diagnosis"
                value={manualFields.diagnosis}
                onChange={(e) => setManualFields({...manualFields, diagnosis: e.target.value})}
                placeholder="Enter diagnosis"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-prescription">Prescription</Label>
              <Textarea
                id="manual-prescription"
                value={manualFields.prescription}
                onChange={(e) => setManualFields({...manualFields, prescription: e.target.value})}
                placeholder="Enter prescription"
                rows={3}
              />
            </div>

            <Button onClick={handleManualSave} className="w-full" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Record
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'upload') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Medical Record
            </div>
            <Button variant="outline" size="sm" onClick={() => setMode('select')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            accept="image/*"
            className="hidden"
          />
          
          {preview && (
            <div className="w-full">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-64 object-contain mx-auto rounded-lg border"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={triggerFileInput}
              disabled={isProcessing}
              className="w-full h-16 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Processing Image...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-6 w-6" />
                  Select Image File
                </>
              )}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Upload a photo of a handwritten or printed medical record. 
            The system will automatically extract patient information using AI.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Medical Record
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <Button
            onClick={() => setMode('camera')}
            className="w-full h-16 text-lg"
          >
            <Camera className="mr-2 h-6 w-6" />
            Use Camera
          </Button>
          
          <Button
            onClick={() => setMode('upload')}
            variant="outline"
            className="w-full h-16 text-lg"
          >
            <Upload className="mr-2 h-6 w-6" />
            Upload from Files
          </Button>

          <Button
            onClick={() => setMode('manual')}
            variant="secondary"
            className="w-full h-16 text-lg"
          >
            <Edit className="mr-2 h-6 w-6" />
            Manual Entry
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground text-center space-y-1">
          <p className="font-medium">Choose how to create your medical record:</p>
          <p>• <strong>Camera:</strong> Take a live photo with your device camera</p>
          <p>• <strong>Upload:</strong> Select an existing image file</p>
          <p>• <strong>Manual Entry:</strong> Type patient information directly</p>
        </div>
        
        <div className="flex justify-center mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};