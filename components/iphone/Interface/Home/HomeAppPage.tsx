import { motion } from 'framer-motion';
import { FC, ReactNode } from 'react';


interface Props {
  children: ReactNode;
}

const HomeAppPage: FC<Props> = ({ children }) => {
  return (
    <motion.section 
      className='grid grid-cols-4 gap-9 gap-y-6 m-8'
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0 }}
    >
      {children}
    </motion.section>
  );
};

export default HomeAppPage;
