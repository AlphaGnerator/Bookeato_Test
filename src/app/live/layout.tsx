export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 selection:bg-orange-500/30 font-sans antialiased pb-20 md:pb-0">
      {/* 
        This is a dedicated namespace for Bookeato Live. 
        It purposely uses a distinct, darker, more premium/rustic color palette 
        compared to the main application's white/light theme.
      */}
      {children}
    </div>
  );
}
