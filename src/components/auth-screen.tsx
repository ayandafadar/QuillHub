"use client";

import { ReactNode } from "react";
import Image from "next/image";

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* Full-screen left visual layer (desktop) */}
      <div className="hidden lg:block absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-neutral-800 to-zinc-800" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-zinc-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neutral-300/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-zinc-500/15 rounded-full blur-3xl animate-pulse delay-500" />

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white max-w-[48%]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Image src="/logo.svg" alt="QuillHub" width={40} height={40} />
              <span className="text-2xl font-bold tracking-tight">QuillHub</span>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-sm uppercase tracking-widest text-white/50">
              You can easily
            </p>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Write. Share.
              <br />
              Collaborate.
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              Real-time editing, seamless teamwork, and beautiful documents — all
              in one place.
            </p>
          </div>

          <div>
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} QuillHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="relative z-20 min-h-screen flex items-center justify-center lg:items-start lg:justify-end p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg lg:mt-4">
          {/* Mobile-only branding */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <Image src="/logo.svg" alt="QuillHub" width={32} height={32} />
            <span className="text-xl font-bold text-white tracking-tight">
              QuillHub
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
