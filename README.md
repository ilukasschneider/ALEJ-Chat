# ALEJ-Chat: Task 3
**AI & the Web, Winter Term 2024/2025**

This repository contains the code for the third project in the university course “AI & the Web.” It demonstrates how to create a chat-like web application that uses different components (hub, channel, client) along with a React frontend.

---
## Content
The channel we developed is entirely about cooking. It holds an API connection to ChatGPT such that recipe requests can be made. Messages containing harmful language or content unrelated to cooking are filtered out.
The requests can have different intentions, you can provide a list of ingredients or just formulate a vague idea for a recipe, both will prove successful.
This may also include a list of ingredients that should NOT be included. 
The channel only holds a maximum of 200 messages, if this limit is exceeded the oldest messages will iteratively be deleted.
Messages can be filtered according to their nationality and their taste (sweet/savory).

## Prerequisites
Make sure you have the following installed and updated:
- **Python**  
- **Node.js** and **npm**

## Installation & Setup

1. **Clone the repository**:

   `git clone https://github.com/ilukasschneider/ALEJ-Chat.git`  
   `cd ALEJ-Chat`

2. **Install dependencies**:

   `pip install -r requirements.txt`

3. **Add Your OpenAI API Key**

    Create a file named `.env` in the project’s root directory, then paste your key in the following format:

    `OPENAI-KEY=your key`

---

## Running the Server Components
After installing dependencies, follow these steps to run the hub, channel server, and client:

1. **Start the hub**:  
   `python hub.py`  
   This will serve as the central hub for communication.

2. **Run the channel server** (in a separate terminal/shell):  
   `python channel.py`

3. **Register the channel server with the hub** (in another separate terminal/shell):  
   `flask --app channel.py register`  
   This step ensures the channel server is properly recognized by the hub.

---

## Running the React Client Frontend
If you prefer a more modern interface, follow these steps to use the React frontend:

1. Ensure **Node.js** and **npm** are installed.
2. Navigate to the React application folder:
   `cd ALEJ-Chat-Client`
3. Install the necessary dependencies:
   `npm install`
4. Start the development server:
   `npm run dev`  
