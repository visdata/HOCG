var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

var app = express();
var port = 3001;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// static assets served by webpack-dev-middleware & webpack-hot-middleware for development

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.engine('.html', ejs.__express);
//var anomaly = require('./routes/anomaly');
//app.use('/anomaly',anomaly);
var index = require('./routes/index');
app.use('/', index);

var webpack = require('webpack'),
    webpackDevMiddleware = require('webpack-dev-middleware'),
    webpackHotMiddleware = require('webpack-hot-middleware'),
    webpackDevConfig = require('./webpack.config.js');

var compiler = webpack(webpackDevConfig);
//app.get('/index',function(req,res){
//    res.sendFile(__dirname+'/index.html');
//});
// attach to the compiler & the server
app.use(webpackDevMiddleware(compiler, {
    // public path should be the same with webpack config
    publicPath: webpackDevConfig.output.publicPath,
    noInfo: true,
    stats: {
        colors: true
    }
}));
app.use(webpackHotMiddleware(compiler));

var reload = require('reload');
var http = require('http');
var server = http.createServer(app);
reload(server, app);
server.listen(port, function(){
    console.log('App (dev) is now running on port '+port+'!');
});

