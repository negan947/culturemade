'use client';

import { motion } from 'framer-motion';
import { FC } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '@/store/store';

interface Props {
  // eslint-disable-next-line no-unused-vars
  handleHomeBar: (_offsetX: number, _offsetY: number) => void;
  // eslint-disable-next-line no-unused-vars
  handleDragEnd: (_finalOffset: number) => void;
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
