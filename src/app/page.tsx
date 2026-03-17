import Player from "@/components/Player";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden">
      {/* Background radial gradients for premium look */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] -z-10"></div>
      
      <div className="w-full max-w-2xl px-4">
        <Player />
      </div>

      <footer className="absolute bottom-8 left-0 w-full text-center text-white/20 text-sm tracking-widest font-light pointer-events-none uppercase">
        Ukraine • Daily 09:00
      </footer>
    </main>
  );
}
