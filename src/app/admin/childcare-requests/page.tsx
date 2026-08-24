'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Baby, Phone, MapPin, Search, Calendar, ShieldCheck, Clock, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChildCareRequest {
  id: string;
  parentName: string;
  phone: string;
  address: string;
  childAge: string;
  timing: string;
  daysPerWeek: string;
  status: 'Pending' | 'Assigned' | 'Active';
  preferredLanguage: string;
  assignedSpecialist?: string;
  createdAt: string;
}

const MOCK_CHILDCARE_REQUESTS: ChildCareRequest[] = [
  {
    id: 'cc-101',
    parentName: 'Sneha & Rahul Kulkarni',
    phone: '+91 98490 12345',
    address: 'Flat 501, My Home Bhooja, Knowledge City, Hitec City, Hyderabad - 500081',
    childAge: '14 Months',
    timing: '8:30 AM - 5:30 PM (Full Day)',
    daysPerWeek: '5 Days (Mon - Fri)',
    status: 'Pending',
    preferredLanguage: 'English / Hindi',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cc-102',
    parentName: 'Divya & Karthik Reddy',
    phone: '+91 99123 88776',
    address: 'Villa 42, Jayabheri Orange County, Nanakramguda - 500032',
    childAge: '3.5 Years',
    timing: '2:00 PM - 7:00 PM (Afternoon)',
    daysPerWeek: '6 Days',
    status: 'Assigned',
    assignedSpecialist: 'Saraswathi Devi (Verified Nanny)',
    preferredLanguage: 'Telugu / English',
    createdAt: new Date().toISOString()
  }
];

function ChildCareRequestsContent() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ChildCareRequest[]>(MOCK_CHILDCARE_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = requests.filter(r => 
    r.parentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm) ||
    r.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Assigned', assignedSpecialist: 'Meenakshi Reddy (Early Childhood Nanny)' } : r));
    toast({ title: 'Specialist Assigned', description: 'Assigned verified child care specialist to parent request.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-stone-950 text-white rounded-[2.5rem] p-8 shadow-xl border border-stone-800 gap-4">
        <div>
           <Badge className="bg-amber-500 text-stone-950 font-black text-xs uppercase mb-2">Child Care Services</Badge>
           <h1 className="text-3xl md:text-4xl font-black flex items-center gap-2 tracking-tight">
             Child Care Requests & Bookings <Baby className="w-7 h-7 text-amber-400" />
           </h1>
           <p className="text-stone-400 mt-1 font-medium text-xs sm:text-sm">
             Manage parent nanny & child care specialist requests across Hyderabad communities.
           </p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <Input 
            placeholder="Search parent name, phone, or society..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 bg-stone-50 border-stone-200 text-xs font-semibold rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(req => (
          <Card key={req.id} className="rounded-3xl border-stone-200 shadow-md bg-white overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-stone-950 text-white p-5">
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="bg-amber-400 text-stone-950 font-black text-[9px] uppercase mb-1">Child Care Request</Badge>
                  <CardTitle className="text-lg font-black text-white">{req.parentName}</CardTitle>
                  <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-amber-400" /> {req.phone}</p>
                </div>
                <Badge className={req.status === 'Assigned' ? 'bg-emerald-500 text-white font-black' : 'bg-amber-500 text-stone-950 font-black'}>
                  {req.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                <span className="font-extrabold text-stone-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> {req.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Child Age</span>
                  <span className="font-extrabold text-stone-900">{req.childAge}</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Timing</span>
                  <span className="font-extrabold text-stone-900">{req.timing}</span>
                </div>
              </div>

              {req.assignedSpecialist && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Assigned Nanny:</span>
                  <span className="font-black text-emerald-800">{req.assignedSpecialist}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-stone-50 p-4 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs font-bold text-stone-500">{req.daysPerWeek}</span>
              {req.status === 'Pending' && (
                <Button onClick={() => handleAssign(req.id)} className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-xs h-9 px-4">
                  Assign Specialist
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ChildCareRequestsPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Child Care Requests & Bookings">
          <ChildCareRequestsContent />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
