'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { FirebaseClientProvider } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, Phone, MapPin, Search, Calendar, ShieldCheck, Clock, UserCheck, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FitnessRequest {
  id: string;
  clientName: string;
  phone: string;
  address: string;
  goal: string;
  sessionType: string;
  timing: string;
  status: 'Pending' | 'Assigned' | 'Active';
  assignedTrainer?: string;
  createdAt: string;
}

const MOCK_FITNESS_REQUESTS: FitnessRequest[] = [
  {
    id: 'ft-101',
    clientName: 'Siddharth Varma',
    phone: '+91 96543 21098',
    address: 'Flat 1403, SMR Vinay Iconia, Kondapur, Hyderabad - 500084',
    goal: 'Personal Strength & Calisthenics Training',
    sessionType: '1-on-1 Home Gym Training',
    timing: '6:30 AM - 7:30 AM (Mon, Wed, Fri)',
    status: 'Pending',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ft-102',
    clientName: 'Neha & Akash Mehta',
    phone: '+91 97112 33445',
    address: 'Villa 7, Boulder Hills, Gachibowli - 500032',
    goal: 'Badminton & Tennis Sports Coaching',
    sessionType: 'Society Court Coaching',
    timing: '5:00 PM - 6:30 PM (Sat & Sun)',
    status: 'Assigned',
    assignedTrainer: 'Coach Rajesh Kumar (Certified NIS Coach)',
    createdAt: new Date().toISOString()
  }
];

function FitnessRequestsContent() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<FitnessRequest[]>(MOCK_FITNESS_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = requests.filter(r => 
    r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm) ||
    r.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Assigned', assignedTrainer: 'Coach Vikram Singh (Certified Fitness & Sports Coach)' } : r));
    toast({ title: 'Coach Assigned', description: 'Assigned certified sports & fitness coach to client request.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-stone-950 text-white rounded-[2.5rem] p-8 shadow-xl border border-stone-800 gap-4">
        <div>
           <Badge className="bg-blue-500 text-white font-black text-xs uppercase mb-2">Sports & Fitness Services</Badge>
           <h1 className="text-3xl md:text-4xl font-black flex items-center gap-2 tracking-tight">
             Sports & Fitness Coach Requests <Dumbbell className="w-7 h-7 text-cyan-400" />
           </h1>
           <p className="text-stone-400 mt-1 font-medium text-xs sm:text-sm">
             Manage personal training, yoga, badminton, and sports coach requests for residential societies.
           </p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <Input 
            placeholder="Search client name, phone, or society..." 
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
                  <Badge className="bg-cyan-500 text-stone-950 font-black text-[9px] uppercase mb-1">Fitness Booking</Badge>
                  <CardTitle className="text-lg font-black text-white">{req.clientName}</CardTitle>
                  <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-cyan-400" /> {req.phone}</p>
                </div>
                <Badge className={req.status === 'Assigned' ? 'bg-emerald-500 text-white font-black' : 'bg-cyan-500 text-stone-950 font-black'}>
                  {req.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                <span className="font-extrabold text-stone-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-cyan-500" /> {req.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Session Type</span>
                  <span className="font-extrabold text-stone-900">{req.sessionType}</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Timing</span>
                  <span className="font-extrabold text-stone-900">{req.timing}</span>
                </div>
              </div>

              <div className="p-2.5 bg-cyan-50 border border-cyan-100 rounded-xl text-xs">
                <span className="text-[10px] text-cyan-900 font-bold uppercase block">Fitness / Sports Goal</span>
                <span className="font-extrabold text-cyan-950">{req.goal}</span>
              </div>

              {req.assignedTrainer && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Assigned Coach:</span>
                  <span className="font-black text-emerald-800">{req.assignedTrainer}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-stone-50 p-4 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs font-bold text-stone-500">Certified Sports Coach</span>
              {req.status === 'Pending' && (
                <Button onClick={() => handleAssign(req.id)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-xs h-9 px-4">
                  Assign Coach
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function FitnessRequestsPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Sports & Fitness Coach Requests">
          <FitnessRequestsContent />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
