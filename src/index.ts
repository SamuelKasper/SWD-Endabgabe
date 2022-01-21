import { Answers } from 'prompts';
import * as readline from 'readline';
import Console from './classes/singleton/Console';
import { User } from './classes/User';
import { Car } from './classes/Car';
import { CarDao } from './dao/carDao';

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
        "Search a car",
        "All cars",
        "Filter",
        "Statistic",
        "Bookings",
        "Register",
        "Login",
      ],
      "Which option do you want to choose?"
    );
    // Call the selected option
    // +1 because "add a car" is the first option in the switch case, but isnt't shown here
    this.selectOption(parseInt(answer.value + 1));
  }

  public async showOptionsIfLoggedIn(): Promise<void> {
    let answer: Answers<string> = await Console.showOptions(
      [
        "Search a car",
        "All cars",
        "Filter",
        "Statistic",
        "Bookings",
      ],
      "Which option do you want to choose?"
    );
    // Call the selected option
    // +1 because "add a car" is the first option in the switch case, but isnt't shown here
    this.selectOption(parseInt(answer.value + 1));
  }

  public async showOptionsIfAdmin(): Promise<void> {
    let answer: Answers<string> = await Console.showOptions(
      [
        "Add a car",
        "Search a car",
        "All cars",
        "Filter",
        "Statistic",
        "Bookings",
      ],
      "Which option do you want to choose?"
    );
    //Call the selected option
    this.selectOption(parseInt(answer.value));
  }

  public async selectOption(_option: number) {
    switch (_option) {
      //Add a cars
      case 1:
        await this.car.addCar();
        await this.showOptionsIfAdmin();
        break;

      //Search a car
      case 2:
        await this.car.searchCar(this.user);
        await this.decideOption();
        break;

      //All cars
      case 3:
        let list: CarDao[] = await this.car.getAllCars();
        await this.car.showCarList(list, this.user);
        await this.showStartOptions();
        break;

      //Filter
      case 4:
        break;

      //Statistic
      case 5:
        break;

      //Bookings
      case 6:
        break;

      //Register
      case 7:
        await this.user.registerUser();
        await this.showStartOptions();
        break;

      //Login
      case 8:
        if (await this.user.loginUser()) {
          await this.decideOption();
        } else {
          // If user is guest
          await this.showStartOptions();
        }
        break;
    }
  }

  /** Choose an option based on the accountState */
  public async decideOption() {
    // If user is admin
    if (this.user.accountState == "admin") {
      await this.showOptionsIfAdmin();

      // If user is normal user
    } else if (this.user.accountState == "loggedIn") {
      await this.showOptionsIfLoggedIn();

      //If user is guest
    } else {
      await this.showStartOptions();
    }
  }
}

let main: Main = new Main();
main.showStartOptions();
