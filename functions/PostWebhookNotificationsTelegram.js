exports = async function (request, response) {
  const { Telegraf, Markup } = require('telegraf');
  const { message } = require('telegraf/filters');
  const logger = console;

  const TELEGRAM_BOT_TOKEN = context.values.get('TELEGRAM_BOT_TOKEN');

  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  bot.start((botContext) => botContext.reply('Welcome'));
  bot.hears('hi', (botContext) => botContext.reply('Hey there'));
  bot.command('setlocation', (botContext) => {
    return botContext.reply(
      'What is your location?',
      Markup
        .removeKeyboard([
          Markup.button.callback('Cancel', 'cancel'),
          Markup.button.locationRequest('Send location'),
        ])
        .oneTime()
        .resize()
    );
  });
  bot.on(message('location'), (botContext) => {
    const message = botContext.message;
    if (!message || !message.locationRequest) {
      return;
    }
    const latitude = message.locationRequest.latitude;
    const longitude = message.locationRequest.longitude;
    return botContext.replyWithLocation(latitude, longitude);
  });
  bot.action('cancel', () => {});

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
    logger.error(error.message);
    response.setStatusCode(400);
    response.setBody(JSON.stringify({
      error: {
        message: error.message,
      },
    }));
  }
}
