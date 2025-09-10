import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, User, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiService } from '@/services/apiService';

interface Doctor {
  id: string;
  user_id: string;
  doctor_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface EditDoctorProfileProps {
  doctor: Doctor;
  onBack: () => void;
  onSuccess: () => void;
}

export const EditDoctorProfile = ({ doctor, onBack, onSuccess }: EditDoctorProfileProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: doctor.doctor_name,
    email: doctor.email,
    role: doctor.role
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          doctor_name: formData.name,
          email: formData.email,
          role: formData.role
        })
        .eq('user_id', doctor.user_id);

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_action: 'UPDATE',
        p_resource_type: 'doctor_profile',
        p_resource_id: doctor.user_id,
        p_details: { 
          old: { name: doctor.doctor_name, email: doctor.email, role: doctor.role },
          new: formData
        }
      });

      toast({
        title: "Success",
        description: "Doctor profile updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating doctor profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update doctor profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Doctor Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Doctor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Dr. John Smith"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Doctor</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Profile...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};