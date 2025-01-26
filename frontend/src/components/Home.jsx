import React from 'react';
import { Link } from 'react-router-dom';

const Chat = () => {
    return (
        <div>
            <h1>Home sweet Home</h1>
            <Link to="/chat">
            <button className="btn btn-primary">Open Chat</button>
            </Link>
        </div>
    )
}

export default Chat 