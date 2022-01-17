"use strict";
exports.__esModule = true;
exports.Main = void 0;
var readline = require("readline");
var Main = /** @class */ (function () {
    function Main() {
        this.consoleLine = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.consoleLine.write("I'm a typescript program!");
    }
    return Main;
}());
exports.Main = Main;
new Main();
