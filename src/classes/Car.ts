import { Answers } from "prompts";
import { CarDao } from "../dao/carDao";
import Console from "./singleton/Console";
import FileHandler from "./singleton/FileHandler";

export class Car {

    public async addCar(): Promise<boolean> {
        // Ask user to input the cars properties
        let id: Answers<string> = await Console.waitForAnswers("Enter the ID:", 'text');
        // Check if the id is free
        if (await this.checkIDFree(id.value)) {
            let model: Answers<string> = await Console.waitForAnswers("Enter the model:", 'text');
            let type: Answers<string> = await Console.showOptions(["Electric", "Conventional",], "Choose a type:");
            let from: Answers<string> = await Console.waitForAnswers("Enter the earliest time:", 'text');
            let to: Answers<string> = await Console.waitForAnswers("Enter the latest time:", 'text');
            let maxDuration: Answers<string> = await Console.waitForAnswers("Enter the maximum duration in minutes", 'number');
            let price: Answers<string> = await Console.waitForAnswers("Enter the flat price:", 'number');
            let pricePerMin: Answers<string> = await Console.waitForAnswers("Enter the additional price per minute:", 'number');

            // Create an object for the car
            let newCar: CarDao = { ID: id.value, model: model.value, type: type.value, from: from.value, to: to.value, maxDuration: maxDuration.value, price: price.value, pricePerMin: pricePerMin.value };

            // Add the car to the JSON file
            FileHandler.writeJsonFile("./files/Cars.json", newCar);
            Console.printLine("\nAdded car to successfully.\n\n");
            return true;
        } else {
            return false;
        }
    }

    public async checkIDFree(_id: string): Promise<boolean> {
        let cars: CarDao[] = await FileHandler.readJsonFile("./files/Cars.json");
        // users would be null if the file couldn't be read
        for (let i: number = 0; i < cars.length; i++) {
            if (cars[i].ID == _id) {
                Console.printLine("\nThis ID is already used.\n\n");
                return false;
            }
        }
        return true;
    }
}