"use client";

import Image from "next/image";
import { Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/8 bg-[rgba(8,12,20,0.6)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-(--text-dim)">
            <span>© {currentYear} Todo AI</span>
            <span className="text-(--text-faint)">·</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="size-3.5 fill-(--accent-ice) text-(--accent-ice)" /> for productivity
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Mahad-Nawaz-Khan/Todo-Ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-(--text-secondary) transition-colors hover:text-white"
            >
              <Image src="/icons/github.svg" alt="GitHub" width={16} height={16} className="size-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
