import PropTypes from "prop-types";
import { getChannelMessages, postMessage } from "../../lib/utils";
import { useEffect, useState, useRef } from "react";

const ChatWindow = ({ channelName, endpoint, auth, userName }) => {
  const [messages, setMessages] = useState([]);
  // const [userMessage, setUserMessage] = useState("");
  const [inputStatus, setInputStatus] = useState(true);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);

  const currentUserName = userName || "Anonymous";

  // reference for last message
  const messagesEndRef = useRef(null);

  // wait 5 seconds before allowing the user to send another message
  // useEffect(() => {
  //   setTimeout(() => {
  //     setInputStatus(true);
  //   }, 8000);
  // }, [inputStatus]);

  // automatically scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {

    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [endpoint, auth]);

  
  const fetchData = async () => {
    try {
      const data = await getChannelMessages(endpoint, auth);

      if (!isDataEqual(data)) setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const isDataEqual = (newMessages) => {
    if (newMessages.length !== messages.length) {
      return false;
    }
    return newMessages.every((obj, index) => {
        return JSON.stringify(obj) === JSON.stringify(messages[index]);
    });
  }
  // useEffect(() => {
  //   const sendMessage = async () => {
  //     try {
  //       await postMessage(endpoint, auth, userMessage, currentUserName);
  //     } catch (err) {
  //       console.error("Failed to post message:", err);
  //     }
  //   };

  //   if (userMessage) {
  //     sendMessage();
  //   }
  // }, [userMessage, endpoint, auth, currentUserName]);


  const onSendMessage = async (message) => {
    setInputStatus(false)
    if (!message) return
    try {
      await postMessage(endpoint, auth, message, currentUserName);
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setInputStatus(true)
      fetchData()
    }
  }

  const toggleWelcome = () => {
    setIsWelcomeVisible(!isWelcomeVisible);
  };


  return (
    <div className="flex items-center justify-center bg-transparent">
      <div className="mockup-window border border-gray-400 bg-transparent max-w-4xl w-full mx-4">
        <div className="flex flex-col p-6 bg-transparent">
          {/* Channel info and title */}
          <div className="mb-2">
            <h2 className="text-xl font-bold">{channelName}</h2>
            {/*<p className="text-sm">Endpoint: {endpoint}</p>
            <p className="text-sm">Auth Key: {auth}</p>*/}
          </div>

          {/* Scrollable Chat Messages area */}
          <div
            className=" overflow-y-auto mb-4 max-h-[600px] bg-transparent"
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

            {/* Pin the welcome message at the absolute top -> Change bg color to actual bg color - havent found yet*/}
            {messages.some((msg) => msg.extra?.includes("welcome-message")) && (
              <div className="sticky top-0 left-0 right-0 bg-neutral-800 z-20 p-4 shadow-md">
                {(() => {
                  const welcomeMsg = messages.find((msg) =>
                    msg.extra?.includes("welcome-message")
                  );
                  return (
                    <div
                      className={`sticky top-0 left-0 right-0 z-20 rounded transition-all duration-300 ease-in-out`}
                    >
                      <div
                        className="flex justify-between items-center cursor-pointer px-2 py-1"
                        onClick={toggleWelcome}
                      >
                        <span className="text-sm font-semibold">Welcome Message</span>
                        <button className="text-xs text-blue-500">
                          {isWelcomeVisible ? "Hide ▲" : "Show ▼"}
                        </button>
                      </div>

                      {isWelcomeVisible && (
                        <div className="mt-2">
                          <div className="chat-header text-sm">
                            {welcomeMsg.sender}
                            <time className="text-xs opacity-50 ml-2">
                              {new Date(welcomeMsg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          </div>
                          <div className="chat-bubble text-sm">{welcomeMsg.content}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Display all other messages except the pinned welcome message */}
            <div className="pt-4">
              {messages
                .filter((msg) => !msg.extra?.includes("welcome-message"))
                .map((msg) => (
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
            </div>

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
                  onSendMessage(e.target.value)
                  //setUserMessage(e.target.value);
                  e.target.value = "";
                  //setInputStatus(false);
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
