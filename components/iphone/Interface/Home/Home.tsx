import { RootState } from "@/store/store";
import { getAllApps } from "@/components/iphone/apps/getApp";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import Dock from "./Dock";
import HomeAppPage from "./HomeAppPage";
import HomeAppShortcut from "./HomeAppShortcut";

const Home = () => {
  const inApp = useSelector((state: RootState) => state.interface.inApp);
  const apps = getAllApps();

  return (
    <motion.section layout
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
      className="flex flex-col h-full pt-10 pb-safe-bottom sm:pb-0"
    >
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