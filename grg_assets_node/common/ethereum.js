const config = require('../config');
const Web3 = require('web3');

const ETHEREUM_ADDRESS = "http://" + config.geth.contract_address.host + ":" + config.geth.contract_address.port;

var _instance = null;
function Ethereum() {
    this.web3 = new Web3();
    this.web3.setProvider(new this.web3.providers.HttpProvider(ETHEREUM_ADDRESS));
    if(!this.web3.isConnected()) {
        throw new Error('unable to connect to ethereum node at ' + ETHEREUM_ADDRESS);
    }

    console.log("success connect to ethereum node at " + ETHEREUM_ADDRESS);
    this.account = this.web3.eth.accounts[0];
    this.contractOption = {from: this.account, gas: 3141592, gasPrice: 18000000000};

    this.contractInstance = this.web3.eth.contract(config.geth.contract_address.contract.contract_abi)
        .at(config.geth.contract_address.contract.contract_address);

    this.web3.personal.unlockAccount(this.web3.eth.accounts[0], config.geth.contract_address.miner_password, 0);
}
if (_instance == null) {
    _instance = new Ethereum();
}

module.exports = _instance;
