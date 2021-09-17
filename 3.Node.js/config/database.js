var mysql = require('mysql');
var db_info = {
    port: '3306',
    host : '13.125.179.15',
    user : 'doping',
    password : 'Doping!1234',
    database : 'playstation'
}

module.exports = {
    init: function () {
        return mysql.createConnection(db_info);
    },
    connect: function(conn) {
        conn.connect(function(err) {
            if(err) console.error('mysql connection error : ' + err);
            else console.log('mysql is connected successfully!');
        });
    }
}