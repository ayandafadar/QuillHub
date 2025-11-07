import React from "react";
import { LoaderIcon } from "lucide-react";

interface FullscreenLoaderProps {
  label?: string;
}

export const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ label }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2">
      <LoaderIcon className="h-6 w-6 text-muted-foreground animate-spin" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
};
