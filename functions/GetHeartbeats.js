exports = async function (request, response) {
  response.setStatusCode(200);
  response.setBody(JSON.stringify({
    message: 'Strong and healthy',
    timestamp: Date.now(),
  }));
}
