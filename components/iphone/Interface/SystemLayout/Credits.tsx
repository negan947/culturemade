"use client";

import { useIphoneContext } from "@/components/iphone/iphone-provider";

const Credits = () => {
  const { isDevelopmentMode } = useIphoneContext();
  
  // Only show credits in development mode
  if (!isDevelopmentMode) return null;

  return (
    <div className="absolute left-4 bottom-4 p-4 bg-black/80 backdrop-blur-sm text-white rounded-lg shadow-xl max-w-sm border border-white/20">
      <h1 className="font-semibold text-xl">
        CultureMade iPhone
      </h1>
      <h2 className="font-medium text-sm opacity-80">
        Realistic iPhone Interface
      </h2>
      <p className="mt-2 text-xs opacity-60">
        Built with{" "}
        <a
          className="text-blue-400 hover:text-blue-300"
          href="https://github.com/framer/motion"
          target="_blank"
          rel="noopener noreferrer"
        >
          Framer Motion
        </a>
        {" "}& Redux Toolkit
      </p>
      <div className="p-2 mt-2 rounded bg-blue-500/20 text-blue-200 text-xs">
        💡 Best experience on desktop with 1080p+ display
      </div>
    </div>
  );
};

export default Credits; 