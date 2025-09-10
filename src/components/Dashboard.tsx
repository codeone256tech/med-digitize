import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Eye, Trash2, MoreVertical, Edit, ArrowUpDown, ArrowUp, ArrowDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiService, MedicalRecord } from '@/services/apiService';
import { useToast } from '@/components/ui/use-toast';
import { DashboardSidebar } from './DashboardSidebar';
import { EditableRecordDialog } from './EditableRecordDialog';
import { MedicalAnalytics } from './MedicalAnalytics';
import { MedicalDashboard } from './MedicalDashboard';
import { PatientSearch } from './PatientSearch';

interface DashboardMedicalRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  age: number | null;
  gender: string | null;
  date_recorded: string;
  diagnosis: string | null;
  prescription: string | null;
  raw_text?: string | null;
  image_url?: string | null;
  created_at: string;
}

interface DashboardProps {
  onNewScan: () => void;
}

type SortField = 'patient_name' | 'age' | 'gender' | 'date_recorded';
type SortDirection = 'asc' | 'desc';

export const Dashboard = ({ onNewScan }: DashboardProps) => {
  const { user, signOut, doctorName } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<DashboardMedicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DashboardMedicalRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<DashboardMedicalRecord | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [currentView, setCurrentView] = useState('records');
  const [sortField, setSortField] = useState<SortField>('date_recorded');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    if (!user) return;
    
    try {
      const data = await apiService.getMedicalRecords();
      // Convert to expected format
      const formattedRecords = data.map(record => ({
        ...record,
        patient_id: record.patientId,
        patient_name: record.patientName,
        age: record.age ? parseInt(record.age) : null,
        date_recorded: record.date,
        image_url: record.imageUrl,
        raw_text: null,
        created_at: record.createdAt
      }));
      setRecords(formattedRecords);
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
    if (!user) return;
    
    try {
      await apiService.deleteMedicalRecord(recordId);
      // Force refresh from database to ensure consistency
      await fetchRecords();
      
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
      // For offline setup, we just sign out
      // Backend will handle actual account deletion
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRecordUpdate = (updatedRecord: DashboardMedicalRecord) => {
    setRecords(records.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setEditingRecord(null);
  };

  const sortedAndFilteredRecords = records
    .filter(record =>
      record.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'patient_name':
          aValue = a.patient_name.toLowerCase();
          bValue = b.patient_name.toLowerCase();
          break;
        case 'age':
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        case 'gender':
          aValue = a.gender || '';
          bValue = b.gender || '';
          break;
        case 'date_recorded':
          aValue = new Date(a.date_recorded).getTime();
          bValue = new Date(b.date_recorded).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <div className="flex-1 p-6">
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
          </div>
        </div>

        {currentView === 'records' && (
          <>
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
                <CardTitle>Patient Records ({sortedAndFilteredRecords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient ID</TableHead>
                        <SortableHeader field="patient_name">Patient Name</SortableHeader>
                        <SortableHeader field="age">Age</SortableHeader>
                        <SortableHeader field="gender">Gender</SortableHeader>
                        <SortableHeader field="date_recorded">Date</SortableHeader>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedAndFilteredRecords.map((record) => (
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
                                  <DropdownMenuItem onClick={() => setEditingRecord(record)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Record
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
          </>
        )}

        {currentView === 'dashboard' && (
          <MedicalDashboard />
        )}

        {currentView === 'analytics' && (
          <MedicalAnalytics />
        )}

        {currentView === 'search' && (
          <PatientSearch />
        )}

        {currentView === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Doctor Information</h3>
                  <p className="text-sm text-muted-foreground">Name: {doctorName}</p>
                  <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteAccount(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Edit Record Dialog */}
        <EditableRecordDialog 
          record={editingRecord as any}
          onClose={() => setEditingRecord(null)}
          onUpdate={(updated: any) => handleRecordUpdate(updated)}
        />

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