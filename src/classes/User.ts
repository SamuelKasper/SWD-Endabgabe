import { Answers } from "prompts";
import { UserDao } from "../dao/userDao";
import Console from "./singleton/Console";
import FileHandler from "./singleton/FileHandler";

export class User {
    // Variable which represents the state of the user: guest, loggedIn, admin
    public accountState: string = "guest";
    public customer: string = "";

    //Register
    public async registerUser(): Promise<boolean> {
        // Ask user to input username and password
        let username: Answers<string> = await Console.waitForAnswers("Enter username:", 'text');
        let password: Answers<string> = await Console.waitForAnswers("Enter password", 'password');

        // check if username can be used
        if (await this.checkUsernameFree(username.value)) {
            //Check if name only contains letters from a-z and the numbers 0-9
            let regexName: RegExp = /^[a-zA-Z0-9]{1,10}$/;
            //If name is valid save name and password in the user file
            if (regexName.test(username.value)) {
                let userObject: UserDao = { username: username.value, password: password.value };
                FileHandler.writeJsonFile("./files/User.json", userObject);
                Console.printLine("\nRegistration successful.\n\n");
                return true;
            } else {
                Console.printLine("\nUsername invalid. No special characters and only 10 characters in total allowed!\n\n");
            }
        }
        return false;
    }

    //Login
    public async loginUser(): Promise<boolean> {
        // Ask user to input username and password
        let username: Answers<string> = await Console.waitForAnswers("Enter username:", 'text');
        this.customer = username.value;
        let password: Answers<string> = await Console.waitForAnswers("Enter password", 'password');

        // Check if user is admin
        if (username.value == "admin" && password.value == "123") {
            this.accountState = "admin";
            Console.printLine("\nLogged in as admin.\n\n");
            return true;
        }

        // If user is not admin
        let users: UserDao[] = await FileHandler.readJsonFile("./files/User.json");
        for (let i: number = 0; i < users.length; i++) {
            if (users[i].username == username.value && users[i].password == password.value) {
                this.accountState = "loggedIn";
                Console.printLine("\nLogin successful.\n\n");
                return true;
            }
        }
        Console.printLine("\nUsername of password wrong.\n\n");
        return false;
    }

    //Check username
    public async checkUsernameFree(_username: string): Promise<boolean> {
        let users: UserDao[] = await FileHandler.readJsonFile("./files/User.json");
        // users would be null if the file couldn't be read
        for (let i: number = 0; i < users.length; i++) {
            if (users[i].username == _username) {
                Console.printLine("\nThis username is already used.\n\n");
                return false;
            }
        }
        return true;
    }

    // Get account state
    public getAccountState(): string {
        return this.accountState;
    }
}