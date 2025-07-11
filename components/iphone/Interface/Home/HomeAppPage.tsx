import { FC, ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

const HomeAppPage: FC<Props> = ({ children }) => {
  return (
    <motion.section className="grid grid-cols-4 gap-9 gap-y-6 m-8">
      {children}
    </motion.section>
  );
};

export default HomeAppPage; 