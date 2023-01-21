function createTelegramBot({ token, }) {
  const { Telegraf } = require('telegraf');
  const bot = new Telegraf(token);
  return bot;
}

exports = async function (request, response) {
  const {
    HandleTelegramUpdateUseCase,
    LocationMongoDbAtlasRepository,
    TelegramTelegrafBot,
    WebhookNotificationMongoDbAtlasRepository,
  } = require('selene-phase-domain');

  const logger = console;

  const DB_NAME = 'selenephase';
  const TELEGRAM_BOT_TOKEN = context.values.get('TELEGRAM_BOT_TOKEN');

  const mongoDbClient = context.services.get('mongodb-atlas');

  const locationDbContext = mongoDbClient.db(DB_NAME).collection('locations');
  const locationRepository = new LocationMongoDbAtlasRepository(locationDbContext);

  const webhookNotificationDbContext = mongoDbClient.db(DB_NAME).collection('webhooknotifications');
  const webhookNotificationRepository = new WebhookNotificationMongoDbAtlasRepository(webhookNotificationDbContext);

  const bot = createTelegramBot({ token: TELEGRAM_BOT_TOKEN, });
  
  const botService = new TelegramTelegrafBot(bot, locationRepository, logger);
  await botService.setup();

  const handleTelegramUpdateUseCase = new HandleTelegramUpdateUseCase(bot, webhookNotificationRepository);

  try {
    if (request.body === undefined) {
      throw new Error('Request body was not defined.');
    }

    const body = JSON.parse(request.body.text());

    const request = { body, };
    await handleTelegramUpdateUseCase.invoke(request);

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
