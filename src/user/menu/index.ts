import type User from '../index.ts';
import { getUserList } from '../management.ts';
import { readlineSync } from '../../utils.ts';
import { logInteractive } from '../../system/logger.ts';

class Menu {
  protected id: string;
  protected name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public getId() {
    return this.id;
  }

  public getName() {
    return this.name;
  }

  // 打印用户列表
  protected printUserList(): void {
    logInteractive('用户列表：');
    const userList: User[] = getUserList();

    userList.forEach((user: User, index: number) => {
      logInteractive(`[${index + 1}] ${user.getName()}`);
    });
  }

  // 选择用户
  protected async selectUser(question: string): Promise<User> {
    this.printUserList();

    const userList: User[] = getUserList();
    if (process.env.YIBOSHI_AUTO_FIRST_USER === '1') {
      logInteractive('自动选择第一个用户');
      return userList[0]!;
    }

    const userIndex: string = await readlineSync(question);
    const index: number = Number(userIndex) - 1;

    if (isNaN(index) || index >= userList.length) {
      logInteractive('输入错误！\n');
      return await this.selectUser(question);
    }

    return userList[index]!;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public fun(): Promise<any> {
    logInteractive('当前菜单没有对应功能，无法使用');
    return Promise.resolve();
  }
}

export default Menu;
