import { Link } from "react-router-dom";
import ChannelSelector from "./ui/channelSelector";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Navbar at the top */}
      <ChannelSelector />

      {/* Main content */}
      <div className="mt-22 px-4 flex flex-col items-center"></div>
    </div>
  );
};
export default Home;
