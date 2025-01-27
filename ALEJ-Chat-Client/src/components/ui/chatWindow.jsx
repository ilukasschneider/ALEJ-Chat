import PropTypes from "prop-types";
import { getChannelMessages, postMessage } from "../../lib/utils";
import { useEffect, useState } from "react";

const ChatWindow = ({ name, endpoint, auth }) => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const username = "JUSTUS PAUERS";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getChannelMessages(endpoint, auth);
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, [endpoint, auth]);

  useEffect(() => {
    const sendMessage = async () => {
      try {
        await postMessage(endpoint, auth, userMessage, username);
      } catch (err) {
        console.error("Failed to post message:", err);
      }
    };

    if (userMessage) {
      sendMessage();
    }
  }, [userMessage, endpoint, auth, username]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent">
      {/*
        - Removed bg-base-100 to avoid white page background
        - If you want the entire page to be e.g. black, set bg-black or any other color here
      */}

      {/*
        If you still want a border outline (like a “mockup-window”) without a fill,
        you can keep the classes but switch background to transparent
      */}
      <div className="mockup-window border border-gray-400 bg-transparent max-w-4xl w-full mx-4">
        <div className="flex flex-col p-6 bg-transparent">
          {/* Channel info/title */}
          <div className="mb-4">
            <h2 className="text-xl font-bold">Channel: {name}</h2>
            <p className="text-sm">Endpoint: {endpoint}</p>
            <p className="text-sm">Auth Key: {auth}</p>
          </div>

          {/* Scrollable Chat Messages area */}
          <div className="p-4 overflow-y-auto mb-4 max-h-[600px] bg-transparent">
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
                {/* The green chat bubble is from chat-bubble-success (DaisyUI).
                    If you want a different color, change or remove that class. */}
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
