import { motion, useAnimation } from 'framer-motion';
import { FC, MouseEvent } from 'react';
import { useDispatch } from 'react-redux';

import { interfaceActions } from '@/store/interface-slice';

interface Props {
  icon?: string;
  name?: string;
  appId: string;
}

const HomeAppShortcut: FC<Props> = ({ appId, icon, name }) => {
  const dispatch = useDispatch();

  const imgAnimation = useAnimation();

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
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0 }}
    >
      <motion.div
        animate={imgAnimation}
        onClick={() => {
          dispatch(interfaceActions.changeCurrentApp(appId));
        }}
        layoutId={appId}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className='w-full aspect-square'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95, filter: 'brightness(70%)' }}
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0 }}
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
        <motion.p 
          className='text-zinc-800 whitespace-nowrap text-ellipsis overflow-hidden text-xs font-normal'
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0 }}
        >
          {name}
        </motion.p>
      )}
    </motion.div>
  );
};

export default HomeAppShortcut;
