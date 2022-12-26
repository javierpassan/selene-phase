function createTelegramBot({ token, }) {
  const { Telegraf } = require('telegraf');
  const bot = new Telegraf(token);
  return bot;
}

class BotService {
  constructor(
    client,
    logger,
    locationRepository
  ) {
    this.bot = client;
    this.logger = logger;
    this.locationRepository = locationRepository;    
  }

  async setup() {
    const { Markup } = require('telegraf');
    const { message } = require('telegraf/filters');

    const COMMAND_SETLOCATION = 'setlocation';
    const COMMAND_SHOWLOCATION = 'showlocation';

    this.bot.start((botContext) => botContext.reply('Welcome'));

    this.bot.command(COMMAND_SETLOCATION, (botContext) => {
      this.logger.log(JSON.stringify({ command: COMMAND_SETLOCATION, }));
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
    
    this.bot.command(COMMAND_SHOWLOCATION, async (botContext) => {
      const message = botContext.message;
      this.logger.log(JSON.stringify({ command: COMMAND_SHOWLOCATION, context: { message, } }));
      const chatId = message.chat.id;
      const location = await this.locationRepository.readLastLocationByChatId(chatId);
      if (!location) {
        return botContext.reply('Location was not previously set.');
      }
      const latitude = location.latitude;
      const longitude = location.longitude;
      return botContext.replyWithLocation(latitude, longitude);
    });
    
    this.bot.on(message('location'), async (botContext) => {
      const message = botContext.message;
      this.logger.log(JSON.stringify({ on: 'message:location', context: { message, } }));
      const isSetLocationCommandReply = message.reply_to_message && message.reply_to_message.text === 'What is your location?';
      if (!isSetLocationCommandReply) {
        return;
      }
      const chatId = message.chat.id;
      const latitude = message.location.latitude;
      const longitude = message.location.longitude;
      await this.locationRepository.createLocation({ chatId, latitude, longitude, });
      return botContext.replyWithLocation(latitude, longitude);
    });
  }
}

class BaseRepository {
  constructor(context) {
    this.context = context
  }
}

class LocationRepository extends BaseRepository {
  constructor(context) {
    super(context);
  }

  async createLocation({ chatId, latitude, longitude, }) {
    return this.context.insertOne({
      chatId,
      createdOn: new Date(),
      latitude,
      longitude,
    });
  }

  async readLastLocationByChatId(chatId) {
    const query = {
      chatId: chatId,
    };
    return (await this.context.find(query).sort({ _id: -1 }).limit(1).toArray())[0];
  }
}

class WebhookNotificationRepository extends BaseRepository {
  constructor(context) {
    super(context)
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

  const DB_NAME = 'selenephase';
  const TELEGRAM_BOT_TOKEN = context.values.get('TELEGRAM_BOT_TOKEN');

  const mongoDbClient = context.services.get('mongodb-atlas');

  const locationDbContext = mongoDbClient.db(DB_NAME).collection('locations');
  const locationRepository = new LocationRepository(locationDbContext);

  const webhookNotificationDbContext = mongoDbClient.db(DB_NAME).collection('webhooknotifications');
  const webhookNotificationRepository = new WebhookNotificationRepository(webhookNotificationDbContext);

  const bot = createTelegramBot({
    token: TELEGRAM_BOT_TOKEN,
  })
  const botServie = new BotService(bot, logger, locationRepository);
  await botServie.setup();

  try {
    if (request.body === undefined) {
      throw new Error('Request body was not defined.');
    }

    const body = JSON.parse(request.body.text());

    await webhookNotificationRepository.createWebhookNotification({
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
