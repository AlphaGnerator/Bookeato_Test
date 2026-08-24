'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { FirebaseClientProvider, useFirestore } from '@/firebase';
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Users, CheckCircle2, XCircle, Search, Phone, MapPin,
  ChefHat, Heart, Baby, Sparkles, ShieldCheck, Eye,
  Dumbbell, RefreshCw, User, Calendar, Star,
  AlertTriangle, Clock, UserCheck
} from 'lucide-react';
import { collection, doc, updateDoc, getDocs } from 'firebase/firestore';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface UnifiedPartner {
  id: string;
  name: string;
  contactNumber: string;
  serviceType: string;
  experience?: number;
  status: string;
  joinedDate?: string;
  address?: string;
  city?: string;
  gender?: string;
  rating?: number;
  qualification?: string;
  profilePhotoUrl?: string;
  photoUrl?: string;
  aadhaarNumber?: string;
  specialities?: string[];
  source: string;
}

// â”€â”€â”€ Mock data shown when Firestore is empty/unavailable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MOCK_PARTNERS: UnifiedPartner[] = [
  {
    id: 'mock-m1', name: 'Lakshmi Priya', contactNumber: '+91 91212 33445',
    serviceType: 'Maid', experience: 5, status: 'approved',
    joinedDate: '2026-08-22T00:00:00.000Z', city: 'Kondapur, Hyderabad',
    specialities: ['Deep Cleaning', 'Utensil Sanitization', 'Laundry'],
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop',
    source: 'mock'
  },
  {
    id: 'mock-c1', name: 'Savitri Devi', contactNumber: '+91 98490 11223',
    serviceType: 'Cook', experience: 8, status: 'pending',
    joinedDate: '2026-08-24T00:00:00.000Z', city: 'Nanakramguda, Hyderabad',
    specialities: ['North Indian', 'Indori Poha', 'Diabetic Meals'],
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
    source: 'mock'
  },
  {
    id: 'mock-e1', name: 'Ramesh Kumar', contactNumber: '+91 97001 44556',
    serviceType: 'Elder Care', experience: 6, status: 'pending',
    joinedDate: '2026-08-23T00:00:00.000Z', city: 'Gachibowli, Hyderabad',
    specialities: ['Mobility Assistance', 'Medication Management'],
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop',
    source: 'mock'
  },
  {
    id: 'mock-cc1', name: 'Sunita Sharma', contactNumber: '+91 98888 77665',
    serviceType: 'Child Care', experience: 7, status: 'pending',
    joinedDate: '2026-08-24T00:00:00.000Z', city: 'Financial District, Hyderabad',
    specialities: ['Infant Care', 'Activity Engagement'],
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    source: 'mock'
  },
];

const SERVICE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'Cook':          { icon: ChefHat,  color: 'text-rose-700',   bg: 'bg-rose-100' },
  'Maid':          { icon: Sparkles, color: 'text-teal-700',   bg: 'bg-teal-100' },
  'Elder Care':    { icon: Heart,    color: 'text-pink-700',   bg: 'bg-pink-100' },
  'Child Care':    { icon: Baby,     color: 'text-amber-700',  bg: 'bg-amber-100' },
  'Fitness Coach': { icon: Dumbbell, color: 'text-cyan-700',   bg: 'bg-cyan-100' },
};

function getServiceMeta(type: string) {
  return SERVICE_META[type] || { icon: User, color: 'text-stone-700', bg: 'bg-stone-100' };
}

function normalizeType(raw: string): string {
  const l = (raw || '').toLowerCase();
  if (l === 'cook') return 'Cook';
  if (l === 'maid') return 'Maid';
  if (l.includes('elder')) return 'Elder Care';
  if (l.includes('child') || l.includes('nanny')) return 'Child Care';
  if (l.includes('fitness') || l.includes('gym') || l.includes('yoga')) return 'Fitness Coach';
  return 'Other';
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PartnersHubContent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [partners, setPartners] = useState<UnifiedPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPartner, setPreviewPartner] = useState<UnifiedPartner | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) {
      setPartners(MOCK_PARTNERS);
      setUsingMock(true);
      setIsLoading(false);
      return;
    }

    let aborted = false;
    setIsLoading(true);

    const fetchAll = async () => {
      try {
        const [maidsSnap, cooksSnap, otherSnap] = await Promise.all([
          getDocs(collection(firestore, 'maids')).catch(() => ({ docs: [] })),
          getDocs(collection(firestore, 'cooks')).catch(() => ({ docs: [] })),
          getDocs(collection(firestore, 'other_services')).catch(() => ({ docs: [] })),
        ]);

        if (aborted) return;

        const fromMaids: UnifiedPartner[] = (maidsSnap.docs || []).map((d: any) => {
          const data = d.data();
          return { id: d.id, name: data.name || 'Unknown', contactNumber: data.contactNumber || '', serviceType: 'Maid', experience: data.experience, status: data.status || 'pending', joinedDate: data.joinedDate, address: data.address, gender: data.gender, rating: data.rating, qualification: data.qualification, profilePhotoUrl: data.profilePhotoUrl, aadhaarNumber: data.aadhaarNumber, source: 'maids' };
        });

        const fromCooks: UnifiedPartner[] = (cooksSnap.docs || []).map((d: any) => {
          const data = d.data();
          return { id: d.id, name: data.name || 'Unknown', contactNumber: data.contactNumber || '', serviceType: 'Cook', experience: data.experience, status: data.status || 'pending', joinedDate: data.joinedDate, address: data.address, gender: data.gender, rating: data.rating, qualification: data.qualification, profilePhotoUrl: data.profilePhotoUrl, aadhaarNumber: data.aadhaarNumber, specialities: data.specialties, source: 'cooks' };
        });

        const fromOther: UnifiedPartner[] = (otherSnap.docs || []).map((d: any) => {
          const data = d.data();
          return { id: d.id, name: data.name || 'Unknown', contactNumber: data.contactNumber || '', serviceType: normalizeType(data.type || data.serviceType || ''), experience: data.experience, status: data.status || 'pending', joinedDate: data.joinedDate, address: data.address, gender: data.gender, rating: data.rating, profilePhotoUrl: data.profilePhotoUrl || data.photoUrl, photoUrl: data.photoUrl, aadhaarNumber: data.documentNumber, source: 'other_services' };
        });

        if (aborted) return;
        const all = [...fromMaids, ...fromCooks, ...fromOther];
        if (all.length === 0) {
          setPartners(MOCK_PARTNERS);
          setUsingMock(true);
        } else {
          setPartners(all);
          setUsingMock(false);
        }
      } catch (_e) {
        if (!aborted) {
          setPartners(MOCK_PARTNERS);
          setUsingMock(true);
        }
      } finally {
        if (!aborted) setIsLoading(false);
      }
    };

    fetchAll();
    return () => { aborted = true; };
  }, [firestore]);

  const handleUpdateStatus = async (partner: UnifiedPartner, newStatus: 'approved' | 'rejected') => {
    setIsUpdating(partner.id);
    try {
      if (firestore && partner.source !== 'mock') {
        await updateDoc(doc(firestore, partner.source, partner.id), { status: newStatus });
      }
      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, status: newStatus } : p));
      toast({ title: `Partner ${newStatus === 'approved' ? 'Approved âœ…' : 'Rejected âŒ'}`, description: `${partner.name} has been ${newStatus}.` });
    } catch (_e) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update status.' });
    } finally {
      setIsUpdating(null);
    }
  };

  const filtered = useMemo(() => partners.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (p.name || '').toLowerCase().includes(q) || (p.contactNumber || '').includes(q) || (p.address || '').toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q);
    const matchType = filterType === 'all' || p.serviceType.toLowerCase().replace(/\s+/g, '_') === filterType;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  }), [partners, searchQuery, filterType, filterStatus]);

  const counts = useMemo(() => ({
    total: partners.length,
    pending: partners.filter(p => p.status === 'pending').length,
    approved: partners.filter(p => p.status === 'approved').length,
    cooks: partners.filter(p => p.serviceType === 'Cook').length,
    maids: partners.filter(p => p.serviceType === 'Maid').length,
  }), [partners]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-stone-950 text-white rounded-[2.5rem] p-8 shadow-xl border border-stone-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Badge className="bg-orange-500 text-stone-950 font-black text-xs uppercase mb-2">Live Partner Sync â€” All Services</Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Partner Onboarding Center</h1>
            <p className="text-stone-400 text-sm font-medium mt-1">Real-time view of all Maid, Cook, Elder Care, Child Care & Fitness Coach applications from Firestore.</p>
            {usingMock && (
              <p className="text-amber-400 text-xs font-bold mt-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Showing demo data â€” no live Firestore registrations yet
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Total', value: counts.total, color: 'text-white' },
              { label: 'Pending', value: counts.pending, color: 'text-amber-400' },
              { label: 'Approved', value: counts.approved, color: 'text-emerald-400' },
              { label: 'Cooks', value: counts.cooks, color: 'text-rose-300' },
              { label: 'Maids', value: counts.maids, color: 'text-teal-300' },
            ].map(s => (
              <div key={s.label} className="bg-stone-900 border border-stone-800 px-4 py-2.5 rounded-2xl text-center min-w-[64px]">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">{s.label}</span>
                <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input placeholder="Search by name, phone or city..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-10 text-xs rounded-xl border-stone-200" />
          </div>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterStatus('all'); }} className="shrink-0 rounded-xl h-10 text-xs font-bold border-stone-200">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-black text-stone-400 uppercase mr-1">Type:</span>
          {[{ id: 'all', label: 'All' }, { id: 'cook', label: 'ðŸ‘¨â€ðŸ³ Cook' }, { id: 'maid', label: 'ðŸ§¹ Maid' }, { id: 'elder_care', label: 'â¤ï¸ Elder Care' }, { id: 'child_care', label: 'ðŸ‘¶ Child Care' }, { id: 'fitness_coach', label: 'ðŸ’ª Fitness' }].map(f => (
            <button key={f.id} onClick={() => setFilterType(f.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === f.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{f.label}</button>
          ))}
          <span className="text-[10px] font-black text-stone-400 uppercase ml-3 mr-1">Status:</span>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filterStatus === s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{s === 'all' ? 'â€¢ All' : s}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-stone-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="font-bold text-sm">Syncing from Firestore (maids + cooks + other_services)...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-3xl text-stone-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-black text-lg">No partners found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(partner => {
            const meta = getServiceMeta(partner.serviceType);
            const Icon = meta.icon;
            const photo = partner.profilePhotoUrl || partner.photoUrl;
            const initials = (partner.name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <Card key={partner.id} className="rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
                <CardHeader className="pb-3 border-b border-stone-100 bg-gradient-to-br from-stone-50 to-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar */}
                      <div
                        onClick={() => setPreviewPartner(partner)}
                        className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-400 shrink-0 shadow cursor-pointer group bg-stone-100"
                      >
                        {photo ? (
                          <img src={photo} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${meta.bg} ${meta.color} font-black text-lg`}>{initials}</div>
                        )}
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      <div>
                        <CardTitle className="text-base font-black text-stone-900 leading-tight">{partner.name}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${meta.bg} ${meta.color}`}>
                            <Icon className="w-3 h-3" /> {partner.serviceType}
                          </span>
                          {partner.experience !== undefined && (
                            <span className="text-[10px] text-stone-400 font-bold">{partner.experience} yrs</span>
                          )}
                        </div>
                        <span className="text-[9px] text-stone-400 font-mono block mt-0.5">
                          {partner.source !== 'mock' ? `ðŸ”¥ Firestore:${partner.source}` : 'ðŸ“‹ Demo'} Â· #{partner.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <Badge className={`shrink-0 font-black text-[10px] uppercase px-2.5 py-1 ${
                      partner.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      partner.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-300' :
                      'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {partner.status === 'pending' && <Clock className="w-2.5 h-2.5 inline mr-0.5" />}
                      {partner.status === 'approved' && <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />}
                      {partner.status === 'rejected' && <XCircle className="w-2.5 h-2.5 inline mr-0.5" />}
                      {partner.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-xs">
                  <div className="space-y-1.5 text-stone-600 font-medium">
                    <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" /> {partner.contactNumber || 'N/A'}</span>
                    {(partner.address || partner.city) && (
                      <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" /><span className="line-clamp-1">{partner.address || partner.city}</span></span>
                    )}
                    {partner.gender && (
                      <span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-orange-500 shrink-0" />{partner.gender}{partner.qualification && <> Â· <span className="text-stone-400">{partner.qualification}</span></>}</span>
                    )}
                    {partner.joinedDate && (
                      <span className="flex items-center gap-2 text-stone-400"><Calendar className="w-3.5 h-3.5 shrink-0" />Applied: {new Date(partner.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>

                  {partner.aadhaarNumber && (
                    <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-stone-700 text-[11px]">KYC: {partner.aadhaarNumber}</span>
                    </div>
                  )}

                  {partner.rating !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-black text-amber-700">{Number(partner.rating).toFixed(1)}</span>
                      <span className="text-stone-400 text-[10px]">platform rating</span>
                    </div>
                  )}

                  {partner.specialities && partner.specialities.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-black text-stone-400 block mb-1">Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {partner.specialities.map((s, i) => (
                          <span key={i} className="bg-orange-50 text-orange-900 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-orange-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex gap-2 flex-wrap">
                    {partner.status !== 'approved' && (
                      <Button
                        onClick={() => handleUpdateStatus(partner, 'approved')}
                        disabled={isUpdating === partner.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl h-9"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {isUpdating === partner.id ? 'Saving...' : 'Approve'}
                      </Button>
                    )}
                    {partner.status !== 'rejected' && (
                      <Button onClick={() => handleUpdateStatus(partner, 'rejected')} disabled={isUpdating === partner.id} variant="outline" className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl h-9">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    )}
                    {photo && (
                      <Button onClick={() => setPreviewPartner(partner)} variant="ghost" className="shrink-0 text-stone-500 hover:bg-stone-100 text-xs rounded-xl h-9 font-bold">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Photo
                      </Button>
                    )}
                    {partner.status === 'approved' && (
                      <span className="flex items-center gap-1 text-emerald-700 font-black text-[11px] px-2">
                        <UserCheck className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Photo Modal */}
      <Dialog open={previewPartner !== null} onOpenChange={open => !open && setPreviewPartner(null)}>
        <DialogContent className="sm:max-w-sm bg-white rounded-3xl p-6 border border-stone-200 text-center">
          {previewPartner && (
            <div className="space-y-4">
              <DialogHeader>
                <Badge className="bg-orange-100 text-orange-950 font-black text-[9px] uppercase w-fit mx-auto">{previewPartner.serviceType} Partner</Badge>
                <DialogTitle className="text-xl font-black text-stone-950">{previewPartner.name}</DialogTitle>
                <DialogDescription className="text-xs text-stone-500 font-medium">{previewPartner.contactNumber} Â· {previewPartner.status.toUpperCase()}</DialogDescription>
              </DialogHeader>
              <div className="w-44 h-44 rounded-2xl overflow-hidden mx-auto border-4 border-orange-500 shadow-lg bg-stone-100">
                {(previewPartner.profilePhotoUrl || previewPartner.photoUrl) ? (
                  <img src={previewPartner.profilePhotoUrl || previewPartner.photoUrl} alt={previewPartner.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-4xl font-black">{(previewPartner.name || '?').charAt(0)}</div>
                )}
              </div>
              {previewPartner.aadhaarNumber && (
                <div className="flex items-center justify-center gap-2 text-xs text-stone-600 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> KYC: {previewPartner.aadhaarNumber}
                </div>
              )}
              <Button onClick={() => setPreviewPartner(null)} className="w-full bg-stone-900 hover:bg-stone-950 text-white font-black rounded-xl h-10 text-xs">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPartnersPage() {
  return (
    <FirebaseClientProvider>
      <AdminAuthGuard>
        <AppLayout pageTitle="Partners Onboarding Center">
          <PartnersHubContent />
        </AppLayout>
      </AdminAuthGuard>
    </FirebaseClientProvider>
  );
}
