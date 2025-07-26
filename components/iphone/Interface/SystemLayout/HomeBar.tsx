'use client';

import { FC } from 'react';

import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

import { RootState } from '@/store/store';

interface Props {
  handleHomeBar: (offsetX: number, offsetY: number) => void;
  handleDragEnd: (finalOffset: number) => void;
}

const HomeBar: FC<Props> = ({ handleHomeBar, handleDragEnd }) => {
  const color = useSelector(
    (state: RootState) => state.interface.statusBarColor
  );

  return (
    <motion.div
      onPan={(_e, info) => {
        handleHomeBar(info.offset.x, info.offset.y);
      }}
      onPanEnd={(_e, info) => {
        handleDragEnd(info.offset.y);
      }}
      style={{ touchAction: 'none' }}
      className='z-50 absolute left-0 w-full h-4 flex items-center justify-center bottom-0 pointer-events-auto'
    >
      <motion.div
        animate={{ backgroundColor: color === 'dark' ? '#000000' : '#ffffff' }}
        className='w-5/12 h-1.5 rounded-full'
      />
    </motion.div>
  );
};

export default HomeBar;
