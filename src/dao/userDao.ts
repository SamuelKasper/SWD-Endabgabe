export class userDao {
    public username: string;
    public password: string;

  constructor(_username: string, _password: string) {
    this.username = _username;
    this.password = _password;
  }
}
