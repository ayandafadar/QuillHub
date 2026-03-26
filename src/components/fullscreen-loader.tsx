import React from "react";
import { Spinner } from "@/components/ui/spinner";

interface FullscreenLoaderProps {
  label?: string;
}

export const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ label }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
      <Spinner size="md" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {label || "Loading..."}
      </p>
    </div>
  );
};
