const express = require('express');
const app = express();
app.use(express.static('dist/experiment_interface/browser'))
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*'
    }
});
var udp = require('dgram');

var server = udp.createSocket('udp4');
var client = udp.createSocket('udp4');

var return_host = "";

// UDP Server (receiving data from Quest)
server.on('error',function(error){
  console.log('Error: ' + error);
  server.close();
});

server.on('message',function(msg, info){
  //console.log('Data received from client : ' + msg.toString());
  //console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
  var els = msg.toString().split("\t");
  if (els.length < 2) {
    io.emit("devicemsg", msg.toString());
  } else {
    var topic = els.shift();
    io.emit(topic, els.join('\t'));
  }
  return_host = info.address;
  // TODO: set sending address using info.address ...

    //sending msg
    /*
    server.send(msg, info.port, 'localhost',function(error){
    if(error){
        client.close();
    }else{
        console.log('Data sent !!!');
    }

    });
    */

});

server.on('listening',function(){
  var address = server.address();
  var port = address.port;
  var ipaddr = address.address;
});

//emits after the socket is closed using socket.close();
server.on('close',function(){
  console.log('Listener socket closed!');
});

server.bind(7766);

var sendQuest = function(msg) {
    var data = Buffer.from(msg);
    client.send(data, 7788, return_host, function(error) {
        if(error){
            console.log("Failed to send.")
        }
    });
};

/*
setInterval(function() {
    if (return_host) {
        //sendQuest("pong");
    }
    io.emit('devicemsg', "foo");

}, 1000);
*/


io.on("connection", socket => {
    socket.on("command", data => {
        sendQuest(data);
    });
});

/*
  let previousId;

  const safeJoin = currentId => {
    socket.leave(previousId);
    socket.join(currentId, () => console.log(`Socket ${socket.id} joined room ${currentId}`));
    previousId = currentId;
  };
  */


http.listen(4444, '0.0.0.0', () => {
  console.log('Web Inteface running: http://127.0.0.1:' + port );
});