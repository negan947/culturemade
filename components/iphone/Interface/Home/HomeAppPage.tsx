import { FC, ReactElement } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactElement[];
}

const HomeAppPage: FC<Props> = ({ children }) => {
  return (
    <motion.section 
      className="grid grid-cols-4 gap-9 gap-y-6 m-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.section>
  );
};

export default HomeAppPage; 