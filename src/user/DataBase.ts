// 获取所有用户列表
import { readFileSync, writeFileSync } from 'fs'
import { config } from '../utils'
import User from './index'
import { consoleDivisionLineByText } from '../utils/DivisionLine'

/**
 * 查询系统内的所有用户
 * @return userList
 */
export function getAllUser(): User[] {
  const userListStr: string = readFileSync(config.userDataBase).toString()
  return JSON.parse(userListStr) as User[]
}

/**
 * 通过 User数组 更新用户信息文件
 * @param userList
 */
function updateUserDataBase(userList: User[]) {
  const userListStr: string = JSON.stringify(userList)
  writeFileSync(config.userDataBase, userListStr, 'utf8')
}

/**
 * 新增用户
 * @param user
 */
export function addUser(user: User): void {
  const userList: User[] = getAllUser()
  userList.push(user)
  const userListStr: string = JSON.stringify(userList)
  writeFileSync(config.userDataBase, userListStr, 'utf8')
  consoleDivisionLineByText(`添加${user.username}成功。`)
}

/**
 * 通过 id 删除用户
 * @param id
 */
export function deleteUserById(id: string): void {
  const userList: User[] = getAllUser()
  const newUserList: User[] = userList.filter((item: User) => {
    return item.id !== id
  })
  updateUserDataBase(newUserList)
  consoleDivisionLineByText(`删除成功。`)
}

/**
 * 更新用户信息
 * @param user
 */
export function updateUser(user: User): void {
  const userList: User[] = getAllUser()
  const userIndex: number = userList.findIndex((item: User) => item.id === user.id)
  if (userIndex >= 0) {
    userList.splice(userIndex, 1, user)
    updateUserDataBase(userList)
    consoleDivisionLineByText(`更新${user.username}成功。`)
  } else {
    consoleDivisionLineByText(`没有${user.username}账户，请重试。`)
  }
}

/**
 * 通过 id 获取用户信息
 * @param id
 */
export function getUserByUsername(id: string): User | undefined {
  const userList: User[] = getAllUser()
  return userList.find(item => item.id === id) as User | undefined
}
