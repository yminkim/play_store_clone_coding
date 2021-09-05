
// node_modules 에 있는 express 관련 파일을 가져온다.
var express = require('express')
// express 는 함수이므로, 반환값을 변수에 저장한다.
var app = express()
var db_config = require(__dirname + '/config/database.js');
var conn = db_config.init();
var bodyParser = require('body-parser');
const { application } = require('express');
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
// app.get('/list', function (req, res) {
//     var sql = 'SELECT * FROM board';    
//     conn.query(sql, function (err, rows, fields) {
//         if(err) console.log('query is not excuted. select fail...\n' + err);
//         else res.render('list.ejs', {list : rows});
//     });
// });

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
        let post_date; // 2021-08-01 23:15
        let post_monthDay;
        let post_time;

        //연도 처리
        post_date = rows[0].regdate.getFullYear()+"-";

        //월, 일 앞에 0 처리
        let month = rows[0].regdate.getMonth()+1;

        if(month < 10 && rows[0].regdate.getDate() < 10) {
            post_monthDay = "0"+month+"-"+"0"+rows[0].regdate.getDate()+" ";
        } else if(month < 10) {
            post_monthDay = "0"+month+"-"+rows[0].regdate.getDate()+" ";
        } else if(rows[0].regdate.getDate() < 10) {
            post_monthDay = month+"-"+"0"+rows[0].regdate.getDate()+" ";
        } else {
            post_monthDay = month+"-"+rows[0].regdate.getDate()+" ";
        }

        post_date += post_monthDay;

        // 시간 처리
        if(rows[0].regdate.getHours() < 10 && rows[0].regdate.getMinutes() < 10) {
            post_time = "0"+rows[0].regdate.getHours()+":"+"0"+rows[0].regdate.getMinutes();
        } else if(rows[0].regdate.getHours() < 10) {
            post_time = "0"+rows[0].regdate.getHours()+":"+rows[0].regdate.getMinutes();
        } else if(rows[0].regdate.getMinutes() < 10) {
            post_time = rows[0].regdate.getHours()+":"+"0"+rows[0].regdate.getMinutes();
        } else {
            post_time = rows[0].regdate.getHours()+":"+rows[0].regdate.getMinutes();
        }

        post_date += post_time;




        if(err) console.log('query is not excuted. select fail...\n' + err);
        else res.render('read.ejs', {list : rows, post_date : post_date});
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

// 회원가입 처리
app.post('/signUpAf', function(req, res) {
    var body = req.body;
    var sql = 'insert into user (login_id, login_pw) values (?, ?)';
    var queryparams = [body.login_id, body.login_pw];
    console.log(queryparams);
    conn.query(sql, queryparams, function(err) {
        if(err) console.log('query is not excuted. update fail...\n' + err);
        else res.redirect('/list');
    });
});

//로그인 처리
app.post('/signInAf', function(req, res) {
    var body = req.body;
    var sql = 'select exists(select * from user where login_id = ? and login_pw = ?) as isHave;';  
    queryparams = [body.login_id, body.login_pw];
    //console.log(queryparams);
    conn.query(sql, queryparams, function(err, rows, fields) {
        console.log(req.params.login_id);
        console.log(body.login_id);
        if(req.params.login_id == body.login_id)
            console.log('일단 로그인 확인');
        else 
            console.log('실패');
    });
});


//페이지 처리
//select * from board limit 5 offset value; 인데 value는 (페이지 번호 - 1 ) * 5로 ㄱㄱ
app.get('/list', function (req, res) {
    let sql = 'select count(*) as count from board';
    conn.query(sql, function(err, result, fields) {
        const total = result[0].count;
        const limit = 5;
        const pages = total / limit;
        var page;

        if (req.param('pages') == null) {
            page = 1;
        } else {
            page = req.param('pages');
        }

        let offset = (page - 1) * limit;
        let sub_sql = 'select * from board order by id desc limit '+ limit +' offset '+ offset;
        
        conn.query(sub_sql, function (err, rows, fields) {
            // 1. 현재 시간(Locale)
            const curr = new Date();

            // 2. UTC 시간 계산
            const utc = 
                curr.getTime() + 
                (curr.getTimezoneOffset() * 60 * 1000);

            // 3. UTC to KST (UTC + 9시간)
            const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
            const kr_curr = 
                new Date(utc + (KR_TIME_DIFF));

            let kr_curr_y = kr_curr.getFullYear();
            let kr_curr_m = kr_curr.getMonth();
            let kr_curr_d = kr_curr.getDate();

            //기준 시간 설정(당일 00:00:00)
            let today_set = new Date(kr_curr_y, kr_curr_m, kr_curr_d, 0,0,0);
            
            // console.log("기준시간용"+today_set);
            // console.log(today_set.toISOString());
            // console.log(rows[0].regdate.toISOString());

            //넘겨줄 변수
            let post_time = new Array(rows.length);  
            
            for(let i=0; i < rows.length; i++) { 
                if(today_set.toISOString() > rows[i].regdate.toISOString()) {
                    post_time[i] = rows[i].regdate.getFullYear();
                    //월, 일 앞에 0 처리
                    let month = rows[i].regdate.getMonth()+1;

                    if(month < 10 && rows[i].regdate.getDate() < 10) {
                        post_monthDay = "0"+month+"."+"0"+rows[i].regdate.getDate();
                    } else if(month < 10) {
                        post_monthDay = "0"+month+"."+rows[i].regdate.getDate();
                    } else if(rows[i].regdate.getDate() < 10) {
                        post_monthDay = month+"."+"0"+rows[i].regdate.getDate();
                    } else {
                        post_monthDay = month+"."+rows[i].regdate.getDate();
                    }

                    post_time[i] += "."+post_monthDay;


                } else {
                    if(rows[i].regdate.getHours() < 10 && rows[i].regdate.getMinutes() < 10) {
                        post_time[i] = "0"+rows[i].regdate.getHours()+":"+"0"+rows[i].regdate.getMinutes();
                    } else if(rows[i].regdate.getHours() < 10) {
                        post_time[i] = "0"+rows[i].regdate.getHours()+":"+rows[i].regdate.getMinutes();
                    } else if(rows[i].regdate.getMinutes() < 10) {
                        post_time[i] = rows[i].regdate.getHours()+":"+"0"+rows[i].regdate.getMinutes();
                    } else {
                        post_time[i] = rows[i].regdate.getHours()+":"+rows[i].regdate.getMinutes();
                    }
                }
            }

            // console.log("기준시간용"+today_set);
            // if(today_set > rows[0].regdate) {
            //     console.log("기준시간용"+today_set);
            //     console.log('기준 시간보다 낮다!');
            //     console.log(today_set);
            //     console.log(rows[0].regdate);
            // } else {
            //     console.log("기준시간용"+today_set);
            //     console.log('기준 시간보다 높다!');
            //     console.log(today_set);
            //     console.log(rows[0].regdate);
            // }
            
            if(err) console.log('query is not excuted. select fail...\n' + err);
            else res.render('list.ejs', {list : rows, pages : pages, post_time : post_time}); 

            
        });
    });
});