import { Answers } from 'prompts';
import * as readline from 'readline';
import Console from './classes/singleton/Console';
import  User  from './classes/singleton/User';
import Car from './classes/singleton/Car';
import { CarDao } from './dao/carDao';
import Booking from './classes/singleton/Booking';
import { BookingDao } from './dao/bookingDao';
import Utility from './classes/singleton/Utility';

export class Main {
  public consoleLine: readline.ReadLine;

  constructor() {
    this.consoleLine = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  //------------------------------------------------------ Show options area
  /** Menu which is shown if not logged in */
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

  /** Menu which is shown if logged in as normal user */
  private async showOptionsIfLoggedIn(): Promise<void> {
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

  /** Menu which is shown if logged in as admin */
  private async showOptionsIfAdmin(): Promise<void> {
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

  //------------------------------------------------------ Select a option area
  /** Handle the selected option */
  private async selectOption(_option: number) {
    let list: CarDao[] = await Car.getAllCars();
    let allBookings: BookingDao[] = await Booking.getAllBookings();

    switch (_option) {
      //Add a cars
      case 1:
        this.addACar(list);
        break;

      //Search a car
      case 2:
        this.searchACar();
        break;

      //All cars
      case 3:
        this.showAllCars(list);
        break;

      //Filter
      case 4:
        this.filterCars(list);
        break;

      //Statistic
      case 5:
        this.statistics(allBookings);
        break;

      //Bookings
      case 6:
        this.showBookings(allBookings);
        break;

      //Register
      case 7:
        this.register();
        break;

      //Login
      case 8:
        this.login();
        break;
    }
  }

  //------------------------------------------------------ Handle selection area
  /** Login */
  private async login() {
    if (await User.loginUser()) {
      await this.decideOption();
    } else {
      // If login fails
      await this.showStartOptions();
    }
  }

  /** Register a user */
  private async register() {
    await User.registerUser(); 
    await this.decideOption();
  }

  /** Shows the bookings */
  private async showBookings(_allBookings: BookingDao[]) {
    let answer: Answers<string> = await Console.showOptions(["Previous", "Upcoming",], "Show the previous or the upcoming bookings?");
    if (answer.value == 1) {
      Booking.decideWhichBookings(User.customer, _allBookings, true);
    } else {
      Booking.decideWhichBookings(User.customer, _allBookings, false);
    }
    await this.decideOption();
  }

  /** Shows the statistic */
  private async statistics(_allBookings: BookingDao[]) {
    let answer: Answers<string> = await Console.showOptions(["average", "accumulated",], "Show the accumulated or the average price?");
    if (answer.value == 1) {
      Utility.printAccumulatedOrAveragePrice(User.customer, _allBookings, true);
    } else {
      Utility.printAccumulatedOrAveragePrice(User.customer, _allBookings, false);
    }
    await this.decideOption();
  }

  /** Filter for cars */
  private async filterCars(_list: CarDao[]) {
    // Get required data
    let dateAndDuration: string[] = await Utility.getDateAndDuration();
    let filteredCars: CarDao[] = await Booking.getAvailableCars(_list, dateAndDuration[0], parseInt(dateAndDuration[1]));

    // Show a list of cars
    await Car.showCarList(filteredCars);

    // Select a car from the list
    let selectedCar = await Car.selectACar(filteredCars);

    // Check if car is free and book it if so
    console.log("You selected: " + selectedCar.model);

    // If selected car exists call bookACar
    let bookingProperties: string[] = await Booking.createBookingProperties(selectedCar, parseInt(dateAndDuration[1]), dateAndDuration[0], User);
    if (bookingProperties[0] == "ok") {
      Booking.bookACar(new Date(bookingProperties[1]), parseInt(bookingProperties[2]), parseInt(bookingProperties[3]), User, selectedCar);
      console.log("Car was successfully booked!");
    } else {
      console.log("Booking process was stopped. Returning to menu.");
    }
    await this.decideOption();
  }

  /** Show all cars */
  private async showAllCars(_list: CarDao[]) {
    // Show a list of cars
    await Car.showCarList(_list);

    // Select a car
    let selectedCar = await Car.selectACar(_list);
    console.log("You selected: " + selectedCar.model);

    // If selected car exists call bookACar
    let bookingProperties = await Booking.startBookingProcess(selectedCar, User);
    if (bookingProperties[0] == "ok") {
      Booking.bookACar(new Date(bookingProperties[1]), parseInt(bookingProperties[2]), parseInt(bookingProperties[3]), User, selectedCar);
      console.log("Car was successfully booked!");
    } else {
      console.log("Booking process was stopped. Returning to menu.");
    }
    await this.decideOption();
  }

  /** Search a car */
  private async searchACar() {
    let foundCars = await Car.searchCar();
    if (foundCars.length == 0) {
      console.log("No cars were found!");

    } else {
      await Car.showCarList(foundCars);

      let selectedCar = await Car.selectACar(foundCars);
      console.log("You selected: " + selectedCar.model);

      // If selected car exists call bookACar
      if (selectedCar != undefined) {
        let bookingProperties = await Booking.startBookingProcess(selectedCar, User);
        if (bookingProperties[0] == "ok") {
          Booking.bookACar(new Date(bookingProperties[0]), parseInt(bookingProperties[1]), parseInt(bookingProperties[2]), User, selectedCar);
          console.log("Car was successfully booked!");
        } else {
          console.log("Booking process was stopped. Returning to menu.");
        }
      }
    }
    await this.decideOption();
  }

  /** Adds a Car to the car list */
  private async addACar(_cars: CarDao[]) {
    await Car.addCar(_cars);
    await this.showOptionsIfAdmin();
  }

  //------------------------------------------------------ Decide menu area
  /** Choose an option based on the accountState */
  private async decideOption() {
    // If user is admin
    if (User.accountState == "admin") {
      await this.showOptionsIfAdmin();

      // If user is normal user
    } else if (User.accountState == "loggedIn") {
      await this.showOptionsIfLoggedIn();

      //If user is guest
    } else {
      await this.showStartOptions();
    }
  }
}

let main: Main = new Main();
main.showStartOptions();
