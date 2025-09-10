import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiService } from '@/services/apiService';

interface MedicalRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  age: number | null;
  gender: string | null;
  date_recorded: string;
  diagnosis: string | null;
  prescription: string | null;
  raw_text: string | null;
  image_url: string | null;
  created_at: string;
}

interface EditableRecordDialogProps {
  record: MedicalRecord | null;
  onClose: () => void;
  onUpdate: (updatedRecord: MedicalRecord) => void;
}

export const EditableRecordDialog = ({ record, onClose, onUpdate }: EditableRecordDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(
    record ? {
      patient_name: record.patient_name,
      age: record.age?.toString() || '',
      gender: record.gender || '',
      date_recorded: record.date_recorded,
      diagnosis: record.diagnosis || '',
      prescription: record.prescription || ''
    } : {
      patient_name: '',
      age: '',
      gender: '',
      date_recorded: '',
      diagnosis: '',
      prescription: ''
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!record) return null;

  const handleSave = async () => {
    if (!formData.patient_name.trim()) {
      toast({
        title: "Error",
        description: "Patient name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const updatedRecord = await apiService.updateMedicalRecord(record.id, {
        patientName: formData.patient_name,
        age: formData.age || '',
        gender: formData.gender || '',
        date: formData.date_recorded || new Date().toISOString().split('T')[0],
        diagnosis: formData.diagnosis || '',
        prescription: formData.prescription || '',
      });

      // Convert back to dashboard format
      const formattedRecord = {
        ...record,
        patient_name: updatedRecord.patientName,
        age: updatedRecord.age ? parseInt(updatedRecord.age) : null,
        gender: updatedRecord.gender,
        date_recorded: updatedRecord.date,
        diagnosis: updatedRecord.diagnosis,
        prescription: updatedRecord.prescription,
      };
      
      onUpdate(formattedRecord);
      
      toast({
        title: "Success",
        description: "Medical record updated successfully",
      });
      
      onClose();
      
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update medical record",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!record} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Medical Record</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-patient-name">Patient Name *</Label>
            <Input
              id="edit-patient-name"
              value={formData.patient_name}
              onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
              placeholder="Enter patient name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-age">Age</Label>
              <Input
                id="edit-age"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="Age"
                type="number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({...formData, gender: value})}
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
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date_recorded}
              onChange={(e) => setFormData({...formData, date_recorded: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-diagnosis">Diagnosis</Label>
            <Textarea
              id="edit-diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              placeholder="Enter diagnosis"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-prescription">Prescription</Label>
            <Textarea
              id="edit-prescription"
              value={formData.prescription}
              onChange={(e) => setFormData({...formData, prescription: e.target.value})}
              placeholder="Enter prescription"
              rows={3}
            />
          </div>

          {record.image_url && (
            <div className="space-y-2">
              <Label>Original Image</Label>
              <img
                src={record.image_url}
                alt="Medical Record"
                className="max-w-full h-48 object-contain rounded border"
              />
            </div>
          )}
          
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};