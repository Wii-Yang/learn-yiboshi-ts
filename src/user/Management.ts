import User from './index'
import {
  getAllUser,
  addUser as addUserInfo,
  deleteUserById,
  updateUser as updateUserInfo
} from './DataBase'
import { consoleDivisionLine, consoleDivisionLineByText } from '../utils/DivisionLine'
import process from 'process'
import { readlineSync } from '../utils/ReadlineSync'

interface Menu {
  id: string
  name: string
}

const add: Menu = { id: 'add', name: '添加用户' }
const del: Menu = { id: 'delete', name: '删除用户' }
const update: Menu = { id: 'update', name: '更新用户信息' }
const get: Menu = { id: 'get', name: '查看用户详情' }
const select: Menu = { id: 'select', name: '选择学习用户' }

export async function managementUser(): Promise<User> {
  let type: string = ''
  do {
    const meuns: Menu[] = getMenus()
    console.log('功能菜单：')
    meuns.forEach((meun: Menu, index: number) => {
      console.log(`[${index + 1}] ${meun.name}`)
    })
    process.stdout.write('请选择菜单：')
    const serial: string = await readlineSync()
    const index: number = Number(serial)
    if (isNaN(index)) {
      consoleInputError()
      type = ''
    } else {
      const menu: Menu | undefined = meuns[index - 1]
      if (menu) {
        type = menu.id
      } else {
        consoleInputError()
        type = ''
      }
    }
    switch (type) {
      case 'add':
        await addUser()
        break
      case 'delete':
        await deleteUser()
        break
      case 'update':
        await updateUser()
        break
      case 'get':
        await getUser()
    }
  } while (type !== 'select')
  return await selectUser()
}

function getMenus(): Menu[] {
  const userList: User[] = getAllUser()
  const menus: Menu[] = []
  if (userList.length > 0) {
    menus.push(get)
    menus.push(update)
    menus.push(del)
    menus.push(select)
  }
  menus.splice(0, 0, add)
  return menus
}

function consoleInputError(): void {
  consoleDivisionLineByText('输入错误，请重新选择！')
}

function consoleUserList(): User[] {
  const userList: User[] = getAllUser()
  console.log('已保存用户列表：')
  userList.forEach((user: User, index: number) => {
    if (user.name) {
      console.log(`[${index + 1}] ${user.name}`)
    } else {
      console.log(`[${index + 1}] ${user.username}（未登录）`)
    }
  })
  return userList
}

async function selectUser(): Promise<User> {
  consoleDivisionLine()
  const userList: User[] = consoleUserList()
  process.stdout.write('请选择用户：')
  const serial: string = await readlineSync()
  const index: number = Number(serial)
  if (isNaN(index)) {
    consoleInputError()
    return selectUser()
  } else {
    const user: User | undefined = userList[index - 1]
    if (user) {
      return user
    } else {
      consoleInputError()
      return selectUser()
    }
  }
}

async function addUser(): Promise<void> {
  consoleDivisionLine()
  process.stdout.write('请输入账号：')
  const username: string = await readlineSync()
  process.stdout.write('请输入密码：')
  const password: string = await readlineSync()
  const user: User = new User({ username, password })
  addUserInfo(user)
}

async function deleteUser(): Promise<void> {
  const user: User = await selectUser()
  deleteUserById(user.id as string)
}

async function updateUser(): Promise<void> {
  const user: User = await selectUser()
  process.stdout.write('请输入用户名（不修改直接回车）：')
  const username: string = await readlineSync()
  if (username) {
    user.username = username
  }
  process.stdout.write('请输入密码（不修改直接回车）：')
  const password: string = await readlineSync()
  if (password) {
    user.password = password
  }
  user.token = ''
  user.fingerprintID = ''
  updateUserInfo(user)
}

async function getUser(): Promise<void> {
  const user: User = await selectUser()
  const userInfo: string = `${user.name}账号：用户名为 ${user.username}; 密码为 ${user.password}`
  consoleDivisionLineByText(userInfo)
}
