import checkUsername from "../helpers/checkUsername";

describe("Check username", () => {
  let invalidUsername : Array<string> = ["samuel12345","#samu","samuel - noah"];
  let validUsername : Array<string> = ["samuel","Samuel123"];
  for(let username of invalidUsername) {
    test("Check invalid username", () => {
      expect(checkUsername.checkUsernameRegExp(username)).toBeFalsy();
    });
  }

  for(let username of validUsername) {
    test("Check valid username", () => {
      expect(checkUsername.checkUsernameRegExp(username)).toBeTruthy();
    });
  }
});