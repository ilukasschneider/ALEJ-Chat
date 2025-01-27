import PropTypes from "prop-types";
import { getChannelMessages } from "../../lib/utils";
import { useEffect, useState } from "react";

const ChatWindow = ({ name, endpoint, auth }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Define a function to fetch
    const fetchData = async () => {
      try {
        const data = await getChannelMessages(endpoint, auth);
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    // Immediately fetch once on mount
    fetchData();

    // Then set up an interval to fetch every 1000 ms
    const intervalId = setInterval(fetchData, 1000);

    // Cleanup: clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [endpoint, auth]);

  return (
    <div className="mx-auto max-w-xl p-4">
      {/* Mockup Window wrapper */}
      <div className="mockup-window border bg-base-300">
        <div className="bg-base-200 flex flex-col px-4 py-4">
          {/* Channel info/title */}
          <div className="mb-3">
            <h2 className="text-xl font-bold">Channel: {name}</h2>
            <p className="text-sm">Endpoint: {endpoint}</p>
            <p className="text-sm">Auth Key: {auth}</p>
            <br />
          </div>

          {/* Chat messages area */}
          <div className="border border-base-300 rounded h-64 p-8 overflow-y-auto bg-base-100">
            {messages.map((msg) => (
              <div key={msg.timestamp} className="chat chat-start">
                <div className="chat-header">
                  {msg.sender}
                  <time className="text-xs opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

ChatWindow.propTypes = {
  name: PropTypes.string.isRequired,
  endpoint: PropTypes.string.isRequired,
  auth: PropTypes.string.isRequired,
};

export default ChatWindow;
