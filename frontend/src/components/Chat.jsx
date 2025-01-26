import React from 'react';

const Chat = () => {
    return (
        <div>
            <h1>Chatroom</h1>
                <div className="chat chat-start">
                    <div className="chat-bubble chat-bubble-primary">
                        The platypus is the best animal!
                    </div>
                </div>
                <div className="chat chat-end">
                    <div className="chat-bubble chat-bubble-success">Penguins are cooler!</div>
                </div>
                <div className="chat chat-start">
                    <div className="chat-bubble chat-bubble-primary">
                        You are right!
                    </div>
                </div>
        </div>
    )
}

export default Chat 