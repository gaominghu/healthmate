angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})


.controller('AppsCtrl', function($scope, socket, Apps) {

  socket.forward('state', $scope);
    $scope.$on('socket:state', function (ev, data) {
      //console.log(data);
      angular.forEach($scope.apps, function(app, index) {
        if(data.id == app.id){
          $scope.$apply(function(){
            $scope.apps[index].status = data.connected ? 'connected' : 'offline';
          });
        }
      });
  });

  Apps.all()
    .success(function(data) {
      $scope.apps = data;
    })
    .error(function(data, status, headers, config) {
      console.log('error');
    });
})

.controller('AppDetailCtrl', function($scope, $stateParams, Apps) {
  $scope.app = Apps.get[$stateParams.appId];
});