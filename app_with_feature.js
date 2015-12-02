/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  user = require('./routes/user'),
  http = require('http'),
  redis = require('redis'),
  multer  = require('multer'),
  fs      = require('fs'),
  path = require('path');
var os = require('os');
var app = express();

var sio = require('socket.io');
var app1 = http.createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end();
    })
  , io = sio.listen(app1);
  
var twilio = require('twilio');
var flag = 0;
var indicator = false;
function sendAlert(flag) {
         var client = new twilio.RestClient('', '');
         var message;
         if(flag) {
                   message = 'Message alert: Express application has exceeded memory usage threshold';
                  }
           else {
                  message = 'Message alert: Express application has overloaded the cpu'; 
          }
         client.sms.messages.create({
                      to:'',
                      from:'',
                      body:message,
                      
                      }, function(error, message) {
   
                      if (!error) {
                                if(flag)
                                console.log('Message has been sent for exceeding memory usage threshold');
                                else 
                                console.log('Message has been sent for overloading the cpu');
                               // console.log(message.sid);

                                console.log('Message sent on:');
                                console.log(message.dateCreated);
                                  } 
                      else {
                              console.log('There was an error.');
                            }
        });

}

function memoryLoad()
{

        var usedMem=((os.totalmem()-os.freemem())/os.totalmem());
        var usedMemPercent = (usedMem * 100).toFixed(2);
        console.log("Total % of used memory", usedMemPercent);
        return usedMemPercent;

}

function cpuLoad() {
        var load = os.loadavg();
        var oneMinuteLoad = load[0];
        var oneMinuteLoadPercent = (oneMinuteLoad % 1).toFixed(2).substring(2);        
        console.log("Total % of cpu overload", oneMinuteLoadPercent);
	      return oneMinuteLoadPercent;
}

// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

client.set("devOpsKey", "false");
app.configure(function(){
  app.set('port', process.env.PORT || 3002);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.render('index', {
    title: 'Home'
  });
});


app.get('/about', function(req, res){

  client.get("devOpsKey", function(err,value){ 
    if (err) throw err
    console.log("listening at port 3000 ");
    console.log("Value of the key is ", value);
    //console.log(value);
    //res.send(value);
    if(value=="true"){
       res.render('aboutFeature', {
        title: 'AboutFeature'
      });
     }else{
        res.render('about', {
        title: 'About'
      });
     }
  });

 
});

app.get('/contact', function(req, res){
  res.render('contact', {
    title: 'Contact'
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

setInterval( function () 
{
  var memLoadPercent = memoryLoad();
  var cpuLoadPercent = cpuLoad();
  
  var memL = parseFloat(memLoadPercent);
  var cpuL = parseFloat(cpuLoadPercent);
  
  if(cpuL > 90) {
    flag = 0;
    //sendAlert(flag);
    indicator = true;
  }
  if(memL > 90) {
    flag = 1;
    //sendAlert(flag);
    indicator = true;
  }
  
  io.sockets.emit('heartbeat', 
	{ 
        status: indicator
   });

}, 2000);

app1.listen(3003);

