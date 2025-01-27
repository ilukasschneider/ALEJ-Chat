const HUB_AUTHKEY = "1234567890";
const HUB_URL = "http://localhost:5555";

var CHANNELS = null;
var LAST_CHANNEL_UPDATE = null;

// this function is like update_channels() inside the original client.py
export async function getChannels() {
  // if we have cached CHANNELS that are more then 60s old return them instantly
  if (
    CHANNELS &&
    LAST_CHANNEL_UPDATE &&
    (new Date() - LAST_CHANNEL_UPDATE) / 1000 < 60
  ) {
    return CHANNELS;
  }

  // fetching channels from the hub
  try {
    // Make the HTTP request with await
    const response = await fetch(HUB_URL + "/channels", {
      headers: {
        Authorization: "authkey " + HUB_AUTHKEY,
      },
    });

    // error handeling
    if (!response.ok) {
      throw new Error("Error fetching channels: " + response.statusText);
    }

    // get answer and format to json
    const channels_response = await response.json();
    if (!channels_response.channels) {
      throw new Error("No channels in response");
    }

    // cache result so we dont have to fetch it again for 60s
    CHANNELS = channels_response.channels;
    LAST_CHANNEL_UPDATE = new Date();

    // returns the channels
    return CHANNELS;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// fetches messages from a channel like the show_channel() inside the original client.py
export async function getChannelMessages(endpoint, authkey) {
  // fetch list of messages from channel
  const response = await fetch(endpoint, {
    headers: {
      Authorization: "authkey " + authkey,
    },
  });
  if (!response.ok) {
    throw new Error("Error fetching messages: " + (await response.text()));
  }
  const messages = await response.json();
  return messages;
}
