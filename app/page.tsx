import { ArrowRight, Clock, Mail, Instagram, Music } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DevelopmentPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dreamy Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black opacity-95"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.02)_0%,_transparent_50%)] opacity-60"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(255,255,255,0.015)_0%,_transparent_50%)] opacity-80"></div>
      
      {/* Floating Dreamy Elements */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white rounded-full opacity-20 animate-pulse blur-sm"></div>
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white rounded-full opacity-15 animate-pulse delay-1000 blur-sm"></div>
      <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-white rounded-full opacity-10 animate-pulse delay-2000 blur-lg"></div>
      <div className="absolute bottom-1/4 right-1/4 w-2.5 h-2.5 bg-white rounded-full opacity-25 animate-pulse delay-700 blur-sm"></div>
      <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-white rounded-full opacity-30 animate-pulse delay-1500 blur-sm"></div>
      <div className="absolute top-2/3 right-1/6 w-3.5 h-3.5 bg-white rounded-full opacity-12 animate-pulse delay-300 blur-lg"></div>
      
      {/* Ethereal Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/20"></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Logo */}
        <div className="mb-16">
          <div className="w-40 h-40 mx-auto mb-8 relative filter drop-shadow-2xl">
            <Image
              src="/CM_Logo_New.png"
              alt="CultureMade Logo"
              fill
              className="object-contain opacity-95 brightness-105 contrast-110 saturate-110"
              priority
            />
          </div>
          <h1 className="text-7xl md:text-9xl font-thin text-white mb-6 tracking-[0.2em] leading-none">
            <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              CULTURE
            </span>
            <br />
            <span className="text-white/90 text-6xl md:text-8xl tracking-[0.3em]">MADE</span>
          </h1>
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto"></div>
        </div>

        {/* Development Message */}
        <div className="mb-20 space-y-10">
          <div className="inline-flex items-center gap-4 px-8 py-4 backdrop-blur-sm bg-white/5 border border-white/10 text-white/70 text-sm tracking-[0.3em] uppercase font-light">
            <Clock className="w-5 h-5 opacity-60" />
            <span>Entering the void</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extralight text-white/90 mb-8 tracking-[0.1em] leading-relaxed">
            Something ethereal<br />
            <span className="text-white/60">is manifesting</span>
          </h2>
          
          <p className="text-xl text-white/50 max-w-3xl mx-auto leading-loose font-extralight tracking-wide">
            We&apos;re creating a dimension where culture transcends reality, 
            where every piece carries the essence of the streets, 
            where authenticity flows like liquid dreams.
          </p>
        </div>

        {/* Features Preview - Ethereal */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                <div className="absolute inset-4 bg-white/20 rounded-full blur-sm opacity-50"></div>
                <div className="absolute inset-8 bg-white rounded-full"></div>
              </div>
              <h3 className="text-white/80 font-extralight mb-3 tracking-[0.2em] text-sm uppercase">Curated</h3>
              <p className="text-white/30 text-sm font-light">Handpicked from the void</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                <div className="absolute inset-4 bg-white/20 rounded-full blur-sm opacity-50"></div>
                <div className="absolute inset-8 bg-white rounded-full"></div>
              </div>
              <h3 className="text-white/80 font-extralight mb-3 tracking-[0.2em] text-sm uppercase">Authentic</h3>
              <p className="text-white/30 text-sm font-light">Born from the streets</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                <div className="absolute inset-4 bg-white/20 rounded-full blur-sm opacity-50"></div>
                <div className="absolute inset-8 bg-white rounded-full"></div>
              </div>
              <h3 className="text-white/80 font-extralight mb-3 tracking-[0.2em] text-sm uppercase">Exclusive</h3>
              <p className="text-white/30 text-sm font-light">Limited to the chosen</p>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-20">
          <p className="text-white/40 text-sm mb-8 tracking-[0.2em] font-light">FOLLOW THE JOURNEY</p>
          <div className="flex justify-center space-x-12">
            <Link 
              href="https://instagram.com/culturemade" 
              className="group flex items-center gap-4 px-8 py-4 backdrop-blur-sm bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80 hover:bg-white/10 transition-all duration-700"
            >
              <Instagram className="w-5 h-5" />
              <span className="tracking-[0.2em] font-light">INSTAGRAM</span>
            </Link>
            
            <Link 
              href="https://tiktok.com/@culturemade" 
              className="group flex items-center gap-4 px-8 py-4 backdrop-blur-sm bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80 hover:bg-white/10 transition-all duration-700"
            >
              <Music className="w-5 h-5" />
              <span className="tracking-[0.2em] font-light">TIKTOK</span>
            </Link>
          </div>
        </div>

        {/* Email Signup */}
        <div className="mb-20">
          <Link 
            href="mailto:hello@culturemade.com" 
            className="inline-flex items-center gap-4 px-10 py-5 bg-white/95 text-black/90 font-light hover:bg-white transition-all duration-500 group backdrop-blur-sm"
          >
            <Mail className="w-5 h-5" />
            <span className="tracking-[0.2em] text-sm">ENTER THE VOID</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-16">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between text-sm text-white/30 mb-4 tracking-[0.2em] font-light">
              <span>MANIFESTATION</span>
              <span>25%</span>
            </div>
            <div className="w-full bg-white/5 h-px relative">
              <div className="absolute top-0 left-0 bg-gradient-to-r from-white/80 via-white/60 to-transparent h-px transition-all duration-3000 ease-out" style={{ width: '25%' }}></div>
              <div className="absolute top-0 left-0 bg-white/40 h-px blur-sm transition-all duration-3000 ease-out" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-10 border-t border-white/5">
          <p className="text-white/20 text-xs tracking-[0.3em] font-light">
            © 2024 CULTUREMADE. TRANSCENDING REALITY.
          </p>
        </div>
      </div>
    </div>
  );
}
