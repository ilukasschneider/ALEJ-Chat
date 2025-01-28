import PropTypes from "prop-types";
import { getChannelMessages, postMessage } from "../../lib/utils";
import { useEffect, useState, useRef } from "react";

const ChatWindow = ({ channelName, endpoint, auth, userName }) => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [inputStatus, setInputStatus] = useState(true);

  const currentUserName = userName || "Anonymous";

  // reference for last message
  const messagesEndRef = useRef(null);

  // wait 5 seconds before allowing the user to send another message
  useEffect(() => {
    setTimeout(() => {
      setInputStatus(true);
    }, 8000);
  }, [inputStatus]);

  // automatically scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        await postMessage(endpoint, auth, userMessage, currentUserName);
      } catch (err) {
        console.error("Failed to post message:", err);
      }
    };

    if (userMessage) {
      sendMessage();
    }
  }, [userMessage, endpoint, auth, currentUserName]);

  return (
    <div className="flex items-center justify-center bg-transparent">
      <div className="mockup-window border border-gray-400 bg-transparent max-w-4xl w-full mx-4">
        <div className="flex flex-col p-6 bg-transparent">
          {/* Channel info and title */}
          <div className="mb-4">
            <h2 className="text-xl font-bold">{channelName}</h2>
            <p className="text-sm">Endpoint: {endpoint}</p>
            <p className="text-sm">Auth Key: {auth}</p>
          </div>

          {/* Scrollable Chat Messages area */}
          <div
            className="p-4 overflow-y-auto mb-4 max-h-[600px] bg-transparent pt-10"
            style={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE 10+
            }}
          >
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
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
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {/* div to scroll to -> Last Message */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area switches to little loading animation for 8 seconds after writing a message*/}
          {inputStatus ? (
            <input
              type="text"
              placeholder="type here and press enter to send a message"
              className="input input-bordered w-full input-ghost"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setUserMessage(e.target.value);
                  e.target.value = "";
                  setInputStatus(false);
                }
              }}
            />
          ) : (
            <div className="flex justify-center">
              <span className="loading loading-infinity loading-lg"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ChatWindow.propTypes = {
  channelName: PropTypes.string.isRequired,
  endpoint: PropTypes.string.isRequired,
  auth: PropTypes.string.isRequired,
  userName: PropTypes.string,
};

export default ChatWindow;
