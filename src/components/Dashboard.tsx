import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Eye, User, LogOut, Settings, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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

interface DashboardProps {
  onNewScan: () => void;
}

export const Dashboard = ({ onNewScan }: DashboardProps) => {
  const { user, signOut, doctorName } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch medical records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      setRecords(records.filter(r => r.id !== recordId));
      toast({
        title: "Success",
        description: "Record deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user's records first
      const { error: recordsError } = await supabase
        .from('medical_records')
        .delete()
        .eq('doctor_id', user?.id);

      if (recordsError) throw recordsError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Sign out (the auth trigger will handle cleanup)
      await signOut();

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted"
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive"
      });
    }
  };

  const filteredRecords = records.filter(record =>
    record.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">MediScan AI Dashboard</h1>
            <p className="text-muted-foreground">
              Hey, {doctorName || 'Doctor'}! Welcome back.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={onNewScan}>
              <Plus className="mr-2 h-4 w-4" />
              New Scan
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowDeleteAccount(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, ID, or diagnosis..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Records ({filteredRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono">
                          {record.patient_id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.patient_name}
                        </TableCell>
                        <TableCell>{record.age || '-'}</TableCell>
                        <TableCell>
                          {record.gender ? (
                            <Badge variant="outline">{record.gender}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(record.date_recorded).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {record.diagnosis || '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setSelectedRecord(record)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
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

        {/* Record Details Dialog */}
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Medical Record Details</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Patient Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>ID:</strong> {selectedRecord.patient_id}</p>
                      <p><strong>Name:</strong> {selectedRecord.patient_name}</p>
                      <p><strong>Age:</strong> {selectedRecord.age || 'Not specified'}</p>
                      <p><strong>Gender:</strong> {selectedRecord.gender || 'Not specified'}</p>
                      <p><strong>Date:</strong> {new Date(selectedRecord.date_recorded).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    {selectedRecord.image_url && (
                      <img
                        src={selectedRecord.image_url}
                        alt="Medical Record"
                        className="max-w-full h-48 object-contain rounded border"
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Diagnosis</h4>
                  <p className="text-sm bg-muted p-3 rounded">
                    {selectedRecord.diagnosis || 'No diagnosis recorded'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Prescription</h4>
                  <p className="text-sm bg-muted p-3 rounded">
                    {selectedRecord.prescription || 'No prescription recorded'}
                  </p>
                </div>
                
                {selectedRecord.raw_text && (
                  <div>
                    <h4 className="font-semibold mb-2">Raw Extracted Text</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
                      {selectedRecord.raw_text}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to delete your account? This will permanently remove:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your doctor profile</li>
                <li>All medical records you've created</li>
                <li>All associated data</li>
              </ul>
              <p className="font-semibold text-destructive">This action cannot be undone!</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteAccount(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};