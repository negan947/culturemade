import { FC } from "react";
import { motion, useAnimation } from "framer-motion";
import { useDispatch } from "react-redux";
import { interfaceActions } from "@/store/interface-slice";
import HomeBar from "../SystemLayout/HomeBar";
import { getApp } from "@/components/iphone/apps/getApp";

interface Props {
  appId: string;
}

const AppView: FC<Props> = ({ appId }) => {
  const appContainer = getApp(appId);
  const dispatch = useDispatch();

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
    <motion.div layout
      className="absolute h-full w-full top-0 left-0 bg-white z-40 overflow-hidden"
      layoutId={appId}
      initial={{ borderRadius: 40, scale: 1 }}
      animate={animateExit}
    >
      <motion.div>
        {appContainer ? appContainer.element() : <p>app id not found</p>}
        <HomeBar handleHomeBar={handleDrag} handleDragEnd={handleEndDrag} />
      </motion.div>
    </motion.div>
  );
};

export default AppView; 