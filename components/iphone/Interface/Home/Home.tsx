import { RootState } from "@/store/store";
import { getAllApps } from "@/components/iphone/apps/getApp";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { interfaceActions } from "@/store/interface-slice";
import Dock from "./Dock";
import HomeAppPage from "./HomeAppPage";
import HomeAppShortcut from "./HomeAppShortcut";

const Home = () => {
  const inApp = useSelector((state: RootState) => state.interface.inApp);
  const dispatch = useDispatch();
  const apps = getAllApps();

  const handleLock = () => {
    dispatch(interfaceActions.lock());
  };

  return (
    <motion.section
      key={"home"}
      animate={{
        filter: inApp ? "blur(4px)" : "blur(0px)",
        scale: inApp ? 0.95 : 1,
      }}
      transition={{
        scale: {
          type: "spring",
          bounce: 0.1,
        },
      }}
      className="flex flex-col h-full pt-10 relative sf-pro-text"
    >
      {/* Lock Button - iOS style */}
      <motion.button
        onClick={handleLock}
        className="absolute top-2 right-4 z-40 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white/90 transition-all duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Lock Screen"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <circle cx="12" cy="16" r="1"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </motion.button>

      <HomeAppPage>
        {apps.map((app) => (
          <HomeAppShortcut
            appId={app.appId}
            icon={app.icon}
            key={app.appId}
            name={app.name}
          />
        ))}
      </HomeAppPage>
      <Dock />
    </motion.section>
  );
};

export default Home; 