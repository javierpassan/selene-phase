const logger = console;

exports = async function (request, response) {
  try {
    if(request.body === undefined) {
      throw new Error(`Request body was not defined.`)
    }
    
    const body = JSON.parse(request.body.text());
  
    logger.info(JSON.stringify(body));

    response.setStatusCode(204);
  } catch (error) {
    response.setStatusCode(400);
    response.setBody(error.message);
  }
}
