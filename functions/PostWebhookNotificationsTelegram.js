exports = async function (request, response) {
  const { Telegraf } = require('telegraf');
  const logger = console;

  const TELEGRAM_BOT_TOKEN = context.values.get('TELEGRAM_BOT_TOKEN');

  try {
    if (request.body === undefined) {
      throw new Error('Request body was not defined.');
    }

    const body = JSON.parse(request.body.text());

    const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
    bot.start((telegramContext) => telegramContext.reply('Welcome'));
    bot.hears('hi', (telegramContext) => telegramContext.reply('Hey there'));

    const update = body;
    await bot.handleUpdate(update);

    response.setStatusCode(200);
    response.setBody(JSON.stringify({
      success: {
        message: 'Event processed successfully.',
      },
    }));
  } catch (error) {
    logger.error(error.message);
    response.setStatusCode(400);
    response.setBody(JSON.stringify({
      error: {
        message: error.message,
      },
    }));
  }
}
