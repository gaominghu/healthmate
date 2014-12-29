angular.module('starter.services', ['btford.socket-io'])
.factory('socket', function (socketFactory) {
  var socket = new socketFactory({
    ioSocket: io.connect(':8080')
  });
  socket.forward('error')
  console.log('Factor');
  console.log(socket);
  return socket;
})
.factory('Apps', function($http) {
  var appsPromise,
   localApp = [];

  return {
    all: function() {
      appsPromise = $http.get('/appList.json').success(function(data) {
      localApp = data;
    })
    .error(function(data, status, headers, config) {
      console.log('error');
    });
      return appsPromise;
    },
    get: function(appId) {
      // Simple index lookup
      console.log(localApp);
      return localApp[appId];
    }
  }
});
