import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/hooks/useAuth';
import { Search, Filter, CalendarIcon, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  age: string;
  gender: string;
  date: string;
  diagnosis: string;
  prescription: string;
  createdAt: string;
}

export const PatientSearch = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [records, searchTerm, diagnosisFilter, genderFilter, ageRange, dateRange]);

  const fetchRecords = async () => {
    if (!user) return;
    
    try {
      const data = await apiService.getMedicalRecords();
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.prescription && record.prescription.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Diagnosis filter
    if (diagnosisFilter) {
      filtered = filtered.filter(record =>
        record.diagnosis && record.diagnosis.toLowerCase().includes(diagnosisFilter.toLowerCase())
      );
    }

    // Gender filter
    if (genderFilter) {
      filtered = filtered.filter(record => record.gender === genderFilter);
    }

    // Age range filter
    if (ageRange) {
      filtered = filtered.filter(record => {
        if (!record.age) return false;
        const age = parseInt(record.age);
        switch (ageRange) {
          case '0-18': return age <= 18;
          case '19-35': return age >= 19 && age <= 35;
          case '36-50': return age >= 36 && age <= 50;
          case '51-65': return age >= 51 && age <= 65;
          case '65+': return age > 65;
          default: return true;
        }
      });
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        if (dateRange.from && recordDate < dateRange.from) return false;
        if (dateRange.to && recordDate > dateRange.to) return false;
        return true;
      });
    }

    setFilteredRecords(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDiagnosisFilter('');
    setGenderFilter('');
    setAgeRange('');
    setDateRange({});
  };

  const exportResults = () => {
    const csvContent = [
      ['Patient ID', 'Patient Name', 'Age', 'Gender', 'Date', 'Diagnosis', 'Prescription'],
      ...filteredRecords.map(record => [
        record.patientId,
        record.patientName,
        record.age || '',
        record.gender || '',
        format(new Date(record.date), 'yyyy-MM-dd'),
        record.diagnosis || '',
        record.prescription || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient_records_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const uniqueDiagnoses = Array.from(new Set(
    records.filter(r => r.diagnosis).map(r => r.diagnosis!)
  )).slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Patient Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search patients, IDs, diagnoses, prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
            <Button onClick={exportResults} disabled={filteredRecords.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by diagnosis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Diagnoses</SelectItem>
                {uniqueDiagnoses.map(diagnosis => (
                  <SelectItem key={diagnosis} value={diagnosis}>
                    {diagnosis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ageRange} onValueChange={setAgeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Ages</SelectItem>
                <SelectItem value="0-18">0-18 years</SelectItem>
                <SelectItem value="19-35">19-35 years</SelectItem>
                <SelectItem value="36-50">36-50 years</SelectItem>
                <SelectItem value="51-65">51-65 years</SelectItem>
                <SelectItem value="65+">65+ years</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, 'MM/dd')} - ${format(dateRange.to, 'MM/dd')}`
                    ) : (
                      format(dateRange.from, 'MM/dd/yyyy')
                    )
                  ) : (
                    'Date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange.from || dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                  onSelect={(range) => setDateRange(range || {})}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRecords.length} of {records.length} records
            </p>
            <Badge variant="outline">
              <Filter className="mr-1 h-3 w-3" />
              {Object.values({searchTerm, diagnosisFilter, genderFilter, ageRange}).filter(Boolean).length + 
               (dateRange.from || dateRange.to ? 1 : 0)} filters active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
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
                      No records found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">{record.patientId}</TableCell>
                      <TableCell className="font-medium">{record.patientName}</TableCell>
                      <TableCell>{record.age || '-'}</TableCell>
                      <TableCell>
                        {record.gender ? (
                          <Badge variant="outline">{record.gender}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.date), 'MM/dd/yyyy')}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {record.diagnosis || '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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