// mysql 블러오기
var mysql = require('mysql');

// mysql 연결 
var connection = mysql.createConnection({
    host : '3.35.50.179',
    user : 'doping',
    password : 'Doping!1234',
    database : 'playstation'
});

// 설정된 mysql 연결 인스턴스
connection.connect();

// query 실행
connection.query('', function (error, results, fields) {
    if (error) {
        console.log(error);
    }
    console.log('The game is: ', results);
});

// 인스턴스 종료
connection.end();
