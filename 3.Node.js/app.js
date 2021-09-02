// node_modules 에 있는 express 관련 파일을 가져온다.
var express = require('express')
// express 는 함수이므로, 반환값을 변수에 저장한다.
var app = express()
var db_config = require(__dirname + '/config/database.js');
var conn = db_config.init();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extende: false}));

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('views'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html'); 


// db연결
db_config.connect(conn);

// 3000 포트로 서버 오픈
app.listen(3000, function() {
    console.log("start! express server on port 3000")
});

app.get('/playstation_Store_collections',function(req,res){
    res.render('play_store.html');
});

app.get('/playstation_Store_browse',function(req,res){
    res.render('ps_browse.html');
});

app.get('/playstation_Store_latest',function(req,res){
    res.render('play_store_latest.html');
});

app.get('/playstation_Store_deals',function(req,res){
    res.render('play_store_deals.html');
});

app.get('/playstation_Store_ps5',function(req,res){
    res.render('play_store_ps5.html');
});

app.get('/playstation_Store_subscriptions',function(req,res){
    res.render('play_store_subscriptions.html');
});

app.get('/playstation_Store_game_page',function(req,res){
    res.render('game_page.html');
});

// mysql 테스트용 게시판
app.get('/list', function (req, res) {
    var sql = 'SELECT * FROM board';    
    conn.query(sql, function (err, rows, fields) {
        if(err) console.log('query is not excuted. select fail...\n' + err);
        else res.render('list.ejs', {list : rows});
    });
});

app.get('/write', function (req, res) {
    res.render('write.ejs');
});

app.post('/writeAf', function (req, res) {
    var body = req.body;
    console.log(body);

    var sql = 'INSERT INTO board (author, title, content, regdate, post_pw, author_img) VALUES (?, ?, ?, NOW(), ?, ?)';
    var params = [body.author, body.title, body.content, body.post_pw, body.author_img];
    console.log(sql);
    conn.query(sql, params, function(err) {
        if(err) console.log('query is not excuted. insert fail...\n' + err);
        else res.redirect('/list');
    });
  
});


app.get('/delete/:id', function(req, res) {
    var sql = 'delete from board where id = ?';
    var params = [req.params.id];
    console.log("id값: "+params);
    conn.query(sql, params, function(err) {
        if(err) console.log('query is not excuted. delete fail...\n' + err);
        else res.redirect('/list');
    });

});

app.get('/edit/:id', function(req, res){
    var sql = 'SELECT * FROM board where id = ?';    
    var params = [req.params.id];
    console.log("id값: "+params);
    conn.query(sql, params, function (err, rows, fields) {
        if(err) console.log('query is not excuted. select fail...\n' + err);
        else res.render('update.ejs', {list : rows});
    });
});

app.post('/updateAf', function(req, res) {
    var body = req.body;
    var sql = 'update board set title = ?, content = ? where id = ?';
    var queryparams = [body.title, body.content, req.query.id];
    console.log(queryparams);
    conn.query(sql, queryparams, function(err) {
        if(err) console.log('query is not excuted. update fail...\n' + err);
        else res.redirect('/read/'+ req.query.id);
    });
});


//게시글 페이지

app.get('/read/:id', function (req, res) {
    var sql = 'SELECT * FROM board where id = ?';    
    var params = [req.params.id];
    conn.query(sql, params, function (err, rows, fields) {
        if(err) console.log('query is not excuted. select fail...\n' + err);
        else res.render('read.ejs', {list : rows});
    });
});


//로그인 페이지
app.get('/signIn', function (req, res) {
    res.render('sign_in.ejs');
});

//회원가입 페이지
app.get('/signUp', function (req, res) {
    res.render('sign_up.ejs');
});

