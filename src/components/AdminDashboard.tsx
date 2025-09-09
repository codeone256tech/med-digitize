import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, FileText, Activity, Settings, MoreVertical, Edit, Trash2, LogOut, UserPlus, Eye, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AddDoctorProfile } from './pages/AddDoctorProfile';
import { ViewDoctorProfiles } from './pages/ViewDoctorProfiles';
import { EditDoctorProfile } from './pages/EditDoctorProfile';
import { AuditLogs } from './pages/AuditLogs';
import medDigitizeLogo from '@/assets/meddigitize-logo.png';

interface DashboardStats {
  totalDoctors: number;
  totalRecords: number;
  totalPatients: number;
  recentActivity: number;
}

interface Doctor {
  id: string;
  user_id: string;
  doctor_name: string;
  email: string;
  role: string;
  created_at: string;
}

export const AdminDashboard = () => {
  const { user, signOut, doctorName, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    totalRecords: 0,
    totalPatients: 0,
    recentActivity: 0
  });
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchDashboardData();
    }
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      // Fetch doctors
      const { data: doctors } = await supabase
        .from('profiles')
        .select('*');

      // Fetch medical records
      const { data: records } = await supabase
        .from('medical_records')
        .select('*, profiles!inner(doctor_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      const uniquePatients = new Set(records?.map(r => r.patient_id)).size;

      setStats({
        totalDoctors: doctors?.length || 0,
        totalRecords: records?.length || 0,
        totalPatients: uniquePatients,
        recentActivity: records?.filter(r => {
          const recordDate = new Date(r.created_at);
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          return recordDate > dayAgo;
        }).length || 0
      });

      setRecentRecords(records || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have admin privileges to access this dashboard.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={medDigitizeLogo} alt="MedDigitize" className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, {doctorName}</p>
              </div>
            </div>
            <Button onClick={signOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'add-doctor' && (
          <AddDoctorProfile
            onBack={() => setCurrentView('dashboard')}
            onSuccess={() => {
              setCurrentView('view-doctors');
              fetchDashboardData();
            }}
          />
        )}
        
        {currentView === 'view-doctors' && (
          <ViewDoctorProfiles
            onBack={() => setCurrentView('dashboard')}
            onEdit={(doctor) => {
              setSelectedDoctor(doctor);
              setCurrentView('edit-doctor');
            }}
            onAdd={() => setCurrentView('add-doctor')}
          />
        )}
        
        {currentView === 'edit-doctor' && selectedDoctor && (
          <EditDoctorProfile
            doctor={selectedDoctor}
            onBack={() => setCurrentView('view-doctors')}
            onSuccess={() => {
              setCurrentView('view-doctors');
              setSelectedDoctor(null);
            }}
          />
        )}
        
        {currentView === 'audit-logs' && (
          <AuditLogs
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                  <p className="text-xs text-muted-foreground">Active system users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRecords}</div>
                  <p className="text-xs text-muted-foreground">Total digitized records</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPatients}</div>
                  <p className="text-xs text-muted-foreground">Unique patients</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recentActivity}</div>
                  <p className="text-xs text-muted-foreground">Records today</p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Functions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Admin Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    variant="outline"
                    className="h-24 flex-col"
                    onClick={() => setCurrentView('add-doctor')}
                  >
                    <UserPlus className="h-6 w-6 mb-2" />
                    <span>Add Doctor</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-24 flex-col"
                    onClick={() => setCurrentView('view-doctors')}
                  >
                    <Eye className="h-6 w-6 mb-2" />
                    <span>View All Doctors</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-24 flex-col"
                    onClick={() => setCurrentView('audit-logs')}
                  >
                    <Clock className="h-6 w-6 mb-2" />
                    <span>Audit Logs</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-24 flex-col"
                    onClick={() => console.log('Settings')}
                  >
                    <Settings className="h-6 w-6 mb-2" />
                    <span>Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Medical Records */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Medical Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Diagnosis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.patient_name}
                            </TableCell>
                            <TableCell className="font-mono">
                              {record.patient_id}
                            </TableCell>
                            <TableCell>
                              {record.profiles?.doctor_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {new Date(record.date_recorded).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="max-w-48 truncate">
                              {record.diagnosis || 'No diagnosis'}
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
      </div>
    </div>
  );
};