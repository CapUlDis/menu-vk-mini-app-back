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

module.exports = { AppResponse }