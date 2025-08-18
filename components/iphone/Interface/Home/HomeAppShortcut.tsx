import { motion, useAnimation } from 'framer-motion';
import { FC, MouseEvent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { getApp } from '@/components/iphone/apps/getApp';
import { interfaceActions } from '@/store/interface-slice';

interface Props {
  icon?: string;
  name?: string;
  appId: string;
  shouldAnimateUnlock?: boolean;
  animationIndex?: number;
}

const HomeAppShortcut: FC<Props> = ({ appId, icon, name, shouldAnimateUnlock = false, animationIndex = 0 }) => {
  const dispatch = useDispatch();
  const [hasAnimatedUnlock, setHasAnimatedUnlock] = useState(false);

  const imgAnimation = useAnimation();

  // Handle unlock animation - only trigger once when unlocked
  useEffect(() => {
    if (shouldAnimateUnlock && !hasAnimatedUnlock) {
      setHasAnimatedUnlock(true);
      // Trigger smooth appearance animation with stagger
    }
  }, [shouldAnimateUnlock, hasAnimatedUnlock]);

  const handleMouseMove = (e: MouseEvent) => {
    const { movementX, movementY } = e;
    imgAnimation.start({
      x: movementX / 6,
      y: movementY / 6,
    });
  };

  const handleMouseLeave = () => {
    imgAnimation.start({ x: 0, y: 0 });
  };

  return (
    <motion.div 
      className='w-full aspect-square flex flex-col justify-center items-center gap-1'
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: shouldAnimateUnlock ? 1 : 0, 
        scale: shouldAnimateUnlock ? 1 : 0.8 
      }}
      transition={{ 
        delay: shouldAnimateUnlock ? animationIndex * 0.05 : 0,
        duration: 0.3,
        ease: "easeOut"
      }}
    >
      <motion.div
        animate={imgAnimation}
        onClick={() => {
          dispatch(interfaceActions.changeCurrentApp(appId));
          // Set the status bar color based on the app's configuration
          const app = getApp(appId);
          if (app) {
            dispatch(interfaceActions.changeStatusBarColor(app.statusBarColor));
          }
        }}
        layoutId={appId}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className='w-full aspect-square'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95, filter: 'brightness(70%)' }}
        style={{
          borderRadius: 15,
          backgroundImage: icon
            ? `url('/images/icons/${icon}.png')`
            : "url('/images/icons/empty.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(100%)',
        }}
      />
      {name && (
        <p className='text-zinc-800 whitespace-nowrap text-ellipsis overflow-hidden text-xs font-normal'>
          {name}
        </p>
      )}
    </motion.div>
  );
};

export default HomeAppShortcut;
