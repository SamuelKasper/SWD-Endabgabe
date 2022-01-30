export class checkUsername {
    private static _instance: checkUsername = new checkUsername();

    private constructor() {
        if (checkUsername._instance)
            throw new Error("Instead of using new checkUsername(), please use checkUsername.getInstance() for Singleton!")
        checkUsername._instance = this;
    }

    public static getInstance(): checkUsername {
        return checkUsername._instance;
    }

    public checkUsernameRegExp(_username: string): boolean {
        //Check if name only contains letters from a-z and the numbers 0-9
        let regexName: RegExp = /^[a-zA-Z0-9]{1,10}$/;
        //If name is valid save name and password in the user file
        return regexName.test(_username);
    }

}

export default checkUsername.getInstance();