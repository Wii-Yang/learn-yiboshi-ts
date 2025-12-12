import type User from './index.ts';
import AddUserMenu from './menu/add-menu.ts';
import { getUserTotal } from './management.ts';
import Menu from './menu/index.ts';
import { readlineSync } from '../utils.ts';
import SelectMenu from './menu/select-menu.ts';
import RemoveMenu from './menu/remove-menu.ts';
import EditMenu from './menu/edit-menu.ts';

// 新增用户
const addUserMenu = new AddUserMenu();

// 删除用户
const removeUserMenu = new RemoveMenu();

// 修改用户
const editUserMenu = new EditMenu();

// 选择用户
const selectUserMenu = new SelectMenu();

async function getUserByMenus(): Promise<User> {
  let user: User | undefined;
  do {
    // 获取菜单
    const menus = getMenus();
    // 打印菜单
    printMenus(menus);
    const menuIndex: string = await readlineSync('请选择菜单：');

    // 校验输入
    const index: number = Number(menuIndex) - 1;
    if (isNaN(index) || index >= menus.length) {
      console.log('输入错误，请重新选择！');
    } else {
      const menu = menus[index];
      if (menu) {
        const result: User | undefined = await menu.fun();
        if (result) {
          user = result;
        }
      }
    }
  } while (!user);

  return user;
}

function printMenus(menus: Menu[]): void {
  console.log('【功能菜单】');
  menus.forEach((menu, index) => {
    console.log(`[${index + 1}] ${menu.getName()}`);
  });
}

function getMenus() {
  const menus: Menu[] = [];
  const userTotal = getUserTotal();
  if (userTotal <= 0) {
    menus.push(addUserMenu);
  } else {
    const list: Menu[] = [selectUserMenu, addUserMenu, removeUserMenu, editUserMenu];
    menus.push(...list);
  }

  return menus;
}

export default getUserByMenus;
