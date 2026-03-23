import React from 'react';
import { Shield, RefreshCw, IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function MaidValueProps() {
  return (
    <section className="section bg-primary/5">
      <div className="container mx-auto px-6 text-center">
        <Badge className="bg-badge-bg text-badge-text font-medium py-1 px-4 text-sm border-none">Why People Choose Us</Badge>
        <h2 className="section-title mt-2">Designed for Trust, Hygiene & Reliability</h2>
        <p className="text-text-secondary max-w-3xl mx-auto mt-4">Every part of our service — from vetting to daily execution — is built for your absolute peace of mind.</p>
        <div className="grid md:grid-cols-3 gap-8 mt-12 text-left px-4">
          <article className="bg-white border-2 border-green-primary/20 rounded-[2rem] p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="bg-green-primary/10 text-green-primary inline-block p-4 rounded-2xl mb-6">
              <Shield className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Vetted Professionals</h3>
            <p className="text-text-secondary text-sm leading-relaxed">Every maid undergoes strict background checks and hygiene training before stepping into your home.</p>
          </article>
          <article className="bg-white border-2 border-green-primary/20 rounded-[2rem] p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="bg-green-primary/10 text-green-primary inline-block p-4 rounded-2xl mb-6">
              <RefreshCw className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1A2E] mb-3">Zero Disruption</h3>
            <p className="text-sm leading-relaxed text-[#355067]">Our signature 30-day guarantee. If your regular maid takes a leave, we automatically deploy a verified backup. No follow-ups needed.</p>
          </article>
          <article className="bg-white border-2 border-green-primary/20 rounded-[2rem] p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="bg-green-primary/10 text-green-primary inline-block p-4 rounded-2xl mb-6">
              <IndianRupee className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Transparent Pricing</h3>
            <p className="text-text-secondary text-sm leading-relaxed">No hidden agency fees or bargaining. Pay strictly for the time you need, or subscribe monthly for total autopilot.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
