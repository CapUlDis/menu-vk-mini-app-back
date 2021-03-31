class AppResponse {
  constructor(status, data) {
    this.status = status;
    this.data = data;
  }
}

AppResponse.ok = function(data) {
  return new AppResponse(200, data);
};

AppResponse.created = function(data) {
  return new AppResponse(201, data);
};

AppResponse.notFound = function(data) {
  return new AppResponse(404, data);
}

module.exports = { AppResponse }