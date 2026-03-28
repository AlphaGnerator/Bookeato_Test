'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, ArrowLeft, MessageSquare, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
    const router = useRouter();

    const supportNumbers = [
        "+91 9944659633",
        "+91 7415991708"
    ];

    return (
        <AppLayout pageTitle="Help & Support">
            <div className="max-w-xl mx-auto pb-32 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 pt-4 px-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-full bg-stone-100 h-10 w-10 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-stone-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Help & Support</h1>
                        <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">We're here for you</p>
                    </div>
                </div>

                {/* Main Support Card */}
                <Card className="rounded-[2.5rem] border-none bg-stone-900 text-white overflow-hidden shadow-2xl">
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tighter">Talk to us.</h2>
                            <p className="text-stone-400 font-bold text-sm">Our support team is available 24/7 to assist you with any queries or issues.</p>
                        </div>

                        <div className="grid gap-3">
                            {supportNumbers.map((num, i) => (
                                <a 
                                    key={i}
                                    href={`tel:${num.replace(/\s/g, '')}`}
                                    className="flex items-center justify-between p-5 bg-stone-800/50 hover:bg-stone-800 rounded-[1.5rem] transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <span className="text-lg font-black tracking-tight">{num}</span>
                                    </div>
                                    <ArrowLeft className="w-5 h-5 text-stone-600 group-hover:text-white transition-all rotate-180" />
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Other Support Options */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-[2rem] border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-stone-900">Chat with us</h3>
                                <p className="text-xs text-stone-400 font-bold leading-relaxed">Response time: ~5 mins</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-stone-900">Email Support</h3>
                                <p className="text-xs text-stone-400 font-bold leading-relaxed">support@bookeato.com</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="px-6 text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Official Support Channels</p>
                    <p className="text-xs text-stone-400 font-medium">Bookeato services are provided by professional partners. For direct on-site issues, please coordinate with your assigned partner.</p>
                </div>
            </div>
        </AppLayout>
    );
}
