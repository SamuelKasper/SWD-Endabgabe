import { Answers } from 'prompts';
import * as readline from 'readline';
import Console from './classes/singleton/Console';
import { User } from './classes/User';
import { Car } from './classes/Car';

export class Main {
  public consoleLine: readline.ReadLine;
  public user: User = new User();
  public car: Car = new Car();

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
        "Search a car",
        "All cars",
        "Filter",
      ],
      "Which option do you want to choose?"
    );

    switch (answer.value) {
      //Case register
      case 1:
        await this.user.registerUser();
        this.showStartOptions();
        break;

      //Case login
      case 2:
        if (await this.user.loginUser()) {
          // If user is admin
          if (this.user.accountState.getState() == "admin") {
            this.showOptionsIfAdminn();

          // If user is normal user
          } else {
            this.showOptionsIfLoggedIn();
          }
        } else {
          this.showStartOptions();
        }
        break;
    }
  }

  public async showOptionsIfLoggedIn(): Promise<void> {
    let answer: Answers<string> = await Console.showOptions(
      [
        "Search a car",
        "All cars",
        "Filter",
      ],
      "Which option do you want to choose?"
    );

    switch (answer.value) {
      //Search a car
      case 1:
        break;

      //All cars
      case 2:
        break;

      //Filter
      case 3:
        break;
    }
  }

  public async showOptionsIfAdminn(): Promise<void> {
    let answer: Answers<string> = await Console.showOptions(
      [
        "Add a car",
        "Search a car",
        "All cars",
        "Filter",
      ],
      "Which option do you want to choose?"
    );

    switch (answer.value) {
      //Add a car
      case 1:
        this.car.addCar();
        break;

      //Search a car
      case 2:
        break;

      //All cars
      case 3:
        break;

      //Filter
      case 4:
        break;
    }
  }
}

let main: Main = new Main();
main.showStartOptions();
