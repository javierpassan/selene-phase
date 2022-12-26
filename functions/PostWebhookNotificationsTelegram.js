function createTelegramBot({ token, }) {
  const { Telegraf, Markup } = require('telegraf');
  const { message } = require('telegraf/filters');

  const bot = new Telegraf(token);

  bot.start((botContext) => botContext.reply('Welcome'));
  bot.hears('hi', (botContext) => botContext.reply('Hey there'));
  bot.command('setlocation', (botContext) => {
    return botContext.reply(
      'What is your location?',
      Markup
        .keyboard([
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
    return botContext.replyWithLocation(latitude, longitude, Markup.removeKeyboard(true));
  });
  bot.action('cancel', () => {});

  return bot;
}

class WebhookNotificationRepository {

  constructor(context) {
    this.context = context;
  }

  async createWebhookNotification({ body, provider, }) {
    return this.context.insertOne({
      body,
      createdOn: new Date(),
      provider,
    })
  }
}

exports = async function (request, response) {
  const logger = console;

  const TELEGRAM_BOT_TOKEN = context.values.get('TELEGRAM_BOT_TOKEN');

  const bot = createTelegramBot({
    token: TELEGRAM_BOT_TOKEN,
  })

  const mongoDbClient = context.services.get('mongodb-atlas');
  const webhookNotificationDbContext = mongoDbClient.db('selenephase').collection('webhooknotifications');
  const WebhookNotificationRepository = new WebhookNotificationRepository(webhookNotificationDbContext);

  try {
    if (request.body === undefined) {
      throw new Error('Request body was not defined.');
    }

    const body = JSON.parse(request.body.text());

    await WebhookNotificationRepository.createWebhookNotification({
      body,
      provider: 'telegram',
    });

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
