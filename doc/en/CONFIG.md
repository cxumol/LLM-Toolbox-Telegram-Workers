> [!WARNING]
> The document is AI generated, and I have no time to proofread it. Please create an issue or tell me if you find any errors.

# Configuration

It is recommended to fill in environment variables in the Workers configuration interface instead of directly modifying variables in the JS code.

## KV configuration

| KEY      | Description                                                                                                       |
|:---------|-------------------------------------------------------------------------------------------------------------------|
| DATABASE | First, create a KV. When creating it, the name can be arbitrary, but when binding it, it must be set as DATABASE. |

## System Configuration

The configuration that is common to each user can only be configured and filled in through the Workers configuration interface or toml, and it is not supported to modify it by sending messages through Telegram.

An empty string in the array indicates that no value has been set. If a value needs to be set, it should be set as `'value1,value2'`, with multiple values separated by commas.

### Basic configuration

| KEY                       | Name                      | Default  | Description                               |
|---------------------------|---------------------------|----------|-------------------------------------------|
| LANGUAGE                  | Language                  | `en`     | Menu language                             |
| UPDATE_BRANCH             | Update branch             | `master` | Check the branch for updates              |
| CHAT_COMPLETE_API_TIMEOUT | Chat complete API timeout | `0`      | Timeout for AI conversation API (seconds) |
| TELEGRAM_MIN_STREAM_INTERVAL | Telegram minimum stream interval | `0` | Minimum message stream interval for Telegram (milliseconds) |


### Telegram configuration

| KEY                       | Name                           | Default                                    | Description                                                                                                   |
|---------------------------|--------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| TELEGRAM_API_DOMAIN       | Telegram API Domain            | `https://api.telegram.org/`                | Telegram API domain                                                                                           |
| TELEGRAM_AVAILABLE_TOKENS | Available Telegram tokens.     | `''//(array string)`                       | Telegram Tokens allowed to access, separated by commas when setting.                                          |
| DEFAULT_PARSE_MODE        | Default parsing mode.          | `Markdown`                                 | Default message parsing mode.                                                                                 |
| I_AM_A_GENEROUS_PERSON    | Allow everyone to use.         | `false`                                    | Is it allowed for everyone to use?                                                                            |
| CHAT_WHITE_LIST           | Chat whitelist                 | `''//(array string)`                       | Allowed Chat ID Whitelist                                                                                     |
| LOCK_USER_CONFIG_KEYS     | Locked user configuration key. | The default value is the URL for all APIs. | Configuration key to prevent token leakage caused by replacement.                                             |
| TELEGRAM_BOT_NAME         | Telegram bot name              | `''//(array string)`                       | The Bot Name corresponding to the Telegram Token that is allowed to access, separated by commas when setting. |
| CHAT_GROUP_WHITE_LIST     | Group whitelist                | `''//(array string)`                       | Allowed group ID whitelist.                                                                                   |
| GROUP_CHAT_BOT_ENABLE     | Whether to enable group bots.  | `true`                                     | Whether to enable group robots.                                                                               |
| GROUP_CHAT_BOT_SHARE_MODE | Group robot sharing mode       | `false`                                    | After opening, people in the same group use the same chat context.                                            |

> IMPORTANT: You must add the group ID to the whitelist `CHAT_GROUP_WHITE_LIST` to use it, otherwise anyone can add your bot to the group and consume your quota.

> IMPORTANT: Due to Telegram's privacy and security policies, if your group is a public group or has more than 2000 members, please set the bot as an `administrator`, otherwise the bot will not respond to chat messages with `@bot`.

> IMPORTANT: You must set `/setprivacy` to `Disable` in botfather, otherwise the bot will not respond to chat messages with `@bot`.

### History configuration

| KEY                | Name                                  | Default | Description                                                   |
|--------------------|---------------------------------------|---------|---------------------------------------------------------------|
| AUTO_TRIM_HISTORY  | Automatic trimming of message history | `true`  | Automatically trim messages to avoid the 4096 character limit |
| MAX_HISTORY_LENGTH | Maximum length of message history     | `20`    | Maximum number of message history entries to keep             |
| MAX_TOKEN_LENGTH   | Maximum token length                  | `2048`  | Maximum token length for message history                      |

### Feature configuration

| KEY                   | Name                    | Default              | Description                                                 |
|-----------------------|-------------------------|----------------------|-------------------------------------------------------------|
| HIDE_COMMAND_BUTTONS  | Hide command buttons    | `''//(array string)` | Need to re-initiate after modification                      |
| SHOW_REPLY_BUTTON     | Show quick reply button | `false`              | Whether to display the quick reply button                   |
| EXTRA_MESSAGE_CONTEXT | Extra message context   | `false`              | The referenced message will also be included in the context |
| STREAM_MODE           | Stream mode             | `true`               | Typewriter mode                                             |
| SAFE_MODE             | Safe mode               | `true`               | When enabled, the ID of the latest message will be saved    |
| DEBUG_MODE            | Debug mode              | `false`              | When enabled, the latest message will be saved              |
| DEV_MODE              | Development mode        | `false`              | When enabled, more debugging information will be displayed  |

## User configuration

Each user's custom configuration can only be modified by sending a message through Telegram. The message format is `/mod_env_set KEY=VALUE`. User configurations have a higher priority than system configurations. If you want to delete a configuration, please use `/mod_env_del KEY`. To set variables in batches, please use `/mod_env_set_batch {"KEY1": "VALUE1", "KEY2": "VALUE2"}`.

### General configuration

| KEY                      | Name                                 | Default                       | Description                                                                                                |
|--------------------------|--------------------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------|
| AI_PROVIDER              | AI provider                          | `auto`                        | Options `auto, openai, azure, workers` |
| AI_IMAGE_PROVIDER        | AI image provider                    | `auto`                        | Options `auto, openai, azure, workers` |
| SYSTEM_INIT_MESSAGE      | Default initialization message.      | `You are a helpful assistant` | Automatically select default values based on the bound language.                                          |
| SYSTEM_INIT_MESSAGE_ROLE | Default initialization message role. | `system`                      |                                                                                                           |
| MY_ACTIONS              | Custom Actions                       | `{}`                          |  Custom actions that can be triggered by `/act` command. See [Custom Actions](#custom-actions) for more details. |

### OpenAI

| KEY                     | Name                    | Default                     | 
|-------------------------|-------------------------|-----------------------------|
| OPENAI_API_KEY          | OpenAI API Key          | `''//(array string)`        |
| OPENAI_CHAT_MODEL       | OpenAI Model            | `gpt-3.5-turbo`             |
| OPENAI_API_BASE         | OpenAI API BASE         | `https://api.openai.com/v1` |
| OPENAI_API_EXTRA_PARAMS | OpenAI API Extra Params | `{}`                        |

### Azure OpenAI

>  AZURE_COMPLETIONS_API `https://RESOURCE_NAME.openai.azure.com/openai/deployments/MODEL_NAME/chat/completions?api-version=VERSION_NAME`

> AZURE_DALLE_API `https://RESOURCE_NAME.openai.azure.com/openai/deployments/MODEL_NAME/images/generations?api-version=VERSION_NAME`

| KEY                   | Name                  | Default | 
|-----------------------|-----------------------|---------|
| AZURE_API_KEY         | Azure API Key         | `null`  |
| AZURE_COMPLETIONS_API | Azure Completions API | `null`  |

### Workers

| KEY                   | Name                  | Default                                        | 
|-----------------------|-----------------------|------------------------------------------------|
| CLOUDFLARE_ACCOUNT_ID | Cloudflare Account ID | `null`                                         |
| CLOUDFLARE_TOKEN      | Cloudflare Token      | `null`                                         |
| WORKERS_CHAT_MODEL    | Text Generation Model | `@cf/mistral/mistral-7b-instruct-v0.1 `        |

## Command

| Command              | Description                                                             | Example                                         |
|:---------------------|:------------------------------------------------------------------------|:------------------------------------------------|
| `/help`              | Get command help.                                                       | `/help`                                         |
| `/start`             | Get your ID and start a new conversation.                               | `/start`                                        |
| `/act`               | List available custom actions.                                         | `/act`                                          |
| `/act_{actionName}`  | Trigger a custom action.                                                | `/act_flatter You are awesome!`                  |
| `/mod_env_set`      | Set user configuration, see `User Configuration` for details.           | `/mod_env_set KEY=VALUE`                             |
| `/mod_env_set_batch` | Batch setting user configuration, see "User Configuration" for details. | `/mod_env_set_batch {"KEY1": "VALUE1", "KEY2": "VALUE2"}` |
| `/mod_env_del`      | Delete user configuration.                                              | `/mod_env_del KEY`                                   |
| `/mod_env_del_all`   | Clear all user configuration.                                          | `/mod_env_del_all`                                 |
| `/mod_system`        | View some current system information.                                   | `/mod_system`                                       |
| `/redo`              | Edit the previous question or provide a different answer.               | `/redo Modified content.` or `/redo`            |
| `/echo`              | Echo message, only available in development mode.                       | `/echo`                                         |

## Custom Actions

Custom actions can be defined in the `MY_ACTIONS` environment variable. Each action consists of a name and a prompt. The name is used to trigger the action using the `/act_{actionName}` command, and the prompt is used as the system prompt for the LLM when the action is triggered.

For example, to define an action named "translate" that translates English text to Chinese, you can set the `MY_ACTIONS` environment variable as follows:

```json
{
  "translate": {
    "name": "Translate to Chinese",
    "prompt": "You are a translator. Please translate the following English text to Chinese."
  }
}
```

This will allow you to use the command `/act_translate Hello, world!` to translate "Hello, world!" to Chinese.

## Custom commands

In addition to the commands defined by the system, you can also customize shortcut commands, which can simplify some longer commands into a single word command.

Custom commands use environment variables to set CUSTOM_COMMAND_XXX, where XXX is the command name, such as `CUSTOM_COMMAND_azure`, and the value is the command content, such as `/mod_env_set_batch {"AI_PROVIDER": "azure"}`. This allows you to use `/azure` instead of `/mod_env_set_batch {"AI_PROVIDER": "azure"}` to quickly switch AI providers.

Here are some examples of custom commands.

| Command                | Value                                                                                                             |
|------------------------|-------------------------------------------------------------------------------------------------------------------|
| CUSTOM_COMMAND_azure   | `/mod_env_set_batch {"AI_PROVIDER": "azure"}`                                                                               |
| CUSTOM_COMMAND_workers | `/mod_env_set_batch {"AI_PROVIDER": "workers"}`                                                                             |
| CUSTOM_COMMAND_gpt3    | `/mod_env_set_batch {"AI_PROVIDER": "openai", "OPENAI_CHAT_MODEL": "gpt-3.5-turbo"}`                                        |
| CUSTOM_COMMAND_gpt4    | `/mod_env_set_batch {"AI_PROVIDER": "openai", "OPENAI_CHAT_MODEL": "gpt-4"}`                                                |
| CUSTOM_COMMAND_cn2en   | `/mod_env_set_batch {"SYSTEM_INIT_MESSAGE": "You are a translator. Please translate everything I say below into English."}` |

If you are using TOML for configuration, you can use the following method:

```toml
CUSTOM_COMMAND_azure= '/mod_env_set_batch {"AI_PROVIDER": "azure"}'
CUSTOM_COMMAND_workers = '/mod_env_set_batch {"AI_PROVIDER": "workers"}'
CUSTOM_COMMAND_gpt3 = '/mod_env_set_batch {"AI_PROVIDER": "openai", "OPENAI_CHAT_MODEL": "gpt-3.5-turbo"}'
CUSTOM_COMMAND_gpt4 = '/mod_env_set_batch {"AI_PROVIDER": "openai", "OPENAI_CHAT_MODEL": "gpt-4"}'
CUSTOM_COMMAND_cn2en = '/mod_env_set_batch {"SYSTEM_INIT_MESSAGE": "You are a translator. Please translate everything I say below into English."}'
```

## Custom commands description

If you want to add help information for a custom command, you can use environment variables to set `COMMAND_DESCRIPTION_XXX`, where `XXX` is the name of the command, such as `COMMAND_DESCRIPTION_azure`, and the value is the description of the command, such as `Switch AI provider to Azure`. This way, you can use `/help` to view the help information for the custom command.

The following are some examples of custom command help information.

| Command Description         | Value                                              |
|-----------------------------|----------------------------------------------------|
| COMMAND_DESCRIPTION_azure   | `Switch AI provider to Azure.`                     |
| COMMAND_DESCRIPTION_workers | `Switch AI provider to Workers`                    |
| COMMAND_DESCRIPTION_gpt3    | `Switch AI provider to OpenAI GPT-3.5 Turbo`       |
| COMMAND_DESCRIPTION_gpt4    | `Switch AI provider to OpenAI GPT-4`               |
| COMMAND_DESCRIPTION_cn2en   | `Translate the conversation content into English.` |

If you are using TOML for configuration, you can use the following method:

```toml
COMMAND_DESCRIPTION_azure = "Switch AI provider to Azure."
COMMAND_DESCRIPTION_workers = "Switch AI provider to Workers"
COMMAND_DESCRIPTION_gpt3 = "Switch AI provider to OpenAI GPT-3.5 Turbo"
COMMAND_DESCRIPTION_gpt4 = "Switch AI provider to OpenAI GPT-4"
COMMAND_DESCRIPTION_cn2en = "Translate the conversation content into English."
```
