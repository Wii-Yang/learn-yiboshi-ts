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
├── .husky                      # husky 插件
├── src                         # 源码
│   ├── learn                   # 学习模块
│   │   ├── course.ts           # 课程相关方法
│   │   ├── examination.ts      # 考试相关方法
│   │   ├── index.ts            # 学习入口
│   │   ├── project.ts          # 项目相关方法
│   │   ├── utils.ts            # 学习相关工具方法
│   │   └── video.ts            # 视频相关方法
│   ├── system                  # 系统模块
│   │   ├── browser.ts          # 创建浏览器相关方法
│   │   ├── config.ts           # 配置文件
│   │   ├── index.ts            # 系统初始化方法
│   │   └── login.ts            # 用户登录相关方法
│   ├── user                    # 用户模块
│   │   ├── menu                # 用户菜单
│   │   │   ├── add-menu.ts     # 添加用户菜单类
│   │   │   ├── edit-menu.ts    # 编辑用户菜单类
│   │   │   ├── index.ts        # 用户菜单类
│   │   │   ├── remove-menu.ts  # 删除用户菜单类
│   │   │   └── select-menu.ts  # 选择用户菜单类
│   │   ├── index.ts            # 用户类
│   │   ├── management.ts       # 用户管理方法
│   │   └── menus.ts            # 用户菜单入口
│   ├── index.ts                # 项目入口文件
│   └── utils.ts                # 工具方法
├── .gitignore                  # git 忽略文件
├── .prettierignore             # prettier 忽略文件
├── .prettierrc                 # prettier 配置文件
├── eslint.config.mts           # EsLint 配置文件
├── package.json                # 包文件
├── pnpm-lock.yaml              # pnpm 锁
├── README.md                   # 项目描述
└── tsconfig.json               # Typescript 配置文件
```

## 二、项目使用方法

- 初始化项目

  ```shell
  pnpm run bootstrap
  ```

- 运行项目

  ```shell
  pnpm run dev
  ```

- 打包项目

  ```shell
  pnpm run build
  ```

## 三、注意事项

> - chromedriver 文件需要在本项目根目录
> - chromedriver 版本需要与本机 chrome 版本一致
