import { motion, useAnimation } from 'framer-motion';
import { FC } from 'react';
import { useDispatch } from 'react-redux';

import { getApp } from '@/components/iphone/apps/getApp';
import HomeBar from '@/components/iphone/Interface/SystemLayout/HomeBar';
import { interfaceActions } from '@/store/interface-slice';

interface Props {
  appId: string;
}

const AppView: FC<Props> = ({ appId }) => {
  const appContainer = getApp(appId);
  const dispatch = useDispatch();

  // Get app-specific background - CultureMade needs gray background for consistency
  const getAppBackground = () => {
    if (appId === 'culturemade') {
      return '#111827'; // bg-gray-900 to match CultureMade app content
    }
    // Other apps can use wallpaper
    return `url('/images/wallpaper-cm.jpg') center / cover no-repeat`;
  };

  const animateExit = useAnimation();

  const handleDrag = (offsetX: number, offsetY: number) => {
    const positiveOffest = offsetY * -1;
    const defaultScale = 1;
    const fragmentedOffset = positiveOffest / 1250;
    const newScale = defaultScale - fragmentedOffset;

    const xTranslate = offsetX / 3;

    animateExit.set({ scale: newScale, x: xTranslate, borderRadius: 40 });
  };

  const handleEndDrag = (offsetOnExit: number) => {
    if (offsetOnExit < -100) {
      dispatch(interfaceActions.exitApp());
    } else {
      animateExit.start({ scale: 1, x: 0 });
    }
  };

  return (
    <motion.div
      className='absolute h-full w-full top-0 left-0 z-40'
      layoutId={appId}
      initial={{ borderRadius: 38, scale: 1 }}
      animate={animateExit}
      style={{
        background: getAppBackground(),
      }}
    >
      <div className="h-full pb-4">
        {appContainer ? appContainer.element() : <p>app id not found</p>}
      </div>
      <HomeBar handleHomeBar={handleDrag} handleDragEnd={handleEndDrag} />
    </motion.div>
  );
};

export default AppView;
