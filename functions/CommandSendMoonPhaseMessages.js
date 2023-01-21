function createTelegramBot({ token, }) {
  const { Telegraf } = require('telegraf');
  const bot = new Telegraf(token);
  return bot;
}

exports = async function () {
  const {
    LocationMongoDbAtlasRepository,
    SendMoonPhaseMessagesUseCase,
  } = require('selene-phase-domain');

  const logger = console;

  const DB_NAME = 'selenephase';
  const TELEGRAM_BOT_TOKEN = context.values.get('TELEGRAM_BOT_TOKEN');

  const mongoDbClient = context.services.get('mongodb-atlas');

  const locationDbContext = mongoDbClient.db(DB_NAME).collection('locations');
  const locationRepository = new LocationMongoDbAtlasRepository(locationDbContext);

  const bot = createTelegramBot({ token: TELEGRAM_BOT_TOKEN, });
  
  const sendMoonPhaseMessageUseCase = new SendMoonPhaseMessagesUseCase(bot, locationRepository);

  try {
    await sendMoonPhaseMessageUseCase.invoke();
  } catch (error) {
    logger.error(error.message);
  }
}
