import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/hooks/useAuth';
import { localOCRService, ExtractedFields } from '@/services/localOCRService';

interface RecordFormProps {
  extractedText: string;
  imageUrl: string;
  onSaved: () => void;
  onBack: () => void;
}

export const RecordForm = ({ extractedText, imageUrl, onSaved, onBack }: RecordFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [fields, setFields] = useState<ExtractedFields>(() => {
    // Try to parse as enhanced JSON first
    try {
      const parsed = JSON.parse(extractedText);
      if (parsed.patientName !== undefined) {
        return parsed;
      }
    } catch (e) {
      // Fall back to basic extraction
    }
    return localOCRService.extractFields(extractedText);
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    if (!fields.patientName.trim()) {
      toast({
        title: "Error",
        description: "Patient name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Generate patient ID
      const patientId = localOCRService.generatePatientId(fields.patientName);
      
      // Upload image if available
      let imageStorageUrl = '';
      if (imageUrl && imageUrl.startsWith('blob:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${patientId}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const uploadResult = await apiService.uploadFile(file);
        imageStorageUrl = uploadResult.url;
      }

      // Save to database
      const newRecord = await apiService.createMedicalRecord({
        patientId,
        patientName: fields.patientName,
        age: fields.age || '',
        gender: fields.gender || '',
        date: fields.date ? new Date(fields.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        diagnosis: fields.diagnosis || '',
        prescription: fields.prescription || '',
        imageUrl: imageStorageUrl || '',
        doctorId: user.id
      });

      toast({
        title: "Success",
        description: "Medical record saved successfully",
      });
      
      onSaved();
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save medical record",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Review & Edit Medical Record</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Extracted Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={fields.patientName}
                onChange={(e) => setFields({...fields, patientName: e.target.value})}
                placeholder="Enter patient name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  value={fields.age}
                  onChange={(e) => setFields({...fields, age: e.target.value})}
                  placeholder="Age"
                  type="number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={fields.gender}
                  onValueChange={(value) => setFields({...fields, gender: value})}
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={fields.date}
                onChange={(e) => setFields({...fields, date: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={fields.diagnosis}
                onChange={(e) => setFields({...fields, diagnosis: e.target.value})}
                placeholder="Enter diagnosis"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prescription">Prescription</Label>
              <Textarea
                id="prescription"
                value={fields.prescription}
                onChange={(e) => setFields({...fields, prescription: e.target.value})}
                placeholder="Enter prescription"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Original Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageUrl && (
              <div className="w-full">
                <img
                  src={imageUrl}
                  alt="Medical Record"
                  className="max-w-full h-48 object-contain mx-auto rounded-lg border"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
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
      </div>
    </div>
  );
};