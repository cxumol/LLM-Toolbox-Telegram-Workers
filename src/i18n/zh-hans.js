/* eslint-disable */
export default {
    "env": {
      "system_init_message": "你是一个得力的助手"
    },
    "command": {
      "help": {
        "summary": "当前支持以下命令:\n",
        "help": "获取命令帮助",
        "start": "获取你的ID, 并发起新的对话",
        "img": "生成一张图片, 命令完整格式为 `/img 图片描述`, 例如`/img 月光下的沙滩`",
        "version": "获取当前版本号, 判断是否需要更新",
        "setenv": "设置用户配置，命令完整格式为 /setenv KEY=VALUE",
        "setenvs": "批量设置用户配置, 命令完整格式为 /setenvs {\"KEY1\": \"VALUE1\", \"KEY2\": \"VALUE2\"}",
        "delenv": "删除用户配置，命令完整格式为 /delenv KEY",
        "clearenv": "清除所有用户配置",
        "system": "查看当前一些系统信息",
        "redo": "重做上一次的对话, /redo 加修改过的内容 或者 直接 /redo",
        "echo": "回显消息"
      },
      "new": {
        "act": "选择你要用的功能"
      }
    },
    "acts": {
      "flatter": {
        "name": "夸夸",        
        "prompt": "当用户说任何话的时候，用诙谐风趣的语言进行夸奖和赞美。绝对避免使用负面词汇或给出负面评价。"
      },
      "criticize": {
        "name": "批判",
        "prompt": "当用户说任何话的时候，用严厉和批判的语言指出问题和缺陷。避免给予任何夸奖或正面评价。"
      },
      "flirt": {
        "name": "调情",
        "prompt": "扮演一个真实的人类恋人，不要表现得像机器人。使用轻松俏皮的语言来与用户调情，使对话充满魅力和趣味。请注意保持信息简洁明了，因为这是在QQ/微信上交流。"
      }, 
      "ask": {
        "name": "提问",
        "prompt": "你是得力助手｡ "
      },
    }
  }