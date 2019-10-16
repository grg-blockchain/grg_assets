module.exports = {
    service: {
        listen_port: 3002,
        listen_https_port:3302
    },
    upload: {
        // path: process.cwd() + '/uploads'
        path: __dirname + "/../storage/uploads/"
    },
    db: {
        host: '127.0.0.1',
        user: 'grg_assets',
        password: 'grg_assets_wG1sOp23sL',
        database: 'grg_assets',
    },
    redis: {
        host: "10.252.51.1",
        port: 6379,
        password: "",
        db: 0,
    },
    cookie: {
        maxAge: 604800000
    },
    sessionStore: {
        host: "10.252.51.1",
        port: 6379,
        pass: "",
        db: 13,
        ttl: 31536000000,
        logErrors: true
    },
    geth: {
        contract_address: {
            host: "10.252.51.1",
            port: 8545,
            miner_password: "12345678",

            contract: {
                contract_address: "0x463f616947a7a83754f7ecbf3c6ac6180086b3ff",
                contract_abi: [{"constant":false,"inputs":[{"name":"appName","type":"string"},{"name":"key","type":"string"},{"name":"value","type":"string"}],"name":"SetSavedInfo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"}],"name":"denyAccess","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"appName","type":"string"},{"name":"key","type":"string"}],"name":"GetSavedInfo","outputs":[{"name":"err","type":"uint256"},{"name":"value","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"}],"name":"allowAccess","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"err","type":"uint256"}],"name":"e","type":"event"}],
            }
        },
    },
    fileStore: {
        address: "http://127.0.0.1:3001/"
    },
    data_sync: {
        wallet_address: "",
    },
    url:{
        //host: "10.252.51.1", //注意:不用协议部分(http://)
        //port: 18003,
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        } //设置content-type 头部
    },
    third_account: {
        wechat: {
            app_id: "wx03fc0fbc1e0ba9b6",
            secret: "a7b9d3501ecc9c01b28b753de5203cf5",
        }
    }

};
