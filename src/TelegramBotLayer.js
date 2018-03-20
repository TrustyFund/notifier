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
      const message = `Send 50 BTS from your BitShares account to account name "BITSHARES-NOTIFIER" with code <b>${msg.chat.id}</b> in the transaction memo.`;
      this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
    });
  }

  sendMessage(chatId, msg, parseMode) {
    console.log('send telegram message', chatId, msg);
    this.bot.sendMessage(chatId, msg, { parse_mode: parseMode });
  }
}

module.exports = TelegramBotLayer;
