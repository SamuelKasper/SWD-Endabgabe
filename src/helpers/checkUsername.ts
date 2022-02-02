export class CheckUsername {
    private static instance: CheckUsername = new CheckUsername();

    private constructor() {
        if (CheckUsername.instance)
            throw new Error("Instead of using new checkUsername(), please use checkUsername.getInstance() for Singleton!")
        CheckUsername.instance = this;
    }

    public static getInstance(): CheckUsername {
        return CheckUsername.instance;
    }

    public checkUsernameRegExp(_username: string): boolean {
        //Check if name only contains letters from a-z and the numbers 0-9
        let regexName: RegExp = /^[a-zA-Z0-9]{1,10}$/;
        //If name is valid save name and password in the user file
        return regexName.test(_username);
    }

}

export default CheckUsername.getInstance();