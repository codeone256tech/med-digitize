import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { OCRService } from '@/utils/ocrService';

interface ScannerProps {
  onExtracted: (text: string, imageUrl: string) => void;
}

export const Scanner = ({ onExtracted }: ScannerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create preview
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);

      // Extract text using OCR
      const extractedText = await OCRService.extractText(file);
      
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
        description: "Failed to extract text from image. Please try with a clearer image.",
        variant: "destructive"
      });
      setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Scan Medical Record
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
            variant="outline"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Processing Image...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-6 w-6" />
                Upload Medical Record
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
};