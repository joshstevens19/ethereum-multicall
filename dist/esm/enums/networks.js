export var Networks;
(function (Networks) {
    Networks[Networks["mainnet"] = 1] = "mainnet";
    Networks[Networks["ropsten"] = 3] = "ropsten";
    Networks[Networks["rinkeby"] = 4] = "rinkeby";
    Networks[Networks["goerli"] = 5] = "goerli";
    Networks[Networks["kovan"] = 42] = "kovan";
    Networks[Networks["bsc"] = 56] = "bsc";
    Networks[Networks["bsc_testnet"] = 97] = "bsc_testnet";
    Networks[Networks["xdai"] = 100] = "xdai";
    Networks[Networks["matic"] = 137] = "matic";
    Networks[Networks["mumbai"] = 80001] = "mumbai";
    Networks[Networks["avalauncheFuji"] = 43113] = "avalauncheFuji";
    Networks[Networks["avalauncheMainnet"] = 43114] = "avalauncheMainnet";
    Networks[Networks["etherlite"] = 111] = "etherlite";
    Networks[Networks["arbitrum"] = 42161] = "arbitrum";
    Networks[Networks["fantom"] = 250] = "fantom";
})(Networks || (Networks = {}));
