import PropTypes from "prop-types";
import { getChannelMessages, postMessage } from "../../lib/utils";
import { useEffect, useState } from "react";

const ChatWindow = ({ name, endpoint, auth }) => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const username = "JUSTUS PAUERS";

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

  useEffect(() => {
    // Define a function to fetch
    const fetchData = async () => {
      try {
        await postMessage(endpoint, auth, userMessage, username);
      } catch (err) {
        console.error("Failed to post message:", err);
      }
    };

    if (userMessage) {
      fetchData();
    }
  }, [userMessage]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-base-100">
      {/* Limit the width of the chat window and put some padding */}
      <div
        className="mockup-window border bg-base-300"
        style={{ maxWidth: "1600px" }}
      >
        <div className="bg-base-200 flex flex-col px-4 py-4">
          {/* Channel info/title */}
          <div className="mb-3">
            <h2 className="text-xl font-bold">Channel: {name}</h2>
            <p className="text-sm">Endpoint: {endpoint}</p>
            <p className="text-sm">Auth Key: {auth}</p>
            <br />
          </div>

          {/* Scrollable Chat Messages area */}
          <div
            className="rounded p-4 overflow-y-auto bg-base-100 mb-4"
            style={{ maxHeight: "1000px" }}
          >
            {messages.map((msg) => (
              <div key={msg.timestamp} className="chat chat-start mb-2">
                <div className="chat-header">
                  {msg.sender}
                  <time className="text-xs opacity-50 ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <div className="chat-bubble chat-bubble-success">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <input
            type="text"
            placeholder="Type here"
            className="input input-bordered w-full text-black input-warning"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setUserMessage(e.target.value);
                e.target.value = "";
              }
            }}
          />
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
