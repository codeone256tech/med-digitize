import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  Activity, 
  Pill, 
  Search, 
  Bell, 
  TrendingUp,
  Heart,
  Stethoscope,
  FileText,
  MessageSquare,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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

  // Calculate dashboard stats
  const today = new Date().toISOString().split('T')[0];
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const todayRecords = records.filter(r => r.date_recorded === today);
  const weekRecords = records.filter(r => r.date_recorded >= thisWeek);
  const recentPatients = records.slice(0, 5);
  
  // Mock data for appointments (in real app, this would come from appointments table)
  const todayAppointments = [
    { id: '1', patient: 'Sarah Johnson', time: '09:00', status: 'checked-in' },
    { id: '2', patient: 'Michael Brown', time: '10:30', status: 'pending' },
    { id: '3', patient: 'Emma Davis', time: '14:00', status: 'pending' },
    { id: '4', patient: 'James Wilson', time: '15:30', status: 'pending' },
  ];

  const notifications = [
    { id: '1', type: 'critical', message: 'Patient X has abnormal lab results', time: '2 hours ago' },
    { id: '2', type: 'reminder', message: 'Prescription renewal due for Patient Y', time: '4 hours ago' },
    { id: '3', type: 'appointment', message: 'New appointment scheduled for tomorrow', time: '1 day ago' },
  ];

  const highRiskPatients = records
    .filter(r => r.diagnosis?.toLowerCase().includes('diabetes') || 
                 r.diagnosis?.toLowerCase().includes('hypertension') ||
                 r.diagnosis?.toLowerCase().includes('cardiac'))
    .slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'reminder': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'appointment': return <Calendar className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

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
          <h1 className="text-3xl font-bold">Good morning, Dr. {doctorName}</h1>
          <p className="text-muted-foreground">Here's what's happening with your patients today</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
          <p className="text-lg font-semibold">{todayAppointments.length} appointments today</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Patients</p>
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
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{weekRecords.length}</p>
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
        {/* Today's Appointments */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{appointment.patient}</p>
                    <p className="text-sm text-muted-foreground">{appointment.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(appointment.status)}`}></div>
                    <span className="text-xs capitalize">{appointment.status}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Schedule New
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{patient.patient_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.age ? `${patient.age}y` : ''} {patient.gender ? ` • ${patient.gender}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(patient.date_recorded).toLocaleDateString()}
                    </p>
                    {patient.diagnosis && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {patient.diagnosis.slice(0, 20)}...
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Search & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Patient Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Patient Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or condition..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {searchTerm && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {records
                    .filter(r => 
                      r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (r.diagnosis && r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .slice(0, 5)
                    .map((patient) => (
                      <div key={patient.id} className="p-2 border rounded cursor-pointer hover:bg-muted">
                        <p className="font-medium">{patient.patient_name}</p>
                        <p className="text-sm text-muted-foreground">{patient.patient_id}</p>
                      </div>
                    ))
                  }
                </div>
              )}
              
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">AI Suggestions:</p>
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Patients with abnormal vitals this week
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Heart className="h-4 w-4 mr-2" />
                    High-risk cardiovascular patients
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Health Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trends" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="risks">High Risk</TabsTrigger>
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trends" className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Blood Pressure Trends</span>
                  </div>
                  <p className="text-sm text-muted-foreground">15% improvement in hypertensive patients this month</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Diabetes Management</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Average HbA1c levels decreasing by 0.3%</p>
                </div>
              </TabsContent>
              
              <TabsContent value="risks" className="space-y-3">
                {highRiskPatients.map((patient) => (
                  <div key={patient.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{patient.patient_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{patient.diagnosis}</p>
                    <Badge variant="destructive" className="mt-1">High Risk</Badge>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="predictions" className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Follow-up Predictions</span>
                  </div>
                  <p className="text-sm text-muted-foreground">3 patients likely need follow-up within 7 days</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Medication Adherence</span>
                  </div>
                  <p className="text-sm text-muted-foreground">2 patients may have medication compliance issues</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lab Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Recent Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">Complete Blood Count</span>
                  <Badge variant="destructive">Abnormal</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Patient: Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">Lipid Panel</span>
                  <Badge variant="outline">Normal</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Patient: Michael Brown</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">HbA1c Test</span>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Patient: Emma Davis</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages & Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages & Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Recent Messages</h4>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Nurse Station</p>
                  <p className="text-sm text-muted-foreground">Patient in Room 302 requesting pain medication</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Lab Department</p>
                  <p className="text-sm text-muted-foreground">Urgent lab results available for review</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Pill className="h-4 w-4 mr-2" />
                    Prescriptions
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Lab Orders
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};