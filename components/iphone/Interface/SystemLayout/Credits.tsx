'use client';

const Credits = () => {
  const isDevelopmentMode = process.env.NODE_ENV === 'development';

  if (!isDevelopmentMode) return null;

  return (
    <div className='fixed bottom-2 left-2 text-xs text-white/60 z-50 pointer-events-none'>
      iPhone Clone v2.0 - CultureMade
    </div>
  );
};

export default Credits;
