import { Answers } from 'prompts';
import * as readline from 'readline';
import Console from './classes/singleton/Console';
import { User } from './classes/User';

export class Main {
  public consoleLine: readline.ReadLine;
  public user: User = new User();

  constructor() {
    this.consoleLine = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  public async showStartOptions(): Promise<void> {
    let answer: Answers<string> = await Console.showOptions(
      [
        "Register",
        "Login",
      ],
      "Which option do you want to choose?"
    );

    switch (answer.value) {
      //Case register
      case 1:
        if (!await this.user.registerUser()) {
          this.showStartOptions();
        }
        break;

      //Case login
      case 2:
        if (!await this.user.loginUser()) {
          this.showStartOptions();
        }
        break;
    }
  }


}

let main: Main = new Main();
main.showStartOptions();
