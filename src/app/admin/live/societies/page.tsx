'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { FirebaseClientProvider, useFirestore } from '@/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { LiveSociety } from '@/types/bookeato-live';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, RefreshCw, Trash, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

function LiveSocietiesManager() {
  const [societies, setSocieties] = useState<LiveSociety[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSoc, setNewSoc] = useState({ name: '', locationDetails: '' });
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchSocieties = async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      const q = collection(firestore, 'liveSocieties');
      const querySnapshot = await getDocs(q);
      const fetched: LiveSociety[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as LiveSociety);
      });
      setSocieties(fetched);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to fetch societies', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, [firestore]);

  const toggleActive = async (soc: LiveSociety) => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'liveSocieties', soc.id);
      await updateDoc(docRef, { isActive: !soc.isActive });
      setSocieties(societies.map(s => s.id === soc.id ? { ...s, isActive: !s.isActive } : s));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
    }
  };

  const addSociety = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!firestore || !newSoc.name || !newSoc.locationDetails) return;
     try {
        const payload = {
           name: newSoc.name,
           locationDetails: newSoc.locationDetails,
           isActive: true
        };
        const res = await addDoc(collection(firestore, 'liveSocieties'), payload);
        setSocieties([...societies, { id: res.id, ...payload }]);
        setNewSoc({ name: '', locationDetails: '' });
        toast({ title: 'Added', description: 'Society is now active.' });
     } catch (e: any) {
        console.error("ADD_SOCIETY_ERROR:", e);
        toast({ title: 'Error', description: 'Could not add society: ' + e.message, variant: "destructive" });
     }
  };
  
  const deleteSociety = async (id: string) => {
     if (!firestore) return;
     if (!confirm("Are you sure?")) return;
     try {
        await deleteDoc(doc(firestore, 'liveSocieties', id));
        setSocieties(societies.filter(s => s.id !== id));
        toast({ title: 'Deleted', description: 'Society removed completely.' });
     } catch (e) {
        toast({ title: 'Error', variant: "destructive", description: 'Failed to delete.' });
     }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-stone-900 text-white rounded-[2rem] p-8 -mt-2 gap-4">
        <div>
           <h1 className="text-3xl font-black">Live Societies Array</h1>
           <p className="text-stone-400 mt-2 font-medium">Toggle which pop-up locations appear in the customer search dropdown.</p>
        </div>
        <Button onClick={fetchSocieties} variant="outline" className="rounded-xl font-bold border-stone-700 hover:bg-stone-800 text-white bg-transparent">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <Card className="rounded-2xl border-none shadow-lg shadow-stone-200/50 flex flex-col justify-center bg-orange-50/50">
            <CardHeader>
               <CardTitle>Add New Pop-up</CardTitle>
            </CardHeader>
            <CardContent>
               <form onSubmit={addSociety} className="flex flex-col gap-3">
                  <Input 
                     placeholder="Society Name (e.g. Global Exhibition)"
                     value={newSoc.name}
                     onChange={e => setNewSoc({...newSoc, name: e.target.value})}
                  />
                  <Input 
                     placeholder="Location Details (e.g. Stall 4, Main Atrium)"
                     value={newSoc.locationDetails}
                     onChange={e => setNewSoc({...newSoc, locationDetails: e.target.value})}
                  />
                  <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-xl">Create & Make Active</Button>
               </form>
            </CardContent>
         </Card>

        {societies.map(soc => (
          <Card key={soc.id} className={`rounded-2xl border-none shadow-lg shadow-stone-200/50 overflow-hidden relative group transition-all duration-300 ${!soc.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
             
             <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                   <CardTitle className="text-xl font-bold leading-tight">{soc.name}</CardTitle>
                   <Badge variant={soc.isActive ? "default" : "secondary"} className={soc.isActive ? 'bg-emerald-500/90 text-white border-none' : 'bg-stone-500 text-white border-none'}>
                      {soc.isActive ? 'Active Pop-up' : 'Disabled'}
                   </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 mt-1 text-stone-500 font-medium">
                   <MapPin className="w-4 h-4 text-orange-500" /> {soc.locationDetails}
                </CardDescription>
             </CardHeader>
             
             <CardContent className="pb-4">
                <p className="text-sm text-stone-500 leading-relaxed">
                   When active, customers near {soc.name} can select this location from their app.
                </p>
             </CardContent>
             
             <CardFooter className="bg-stone-50 p-4 border-t border-stone-100 gap-2">
                <Button onClick={() => toggleActive(soc)} variant={soc.isActive ? 'outline' : 'default'} className="flex-1 rounded-xl">
                   {soc.isActive ? 'Go Offline' : 'Make Active'}
                </Button>
                <Button onClick={() => deleteSociety(soc.id)} variant="ghost" className="shrink-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash className="w-4 h-4" />
                </Button>
             </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminLiveSocietiesPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Stall Locations">
          <LiveSocietiesManager />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  )
}
