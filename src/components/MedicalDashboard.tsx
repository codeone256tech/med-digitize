import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Search, 
  Bell, 
  TrendingUp,
  Heart,
  Stethoscope,
  FileText,
  Plus,
  Calendar,
  Filter
} from 'lucide-react';
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
  created_at: string;
}

export const MedicalDashboard = () => {
  const { user, doctorName } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real dashboard stats
  const today = new Date().toISOString().split('T')[0];
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const todayRecords = records.filter(r => r.date_recorded === today);
  const weekRecords = records.filter(r => r.date_recorded >= thisWeek);
  const monthRecords = records.filter(r => r.date_recorded >= thisMonth);
  const recentPatients = records.slice(0, 8);
  
  const highRiskPatients = records
    .filter(r => r.diagnosis?.toLowerCase().includes('diabetes') || 
                 r.diagnosis?.toLowerCase().includes('hypertension') ||
                 r.diagnosis?.toLowerCase().includes('cardiac') ||
                 r.diagnosis?.toLowerCase().includes('heart'))
    .slice(0, 5);

  const criticalRecords = records.filter(r => 
    r.diagnosis?.toLowerCase().includes('critical') ||
    r.diagnosis?.toLowerCase().includes('urgent') ||
    r.diagnosis?.toLowerCase().includes('emergency')
  );

  const filteredRecords = records.filter(r => 
    r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.diagnosis && r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
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
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Medical Records Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. {doctorName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
          <p className="text-lg font-semibold">{records.length} total records</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Records</p>
                <p className="text-2xl font-bold">{todayRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{monthRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold">{highRiskPatients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Patient Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentPatients.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patient records yet</p>
                  <p className="text-sm">Start by scanning or creating your first record</p>
                </div>
              ) : (
                recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div>
                      <p className="font-medium">{patient.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {patient.patient_id}
                        {patient.age && ` • ${patient.age}y`}
                        {patient.gender && ` • ${patient.gender}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(patient.date_recorded).toLocaleDateString()}
                      </p>
                      {patient.diagnosis && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {patient.diagnosis.length > 25 ? 
                            `${patient.diagnosis.slice(0, 25)}...` : 
                            patient.diagnosis}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Search & Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {searchTerm && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filteredRecords.slice(0, 5).map((patient) => (
                    <div key={patient.id} className="p-2 border rounded cursor-pointer hover:bg-muted text-sm">
                      <p className="font-medium">{patient.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{patient.patient_id}</p>
                    </div>
                  ))}
                  {filteredRecords.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No records found</p>
                  )}
                </div>
              )}
              
              <div className="pt-2 border-t space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by condition
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Filter by date range
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Insights & High Risk Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              High Risk Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskPatients.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No high-risk patients identified</p>
                </div>
              ) : (
                highRiskPatients.map((patient) => (
                  <div key={patient.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{patient.patient_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{patient.diagnosis}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recorded: {new Date(patient.date_recorded).toLocaleDateString()}
                    </p>
                    <Badge variant="destructive" className="mt-2">High Risk</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Record Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Record Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Records This Week</span>
                  </div>
                  <p className="text-2xl font-bold">{weekRecords.length}</p>
                  <p className="text-sm text-muted-foreground">Patient records created</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Unique Patients</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {new Set(records.map(r => r.patient_id)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Individual patients</p>
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Most Common Conditions</span>
                  </div>
                  <div className="space-y-1">
                    {records
                      .filter(r => r.diagnosis)
                      .reduce((acc, record) => {
                        const diagnosis = record.diagnosis!.toLowerCase();
                        if (diagnosis.includes('diabetes')) acc.diabetes = (acc.diabetes || 0) + 1;
                        if (diagnosis.includes('hypertension')) acc.hypertension = (acc.hypertension || 0) + 1;
                        if (diagnosis.includes('fever')) acc.fever = (acc.fever || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                      && Object.entries(records
                        .filter(r => r.diagnosis)
                        .reduce((acc, record) => {
                          const diagnosis = record.diagnosis!.toLowerCase();
                          if (diagnosis.includes('diabetes')) acc.diabetes = (acc.diabetes || 0) + 1;
                          if (diagnosis.includes('hypertension')) acc.hypertension = (acc.hypertension || 0) + 1;
                          if (diagnosis.includes('fever')) acc.fever = (acc.fever || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>))
                        .slice(0, 3)
                        .map(([condition, count]) => (
                          <div key={condition} className="flex justify-between text-sm">
                            <span className="capitalize">{condition}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setSearchTerm('')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>View All Records</span>
              <span className="text-xs text-muted-foreground">{records.length} total</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => {
                const input = document.querySelector('input[placeholder="Search patients..."]') as HTMLInputElement;
                if (input) input.focus();
              }}
            >
              <Search className="h-6 w-6 mb-2" />
              <span>Advanced Search</span>
              <span className="text-xs text-muted-foreground">Filter records</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => {
                const csvContent = [
                  ['Patient Name', 'Patient ID', 'Age', 'Gender', 'Date Recorded', 'Diagnosis', 'Prescription'],
                  ...records.map(record => [
                    record.patient_name,
                    record.patient_id,
                    record.age?.toString() || '',
                    record.gender || '',
                    record.date_recorded,
                    record.diagnosis || '',
                    record.prescription || ''
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `medical_records_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                toast({
                  title: "Export Complete",
                  description: `Downloaded ${records.length} records as CSV`
                });
              }}
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Export Report</span>
              <span className="text-xs text-muted-foreground">Download CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};