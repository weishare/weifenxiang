/*
 * GET home page.
 */

var weixin = require('weixin-api');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/WXMessage');

var db = mongoose.connection;
db.on('error',console.error.bind(console,'连接错误:'));
db.once('open',function(){
    console.log('open WXMessage');
});


var WXMessageSchema = mongoose.Schema({
        toUserName: String,
        fromUserName: String,
        createTime: Date,
        picUrl: String,
        msgId: String,
        content: String
    });


var WXMessageModel = mongoose.model("message", WXMessageSchema);


// config
weixin.token = 'honghong';



weixin.textMsg(function(msg) {
    console.log("textMsg received");
    console.log(JSON.stringify(msg));


    var WXMessageEntity = new WXMessageModel(msg);

    WXMessageEntity.save(function (err) {
        if (err) console.log(err)
        console.log('save success');
    });
});



// 监听图片消息
weixin.imageMsg(function(msg) {
    console.log("imageMsg received");
    console.log(JSON.stringify(msg));
    var WXMessageEntity = new WXMessageModel(msg);
    WXMessageEntity.save();
});

// 监听位置消息
weixin.locationMsg(function(msg) {
    console.log("locationMsg received");
    console.log(JSON.stringify(msg));
});

// 监听链接消息
weixin.urlMsg(function(msg) {
    console.log("urlMsg received");
    console.log(JSON.stringify(msg));
});

// 监听事件消息
weixin.eventMsg(function(msg) {
    console.log("eventMsg received");
    console.log(JSON.stringify(msg));
});



exports.index = function(req, res){

	// 签名成功
    if (weixin.checkSignature(req)) {
        res.send(200, req.query.echostr);
    } else {
        res.send(200, 'fail');
    }
};


exports.start = function(req, res){
	weixin.loop(req, res);
};


