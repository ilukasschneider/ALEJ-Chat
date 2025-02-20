import PropTypes from "prop-types";
import { getChannelMessages, postMessage } from "../../lib/utils";
import { useEffect, useState, useRef } from "react";
import DOMPurify from 'dompurify';

const ChatWindow = ({ channelName, endpoint, auth, userName }) => {
  console.log(channelName, endpoint, auth, userName)
  const [messages, setMessages] = useState([]);
  // const [userMessage, setUserMessage] = useState("");
  const [inputStatus, setInputStatus] = useState(true);
  const [inputValue, setInputValue] = useState("");
  // Variables to toggle visibility of different components
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [showNationalities, setShowNationalities] = useState(false);
  const [showTastes, setShowTastes] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  // filtering components
  const [nationalities, setNationalities] = useState([]);
  const [tastes, setTastes] = useState([]);// State for nationalities
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [recognitionSupported, setRecognitionSupported] = useState(false)

  const currentUserName = userName || "Anonymous";

  // reference for last message
  const messagesEndRef = useRef(null);

  // wait 5 seconds before allowing the user to send another message
  // useEffect(() => {
  //   setTimeout(() => {
  //     setInputStatus(true);
  //   }, 8000);
  // }, [inputStatus]);

  // Check for speech recognition support
  useEffect(() => {
    window.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (window.SpeechRecognition) {
      setRecognitionSupported(true);
    }
  }, []);
  // automatically scroll to bottom whenever messages change
  useEffect(() => {
    console.log("Will scroll down")
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // automatically fetch messages at regular intervals
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [endpoint, auth]);

  // Function to fetch data from the API
  const fetchData = async () => {
    try {
      const data = await getChannelMessages(endpoint, auth);

      // console.log(!isDataEqual(data))
      if (!isDataEqual(data)) {
        console.log("Sets new Messages")
        console.log(data.at(-1))
        setMessages(data);
        setFilteredMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };
  // determine if the new data is equal to the current state data
  const isDataEqual = (newMessages) => {
    // console.log(newMessages)
    // console.log(messages)

    if (newMessages.length !== messages.length) {
      return false;
    }
    // console.log(JSON.stringify(newMessages.at(-1)))
    // console.log(JSON.stringify(messages.at(-1)))
    console.log(JSON.stringify(newMessages.at(-1)) === JSON.stringify(messages.at(-1)))
    return JSON.stringify(newMessages.at(-1)) === JSON.stringify(messages.at(-1))
    return newMessages.every((obj, index) => {
      console.log([JSON.stringify(obj), JSON.stringify(messages[index])])
      console.log(JSON.stringify(obj) === JSON.stringify(messages[index]))
      return JSON.stringify(obj) === JSON.stringify(messages[index]);
    });
  };
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

  // send a message to the server
  const onSendMessage = async (message) => {
    setInputStatus(false); // disable the input area
    if (!message) return;
    try {
      await postMessage(endpoint, auth, message, currentUserName);
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setInputStatus(true);
      fetchData();
      setInputValue(""); // Clear input after sending
    }
  };

  // toggle the visibility of the welcome message
  const toggleWelcome = () => {
    setIsWelcomeVisible(!isWelcomeVisible);
  };

  // toggle the visibility of the filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (showFilters) {
      setShowNationalities(false); // Hide nationalities when hiding filters
      setShowTastes(false); // Hide tastes when hiding filters
    }
  };

  // formating of the messages to display them in a clear and structured way
  const formatMessageContent = (content, extra) => {
    
    // extract the nationality of the extra field
    const nationality =
      extra && extra.trim() !== ""
      ? (extra.match(/Nationality:\s*([^,]+)/i) || [])[1]?.trim() || ""
      : "";
    const categoryMatch = extra && extra.match(/Category:\s*(\w+)/i);

    // extract the taste category of the extra field
    const category = categoryMatch ? categoryMatch[1].toLowerCase() : "";

    // Set emoji based on the category
    const emoji =
      category === "sweet" ? "🍰" : category === "savory" ? "🍲" : "";

    content = DOMPurify.sanitize(content).replace(/\\b([^\\]+)\\b/g, '<b>$1</b>').replace(/\\i([^\\]+)\\i/g, '<i>$1</i>').replace(/\\u([^\\]+)\\u/g, '<u>$1</u>');

    // extract the title and the subsections of the recipe
    const sections = content.split(/(?=##|\*\*)/);

    return (
      <div>
        {sections.map((section, index) => {
          if (section.startsWith("##")) {
            // Display title larger and bold, remove ##, add the emoji around the title and the nationality
            let title = section.replace("##", "").trim();
            return (
              <h3 key={index} className="font-bold text-lg mb-2">
                {emoji && `${emoji} `}
                {title}
                {emoji && `${emoji} `}
                {nationality && (
                  <span
                    style={{
                      fontWeight: "normal",
                      fontSize: "small",
                      fontStyle: "italic",
                    }}
                  >
                    {" ("}
                    {nationality}
                    {")"}
                  </span>
                )}
              </h3>
            );

          // if the section starts with ** it is a subsection
          } else if (section.startsWith("**")) {
            // Handle subsection title
            const subsectionParts = section.split("\n");
            const title = subsectionParts[0]
              .replace(/\*\*/g, "")
              .replace(":", "")
              .trim(); // Remove ** and colon
            const content = subsectionParts.slice(1).join("\n").trim(); // Content following the title
            
            return (
              <div key={index} className="mb-3">
                <div className="underline font-semibold mb-1">{title}</div>
                <div dangerouslySetInnerHTML={{ __html: content }}>{/*content*/}</div>
              </div>
            );
          } else {
            // Display content normally if not matched
            return <div key={index} dangerouslySetInnerHTML={{ __html: section.trim() }}>{/*section.trim()*/}</div>;
          }
        })}
      </div>
    );
  };

  // store the unique nationalities of all the messages
  // is called when the respective filter button is clicked
  // toggles the visibility of the filter choices
  const extractNationalities = () => {
  if (!showNationalities) {
    const uniqueNationalities = Array.from(
      new Set(
        messages
          .map((msg) => {
            const match =
              msg.extra && msg.extra.match(/Nationality:\s*([^,]+)/i);
            return match ? match[1].trim() : null;
          })
          .filter(Boolean),
      ),
    );
    setNationalities(uniqueNationalities);
  }
  setShowNationalities(!showNationalities);
};

  // store the unique tastes of all the messages
  // is called when the respective filter button is clicked
  // toggles the visibility of the filter choices
  const extractTastes = () => {
    if (!showTastes){
      const uniqueTastes = Array.from(
          new Set(messages.map((msg) => { const match = msg.extra && msg.extra.match(/Category:\s*(\w+)/i);
          return match ? match[1].toLowerCase(): null;
          }).filter(Boolean),
              ),
      );
      setTastes(uniqueTastes);
    }
    setShowTastes(!showTastes);
  };

  // filters the messages by a specified nationality
  const filterMessagesByNationality = (nationality) => {
    const filtered = messages.filter(
      (msg) => msg.extra && msg.extra.includes(`Nationality: ${nationality}`),
    );
    setFilteredMessages(filtered);
  };

  // filters the messages by a specified taste
  const filterMessagesByTaste = (taste) => {
    const filtered = messages.filter(
        (msg) => msg.extra && msg.extra.includes(`Category: ${taste}`),
    );
    setFilteredMessages((filtered));
  };

  // is called if the respective button is clicked
  // resets the filtered messages to all messages available
  const showAllMessages = () => {
    setFilteredMessages(messages);
  };

  // Speech recognition logic
  const startSpeechRecognition = () => {
    // if speech recognition is not supported in the browser, inform the user and return
    if (!recognitionSupported){
      alert("Sorry, it seems like your browser does not support speech recognition!")
      return;
    }
    const recognition = new window.SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    // user message is the recognized speech
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInputValue(speechToText);
      onSendMessage(speechToText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  return (
    <>
      <div className="flex items-center justify-center bg-transparent">
        <div className="mockup-window border border-gray-400 bg-transparent max-w-8xl w-full mx-4">
          <div className="flex flex-col p-6 bg-transparent">
            {/* Channel info and title */}
            <div className="mb-2">
              <h2 className="text-4xl font-bold relative bottom-4">
                {channelName}
              </h2>
              {/*<p className="text-sm">Endpoint: {endpoint}</p>
            <p className="text-sm">Auth Key: {auth}</p>*/}
            </div>

            {/* Scrollable Chat Messages area */}
            <div
                className=" overflow-y-auto mb-4 max-h-[700px] bg-transparent"
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
              {messages.some((msg) =>
                  msg.extra?.includes("welcome-message"),
              ) && (
                  <div className="sticky top-0 left-0 right-0 bg-black rounded-xl z-20 p-2 ">
                    {(() => {
                      const welcomeMsg = messages.find((msg) =>
                          msg.extra?.includes("welcome-message"),
                      );
                      return (
                          <div
                              className={`sticky top-0 left-0 right-0 z-20 rounded transition-all duration-300 ease-in-out`}
                          >
                            <div
                                className="flex justify-between items-center cursor-pointer px-2 py-1"
                                onClick={toggleWelcome}
                            >
                          <span className="text-sm font-semibold">
                            Welcome Message
                          {/*  functionality to hide or show the welcome message*/}
                          </span>
                              <button className="btn-ghost">
                                {isWelcomeVisible ? "Hide ▲" : "Show ▼"}
                              </button>
                            </div>

                            {isWelcomeVisible && (
                                <div className="mt-2">
                                  <div className="chat-bubble bg-black text-xl">
                                    {welcomeMsg.content}
                                  </div>
                                </div>
                            )}
                          </div>
                      );
                    })()}
                  </div>
              )}

              {/* Display all other messages except the pinned welcome message */}
              <div className="pt-4">
                {filteredMessages
                    .filter((msg) => !msg.extra?.includes("welcome-message"))
                    .map((msg) => (
                        <div
                            key={msg.timestamp}
                            className={`chat ${msg.sender === currentUserName ? " chat-end" : "chat-start"} mb-2`}
                        >
                          <div className="chat-header">
                            {msg.sender}
                            <time className="text-xs opacity-50 ml-2">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          </div>
                          <div
                              className={`chat-bubble ${msg.sender === currentUserName ? " chat-bubble-primary" : "chat-bubble"}`}
                          >
                            {/*display the messages in the desired format*/}
                            {formatMessageContent(msg.content, msg.extra)}
                          </div>
                          {/*<div className="chat-bubble">{msg.content}</div>*/}
                        </div>
                    ))}
              </div>

              {/* div to scroll to -> Last Message */}
              <div ref={messagesEndRef}/>
            </div>

            {/*button to hide and show the filter buttons*/}
            <div className="flex justify-end my-4">
              <button className="btn-ghost" onClick={toggleFilters}>
                {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
              </button>
            </div>
            {/*the two filter buttons nationalities and taste*/}
            {showFilters && (
              <div className="flex justify-end my-4">
                <button className="btn-ghost" onClick={extractNationalities}>
                  Nationalities
                </button>
                <button className="btn-ghost ml-2" onClick={extractTastes}>
                  Taste
                </button>
              </div>
            )}

            {/*if one of the filter buttons is clicked show the different choices they provide*/}
            {showNationalities && (
                <div className="flex justify-end my-4 overflow-y-auto max-h-32 border p-2">
                  {nationalities.map((nat, index) => (
                      // background of the choices marks the choices when hovering over them
                      <p
                          key={index}
                          onClick={() => filterMessagesByNationality(nat)}
                          className="cursor-pointer mb-1 mx-2 px-2 py-1 hover:bg-gray-200 transition-colors duration-200"
                          style={{borderRadius: "4px", transition: "background-color 0.3s"}}
                      >
                        {nat}
                      </p>
                  ))}
                </div>
            )}
            {/*same functionality as the button above*/}
            {showTastes && (
                <div className="flex justify-end my-4 overflow-y-auto max-h-32 border p-2">
                  {tastes.map((taste, index) => (
                      <p
                          key={index}
                          onClick={() => filterMessagesByTaste(taste)}
                          className="cursor-pointer mb-1 mx-2 px-2 py-1 hover:bg-gray-200 transition-colors duration-200"
                          style={{borderRadius: "4px", transition: "background-color 0.3s"}}
                      >
                        {taste}
                      </p>
                  ))}
                </div>
            )}

            {/*if only filtered messages are shown a button appears offering the possibility to show all messages again*/}
            {filteredMessages.length !== messages.length && (
                <div className="flex justify-end my-2">
                  <button className="btn-ghost" onClick={showAllMessages}>
                    Show All Messages
                  </button>
                </div>
            )}
            {/* Input area switches to little loading animation for 8 seconds after writing a message*/}
            {inputStatus ? (
                <div className="flex items-center">
                  <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type here and press enter to send a message"
                      className="input input-bordered w-full input-ghost"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSendMessage(inputValue);
                          e.target.value = "";
                          setInputValue("");
                        }
                      }}
                  />
                  {/*{recognitionSupported && (*/}
                  {/*button to start speech recognition*/}
                      <button
                          className="btn-ghost ml-2"
                          onClick={startSpeechRecognition}
                      >
                        🎤
                      </button>
                  {/*)}*/}
                </div>

            ) : (
                <div className="flex justify-center">
                  <span className="loading loading-infinity loading-lg"></span>
                </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

ChatWindow.propTypes = {
  channelName: PropTypes.string.isRequired,
  endpoint: PropTypes.string.isRequired,
  auth: PropTypes.string.isRequired,
  userName: PropTypes.string,
};

export default ChatWindow;