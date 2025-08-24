import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Heart, 
  Activity,
  AlertTriangle,
  PieChart,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  totalPatients: number;
  recordsThisMonth: number;
  commonDiagnoses: { diagnosis: string; count: number }[];
  ageDistribution: { range: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  recentTrends: { date: string; count: number }[];
}

export const MedicalAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      // Fetch all records for the doctor
      const { data: records, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('doctor_id', user.id);

      if (error) throw error;

      // Process analytics data
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const recordsThisMonth = records?.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      }).length || 0;

      // Count unique patients
      const uniquePatients = new Set(records?.map(r => r.patient_id)).size;

      // Common diagnoses
      const diagnosisCount: { [key: string]: number } = {};
      records?.forEach(record => {
        if (record.diagnosis) {
          const diagnosis = record.diagnosis.toLowerCase().trim();
          diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
        }
      });

      const commonDiagnoses = Object.entries(diagnosisCount)
        .map(([diagnosis, count]) => ({ diagnosis, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Age distribution
      const ageRanges = {
        '0-18': 0,
        '19-35': 0,
        '36-50': 0,
        '51-65': 0,
        '65+': 0
      };

      records?.forEach(record => {
        if (record.age) {
          const age = parseInt(record.age.toString());
          if (age <= 18) ageRanges['0-18']++;
          else if (age <= 35) ageRanges['19-35']++;
          else if (age <= 50) ageRanges['36-50']++;
          else if (age <= 65) ageRanges['51-65']++;
          else ageRanges['65+']++;
        }
      });

      const ageDistribution = Object.entries(ageRanges)
        .map(([range, count]) => ({ range, count }));

      // Gender distribution
      const genderCount: { [key: string]: number } = {};
      records?.forEach(record => {
        if (record.gender) {
          genderCount[record.gender] = (genderCount[record.gender] || 0) + 1;
        }
      });

      const genderDistribution = Object.entries(genderCount)
        .map(([gender, count]) => ({ gender, count }));

      setAnalytics({
        totalPatients: uniquePatients,
        recordsThisMonth,
        commonDiagnoses,
        ageDistribution,
        genderDistribution,
        recentTrends: []
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <p className="text-3xl font-bold">{analytics.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Records This Month</p>
                <p className="text-3xl font-bold">{analytics.recordsThisMonth}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Diagnoses</p>
                <p className="text-3xl font-bold">{analytics.commonDiagnoses.length}</p>
              </div>
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Age</p>
                <p className="text-3xl font-bold">
                  {analytics.ageDistribution.reduce((acc, curr) => {
                    const midAge = curr.range === '65+' ? 70 : 
                                  curr.range === '51-65' ? 58 :
                                  curr.range === '36-50' ? 43 :
                                  curr.range === '19-35' ? 27 : 12;
                    return acc + (midAge * curr.count);
                  }, 0) / analytics.totalPatients || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Common Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.commonDiagnoses.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{item.diagnosis}</p>
                    <Progress value={(item.count / analytics.totalPatients) * 100} className="mt-1" />
                  </div>
                  <Badge variant="secondary" className="ml-3">
                    {item.count}
                  </Badge>
                </div>
              ))}
              {analytics.commonDiagnoses.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No diagnoses recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.ageDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.range} years</p>
                    <Progress value={(item.count / analytics.totalPatients) * 100} className="mt-1" />
                  </div>
                  <Badge variant="outline" className="ml-3">
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.genderDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.gender}</p>
                    <Progress value={(item.count / analytics.totalPatients) * 100} className="mt-1" />
                  </div>
                  <Badge variant="outline" className="ml-3">
                    {item.count}
                  </Badge>
                </div>
              ))}
              {analytics.genderDistribution.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No gender data recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Most Common Age Group</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.ageDistribution.sort((a, b) => b.count - a.count)[0]?.range || 'No data'} years
                </p>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Top Diagnosis</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {analytics.commonDiagnoses[0]?.diagnosis || 'No diagnoses yet'}
                </p>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Monthly Activity</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.recordsThisMonth} records added this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};