import * as path from 'node:path';
import * as process from 'node:process';

interface Config {
  // 用户信息路径
  UserDataPath: string;
  // chromedriver 路径
  ChromedriverPath: string;
  // 医博士网址
  YiboshiURL: string;
}

const Config: Config = ((): Config => {
  const UserDataPath = path.join(process.cwd(), 'user.json');

  let ChromedriverPath = path.join(process.cwd(), 'chromedriver');

  if (process.platform === 'win32') {
    ChromedriverPath += '.exe';
  }

  return { UserDataPath, ChromedriverPath, YiboshiURL: 'https://www.yiboshi.com' };
})();

export default Config;
