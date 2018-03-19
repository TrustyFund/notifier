const TelegramBot = require('node-telegram-bot-api');

class TelegramBotLayer {
  constructor(token) {
    this.token = token;
    this.bot = new TelegramBot(this.token, { polling: true });
    console.log('bot init');
  }

  listen() {
    this.bot.on('message', (msg) => {
      console.log(msg);
    });
    this.bot.onText(/\/start/, (msg) => {
      const message = `To get a lifetime subscription send 50 BTS to account name "EMAIL-NOTIFIER" with tx memo:<b>${msg.chat.id}</b>`;
      this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
    });
  }

  sendMessage(chatId, msg, parseMode) {
    console.log('send telegram message', chatId, msg);
    this.bot.sendMessage(chatId, msg, { parse_mode: parseMode });
  }
}

module.exports = TelegramBotLayer;
