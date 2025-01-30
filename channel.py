## channel.py - a simple message channel
##

from flask import Flask, request, render_template, jsonify
import json
import requests
from datetime import datetime

from openai import OpenAI
from dotenv import dotenv_values

# for local development - delete later
from flask import Flask
from flask_cors import CORS
from profanity_check import predict, predict_prob
import re

config = dotenv_values(".env")
API_KEY = config["OPENAI-KEY"]


INVALID_ANSWER = {
    "content": "This channel is entirely about cooking. We have deleted your message because it either isnt about cooking or because it contained harmful language",
    "sender": "system",
    "extra": ""
}
WELCOME_MESSAGE = {
    "content": "🍳 Welcome to the ultimate cooking channel! 🥗✨ Here, you can tell us what you're craving—whether it's a specific cuisine, ingredients you have on hand, or just a wild cooking idea—and our AI will whip up the perfect recipe for you in seconds! Let’s make cooking fun, easy, and delicious together. Ready to get started? Type away and let the magic happen! 🍝🎉",
    "sender": "system",
    "extra": "welcome-message"
}
MAX_MESSAGES = 200

# Class-based application configuration
class ConfigClass(object):
    """ Flask application config """

    # Flask settings
    SECRET_KEY = 'This is an INSECURE secret!! DO NOT use this in production!!'

# Create Flask app
app = Flask(__name__)

# DELETE BEFORE DEPLOYMENT!!
CORS(app)  # this will allow CORS for all routes by default


app.config.from_object(__name__ + '.ConfigClass')  # configuration
app.app_context().push()  # create an app context before initializing db

HUB_URL = 'http://localhost:5555'
HUB_AUTHKEY = '1234567890'
CHANNEL_AUTHKEY = '0987654321'
CHANNEL_NAME = "The One and Only Channel"
CHANNEL_ENDPOINT = "http://localhost:5001" # don't forget to adjust in the bottom of the file
CHANNEL_FILE = 'messages.json'
CHANNEL_TYPE_OF_SERVICE = 'aiweb24:chat'

@app.cli.command('register')
def register_command():
    global CHANNEL_AUTHKEY, CHANNEL_NAME, CHANNEL_ENDPOINT

    # send a POST request to server /channels
    response = requests.post(HUB_URL + '/channels', headers={'Authorization': 'authkey ' + HUB_AUTHKEY},
                             data=json.dumps({
                                "name": CHANNEL_NAME,
                                "endpoint": CHANNEL_ENDPOINT,
                                "authkey": CHANNEL_AUTHKEY,
                                "type_of_service": CHANNEL_TYPE_OF_SERVICE,
                             }))

    if response.status_code != 200:
        print("Error creating channel: "+str(response.status_code))
        print(response.text)
        return

def check_authorization(request):
    global CHANNEL_AUTHKEY
    # check if Authorization header is present
    if 'Authorization' not in request.headers:
        return False
    # check if authorization header is valid
    if request.headers['Authorization'] != 'authkey ' + CHANNEL_AUTHKEY:
        return False
    return True

@app.route('/health', methods=['GET'])
def health_check():
    global CHANNEL_NAME
    if not check_authorization(request):
        return "Invalid authorization", 400
    return jsonify({'name':CHANNEL_NAME}),  200

# GET: Return list of messages
@app.route('/', methods=['GET'])
def home_page():
    if not check_authorization(request):
        return "Invalid authorization", 400
    # fetch channels from server
    messages = read_messages()
    #print("Messages: ", messages, type(messages), len(messages))
    if len(messages) == 0: 
        messages = add_welcome_message(messages)
        save_messages(messages)
    #print("Messages: ", messages, type(messages), len(messages))

    return jsonify(messages)


def add_welcome_message(messages):
    print("Add welcome message")
    welcome_message = WELCOME_MESSAGE.copy()
    welcome_message["timestamp"] = datetime.now().isoformat()
    messages.append(welcome_message)
    return messages


def cut_old_messages(messages):
    if len(messages) <= MAX_MESSAGES:
        return messages 

    return [messages[0]] + messages[-(MAX_MESSAGES - 1):]


def check_and_generate(message):
    client = OpenAI(api_key=API_KEY)
    model = "gpt-4o-mini"
    rules = "First of all, if this message does not have anything to do with cooking just answer with the single word NO! Otherwise follow the instructions in the message. If you provide a recipe structure them the following way: Kitchen utensils, ingredients, instructions. Mark these by enclosing them with stars **. The field instructions does not contain any subheaders. If the recipe has a specific nationality, the instructions should be followed by **Nationality: specific nationality**. Give the recipe a title, marked by double hashtags around the title like this: '##title##'."
    question = f"Message from {message['sender']}: {message['content']} - {rules}"

    # chat_completion = client.chat.completions.create(
    #     model=model,
    #     messages=[
    #         {"role": "user", "content": question},
    #     ],
    # )
    #
    # answer = chat_completion.choices[0].message.content
    answer = "##Jamaican Jerk Chicken##\n\n**Kitchen utensils:**  \n- Mixing bowl  \n- Whisk  \n- Grill or grill pan  \n- Meat thermometer  \n- Basting brush  \n\n**Ingredients:**  \n- 4 chicken thighs (bone-in, skin-on)  \n- 1 tablespoon allspice  \n- 1 tablespoon dried thyme  \n- 1 tablespoon brown sugar  \n- 1 teaspoon cayenne pepper  \n- 1 teaspoon black pepper  \n- 1 teaspoon salt  \n- 1 teaspoon cinnamon  \n- 2 cloves garlic (minced)  \n- 1 inch piece of ginger (grated)  \n- 2 scallions (chopped)  \n- 1 lime (juiced)  \n- 2 tablespoons vegetable oil  \n\n**Instructions:**  \nIn a mixing bowl, combine allspice, thyme, brown sugar, cayenne pepper, black pepper, salt, cinnamon, garlic, ginger, scallions, lime juice, and vegetable oil. Whisk together until well blended. Add chicken thighs to the marinade, ensuring they are well coated. Cover and refrigerate for at least 4 hours, or ideally overnight. Preheat your grill to medium-high heat. Remove chicken from the marinade and place it on the grill, skin side down. Grill for about 7-8 minutes, then flip and cook another 7-8 minutes or until the internal temperature reaches 165\u00b0F (75\u00b0C). Baste with leftover marinade during the last few minutes of cooking for extra flavor. Let the chicken rest for a few minutes before serving.\n\n**Nationality: Jamaican**"
    if answer.startswith("NO!"):
        invalid_answer = INVALID_ANSWER.copy()
        invalid_answer["timestamp"] = datetime.now().isoformat()
        
        return [invalid_answer]

    else:
        extra = ""
        if '**nationality:' in answer.lower():
            print("in if")
            extra, answer = get_word_after_nationality(answer)
        valid_answer = {
            "content": answer,
            "sender": "system",
            "timestamp": datetime.now().isoformat(),
            "extra": extra
        }
        return [message, valid_answer]

def get_word_after_nationality(text):
    # Regular expression to find "nationality" followed by a word
    text = text.lower()
    match = re.search(r'nationality:\s+(\w+)', text, re.IGNORECASE)
    if match:
        following_word = match.group(1)
        print("FOLLOWING WORD: ", following_word)
        cleaned_text = re.sub(r'\*\*Nationality:\s*\w+\*\*', '', text, flags=re.IGNORECASE).strip()
        print(cleaned_text)
        return following_word, cleaned_text
    return None

# POST: Send a message
@app.route('/', methods=['POST'])
def send_message():
    # fetch channels from server
    # check authorization header
    if not check_authorization(request):
        return "Invalid authorization", 400
    # check if message is present
    message = request.json
    if not message:
        return "No message", 400
    if not 'content' in message:
        return "No content", 400
    if not 'sender' in message:
        return "No sender", 400
    if not 'timestamp' in message:
        return "No timestamp", 400
    if not 'extra' in message:
        extra = None
    else:
        extra = message['extra']
    # add message to messages
    print("Will predict")
    contains_swearing = predict([message["content"]])
    print(contains_swearing)

    if predict([message["content"]]):
        invalid_answer = INVALID_ANSWER.copy()
        invalid_answer["timestamp"] = datetime.now().isoformat()
        new_messages = [invalid_answer]
    else:
        new_messages = check_and_generate(message)
        

    messages = read_messages()

    if len(messages) == 0: messages = add_welcome_message(messages)

    # messages.append({'content': message['content'],
    #                  'sender': message['sender'],
    #                  'timestamp': message['timestamp'],
    #                  'extra': extra,
    #                  })
    messages.extend(new_messages)
    if len(messages) >= MAX_MESSAGES:
        messages = cut_old_messages(messages)
    save_messages(messages)
    return "OK", 200

def read_messages():
    global CHANNEL_FILE
    try:
        f = open(CHANNEL_FILE, 'r')
    except FileNotFoundError:
        return []
    try:
        messages = json.load(f)
    except json.decoder.JSONDecodeError:
        messages = []
    f.close()
    return messages

def save_messages(messages):
    global CHANNEL_FILE
    with open(CHANNEL_FILE, 'w') as f:
        json.dump(messages, f)

# Start development web server
# run flask --app channel.py register
# to register channel with hub

if __name__ == '__main__':
    app.run(port=5001, debug=True)
