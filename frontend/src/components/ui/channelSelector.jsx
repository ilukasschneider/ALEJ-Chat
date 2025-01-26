import { getChannels } from "../../../lib/utils";
import { useEffect, useState } from "react";
import ChatWindow from "./chatWindow";

const ChannelSelector = () => {
  // Sates for the channels and error (if needed)
  const [channels, setChannels] = useState([]);

  // State for current selected channel
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Fetching channels from the hub with getChannels() from utils.js
  useEffect(() => {
    (async () => {
      try {
        const data = await getChannels(); // getChannels() returns an array
        setChannels(data);
      } catch (err) {
        console.error("Failed to fetch channels:", err);
      }
    })();
  }, []);

  return (
    <>
      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          <label htmlFor="my-drawer" className="btn btn-ghost text-xl">
            Select Channel
          </label>
        </div>
        <div className="drawer-side">
          <label
            htmlFor="my-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
            {/* Sidebar content here */}

            {channels.map((channel) => (
              <li key={channel.endpoint}>
                <a onClick={() => setSelectedChannel(channel)}>
                  {channel.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Shows a Chat Window when a channel was selected (inside the channel Selector) */}
      {selectedChannel ? (
        <ChatWindow
          name={selectedChannel.name}
          endpoint={selectedChannel.endpoint}
          auth={selectedChannel.authkey}
        />
      ) : (
        <p></p>
      )}
    </>
  );
};

export default ChannelSelector;
