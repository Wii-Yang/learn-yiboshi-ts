import * as crypto from 'node:crypto';

interface UserOptions {
  id?: string;
  name?: string;
  username: string;
  password: string;
  token?: string;
  fingerprintID?: string;
}

export interface UserData {
  id: string;
  name?: string;
  username: string;
  password: string;
  token?: string;
  fingerprintID?: string;
}

class User {
  private readonly id: string;
  private name: string | undefined;
  private username: string;
  private password: string;
  private token: string | undefined;
  private fingerprintID: string | undefined;

  constructor(data: UserOptions) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name;
    this.username = data.username;
    this.password = data.password;
    this.token = data.token;
    this.fingerprintID = data.fingerprintID;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string | undefined {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getUsername(): string {
    return this.username;
  }

  public setUsername(username: string) {
    this.username = username;
  }

  public getPassword(): string {
    return this.password;
  }

  public setPassword(password: string) {
    this.password = password;
  }

  public getToken(): string | undefined {
    return this.token;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public getFingerprintID(): string | undefined {
    return this.fingerprintID;
  }

  public setFingerprint(fingerprintID: string) {
    this.fingerprintID = fingerprintID;
  }

  public toString(): string {
    const user = {
      id: this.id || '',
      name: this.name || '',
      username: this.username,
      password: this.password,
      token: this.token || '',
      fingerprintID: this.fingerprintID || '',
    };
    return JSON.stringify(user);
  }

  static formatByData(data: UserData): User {
    return new User(data);
  }
}

export default User;
