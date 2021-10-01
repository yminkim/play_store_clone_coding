// node_modules 에 있는 express 관련 파일을 가져온다.
var express = require('express')
// express 는 함수이므로, 반환값을 변수에 저장한다.
var app = express()
var db_config = require(__dirname + '/config/database.js');
var conn = db_config.init();
var bodyParser = require('body-parser');
const { application, query } = require('express');

var session = require('express-session');
const { render } = require('ejs');

// var req.session;

app.use(session({
    secret: "asdfasdfasdf",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 600000 }
}));

app.get('/profile/image/update', function(req, res) {
    let sql = 'UPDATE user SET user_img = ? WHERE id = ?';
    let params = [req.query.img_src, req.session.user.id];

    conn.query(sql, params, function(err) {
        if(err) console.log(err);
        else {
            console.log(req.session.user.id+'의 이미지 변경 성공');
            console.log('전: '+JSON.stringify(req.session.user));
            req.session.user.user_img = req.query.img_src;
            console.log('후: '+JSON.stringify(req.session.user)); 
            req.session.save();
        }
    })

    res.send("request accept success - " + req.query.img_src);
});

app.get('/', function(req, res) {
    //req.session = req.session;
    //req.session.username = 'asdf';  테스트용 
    // console.log(req.session.username);테스트용 
});

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


// 브라우즈 페이지 렌더링
app.get('/playstation_Store_browse',function(req,res){
    let sql = 'select * from game';

    conn.query(sql, function(err, rows, fields){
        let list_count = rows.length;
        if(err) console.log('브라우져 렌더링 실패' + err);
        else {
            res.render('ps_browse.ejs', {game : rows, list_count : list_count});
        }
    });
});

// 옵션 관련하여 ajax 처리
app.get('/playstation_Store_browse_ajax', function(req, res){
    let sql = "";
    let sort_op = ""; // 정렬 옵션 쿼리 변수
    let price_sort_op=""; // 가격 옵션 쿼리 변수
    let genre_sort_op=""; // 장르 옵션 쿼리 변수
    let device_sort_op = ""; // 디바이스 옵션 쿼리 변수
    let release_sort_op = ""; // 기간 옵션
    let vr_sort_op = ""; // vr옵션
    let query_where = "";
    // 가격 정렬 옵션 정보를 담는 배열
    let price_sort = [];
    price_sort =  req.query.sort_price_op; 

    // 장르 정렬 옵션 정보를 담는 배열
    let genre_sort = [];
    genre_sort = req.query.sort_genre_op;

    // 디바이스 정렬 옵션 정보를 담는 배열
    let device_sort = [];
    device_sort = req.query.sort_device_op;

    // 기간 정렬 옵션 정보를 담는 배열
    let release_sort = [];
    release_sort = req.query.sort_release_op;

    // vr 정렬 옵션 정보를 담는 배열
    let vr_sort = [];
    vr_sort = req.query.sort_vr_op;

    let sort_num = req.query.sort_option; // 페이지에서 요청온 아이템 번호
    sql = 'select game.id, game.title, game.image, gg.game_id, gg.genre, plt.device from game left join game_genre as gg on game.id = gg.game_id left join platform as plt on game.id = plt.game_id'; // 기본 정렬

    switch(sort_num) {
        case '1' :
            sort_op = ' order by title DESC';
            break;
        case '2' :
            sort_op = ' order by title ASC';
            break;
        case '3' :
            sort_op = ' order by release_date ASC';
            break;
        case '4' : 
            sort_op = ' order by release_date DESC';
            break;
        case '5' :
            sort_op = ' order by price ASC';
            break;
        case '6' :
            sort_op = ' order by price DESC';
            break;
        default :
            break;
    }
    

    
   // let prict_sort_len = price_sort.length;
    // price 정렬 쿼리문 제작
    if(price_sort != undefined) {
        query_where = " where";
        price_sort_op += ' (';
        for(let i=0; i<price_sort.length; i++) {
            
            switch(price_sort[i]) {
                case '가격옵션-무료' :
                    price_sort_op += ' game.price = 0';
                    break;
                case '가격옵션-49' :
                    price_sort_op +=' game.price <= 4999';
                    break;
                case '가격옵션-5099' :
                    price_sort_op +=' game.price between 5000 and 9999';
                    break;
                case '가격옵션-100199' :
                    price_sort_op +=' game.price between 10000 and 19999';
                    break;
                case '가격옵션-200499' :
                    price_sort_op +=' game.price between 20000 and 49999';
                    break;
                case '가격옵션-500' :
                    price_sort_op +=' game.price >= 50000';
                    break;
                default :
                    break;
            }

            // 마지막 요소 전까지는 or 을 붙여줌
            if(i+1 != price_sort.length)
                price_sort_op += ' or';
            else {
                price_sort_op += ' )';
            }
        }
    }

    // 장르 정렬 
    if(genre_sort != undefined) {
        query_where = " where";
        genre_sort_op = ' (gg.genre in (';
        for(let i=0; i<genre_sort.length; i++) {
            
            switch(genre_sort[i]) {
                case '장르옵션-액션' :
                    genre_sort_op += "'액션'";
                    break;
                case '장르옵션-어드밴처' :
                    genre_sort_op += "'어드벤처'";
                    break;
                case '장르옵션-공포' :
                    genre_sort_op += "'공포'";
                    break;
                case '장르옵션-슈팅' :
                    genre_sort_op += "'슈팅'";
                    break;
                case '장르옵션-롤플레잉게임' :
                    genre_sort_op += "'롤플레잉 게임'";
                    break;
                case '장르옵션-드라이빙레이싱' :
                    genre_sort_op += "'드라이빙/레이싱'";
                    break;
                case '장르옵션-스포츠' :
                    genre_sort_op += "'스포츠'";
                    break;
                case '장르옵션-유니크' :
                    genre_sort_op += "'유니크'";
                    break;
                default :
                    break;
            }

            // 마지막 요소 전까지는 or 을 붙여줌
            if(i+1 != genre_sort.length)
                genre_sort_op += ', ';
            else {
                genre_sort_op += '))';
            }
        }
    }

    

    // 디바이스 옵션
    if(device_sort != undefined) {
        query_where = " where";
        device_sort_op = ' (';
        for(let i=0; i<device_sort.length; i++) {
            
            switch(device_sort[i]) {
                case '디바이스옵션-ps4' :
                    device_sort_op += " plt.device = 'ps4'";
                    break;
                case '디바이스옵션-ps5' :
                    device_sort_op += " plt.device = 'ps5'";
                    break;
                default :
                    break;
            }

            // 마지막 요소 전까지는 or 을 붙여줌
            if(i+1 != device_sort.length)
                device_sort_op += ' or';
            else {
                device_sort_op += ')';
            }
        }
    }

    /// 기간 옵션
    if(release_sort != undefined) {
        query_where = " where";
        release_sort_op = " (";
        for(let i=0; i < release_sort.length; i++) {
            switch(release_sort[i]) {
                case '릴리즈옵션-신규출시' :
                    release_sort_op += " (game.release_date between date_sub(now(), interval 2 month) and now())";
                    break;
                case '릴리즈옵션-곧제공예정' :
                    release_sort_op += " release_date > now()";
                    break;
                default : 
                    break;
            }

            // 마지막 요소 전까지는 or 을 붙여줌
            if(i+1 != release_sort.length)
                release_sort_op += ' or';
            else {
                release_sort_op += ')';
            }
        }
    }


    /// vr 옵션
    if(vr_sort != undefined) {
        query_where = " where";
        vr_sort_op = " (game.go_vr_type in (";
        for(let i=0; i < vr_sort.length; i++) {
            switch(vr_sort[i]) {
                case 'vr옵션-vr없음' :
                    vr_sort_op += " 'VR 없음'";
                    break;
                case 'vr옵션-vr필수' :
                    vr_sort_op += " 'VR 필수'";
                    break;
                case 'vr옵션-vr선택사항' :
                    vr_sort_op += " 'VR 선택 사항'";
                    break;
                default : 
                    break;
            }

            // 마지막 요소 전까지는 or 을 붙여줌
            if(i+1 != vr_sort.length)
                vr_sort_op += ', ';
            else {
                vr_sort_op += '))';
            }
        }
    }




    // 최종 쿼리 조합
    // 쿼리 붙일 때 조건 여부를 확인하여 조건이 있다면 where을 붙이고 시작
    if(query_where == " where") {
        sql += query_where;
    }
    // 가격 조건이 비어있지 않다면 준비해둔 가격 옵션 쿼리를 이어서 붙임
    if(price_sort_op != "") {
        sql += price_sort_op;
    }
    // 장르 조건이 비어있지 않다면 준비해둔 장르 옵션 쿼리를 이어서 붙임
    if(genre_sort_op != "") {
        // 가격 옵션 뒤에 오기 때문에 가격 옵션이 비어있지 않다면 or을 붙임
        if(price_sort_op != "") {
            sql += ' and';
        }
        sql += genre_sort_op;
    }

    // 디바이스 조건이 비어있지 않다면 준비해둔 장르 옵션 쿼리를 이어서 붙임
    if(device_sort_op != "") {
        // 가격 옵션 뒤에 오기 때문에 가격 옵션이 비어있지 않다면 or을 붙임
        if(price_sort_op != "" || genre_sort_op != "") {
            sql += ' and';
        }
        sql += device_sort_op;
    }

    // 기간 정렬
    if(release_sort_op != "") {
        if(price_sort_op != "" || genre_sort_op != "" || device_sort_op != "") {
            sql += ' and';
        }
        sql += release_sort_op;
    }


    // vr 정렬
    if(vr_sort_op != "") {
        if(price_sort_op != "" || genre_sort_op != "" || device_sort_op != "" || release_sort_op != "") {
            sql += ' and';
        }
        sql += vr_sort_op;
    }


    // 마지막으로 정렬 옵션이 있다면 쿼리를 이어서 붙임
    if(sort_op != "") {
        sql += sort_op;
    }

    console.log('여기입니다 | '+ sql); // 잘 조합되시나요?~
    let game = [];

    conn.query(sql, function(err, rows, fields){
        let list_count = rows.length;
        
        if(err) console.log('브라우져 렌더링 실패' + err);
        else {

            //중복되는 튜플 제외하고 배열에 넣어주는 구간
            for(let i=0; i<rows.length; i++) {
                if(rows.length != (i+1)) { // 마지막 행 이전 적용
                    if(rows[i].id != rows[i+1].id) { // 현재 행과 다음행의 id값이 같으면 추가해주지 않음
                        game.push(rows[i]);
                    }
                } else { // 마지막 행 도달 시 배열에 추가
                    game.push(rows[i]);
                }
                
            }

            res.render('ps_browse_ajax.ejs', {game : game, list_count : list_count});
        }
    });
});

app.get('/playstation_Store_latest',function(req,res){
    let sql = "SELECT game.id, game.title, game.image, game.price, game.release_date, dis.rate FROM game left join discount as dis on game.id = dis.game_id order by game.release_date desc limit 11";
    conn.query(sql, function(err, rows, fields) {
        // 가격 포맷
        let game_price = [];
        let game_dc_price = [];
        for(let i=0; i< rows.length; i++) {
            game_price[i] = comma(rows[i].price);
            
            game_dc_price[i] = comma(discount_price(rows[i].price, rows[i].rate));
            
        }
        
        console.log('가격: ' + game_price);
        console.log('할인 가격: ' + game_dc_price);
        res.render('play_store_latest.ejs', {game : rows, price : game_price, dc_price : game_dc_price});
    });
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


// 숫자 콤마 찍기
function comma(num) {
    var len, point, str; 
       
    num = num + ""; 
    point = num.length % 3 ;
    len = num.length; 
   
    str = num.substring(0, point); 
    while (point < len) { 
        if (str != "") str += ","; 
        str += num.substring(point, point + 3); 
        point += 3; 
    } 
    
    if(str == "0") {
        str = "무료";
    } else {
        str += '원';
    }

    return str;
}

// 할인가 구하기
function discount_price(price, rate) {
    return price * (100 - rate) / 100;
}

//할인 기간 포맷 바꿔주는 함수,, 다 만들고 위로 분리시켜야함
function date_format(date) {
    let date_y = date.getFullYear();
    let date_m = date.getMonth()+1;
    let date_d = date.getDate();

    
        return date_y + "/" + date_m + "/" + date_d;
        
    
}


app.get('/playstation_Store_game_page',function(req,res){
    let game_id = req.param('id');
    let publisher_name;

    //게임 db 가져오기
    sql = 'select * from game where id = '+game_id;
    conn.query(sql, function(err, rows, fields){
        if(err) console.log(err);
        else {
            //원가, 콤마 찍은 가격
            price = rows[0].price;
            price_c = comma(rows[0].price);

            //게임 속성 배열로 정리하기
            let go_arr = new Array();

            if(rows[0].go_play_type != undefined) {
                go_arr.push(rows[0].go_play_type);
            }

            if(rows[0].go_buy_type != undefined) {
                go_arr.push(rows[0].go_buy_type);
            }

            if(rows[0].go_psplus_type != undefined) {
                go_arr.push(rows[0].go_psplus_type);
            }

            if(rows[0].go_maxplayer != undefined) {
                go_arr.push(rows[0].go_maxplayer);
            }

            if(rows[0].go_online_type != undefined) {
                go_arr.push(rows[0].go_online_type);
            }

            if(rows[0].go_vr_type != undefined) {
                go_arr.push(rows[0].go_vr_type);
            }


            // [게임 세부 정보]
            let release_date = date_format(rows[0].release_date);
            
            


            //게임 퍼블리셔 가져오기
            sql_f = 'select name from publisher where id = '+game_id;
            conn.query(sql_f, function(err, result, fields) {
                publisher_name = result[0].name;

                //게임 할인율 가져오기
                sql_discount = "select * from discount where game_id = "+game_id;
                conn.query(sql_discount, function(err, result, fields){
                    let discount;
                    let discount_price_c;
                    let discount_rate;
                    let discount_date;
                    let discount_end_date;

                    if(result[0] != undefined) {
                        discount = result[0];
                        discount_price_c = comma(discount_price(price, discount.rate));
                        discount_rate = discount.rate;
                        discount_date = discount.end_date;
                        
                        discount_end_date = date_format(discount_date)+ "에 프로모션 종료";
                    }
                    // 게임의 플랫폼 정보 가져오기
                    sql = 'select * from platform where game_id = '+game_id;
                    conn.query(sql, function(err, result, fields){
                        let device = result;
                        // [게임 세부 정보]
                        let device_s = "";
                        if(device[0].device != undefined) {
                            for(let i=0; i<device.length; i++) {
                                if(i+1 == device.length) {
                                    device_s += device[i].device;
                                } else {
                                    device_s += device[i].device+", ";
                                }
                            }
                        } else {
                            device_s = null;
                        }
                       

                        // 에디션 정보, 플랫폼, 할인 가져오기
                        sql = 'select edt.*, dc.* from edition as edt left join discount as dc on edt.id = dc.edition_id where edt.game_id = '+ game_id;
                        conn.query(sql, function(err, result, fields) {
                            let edition = result;
                            //에디션 콘텐츠를 넣어줄 배열
                            let edition_contents = [];
                            //에디션 할인 가격 할인 관련 정보
                            let e_discount = []; // 에디션 가격 정보를 담는 배열
                            let e_discount_prcie = []; // 에디션 가격 중 할인이 적용된 가격
                            let e_discount_date = []; //  에디션 할인 종료일자(바로위 data를 담는 배열)
                            let e_price = [];
                            //콘텐츠 아이템이 존재할 경우 위 배열에 push함
                            for(let i=0; i<edition.length ; i++) {
                                edition_contents[i] = [];
                                for(let j=0 ; j<4 ; j++) {
                                    if(eval('edition['+i+'].contents'+(j+1)) != undefined) {
                                        edition_contents[i].push(eval('edition['+i+'].contents'+(j+1)));
                                    }
                                }
                                //에디션 원가 콤마
                                e_price[i] = comma(edition[i].price);

                                //에디션 할인가 계산을 위한 식
                                e_discount[i]= [];
                                e_discount[i].push(edition[i].price);
                                e_discount[i].push(edition[i].rate);
                                e_discount[i].push(edition[i].end_date);

                                e_discount_prcie[i] = comma(discount_price(edition[i].price, edition[i].rate));
                                
                                //에디션 할인 날짜 스트링 배열
                                if(edition[i].end_date != undefined)
                                    e_discount_date[i] = date_format(edition[i].end_date)+ "에 프로모션 종료";
                            }

                            //console.log('정가 릴레이: '+ e_price);
                            //console.log('할인율 릴레이: '+ edition[0].rate + "/" + edition[1].rate + "/" + edition[2].rate);
                            //console.log('할인가 릴레이: '+ e_discount_prcie);
                            //console.log(e_discount_date);
                            
                            sql = 'SELECT ed.id, ed.game_id, pl.device FROM edition as ed left join platform as pl on ed.id = pl.edition_id where ed.game_id =' + game_id;
                            conn.query(sql, function(err, result, fields) {
                                let e_device = result;
                                //let e_count = edition.length;
                                let e_dvc_arr = [];
                                
                                let k = 0;
                                for(let i=0; i<e_device.length; i++) {
                                    let tmp = 'true';
                                    if(i > 0) {

                                        if(e_device[i].id != e_device[i-1].id) {
                                            ++k;
                                            
                                        } else {
                                            tmp = 'false';
                                        }

                                    }
                                    if(tmp == 'true') {
                                        e_dvc_arr[k] = [];
                                    }
                                   


                                    //console.log('asdf'+k);
                                    e_dvc_arr[k].push(e_device[i].device);
                                }

                                //console.log(e_dvc_arr);
                                
                                sql = 'select * from additional_content as ac left join discount as ds on ac.id = ds.additional_content_id where ac.game_id =' + game_id;
                                conn.query(sql, function(err, result, fields){
                                    let add_c = result;
                                    
                                    let add_c_dc_price_info = [];
                                    let add_c_price_info = [];

                                    for(let i=0 ; i<add_c.length; i++) {
                                        add_c_price_info[i] = comma(add_c[i].price);
                                        add_c_dc_price_info[i] = comma(discount_price(add_c[i].price, add_c[i].rate));
                                    }
                                    //console.log(add_c_price_info);

                                    // 추가콘텐츠 플랫폼 정보 가져오기
                                    sql = 'select ac.*, plt.device from additional_content as ac left join platform as plt on ac.id = plt.additional_content_id where ac.game_id = ' + game_id;
                                    conn.query(sql, function(err, result, fields){
                                        let ac_device = result;
                                        let ac_dvc_arr = [];
                                        
                                        let k = 0;
                                        for(let i=0; i<ac_device.length; i++) {
                                            let tmp = 'true';
                                            if(i > 0) {

                                                if(ac_device[i].id != ac_device[i-1].id) {
                                                    ++k;
                                                    
                                                } else {
                                                    tmp = 'false';
                                                }

                                            }
                                            if(tmp == 'true') {
                                                ac_dvc_arr[k] = [];
                                            }
                                        


                                            //console.log(ac_device[i].id+' '+k);
                                            ac_dvc_arr[k].push(ac_device[i].device);
                                        }

                                        //console.log(ac_dvc_arr);

                                        // 게임 장르 가져오기
                                        sql = 'SELECT * FROM playstation.game_genre where game_id = ' + game_id;
                                        conn.query(sql, function(err, result){

                                            game_gr = result;
                                            let genre ="";
                                            // 장르 이어 붙이는 작업
                                            if(game_gr[0].genre != undefined) {
                                                for(let i=0; i<game_gr.length; i++) {
                                                    if(i+1 == game_gr.length) {
                                                        genre += game_gr[i].genre;
                                                    } else {
                                                        genre += game_gr[i].genre+", ";
                                                    }
                                                }
                                            } else {
                                                genre = null;
                                            }


                                            res.render('game_page.ejs', {
                                                game : rows[0],
                                                publisher : publisher_name,
                                                price : price_c,
                                                discount_price : discount_price_c,
                                                discount_rate : discount_rate,
                                                discount_end_date : discount_end_date, 
                                                discount : discount,
                                                go_arr : go_arr,
                                                device : device,
                                                release_date : release_date, 
                                                genre : genre,
                                                device_s : device_s, 
                                                //에디션 정보
                                                edition : edition, 
                                                edition_contents : edition_contents, // 에디션 아이템
                                                e_price : e_price, // 에디션 가격 콤마
                                                e_discount_prcie : e_discount_prcie, // 할인가 콤마
                                                e_discount_date : e_discount_date, // 프로모션 스트링
                                                e_dvc_arr : e_dvc_arr, // 에디션 디바이스 배열
                                                //추가콘텐츠
                                                add_c : add_c, // 추가콘텐츠
                                                add_c_price_info : add_c_price_info,
                                                add_c_dc_price_info : add_c_dc_price_info, // 추가콘텐츠 할인 정보
                                                ac_dvc_arr : ac_dvc_arr // 추가콘텐츠 디바이스 배열
                                                
                                            });
                                        });
                                        
                                    });
                                    
                                });

                                


                            });

                                
                        });

                    });


                    
                });
                
            });
                
            
            
           
        }
    });

    
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
    let login_info;
    login_info = req.session.user;
    console.log(JSON.stringify(req.session.user));
    res.render('write.ejs', {user_info : login_info});
});

app.post('/writeAf', function (req, res) {
    
    var body = req.body;
    console.log(body);
    let author_imgs = req.session.user.user_img;

    var sql = 'INSERT INTO board (author, title, content, regdate, post_pw, author_img, user_id) VALUES (?, ?, ?, NOW(), ?, ?, ?)';
    var params = [body.author, body.title, body.content, body.post_pw, author_imgs, body.user_id];

    

    var sql2 = 'update user set user_img = ? where id = ?';
    var params2 = [body.author_img, req.session.user.id];
    
    
    conn.query(sql, params, function(err) {
        conn.query(sql2, params2);
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
    let login_info;
    if(req.session != null) {
        login_info = req.session.user;
        console.log(login_info);
    }

    console.log(req.session);


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
        else res.render('read.ejs', {list : rows, post_date : post_date, user_info : login_info});
    });
});


//로그인 페이지
app.get('/signIn', function (req, res) {
    req.session = req.session;
    let validation = true;
    if (req.session.valid == false) {
        validation = false;
    }
    
    res.render('sign_in.ejs', {validation : validation, user_info : req.session});
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
            return;
        }
        req.session;
        
    });
});

//로그인 처리
app.post('/signInAf', function(req, res) {
    var body = req.body;

    var sql = 'select id, login_id, nickname, user_img from user where login_id = ? and login_pw = ?';
    queryparams = [body.login_id, body.login_pw];
    //console.log(queryparams);
    conn.query(sql, queryparams, function(err, rows, fields) {
        if(rows[0] == undefined) {
            console.log('로그인 실패 처리');
            req.session.valid = false;
            res.redirect('/signIn');
        } else {
            req.session.user = rows[0];
            console.log("로그인 성공/ 접속 id: " + req.session.user.nickname);
            res.redirect('/list');
        }
        
    });
});

//회원가입 페이지
app.get('/signUp', function (req, res) {
    req.session = req.session;
    let overlap_ck = true;
    if(req.session.overlap == false) {
        overlap_ck = false;
    }

    res.render('sign_up.ejs', {overlap_ck : overlap_ck});
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
            return;
        }
        req.session;
        
    });
});

// 회원가입 처리
app.post('/signUpAf', function(req, res) {
    var body = req.body;

    let get_user_db_sql = 'select login_id, nickname from user where login_id = ? or nickname = ?';
    let params = [body.login_id, body.nickname];
    
    conn.query(get_user_db_sql, params, function(err, rows, fields){
        if(rows[0] != undefined) {
            console.log('중복확인');
            req.session.overlap = false;
            res.redirect('/signUp');
        } else {
            var sql = 'insert into user (login_id, login_pw, nickname) values (?, ?, ?)';
            var queryparams = [body.login_id, body.login_pw, body.nickname];
            console.log(queryparams);
            conn.query(sql, queryparams, function(err) {
                if(err) console.log('query is not excuted. update fail...\n' + err);
                else {
                    req.session.new_id = body.login_id;
                    req.session.new_pw = body.login_pw;
                    console.log('새아이디'+req.session.new_id);
                    console.log('새비번'+req.session.new_pw);
                    req.session.overlap = true;
                    res.redirect('/signIn');
                }
            });
        }

    });

});



//로그아웃 처리
app.post('/logout', function(req, res) {
    console.log('로그아웃 시도');
    // req.session = req.session;
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
            return;
        }
        req.session;
        
    });

    res.redirect('/list');

    // req.session.destroy(function(err) {
    //     if(err) 
    //         console.log(err);
    //     else {
    //         console.log('세션을 삭제하고 로그아웃 합니다.');
    //         res.redirect('/list');
    //         console.log("로그아웃 후 세션"+req.session);
    //     }
    // });

});

//탈퇴
app.post('/remove_user', function(req, res) {
    let sql = 'delete from user where id = ?';
    console.log(req.session.user.id);
    let params = req.session.user.id;
    conn.query(sql, params, function(err, rows, fields){
        console.log(params+'회원을 탈퇴합니다.');
        res.redirect('/signIn');
    });
});

//페이지 처리
//select * from board limit 5 offset value; 인데 value는 (페이지 번호 - 1 ) * 5로 ㄱㄱ
app.get('/list', function (req, res) {
    let login_info;
    if(req.session != null) {
        login_info = req.session.user;
        console.log(login_info);
    }
    
    

    let sql = 'select count(*) as count from board';
    conn.query(sql, function(err, result, fields) {
        const total = result[0].count;
        const limit = 10;
        const pages = Math.ceil(total / limit); // ejs에서 페이지 수를 계산해준거임
        console.log(pages); 
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
            
            if(err) console.log('query is not excuted. select fail...\n' + err);
            else res.render('list.ejs', {list : rows, pages : pages, post_time : post_time, user_info : login_info, n_page : page}); 

            
        });
    });
});