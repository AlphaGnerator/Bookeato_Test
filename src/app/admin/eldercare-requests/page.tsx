'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Phone, MapPin, Search, Calendar, ShieldCheck, Clock, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ElderCareRequest {
  id: string;
  familyMemberName: string;
  phone: string;
  address: string;
  elderAge: string;
  careType: string;
  timing: string;
  status: 'Pending' | 'Assigned' | 'Active';
  assignedAide?: string;
  createdAt: string;
}

const MOCK_ELDERCARE_REQUESTS: ElderCareRequest[] = [
  {
    id: 'ec-101',
    familyMemberName: 'Dr. Srinivas Rao (for Parent)',
    phone: '+91 97012 34567',
    address: 'Flat 804, Lansum Etania, Gachibowli, Hyderabad - 500032',
    elderAge: '78 Years (Mobility Support)',
    careType: 'Companionship, Medication & Walking Support',
    timing: '9:00 AM - 6:00 PM (Day Care)',
    status: 'Pending',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ec-102',
    familyMemberName: 'Sunita & Ramesh Verma',
    phone: '+91 98850 99887',
    address: 'Villa 12, Rainbow Vistas Rock Garden, Kukatpally - 500072',
    elderAge: '82 Years',
    careType: '24x7 Resident Elderly Nurse Support',
    timing: 'Full Time (24 Hours)',
    status: 'Assigned',
    assignedAide: 'Lakshmi Narayana (Certified Geriatric Caregiver)',
    createdAt: new Date().toISOString()
  }
];

function ElderCareRequestsContent() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ElderCareRequest[]>(MOCK_ELDERCARE_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = requests.filter(r => 
    r.familyMemberName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm) ||
    r.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Assigned', assignedAide: 'Saroja Devi (Verified Elder Care Assistant)' } : r));
    toast({ title: 'Aide Assigned', description: 'Assigned certified elder care assistant to family request.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-stone-950 text-white rounded-[2.5rem] p-8 shadow-xl border border-stone-800 gap-4">
        <div>
           <Badge className="bg-rose-500 text-white font-black text-xs uppercase mb-2">Elder Care Services</Badge>
           <h1 className="text-3xl md:text-4xl font-black flex items-center gap-2 tracking-tight">
             Elder Care Requests & Bookings <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
           </h1>
           <p className="text-stone-400 mt-1 font-medium text-xs sm:text-sm">
             Review senior citizen caregiving, medication support, and companion requests across Hyderabad.
           </p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <Input 
            placeholder="Search family name, phone, or society..." 
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
                  <Badge className="bg-rose-500 text-white font-black text-[9px] uppercase mb-1">Elder Care Request</Badge>
                  <CardTitle className="text-lg font-black text-white">{req.familyMemberName}</CardTitle>
                  <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-rose-400" /> {req.phone}</p>
                </div>
                <Badge className={req.status === 'Assigned' ? 'bg-emerald-500 text-white font-black' : 'bg-rose-500 text-white font-black'}>
                  {req.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                <span className="font-extrabold text-stone-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {req.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Senior Age</span>
                  <span className="font-extrabold text-stone-900">{req.elderAge}</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Timing</span>
                  <span className="font-extrabold text-stone-900">{req.timing}</span>
                </div>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs">
                <span className="text-[10px] text-rose-900 font-bold uppercase block">Required Care Type</span>
                <span className="font-extrabold text-rose-950">{req.careType}</span>
              </div>

              {req.assignedAide && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Assigned Aide:</span>
                  <span className="font-black text-emerald-800">{req.assignedAide}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-stone-50 p-4 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs font-bold text-stone-500">Verified Geriatric Aide</span>
              {req.status === 'Pending' && (
                <Button onClick={() => handleAssign(req.id)} className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs h-9 px-4">
                  Assign Caregiver
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ElderCareRequestsPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Elder Care Requests & Bookings">
          <ElderCareRequestsContent />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
