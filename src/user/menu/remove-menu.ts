import Menu from './index.ts';
import type User from '../index.ts';
import { removeUser } from '../management.ts';
import { logInteractive } from '../../system/logger.ts';

class RemoveMenu extends Menu {
  constructor() {
    super('remove', '删除用户');
  }

  public async fun(): Promise<void> {
    logInteractive('\n【删除用户】');

    const user: User = await this.selectUser('请选择要删除的用户序号：');

    removeUser(user);
    logInteractive('用户删除成功\n');
  }
}

export default RemoveMenu;
