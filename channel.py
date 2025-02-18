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

# constant messages

# system response for messages containing harmful language
INVALID_ANSWER_PROFANITY = {
    "content": "This channel is entirely about cooking. We have deleted your message because it contained harmful language.",
    "sender": "system",
    "extra": ""
}
# system response for messages off-topic
INVALID_ANSWER_TOPIC = {
    "content": "This channel is entirely about cooking. We have deleted your message because it contained a request that was not related to cooking.",
    "sender": "system",
    "extra": ""
}
# welcome message of the channel, is always displayed and never deleted
WELCOME_MESSAGE = {
    "content": "🍳 Welcome to the ultimate cooking channel! 🥗✨ Here, you can tell us what you're craving—whether it's a specific cuisine, ingredients you have on hand, or just a wild cooking idea—and our AI will whip up the perfect recipe for you in seconds! Let’s make cooking fun, easy, and delicious together. Ready to get started? Type away and let the magic happen! 🍝🎉",
    "sender": "system",
    "extra": "welcome-message"
}

# maximum number of stored messages
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

# hub communication constants
HUB_URL = 'http://localhost:5555'
HUB_AUTHKEY = '1234567890'
CHANNEL_AUTHKEY = '0987654321'
CHANNEL_NAME = "Recipe Rendezvous"
CHANNEL_ENDPOINT = "http://localhost:5001" # don't forget to adjust in the bottom of the file
CHANNEL_FILE = 'messages.json'
CHANNEL_TYPE_OF_SERVICE = 'aiweb24:chat'

@app.cli.command('register')
def register_command():
    """command to register the channel with the hub"""
    global CHANNEL_AUTHKEY, CHANNEL_NAME, CHANNEL_ENDPOINT

    # send a POST request to server /channels
    response = requests.post(HUB_URL + '/channels', headers={'Authorization': 'authkey ' + HUB_AUTHKEY},
                             data=json.dumps({
                                "name": CHANNEL_NAME,
                                "endpoint": CHANNEL_ENDPOINT,
                                "authkey": CHANNEL_AUTHKEY,
                                "type_of_service": CHANNEL_TYPE_OF_SERVICE,
                             }))

    # check for registration success
    if response.status_code != 200:
        print("Error creating channel: "+str(response.status_code))
        print(response.text)
        return

def check_authorization(request):
    """check if the request is authorized using the authorization header"""
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
    """check the status of the service"""
    global CHANNEL_NAME
    if not check_authorization(request):
        return "Invalid authorization", 400
    return jsonify({'name':CHANNEL_NAME}),  200

# GET: Return list of messages
@app.route('/', methods=['GET'])
def home_page():
    """get all messages; if there aren't any, add welcome message"""
    if not check_authorization(request):
        return "Invalid authorization", 400
    # read the stored messages
    messages = read_messages()

    if len(messages) == 0:
        # if no messages exist add the welcome message
        messages = add_welcome_message(messages)
        save_messages(messages)

    return jsonify(messages)


def add_welcome_message(messages):
    """add the welcome message to the messages list"""
    welcome_message = WELCOME_MESSAGE.copy()
    welcome_message["timestamp"] = datetime.now().isoformat()
    messages.append(welcome_message)
    return messages


def cut_old_messages(messages):
    """delete older message if the limit is exceeded"""
    if len(messages) <= MAX_MESSAGES:
        return messages

    # skip the welcome message when deleting
    return [messages[0]] + messages[-(MAX_MESSAGES - 1):]


def check_and_generate(message):
    """check message content and return generated response or invalid message"""
    client = OpenAI(api_key=API_KEY)
    model = "gpt-4o-mini"
    # prompt engineering
    # rules for generating responses to be able to correctly format the answer
    # includes content check (requests must have to do with cooking
    rules = "First of all, if this message does not have anything to do with cooking just answer with the single word NO! Otherwise follow the instructions in the message. If you provide a recipe structure them the following way: Kitchen utensils, ingredients, instructions. Mark these by enclosing them with stars **. The field instructions does not contain any subheaders. If the recipe has a specific nationality, the instructions should be followed by **Nationality: specific nationality**. Give the recipe a title, marked by double hashtags before the title like this: '##title'. At the end of your answer you should specify if the recipe is sweet or savory this way **Category: sweet**"
    question = f"Message from {message['sender']}: {message['content']} - {rules}"

    # chat completion API call to OpenAI
    chat_completion = client.chat.completions.create(
         model=model,
         messages=[
             {"role": "user", "content": question},
         ],
     )

    answer = chat_completion.choices[0].message.content

    # process answer
    if answer.startswith("NO!"):
        # user request has unsuited content
        invalid_answer = INVALID_ANSWER_TOPIC.copy()
        invalid_answer["timestamp"] = datetime.now().isoformat()

        return [invalid_answer]

    else:
        # modify the extra fielt for filtering purposes
        extra = ""
        # nationality of the dish
        if '**nationality:' in answer.lower():
            print("in if")
            nationality, answer = get_word_after_nationality(answer)
            extra += f'Nationality: {nationality} ,'

        # category of the dish (sweet or savory)
        if '**category:' in answer.lower():
            category, answer = get_category(answer)
            extra += f'Category: {category} '
        valid_answer = {
            "content": answer,
            "sender": "system",
            "timestamp": datetime.now().isoformat(),
            "extra": extra
        }
        return [message, valid_answer]

def get_category(text):
    """extract taste category from text"""
    # regular expression to find "category" followed by a word
    match = re.search(r'category:\s+(\w+)', text, re.IGNORECASE)
    if match:
        category = match.group(1)
        # delete the category snippet
        cleaned_text = re.sub(r'\*\*Category:\s*\w+\*\*', '', text, flags=re.IGNORECASE).strip()
        return category, cleaned_text
    return None

def get_word_after_nationality(text):
    """extract nationality information from text"""
    # Regular expression to find "nationality" followed by a word
    match = re.search(r'nationality:\s*([^*]+)', text, re.IGNORECASE)
    if match:
        following_word = match.group(1).strip()
        # delete the nationality snippet from the text
        cleaned_text = re.sub(r'\*\*Nationality:\s*([^*]+)\*\*', '', text, flags=re.IGNORECASE).strip()
        return following_word, cleaned_text
    return None

# POST: Send a message
@app.route('/', methods=['POST'])
def send_message():
    """receive and process a new message from the user"""

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

    # check for profanity
    contains_swearing = predict([message["content"]])

    if predict([message["content"]]):
        # return system answer if the post contains profanity
        invalid_answer = INVALID_ANSWER_PROFANITY.copy()
        invalid_answer["timestamp"] = datetime.now().isoformat()
        new_messages = [invalid_answer]
    else:
        new_messages = check_and_generate(message)
    # generate an appropriate response
    messages = read_messages()

    if len(messages) == 0: messages = add_welcome_message(messages)

    messages.extend(new_messages)
    # check if the maximum of messages has been exceeded and if it is delete old messages
    if len(messages) >= MAX_MESSAGES:
        messages = cut_old_messages(messages)
    save_messages(messages)
    return "OK", 200

def read_messages():
    """read messages from a json file, return empty list if no file found"""
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
    """save messages to a json file"""
    global CHANNEL_FILE
    with open(CHANNEL_FILE, 'w') as f:
        json.dump(messages, f)

if __name__ == '__main__':
    app.run(port=5001, debug=True)
