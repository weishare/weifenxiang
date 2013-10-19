/*
 * GET home page.
 */

var weixin = require('weixin-api');
var mongoose = require('mongoose');


var MYHOST = 'http://63.223.73.213/';
var LATEST = 'http://63.223.73.213/latest';
var LATESTQ = 'http://63.223.73.213/latest/?UserName=';

mongoose.connect('mongodb://localhost/WXMessage');

var db = mongoose.connection;
db.on('error',console.error.bind(console,'连接错误:'));
db.once('open',function(){
    console.log('open WXMessage');
});

var Schema = mongoose.Schema;


var WXMessageSchema = Schema({
        toUserName: String,
        fromUserName: String,
        createTime: Number,
        likes: [String],
        fucks: [String],
        picUrl: String,
        msgId: String,
        content: String,
        comments: [{ body: String, date: Date }],
        title: {type: String, default: '无标题'},
        description: {type: String, default: ''}
    });


WXMessageSchema.methods.findSelf = function(cb){
    this.model('message').find({fromUserName:this.fromUserName}).limit(9).sort({'_id':-1}).exec(cb);
}

WXMessageSchema.statics.findNew = function(num, cb){

    this.find().limit(num).sort({'_id':-1}).exec(cb);
}

WXMessageSchema.statics.findNewByLast = function(num, last, cb){
    this.find().where('_id').lt(last).limit(num).sort({'_id':-1}).exec(cb);
}


var WXMessageModel = mongoose.model("message", WXMessageSchema);


Date.prototype.toMyformat = function(){
    var m = this.getMonth();
    m++;
    return this.getFullYear() + '-' + m + '-' + this.getDate();
}

// config
weixin.token = 'honghong';



weixin.textMsg(function(msg) {
    console.log("textMsg received");
    console.log(JSON.stringify(msg));
    var resMsg = {};


    switch (msg.content) {
        case "n" :
            WXMessageModel.findNew(9, function(err, messages){
                var articles = [];
                for (var i = 0; i < messages.length; i++) {
                    articles[i] = {
                        title : messages[i].title,
                        description : messages[i].description,
                        picUrl : messages[i].picUrl,
                        url : messages[i].picUrl
                    };
                };

                articles[messages.length] = {
                    title : '更多',
                    description : "更多最新",
                    picUrl : '/images/icon_arrow_more.png',
                    url : LATESTQ + msg.fromUserName
                };

                resMsg = {
                    fromUserName : msg.toUserName,
                    toUserName : msg.fromUserName,
                    msgType : "news",
                    articles : articles,
                    funcFlag : 0
                }

                 weixin.sendMsg(resMsg);
            })
        break;
        case "q":
            var WXMessageEntity = new WXMessageModel(msg);
            WXMessageEntity.findSelf(function(err, messages){
                var articles = [];
                for (var i = 0; i < messages.length; i++) {
                    articles[i] = {
                        title : messages[i].title,
                        description : messages[i].description,
                        picUrl : messages[i].picUrl,
                        url : messages[i].picUrl
                    };
                };

                resMsg = {
                    fromUserName : msg.toUserName,
                    toUserName : msg.fromUserName,
                    msgType : "news",
                    articles : articles,
                    funcFlag : 0
                }

                 weixin.sendMsg(resMsg);
            })

        break;
    }
});



// 监听图片消息
weixin.imageMsg(function(msg) {
    console.log("imageMsg received");
    console.log(JSON.stringify(msg));
    var WXMessageEntity = new WXMessageModel(msg);
    WXMessageEntity.save(function (err) {
        if (err) console.log(err)
        console.log('save success');
    });
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


exports.latest = function(req, res){
    console.log(req.query)
    if (req.query.UserName) {
        res.cookie('UserName', req.query.UserName);
    };
    
    WXMessageModel.findNew(20, function(err, messages){

        res.render('latest', {
            messages: messages,
            first: true
        });
    });

};


exports.morelatest = function(req, res){
    if (req.body._id) {
        WXMessageModel.findNewByLast(20, req.body._id, function(err, messages){
            res.render('messages', {
                messages: messages,
                first: false
            });
        });
    } else {
        res.send(200, 'error');
    }
};


exports.show = function(req, res){
    if(req.params.id){
        WXMessageModel.findById(req.params.id, function(err, obj){
            if (err) {
                console.log(err);
                res.send(200, 'fail');
                return;
            };

            console.log(obj)

            console.log(req.cookies)

            obj.likeDisabled = obj.likes.indexOf(req.cookies.UserName) === -1 ? "" : "disabled";
            obj.fuckDisabled = obj.fucks.indexOf(req.cookies.UserName) === -1 ? "" : "disabled";
            res.render('show', obj);
        })
    }
};



exports.like = function(req, res){
    if(req.params.id){

        var conditions  = { _id: req.params.id},
        update = { $addToSet: { likes:  req.cookies.UserName} };
        WXMessageModel.update(conditions, update, function(err){
            if (err) console.log(err);

            res.send(200, 'success');
        })
    }
};
















































