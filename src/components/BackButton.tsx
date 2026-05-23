// src/components/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Props {
  label?: string;
  href?: string;
}

export default function BackButton({ label = "Back", href }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition-colors group"
    >
      <span className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
        <ArrowLeft size={14} />
      </span>
      {label}
    </button>
  );
}