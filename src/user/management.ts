import { readFileSync, writeFileSync } from 'node:fs';
import Config from '../system/config.ts';
import User, { type UserData } from './index.ts';

/**
 * 新增用户
 * @param user
 */
export function addUser(user: User) {
  const userList = getUserList();
  userList.push(user);
  writeFileSync(Config.UserDataPath, JSON.stringify(userList));
}

/**
 * 删除用户
 * @param user
 */
export function removeUser(user: User) {
  const userList: User[] = getUserList();
  const index: number = userList.findIndex((item: User): boolean => item.getId() === user.getId());
  if (index > -1) {
    userList.splice(index, 1);
  }
  writeFileSync(Config.UserDataPath, JSON.stringify(userList));
}

/**
 * 编辑用户
 */
export function editUser(user: User) {
  const userList: User[] = getUserList();
  const index: number = userList.findIndex((item: User): boolean => item.getId() === user.getId());
  if (index > -1) {
    userList.splice(index, 1, user);
  }
  writeFileSync(Config.UserDataPath, JSON.stringify(userList));
}

/**
 * 获取所有用户
 */
export function getUserList(): User[] {
  const userData: string = readFileSync(Config.UserDataPath).toString();
  const userDataList: UserData[] = JSON.parse(userData);
  return userDataList.map((item: UserData): User => User.formatByData(item));
}

/**
 * 获取用户数量
 */
export function getUserTotal(): number {
  const userList: User[] = getUserList();
  return userList.length;
}

/**
 * 通过 id 查询用户
 * @param id
 */
export function getUserById(id: string): User | undefined {
  const userList: User[] = getUserList();
  return userList.find((item) => item.getId() === id);
}
