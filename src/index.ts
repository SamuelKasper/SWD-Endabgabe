import { Answers } from 'prompts';
import * as readline from 'readline';
import Console from './classes/singleton/Console';
import { User } from './classes/User';
import { Car } from './classes/Car';
import { CarDao } from './dao/carDao';
import { Booking } from './classes/Booking';
import { BookingDao } from './dao/bookingDao';

export class Main {
  public consoleLine: readline.ReadLine;
  public user: User = new User();
  public car: Car = new Car();
  public booking: Booking = new Booking();

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
    let list: CarDao[] = await this.car.getAllCars();
    switch (_option) {
      //Add a cars
      case 1:
        await this.car.addCar();
        await this.showOptionsIfAdmin();
        break;

      //Search a car
      case 2:
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
        break;

      //All cars
      case 3:
        await this.car.showCarList(list);
        let selectedCar = await this.car.selectACar(list);
        console.log("You selected: " + selectedCar.model);

        // If selected car exists call bookACar
        if (selectedCar != undefined) {
          //this.booking.setCarAndUser(selectedCar, this.user);
          let bookingProperties = await this.booking.startBookProcess(selectedCar, this.user);
          if (bookingProperties[0] == "ok") {
            this.booking.bookACar(new Date(bookingProperties[1]), parseInt(bookingProperties[2]), parseInt(bookingProperties[3]), this.user, selectedCar);
            console.log("Car was successfully booked!");
          } else {
            console.log("Booking process was stopped. Returning to menu.");
          }
        }
        await this.showStartOptions();
        break;

      //Filter
      case 4:
        let dateAndDuration: string[] = await this.booking.getDateAndDuration();
        let filteredCars: CarDao[] = await this.booking.getAvailableCars(list, dateAndDuration[0], parseInt(dateAndDuration[1]));
        await this.car.showCarList(filteredCars);
        let selectedCar2 = await this.car.selectACar(list);
        console.log("You selected: " + selectedCar2.model);
        let bookingProperties: string[] = await this.booking.createBookingProperties(selectedCar2, parseInt(dateAndDuration[1]), dateAndDuration[0], this.user);
        if (bookingProperties[0] == "ok") {
          this.booking.bookACar(new Date(bookingProperties[1]), parseInt(bookingProperties[2]), parseInt(bookingProperties[3]), this.user, selectedCar2);
          console.log("Car was successfully booked!");
        } else {
          console.log("Booking process was stopped. Returning to menu.");
        }
        await this.showStartOptions();
        break;

      //Statistic
      case 5:
        let allBookings: BookingDao[] = await this.booking.getAllBookings();
        let answer: Answers<string> = await Console.showOptions(["average", "accumulated",], "Show the accumulated or the average price?");
        if (answer.value == 1) {
          this.booking.printAccumulatedOrAveragePrice(this.user.customer, allBookings, true);
        } else {
          this.booking.printAccumulatedOrAveragePrice(this.user.customer, allBookings, false);
        }
        await this.showStartOptions();
        break;

      //Bookings
      case 6:
        let allBookings2: BookingDao[] = await this.booking.getAllBookings();
        let answer2: Answers<string> = await Console.showOptions(["Previous", "Upcoming",], "Show the previous or the upcoming bookings?");
        if (answer2.value == 1) {
          this.booking.decideWhichBookings(this.user.customer, allBookings2, true);
        } else {
          this.booking.decideWhichBookings(this.user.customer, allBookings2, false);
        }
        await this.showStartOptions();
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
