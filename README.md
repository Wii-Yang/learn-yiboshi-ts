# 医博士学习辅助工具

## 一、项目简介

### （一）、目的

通过本项目人工辅助登录后自动完成添加到“我的项目”中的课程学习。  
学习中需要做的少量操作包括：

- 在学习前手动登录并选择课程加入到“我的项目”中；
- 在控制台中新增用户；
- 在控制台中删除用户；
- 在控制台中修改用户；
- 在控制台中选择学习的用户；
- 在每次登录时手动完成验证码验证。

除以上操作外尽可能减少人为操作，自动完成视频学习、考试，达到解放双手的目的。

### （二）、技术路线

本项目使用 selenium-webdriver 自动化测试插件，通过模拟手动操作网页来达到自动学习的效果。  
使用 Typescript 语言来编写代码，基于 node 环境运行代码。

### （三）、项目结构

```
├── .husky                   # husky 插件
├── src
│   ├── browser              # 浏览器模块
│   ├── init                 # 初始化模块
│   ├── learn                # 学习模块
│   ├── user                 # 用户模块
│   ├── utils                # 工具类模块
│   └── index.ts             # 项目入口文件
├── .commitlintrc.js         # commitlint 配置文件
├── .eslintignore            # EsLint 忽略文件
├── .eslintrc.js             # EsLint 配置文件
├── .gitignore               # git 忽略文件
├── .prettierignore          # prettier 忽略文件
├── .prettierrc.json         # prettier 配置文件
├── package.json
├── README.md
└── tsconfig.json            # Typescript 配置文件
```

## 二、项目使用方法

- 初始化项目

  ```shell
  pnpm run bootstrap
  ```

- 运行项目

  ```shell
  pnpm run serve
  ```

- 打包项目

  ```shell
  pnpm run build
  ```

## 三、注意事项

> - chromedriver.exe 文件需要在本项目根目录
> - chromedriver.exe 版本需要与本机 chrome 版本一致
