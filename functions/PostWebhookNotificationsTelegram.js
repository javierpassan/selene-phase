exports = async function (request, response) {
  const { Telegraf } = require('telegraf');

  const TELEGRAM_BOT_TOKEN = context.values.get('TELEGRAM_BOT_TOKEN');
  
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  bot.start((telegramContext) => telegramContext.reply('Welcome'));
  bot.hears('hi', (telegramContext) => telegramContext.reply('Hey there'));

  try {
    if (request.body === undefined) {
      throw new Error('Request body was not defined.');
    }

    const body = JSON.parse(request.body.text());

    const update = body;
    await bot.handleUpdate(update);

    response.setStatusCode(200);
    response.setBody(JSON.stringify({
      success: {
        message: 'Event processed successfully.',
      },
    }));
  } catch (error) {
    response.setStatusCode(400);
    response.setBody({
      error: {
        message: error.message,
      },
    });
  }
}
