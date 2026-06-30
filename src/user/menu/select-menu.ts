import Menu from './index.ts';
import type User from '../index.ts';
import { logInteractive } from '../../system/logger.ts';

class SelectMenu extends Menu {
  constructor() {
    super('select', '选择用户');
  }

  public async fun(): Promise<User> {
    logInteractive('\n【选择用户】');

    const user: User = await this.selectUser('请输入用户序号：');
    logInteractive(`选中【${user.getName()}】账号\n`);

    return user;
  }
}

export default SelectMenu;
