import { Answers } from 'prompts';
import * as readline from 'readline';
import Console from './classes/singleton/Console';
import { User } from './classes/User';
import { Car } from './classes/Car';
import { CarDao } from './dao/carDao';
import { Booking } from './classes/Booking';
import { BookingDao } from './dao/bookingDao';
import Utility from './classes/Utility';

export class Main {
  public consoleLine: readline.ReadLine;
  // Create a instance of user, car and booking
  public user: User = new User();
  public car: Car = new Car();
  public booking: Booking = new Booking();

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

  /** Menu which is shown if logged in as admin */
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

  //------------------------------------------------------ Select a option area
  /** Handle the selected option */
  public async selectOption(_option: number) {
    let list: CarDao[] = await this.car.getAllCars();
    let allBookings: BookingDao[] = await this.booking.getAllBookings();

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
  public async login() {
    if (await this.user.loginUser()) {
      await this.decideOption();
    } else {
      // If login fails
      await this.showStartOptions();
    }
  }

  /** Register a user */
  public async register() {
    await this.user.registerUser();
    await this.decideOption();
  }

  /** Shows the bookings */
  public async showBookings(_allBookings: BookingDao[]) {
    let answer: Answers<string> = await Console.showOptions(["Previous", "Upcoming",], "Show the previous or the upcoming bookings?");
    if (answer.value == 1) {
      this.booking.decideWhichBookings(this.user.customer, _allBookings, true);
    } else {
      this.booking.decideWhichBookings(this.user.customer, _allBookings, false);
    }
    await this.decideOption();
  }

  /** Shows the statistic */
  public async statistics(_allBookings: BookingDao[]) {
    let answer: Answers<string> = await Console.showOptions(["average", "accumulated",], "Show the accumulated or the average price?");
    if (answer.value == 1) {
      Utility.printAccumulatedOrAveragePrice(this.user.customer, _allBookings, true);
    } else {
      Utility.printAccumulatedOrAveragePrice(this.user.customer, _allBookings, false);
    }
    await this.decideOption();
  }

  /** Filter for cars */
  public async filterCars(_list: CarDao[]) {
    // Get required data
    let dateAndDuration: string[] = await Utility.getDateAndDuration();
    let filteredCars: CarDao[] = await this.booking.getAvailableCars(_list, dateAndDuration[0], parseInt(dateAndDuration[1]));

    // Show a list of cars
    await this.car.showCarList(filteredCars);

    // Select a car from the list
    let selectedCar = await this.car.selectACar(filteredCars);

    // Check if car is free and book it if so
    console.log("You selected: " + selectedCar.model);

    // If selected car exists call bookACar
    let bookingProperties: string[] = await this.booking.createBookingProperties(selectedCar, parseInt(dateAndDuration[1]), dateAndDuration[0], this.user);
    if (bookingProperties[0] == "ok") {
      this.booking.bookACar(new Date(bookingProperties[1]), parseInt(bookingProperties[2]), parseInt(bookingProperties[3]), this.user, selectedCar);
      console.log("Car was successfully booked!");
    } else {
      console.log("Booking process was stopped. Returning to menu.");
    }
    await this.decideOption();
  }

  /** Show all cars */
  public async showAllCars(_list: CarDao[]) {
    // Show a list of cars
    await this.car.showCarList(_list);

    // Select a car
    let selectedCar = await this.car.selectACar(_list);
    console.log("You selected: " + selectedCar.model);

    // If selected car exists call bookACar
    let bookingProperties = await this.booking.startBookProcess(selectedCar, this.user);
    if (bookingProperties[0] == "ok") {
      this.booking.bookACar(new Date(bookingProperties[1]), parseInt(bookingProperties[2]), parseInt(bookingProperties[3]), this.user, selectedCar);
      console.log("Car was successfully booked!");
    } else {
      console.log("Booking process was stopped. Returning to menu.");
    }
    await this.decideOption();
  }

  /** Search a car */
  public async searchACar() {
    let foundCars = await this.car.searchCar();
    if (foundCars.length == 0) {
      console.log("No cars were found!");

    } else {
      await this.car.showCarList(foundCars);

      let selectedCar = await this.car.selectACar(foundCars);
      console.log("You selected: " + selectedCar.model);

      // If selected car exists call bookACar
      if (selectedCar != undefined) {
        //this.booking.setCarAndUser(selectedCar, this.user);
        let bookingProperties = await this.booking.startBookProcess(selectedCar, this.user);
        if (bookingProperties[0] == "ok") {
          this.booking.bookACar(new Date(bookingProperties[0]), parseInt(bookingProperties[1]), parseInt(bookingProperties[2]), this.user, selectedCar);
          console.log("Car was successfully booked!");
        } else {
          console.log("Booking process was stopped. Returning to menu.");
        }
      }
    }
    await this.decideOption();
  }

  /** Adds a Car to the car list */
  public async addACar(_cars: CarDao[]) {
    await this.car.addCar(_cars);
    await this.showOptionsIfAdmin();
  }

  //------------------------------------------------------ Decide menu area
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
