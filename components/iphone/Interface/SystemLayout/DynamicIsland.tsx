import { interfaceActions } from "@/store/interface-slice";
import { useDispatch } from "react-redux";

const DynamicIsland = () => {
  const dispatch = useDispatch();

  return (
    <div
      onClick={() => {
        dispatch(interfaceActions.exitApp());
      }}
      className="z-50 absolute left-1/2 -translate-x-1/2 rounded-full bg-black pointer-events-auto shadow-lg"
      style={{
        width: '126px',
        height: '37px',
        top: '11px',
        borderRadius: '19px',
      }}
    />
  );
};

export default DynamicIsland; 