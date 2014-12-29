"use strict";

var inspect = require('eyespect').inspector(),
  running = require('is-running'),
  exec = require('child_process').exec,
  child,
  sys = require('sys'),  
  appList = require('jsonfile').readFileSync('./public/appList.json'),
  mdns = require('mdns'),
  _ = require('lodash'),
  staticServer = require('node-static'),
  connectedSocket = [],
  intervalCheck = 3000;

//
// Create a node-static server instance to serve the './public' folder
//
var fileServer = new staticServer.Server('./public');

var app = require('http').createServer(function(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  request.addListener('end', function() {
    fileServer.serve(request, response, function(err, result) {
      if (err) { // There was an error serving the file
        sys.error("Error serving " + request.url + " - " + err.message);
        // Respond to the client
        response.writeHead(err.status, err.headers);
        response.end();
      }
    });
  }).resume();
})
var io = require('socket.io')(app);
app.listen(8080);

// advertise a http server on port 4321
var ad = mdns.createAdvertisement(mdns.tcp('http'), 8080);
ad.start();

io.on('connection', function (socket) {
  connectedSocket.push(socket);
  console.log('connected');
  socket.emit('news', { hello: 'world' });
});

function isRunning(pid, app) {
  running(pid, function(err, live) {
    if (err) {
      inspect(err, 'error testing if process is running');
      return
    }
    inspect(live, 'is process ' + app.name + ' running?');
    app.connected = live;
    _.each(connectedSocket, function(socket, index){
      socket.emit('state', app);
    });
  });
}

function checkApp(app){
  child = exec('pgrep -o -x "' + app.name + '"',
    function(error, stdout, stderr) {
      //console.log('stdout: ' + stdout);
      if (stderr.length > 0 || error !== null) {
        if (error !== null) {
          console.log('exec error: ' + error);
        } else {
          console.log('stderr: ' + stderr);  
        }
        app.connected = false ;
        app.reason = {
          'stderr': stderr,
          'error': error
        };
        _.each(connectedSocket, function(socket, index){
          socket.emit('state', app);
        });
      } else {
        //console.log('ps -p '+stdout.replace(/(\r\n|\n|\r)/gm,"")+' -o pid,vsz=MEMORY -o user,group=GROUP -o comm,args=ARGS');
        exec('ps -p ' + stdout.replace(/(\r\n|\n|\r)/gm, "") + ' -o pid,vsz=MEMORY -o user,group=GROUP -o comm,args=ARGS',
          function(error, stdout, stderr) {
            if (stderr.length > 0) {
              console.log('stderr: ' + stderr);
            }
            if (error !== null) {
              console.log('exec error: ' + error);
            } else {
              console.log(stdout);
            }
          });
        isRunning(Number(stdout), app);
      }
    });
}

_.each(appList, function(app, index) {
  setInterval(function() {
    checkApp(app);
  }, intervalCheck);
});

