import * as readline from 'readline';

namespace Project {
  export class Main {
    public consoleLine : readline.ReadLine;

    constructor() {
      this.consoleLine = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
    }

    public showProgramStatus() : void {
      this.consoleLine.write("I'm running");
    }
  }

  let main : Main = new Main();
  main.showProgramStatus();
}