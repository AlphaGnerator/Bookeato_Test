'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, ArrowLeft, MessageSquare, Mail, Send, Headset, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function HelpPage() {
    const router = useRouter();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { sender: 'admin', text: 'Hello! Welcome to Bookeato Support. How can we assist you today?', time: 'Just now' }
    ]);
    const [inputMessage, setInputMessage] = useState('');

    const supportNumber = "+91-9573110016";

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMsg = { sender: 'user', text: inputMessage.trim(), time: 'Just now' };
        setChatMessages(prev => [...prev, userMsg]);
        const msgText = inputMessage.trim();
        setInputMessage('');

        // Auto-reply simulation from Admin Support Desk
        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                sender: 'admin',
                text: `Thank you for contacting Bookeato. Our admin team has received your message: "${msgText}". An admin representative will respond shortly!`,
                time: 'Just now'
            }]);
        }, 1000);
    };

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
                        <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">We're here for you 24/7</p>
                    </div>
                </div>

                {/* Main Support Card - Single Contact Number +91-9573110016 */}
                <Card className="rounded-[2.5rem] border-none bg-stone-900 text-white overflow-hidden shadow-2xl">
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tighter">Talk to us.</h2>
                            <p className="text-stone-400 font-bold text-sm">Call our official helpline directly for instant customer assistance.</p>
                        </div>

                        <div className="grid gap-3">
                            <a 
                                href={`tel:${supportNumber.replace(/[^0-9+]/g, '')}`}
                                className="flex items-center justify-between p-5 bg-gradient-to-r from-stone-800/80 to-stone-800 hover:from-orange-950/40 hover:to-stone-800 rounded-[1.5rem] transition-all border border-stone-700/50 group shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
                                        <Phone className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <span className="text-xl font-black tracking-tight text-white block">{supportNumber}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Official Helpline (Click to Call)</span>
                                    </div>
                                </div>
                                <ArrowLeft className="w-5 h-5 text-stone-400 group-hover:text-orange-400 transition-all rotate-180" />
                            </a>
                        </div>
                    </CardContent>
                </Card>

                {/* Support Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Interactive Live Chat Card */}
                    <Card 
                        className="rounded-[2rem] border-stone-200/80 shadow-md hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-blue-50/50 group border hover:border-blue-300"
                        onClick={() => setIsChatOpen(true)}
                    >
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Admin
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-stone-900 text-lg">Chat with us</h3>
                                <p className="text-xs text-stone-500 font-medium leading-relaxed">Open live chat box connected to admin support desk.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-stone-200/80 shadow-md hover:shadow-xl transition-all bg-white">
                        <CardContent className="p-6 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-stone-900 text-lg">Email Support</h3>
                                <p className="text-xs text-stone-500 font-medium leading-relaxed">support@bookeato.com</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Direct Admin Access Notice */}
                <div className="bg-stone-100 rounded-2xl p-4 border border-stone-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-stone-900">Are you an Admin?</p>
                            <p className="text-[11px] text-stone-500 font-medium">Log in to manage live customer support chats.</p>
                        </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-xl font-bold text-xs border-stone-300 hover:bg-stone-900 hover:text-white shrink-0">
                        <Link href="/admin/login">Admin Login →</Link>
                    </Button>
                </div>

                <div className="px-6 text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Official Support Channel</p>
                    <p className="text-xs text-stone-400 font-medium">Bookeato services are provided by verified professional partners. For direct on-site assistance, please call +91-9573110016.</p>
                </div>
            </div>

            {/* Live Support Chat Modal */}
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden bg-white">
                    <DialogHeader className="bg-stone-900 text-white p-5 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-bold">
                                <Headset className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-lg font-black text-white">Bookeato Support Desk</DialogTitle>
                                <DialogDescription className="text-xs text-stone-300 font-medium flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Connected to Admin Login
                                </DialogDescription>
                            </div>
                        </div>
                        <Button asChild size="sm" variant="ghost" className="text-xs font-bold text-orange-400 hover:text-white hover:bg-stone-800 rounded-xl px-2">
                            <Link href="/admin/login">Admin Portal</Link>
                        </Button>
                    </DialogHeader>

                    {/* Chat Messages Container */}
                    <div className="p-4 space-y-3 h-80 overflow-y-auto bg-stone-50">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-3 text-xs font-medium space-y-1 ${
                                    msg.sender === 'user' 
                                      ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' 
                                      : 'bg-white text-stone-900 border border-stone-200 rounded-bl-none shadow-sm'
                                }`}>
                                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 font-bold mb-0.5">
                                        <span>{msg.sender === 'user' ? 'You' : 'Admin Support'}</span>
                                        <span>{msg.time}</span>
                                    </div>
                                    <p className="leading-relaxed">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input Box */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
                        <Input 
                            value={inputMessage} 
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Type your query for admin..."
                            className="rounded-xl border-stone-200 text-xs font-medium h-10 focus-visible:ring-emerald-500"
                        />
                        <Button type="submit" size="icon" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10 shrink-0">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
