import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { OCRService } from '@/utils/ocrService';
import { CameraCapture } from './CameraCapture';

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

      onExtracted(extractedText, imageUrl);
      
      toast({
        title: "Success",
        description: "Text extracted successfully from image",
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

  const handleManualInput = () => {
    // For manual input, we pass empty text and no image
    onExtracted('', '');
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Manual Record Entry
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Enter patient information manually without scanning any document.
            </p>
            
            <Button
              onClick={handleManualInput}
              className="w-full h-16 text-lg"
            >
              <Upload className="mr-2 h-6 w-6" />
              Start Manual Entry
            </Button>
          </div>
          
          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" onClick={() => setMode('select')}>
              Back to Options
            </Button>
          </div>
        </CardContent>
      </Card>
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
            The system will automatically extract patient information.
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
            <Upload className="mr-2 h-6 w-6" />
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