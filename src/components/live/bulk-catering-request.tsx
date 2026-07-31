'use client';

import React, { useState } from 'react';
import { PartyPopper, Users, Calendar, Phone, MapPin, ChefHat, CheckCircle2, Sparkles, Send, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface BulkCateringRequestProps {
  defaultLocation?: string;
  className?: string;
}

export function BulkCateringRequest({ defaultLocation = '', className = '' }: BulkCateringRequestProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: defaultLocation,
    guestCount: '50-100',
    eventDate: '',
    eventType: 'Society Pop-up / Festival',
    dishesNeeded: 'Indori Poha & Special Snacks',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast({ title: 'Missing details', description: 'Please fill in your name and phone number.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (firestore) {
        await addDoc(collection(firestore, 'liveCateringRequests'), {
          ...formData,
          status: 'Pending Review',
          createdAt: new Date().toISOString()
        });
      }

      setIsSubmitted(true);
      toast({
        title: '🎉 Request Received!',
        description: 'Our Bookeato Live catering coordinator will contact you within 30 minutes.'
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Submission Error', description: 'Could not send request. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 rounded-[2.5rem] border-2 border-orange-500/50 p-6 md:p-8 shadow-2xl relative overflow-hidden text-left ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[11px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <PartyPopper className="w-3.5 h-3.5" /> Bulk & Party Catering
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Kitchen Counter
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
              Host a Pop-Up Stall or Bulk Party Order
            </h3>
            <p className="text-sm text-stone-300 font-medium mt-1 max-w-xl">
              Planning a society festival, house party, or corporate lunch? Get hot, freshly prepared signature dishes (like Indori Poha, Chaats & Bowls) served live at your event!
            </p>
          </div>

          {!isOpen && !isSubmitted && (
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-orange-500 hover:bg-orange-400 text-stone-950 font-black rounded-2xl px-6 py-3 text-sm h-12 shadow-lg shadow-orange-500/20 shrink-0 transition-transform active:scale-95 flex items-center gap-2"
            >
              Raise Party Request <Send className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Success Confirmation State */}
        {isSubmitted && (
          <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-6 text-center space-y-3 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-white">Party Request Submitted!</h4>
            <p className="text-sm text-stone-300 max-w-md mx-auto">
              Thank you, <strong className="text-emerald-400">{formData.name}</strong>! Our event executive will call you at <strong className="text-emerald-400">{formData.phone}</strong> shortly to finalize menus and pricing.
            </p>
            <Button
              onClick={() => { setIsSubmitted(false); setIsOpen(false); }}
              variant="outline"
              className="mt-2 border-emerald-700 text-emerald-300 hover:bg-emerald-900/50 rounded-xl"
            >
              Submit Another Request
            </Button>
          </div>
        )}

        {/* Integrated Request Form */}
        {isOpen && !isSubmitted && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-stone-300">Your Full Name *</Label>
                <Input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="bg-stone-950 border-stone-700 text-white rounded-xl h-11 focus-visible:ring-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-stone-300">Phone Number *</Label>
                <Input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="bg-stone-950 border-stone-700 text-white rounded-xl h-11 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-stone-300">Event Location / Society</Label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Green Meadows Society"
                  className="bg-stone-950 border-stone-700 text-white rounded-xl h-11 focus-visible:ring-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-stone-300">Estimated Guests</Label>
                <select
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleChange}
                  className="w-full bg-stone-950 border border-stone-700 text-white rounded-xl h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="20-50 guests">20 - 50 Guests</option>
                  <option value="50-100 guests">50 - 100 Guests</option>
                  <option value="100-250 guests">100 - 250 Guests</option>
                  <option value="250+ guests">250+ Large Gathering</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-stone-300">Preferred Event Date</Label>
                <Input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="bg-stone-950 border-stone-700 text-white rounded-xl h-11 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-stone-300">Dishes / Special Requests</Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. We want live Indori Poha stall + Golgappa stall for 80 residents on Sunday morning."
                className="bg-stone-950 border-stone-700 text-white rounded-xl resize-none focus-visible:ring-orange-500 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-stone-700 text-stone-300 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-500 hover:bg-orange-400 text-stone-950 font-black rounded-xl px-6"
              >
                {isSubmitting ? 'Sending Request...' : 'Submit Party Request 🚀'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
