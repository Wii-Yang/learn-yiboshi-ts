import type User from '../index.ts';
import { getUserList } from '../management.ts';
import { readlineSync } from '../../utils.ts';

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
    console.log('用户列表：');
    const userList: User[] = getUserList();

    userList.forEach((user: User, index: number) => {
      console.log(`[${index + 1}] ${user.getName()}`);
    });
  }

  // 选择用户
  protected async selectUser(question: string): Promise<User> {
    this.printUserList();

    const userList: User[] = getUserList();

    const userIndex: string = await readlineSync(question);
    const index: number = Number(userIndex) - 1;

    if (isNaN(index) || index >= userList.length) {
      console.log('输入错误！\n');
      return await this.selectUser(question);
    }

    return userList[index]!;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public fun(): Promise<any> {
    console.log('当前菜单没有对应功能，无法使用');
    return Promise.resolve();
  }
}

export default Menu;
