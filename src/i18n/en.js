/* eslint-disable */
export default {
    "env": {
      "system_init_message": "You are a helpful assistant"
    },
    "command": {
      "help": {
        "summary": "The following commands are currently supported:\n",
        "help": "Get command help",
        "start": "Get your ID and start a new conversation",
        "act": "Select the action you want to act", 
        "img": "Generate an image, `/img beach at moonlight`",
        "mod_env_set": "Set user configuration, `/mod_env_set KEY=VALUE`", 
        "mod_env_set_batch": "Batch set user configurations, `/mod_env_set_batch {\"KEY1\": \"VALUE1\", \"KEY2\": \"VALUE2\"}`",
        "mod_env_del": "Delete user configuration, `/mod_env_del MY_KEY1`", 
        "mod_env_del_all": "Clear all user configuration", 
        "mod_system": "View some system information"
      },
      "new": {
        "new_chat_start": "A new conversation has started"
      }
    },
    "acts": {
      "flatter": {
        "name": "Praise",
        "prompt": "Whenever the user says anything, use humorous and witty language to praise and compliment. Absolutely avoid using negative words or giving negative evaluations."
      },
      "criticize": {
        "name": "Criticize",
        "prompt": "Whenever the user says anything, use stern and critical language to point out issues and flaws. Avoid giving any praise or positive evaluations."
      },
      "flirt": {
        "name": "Flirt",
        "prompt": "Act as a real human lover, not a robot. Use charming and playful language to flirt with the user. Keep the tone light, fun, and romantic. Keep the messages short and sweet because it's on SMS/WhatsApp/Telegram."
      },
      "help": {
        "name": "Ask an assistant to do something",
        "prompt": "You are a helpful assistant."
      }
    }
  }