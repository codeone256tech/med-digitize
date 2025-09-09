import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Search, MoreVertical, Edit, Trash2, Users, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Doctor {
  id: string;
  user_id: string;
  doctor_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ViewDoctorProfilesProps {
  onBack: () => void;
  onEdit: (doctor: Doctor) => void;
  onAdd: () => void;
}

export const ViewDoctorProfiles = ({ onBack, onEdit, onAdd }: ViewDoctorProfilesProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doctor profiles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    if (!confirm(`Are you sure you want to delete ${doctor.doctor_name}'s profile?`)) return;

    try {
      // Delete from profiles (the user will be handled by Supabase)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', doctor.user_id);

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_action: 'DELETE',
        p_resource_type: 'doctor_profile',
        p_resource_id: doctor.user_id,
        p_details: { name: doctor.doctor_name, email: doctor.email }
      });

      await fetchDoctors();
      toast({
        title: "Success",
        description: "Doctor profile deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting doctor:', error);
      toast({
        title: "Error",
        description: "Failed to delete doctor profile",
        variant: "destructive"
      });
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Doctor Profiles</h1>
        </div>
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Doctors ({filteredDoctors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No doctors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="font-medium">
                        {doctor.doctor_name}
                      </TableCell>
                      <TableCell>{doctor.email}</TableCell>
                      <TableCell>
                        <Badge variant={doctor.role === 'admin' ? 'default' : 'secondary'}>
                          {doctor.role === 'admin' ? 'Administrator' : 'Doctor'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(doctor.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEdit(doctor)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Profile
                            </DropdownMenuItem>
                            {doctor.role !== 'admin' && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(doctor)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};