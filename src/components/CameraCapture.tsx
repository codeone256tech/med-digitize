import { useRef, useState, useCallback } from 'react';
import { Camera as CameraPro } from 'react-camera-pro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Circle, RotateCcw, Upload, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onBack: () => void;
  onUploadMode: () => void;
}

export const CameraCapture = ({ onCapture, onBack, onUploadMode }: CameraCaptureProps) => {
  const camera = useRef<any>(null);
  const [numberOfCameras, setNumberOfCameras] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTakePhoto = useCallback(() => {
    if (camera.current) {
      const photo = camera.current.takePhoto();
      setCapturedImage(photo);
    }
  }, []);

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleSwitchCamera = () => {
    if (camera.current && numberOfCameras > 1) {
      camera.current.switchCamera();
    }
  };

  if (capturedImage) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Review Captured Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-auto rounded-lg border max-h-96 object-contain"
            />
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleRetake}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button onClick={handleUsePhoto}>
              Use This Photo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Medical Record
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
          <CameraPro
            ref={camera}
            aspectRatio={4/3}
            numberOfCamerasCallback={setNumberOfCameras}
            errorMessages={{
              noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
              permissionDenied: 'Permission denied. Please allow camera access to take photos.',
              switchCamera: 'Camera switch is not supported.',
              canvas: 'Canvas is not supported.',
            }}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button 
            onClick={handleTakePhoto}
            className="sm:col-span-2"
          >
            <Circle className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
          
          {numberOfCameras > 1 && (
            <Button variant="outline" onClick={handleSwitchCamera}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Switch
            </Button>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Or alternatively, upload an image file
          </p>
          <Button variant="outline" onClick={onUploadMode}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Image Instead
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>• Position the medical record clearly in the camera view</p>
          <p>• Ensure good lighting and avoid shadows</p>
          <p>• Keep the document flat and avoid glare</p>
        </div>
        
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Options
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};