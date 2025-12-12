import { readFileSync } from 'fs';
import Config from './config.ts';
import { writeFileSync } from 'node:fs';

async function initSystem() {
  // 初始化用户数据
  initUserData();

  // 初始化 chromedriver
  await initChromedriver();
}

function initUserData() {
  try {
    readFileSync(Config.UserDataPath);
  } catch {
    console.log('初始化用户数据文件');
    writeFileSync(Config.UserDataPath, JSON.stringify([]), 'utf-8');
  }
}

async function initChromedriver() {
  try {
    readFileSync(Config.ChromedriverPath);
  } catch {
    console.log('请下载与当前电脑中 chrome 浏览器版本对应的 chromedriver 文件并放置到当前文件夹。');
    console.log(
      'chrome 浏览器版本查看方式请自行百度，推荐的 chromedriver 的下载网址为 https://registry.npmmirror.com/binary.html?path=chromedriver',
    );
    throw 'exit';
  }
}

export default initSystem;
