
<h1 align="center">
LLM-Toolbox-Telegram-Workers
</h1>

<p align="center">
    <em>LLM Toolbox as a Telegram bot, deploying on Cloudflare Workers with ease.</em>
</p>

## Make Your Friends Blush (or Squirm!) with the ActGPT Telegram Bot!

This project, forked from [ChatGPT-Telegram-Workers](https://github.com/TBXark/ChatGPT-Telegram-Workers/) v1.7.0, transforms your Telegram bot into a playful agent of flattery, criticism, and much more!  Instead of multi-turn chats, this bot focuses on single-turn actions triggered by commands, allowing you to inject humor and spice into your group conversations.

**Key Features:**

* **Praise and Playful Prodding:**  Flatter your friends with `/act_flatter@mybot` or unleash some (stern) criticism with `/act_criticize@mybot` directly within your Telegram group.
* **A Multitude of Actions:**  Beyond flattery and criticism, explore a wide range of preset actions like "flirt", "skim", and "explain" to engage with your friends in unique ways.
* **Truth Seeker & Scam Detector:** Use commands like `/act_chktruth@mybot`, `/act_checkscam@mybot`, and `/act_skim@mybot` to analyze Twitter (X) tweets, Medium articles, or other online content for veracity, potential scams, and quick summaries.
* **Customizable Actions:**  Personalize your bot experience! Add your own defined actions, both as a user and as the bot administrator.

**Key Differences from Upstream:**

This fork significantly deviates from the original `ChatGPT-Telegram-Workers` project.  The core functionality has been shifted from multi-turn conversations to single-turn actions, enabling a distinct and more dynamic user experience.  Therefore, ongoing synchronization with the upstream repository is not maintained.

## Getting Started

Please refer to [Deploy](./doc/en/DEPLOY.md) and [Platform](./doc/en/DEPLOY.md) from the original `ChatGPT-Telegram-Workers` project.  
Please note that things may have changed since the fork. 
On this fork, only deployment on Clouflare Workers is tested.



## Contributing

Contributions are welcomed.

## License

[MIT License](./LICENSE)