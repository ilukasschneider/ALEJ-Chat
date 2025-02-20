import { getChannels } from "../../lib/utils";
import { useEffect, useState } from "react";
import ChatWindow from "./chatWindow";

const ChannelSelector = () => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // input until user confirms
  const [tempUserName, setTempUserName] = useState("");
  // username once confirmed
  const [userName, setUserName] = useState("");
  // controls if we show the username input box
  const [showUserNameInput, setShowUserNameInput] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getChannels();
        setChannels(data);
      } catch (err) {
        console.error("Failed to fetch channels:", err);
      }
    })();
  }, []);

  const handleConfirmUserName = () => {
    setUserName(tempUserName);
    setShowUserNameInput(false);
  };

  return (
    <div className="flex">
      {/* Drawer-Stuff */}
      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          <label htmlFor="my-drawer" className="btn btn-ghost text-xl pb-10">
            Select Channel
          </label>
          {/* If a channel is selected -> show the ChatWindow */}
          {selectedChannel && (
            <ChatWindow
              channelName={selectedChannel.name}
              endpoint={selectedChannel.endpoint}
              auth={selectedChannel.authkey}
              userName={userName}
            />
          )}
        </div>

        <div className="drawer-side">
          <label
            htmlFor="my-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>

          <ul className="menu bg-blend-darken text-light min-h-full w-120 p-4">
            {/* Username input or display */}
            <li className="mb-4">
              {showUserNameInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempUserName}
                    onChange={(e) => setTempUserName(e.target.value)}
                    placeholder="set your username"
                    className="input input-bordered input-ghost w-full"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmUserName}
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <div className="px-2 font-semibold text-lg">
                  User: {userName}
                </div>
              )}
            </li>

            {/* List of channels */}
            {channels.map((channel) => (
              <li key={channel.endpoint}>
                <button onClick={() => setSelectedChannel(channel)}>
                  {channel.name === "Recipe Rendezvous" ? (<b><u>{channel.name }</u></b>) : channel.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChannelSelector;
