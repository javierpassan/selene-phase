exports = async function (request, response) {
  const logger = console;
  try {
    if (request.body === undefined) {
      throw new Error('Request body was not defined.');
    }

    const body = JSON.parse(request.body.text());

    const useCaseRequest = { body, };
    await context.functions.execute(useCaseRequest.name);

    response.setStatusCode(200);
    response.setBody(JSON.stringify({
      success: {
        message: 'Job processed successfully.',
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
