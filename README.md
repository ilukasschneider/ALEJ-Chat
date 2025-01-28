# Start Code for Task 3

AI & the Web, winter term 2024/2025

## Running the code on your development server

1. Create and activate a virtual environment, install everything from requirements.txt

2. Run hub

    > python hub.py

3. Run the channel server (different shell)

    > python channel.py

4. Register the channel server with the hub (another different shell)

    > flask --app channel.py register
    
~~5. Now open the client from step 3 (URL is displayed in the terminal)~~

5. run client - No need for this if you run the react part 
    > python client.py
    
6. Now open the client from step 5 (URL is displayed in the terminal)


## Run the react part

1. Have npm and nodejs installed

2. change into ALEJ-Chat-Client directory

3. run 
    > npm install 

4. run
    > npm run dev

5. Open link shown in console

6. Develop stuff in src/components - base routing in App.jsx
