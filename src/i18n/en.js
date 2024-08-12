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
        "img": "Generate an image, the complete command format is `/img image description`, for example `/img beach at moonlight`",
        "setenv": "Set user configuration, the complete command format is /setenv KEY=VALUE",
        "setenvs": "Batch set user configurations, the complete command format is /setenvs {\"KEY1\": \"VALUE1\", \"KEY2\": \"VALUE2\"}",
        "delenv": "Delete user configuration, the complete command format is /delenv KEY",
        "clearenv": "Clear all user configuration",
        "system": "View some system information",
        "echo": "Echo the message (debug mode only)",
        "act": "Select the action you want to act"
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
      "ask": {
        "name": "Ask",
        "prompt": "You are a helpful assistant."
      }
    }
  }