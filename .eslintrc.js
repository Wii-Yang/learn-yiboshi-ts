module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // ↓TypeScript EsLint规则
    // ↓禁止未使用的变量，扩展了 eslint/no-unused-vars 规则
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    // ↓不允许使用 @ts-<directive> 注释
    '@typescript-eslint/ban-ts-comment': 'off',
    // ↓禁用特定类型，并可以建议替代方案
    '@typescript-eslint/ban-types': 'off',
    // ↓需要函数和类方法的显式返回类型
    '@typescript-eslint/explicit-function-return-type': 'off',
    // ↓不允许any类型
    '@typescript-eslint/no-explicit-any': 'off',
    // ↓禁止require出现在 import 语句除外的语句
    '@typescript-eslint/no-var-requires': 'off',
    // ↓不允许空函数
    '@typescript-eslint/no-empty-function': 'off',
    // ↓禁止在定义变量之前使用变量
    '@typescript-eslint/no-use-before-define': 'off',
    // ↓禁止使用后缀运算符进行非空断言
    '@typescript-eslint/no-non-null-assertion': 'off',
    // ↓在导出函数和类的公共类方法上显式返回和参数类型
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // ↓EsLint 规则
    // ↓在箭头函数中的箭头前后强制执行一致的间距
    'arrow-spacing': [
      2,
      {
        before: true,
        after: true
      }
    ],
    // ↓在打开块之后和关闭块之前禁止或强制在块内使用空格
    'block-spacing': [2, 'always'],
    // ↓为块强制执行一致的大括号样式
    'brace-style': [
      2,
      '1tbs',
      {
        allowSingleLine: true
      }
    ],
    // ↓强制执行驼峰命名约定
    camelcase: [
      0,
      {
        properties: 'always'
      }
    ],
    // ↓禁止尾随逗号
    'comma-dangle': [2, 'never'],
    // ↓在逗号前后强制执行一致的间距
    'comma-spacing': [
      2,
      {
        before: false,
        after: true
      }
    ],
    // ↓强制执行一致的逗号样式
    'comma-style': [2, 'last'],
    // ↓在构造函数中需要调用super()
    'constructor-super': 2,
    // ↓对所有控制语句强制执行一致的大括号样式
    curly: [2, 'multi-line'],
    // ↓在点前后强制换行一致
    'dot-location': [2, 'property'],
    // ↓要求或禁止在文件末尾换行
    'eol-last': 2,
    // ↓要求使用===和!==
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    // ↓在生成器函数中强制*操作符周围有一致的间距
    'generator-star-spacing': [
      2,
      {
        before: true,
        after: true
      }
    ],
    // ↓强制执行一致的缩进
    indent: [
      2,
      2,
      {
        SwitchCase: 1
      }
    ],
    // ↓在对象文字属性中强制执行键和值之间的一致间距
    'key-spacing': [
      2,
      {
        beforeColon: false,
        afterColon: true
      }
    ],
    // ↓在关键字前后强制使用一致的间距
    'keyword-spacing': [
      2,
      {
        before: true,
        after: true
      }
    ],
    // ↓要求构造函数名称以大写字母开头
    'new-cap': [
      2,
      {
        newIsCap: true,
        capIsNew: false
      }
    ],
    // ↓在调用不带参数的构造函数时强制或禁止使用括号
    'new-parens': 2,
    // ↓不允许Array构造函数
    'no-array-constructor': 2,
    // ↓禁止使用arguments.caller或arguments.callee
    'no-caller': 2,
    // ↓禁止使用console
    'no-console': 'off',
    // ↓禁止重新分配 class 成员
    'no-class-assign': 2,
    // ↓禁止条件表达式中的赋值运算符
    'no-cond-assign': 2,
    // ↓禁止重新分配const变量
    'no-const-assign': 2,
    // ↓禁止在正则表达式中使用控制字符
    'no-control-regex': 0,
    // ↓禁止删除变量
    'no-delete-var': 2,
    // ↓禁止函数定义中的重复参数
    'no-dupe-args': 2,
    // ↓禁止重复的 class 成员
    'no-dupe-class-members': 2,
    // ↓禁止对象中的出现重复的 key
    'no-dupe-keys': 2,
    // ↓禁止重复的 case 标签
    'no-duplicate-case': 2,
    // ↓禁止在正则表达式中使用空字符类
    'no-empty-character-class': 2,
    // ↓禁止空解构模式
    'no-empty-pattern': 2,
    // ↓禁止使用eval()
    'no-eval': 2,
    // ↓catch不允许在子句中重新给error赋值
    'no-ex-assign': 2,
    // ↓禁止扩展原生类型
    'no-extend-native': 2,
    // ↓禁止不必要的调用.bind()
    'no-extra-bind': 2,
    // ↓禁止不必要的布尔转换
    'no-extra-boolean-cast': 2,
    // ↓禁止不必要的括号
    'no-extra-parens': [2, 'functions'],
    // ↓禁止case语句的失败
    'no-fallthrough': 2,
    // ↓禁止数字文字中的前导或尾随小数点
    'no-floating-decimal': 2,
    // ↓禁止重新给function声明
    'no-func-assign': 2,
    // ↓禁止使用eval()-like 方法
    'no-implied-eval': 2,
    // ↓function禁止嵌套块中的变量或声明
    'no-inner-declarations': [2, 'functions'],
    // ↓RegExp禁止在构造函数中使用无效的正则表达式字符串
    'no-invalid-regexp': 2,
    // ↓禁止不规则空格
    'no-irregular-whitespace': 2,
    // ↓禁止使用__iterator__
    'no-iterator': 2,
    // ↓禁止与变量共享名称的标签
    'no-label-var': 2,
    // ↓禁止标记语句
    'no-labels': [
      2,
      {
        allowLoop: false,
        allowSwitch: false
      }
    ],
    // ↓禁止不必要的嵌套块
    'no-lone-blocks': 2,
    // ↓不允许缩进混合空格和制表符
    'no-mixed-spaces-and-tabs': 2,
    // ↓不允许多个空格
    'no-multi-spaces': 2,
    // ↓禁止多行字符串
    'no-multi-str': 2,
    // ↓不允许多个空行
    'no-multiple-empty-lines': [
      2,
      {
        max: 1
      }
    ],
    // ↓不允许构造Object
    'no-new-object': 2,
    // ↓禁止new Symbol对象
    'no-new-symbol': 2,
    // ↓禁止new String、Number和Boolean对象
    'no-new-wrappers': 2,
    // ↓不允许将全局对象属性作为函数调用
    'no-obj-calls': 2,
    // ↓禁止八进制文字
    'no-octal': 2,
    // ↓禁止在字符串文字中使用八进制转义序列
    'no-octal-escape': 2,
    // ↓禁止使用__proto__
    'no-proto': 2,
    // ↓不允许变量重新声明
    'no-redeclare': 2,
    // ↓禁止在正则表达式中使用多个空格
    'no-regex-spaces': 2,
    // ↓禁止在return语句中赋值运算符
    'no-return-assign': [2, 'except-parens'],
    // ↓禁止双方完全相同的分配
    'no-self-assign': 2,
    // ↓禁止双方完全相同的比较
    'no-self-compare': 2,
    // ↓禁止逗号运算符
    'no-sequences': 2,
    // ↓禁止标识符隐藏受限名称
    'no-shadow-restricted-names': 2,
    // ↓不允许稀疏数组
    'no-sparse-arrays': 2,
    // ↓在构造函数之前禁止调用this/supersuper()
    'no-this-before-super': 2,
    // ↓不允许在行尾使用尾随空格
    'no-trailing-spaces': 2,
    // ↓不允许将变量初始化为undefined
    'no-undef-init': 2,
    // ↓禁止混淆多行表达式
    'no-unexpected-multiline': 2,
    // ↓禁止未修改的循环条件
    'no-unmodified-loop-condition': 2,
    // ↓当存在更简单的替代方案时，禁止使用三元运算符
    'no-unneeded-ternary': [
      2,
      {
        defaultAssignment: false
      }
    ],
    // ↓在throw, continue, 和break语句中return之后禁止出现无法访问的代码
    'no-unreachable': 2,
    // ↓禁止块中使用finally的控制流语句
    'no-unsafe-finally': 2,
    // ↓禁止未使用的变量
    'no-unused-vars': [
      2,
      {
        vars: 'all',
        args: 'none'
      }
    ],
    // ↓禁止不必要的调用.call()和.apply()
    'no-useless-call': 2,
    // ↓禁止在对象和类中使用不必要的计算属性键
    'no-useless-computed-key': 2,
    // ↓禁止不必要的构造函数
    'no-useless-constructor': 2,
    // ↓禁止不必要的转义字符
    'no-useless-escape': 0,
    // ↓属性前不允许有空格
    'no-whitespace-before-property': 2,
    // ↓禁止with声明
    'no-with': 2,
    // ↓强制变量在函数中一起或单独声明
    'one-var': [
      2,
      {
        initialized: 'never'
      }
    ],
    // ↓为操作符强制执行一致的换行样式
    'operator-linebreak': [
      2,
      'after',
      {
        overrides: {
          '?': 'before',
          ':': 'before'
        }
      }
    ],
    // ↓要求或不允许块内填充
    'padded-blocks': [2, 'never'],
    // ↓强制一致使用反引号、双引号或单引号
    quotes: [
      2,
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true
      }
    ],
    // ↓要求或禁止使用分号而不是 ASI
    semi: [2, 'never'],
    // ↓在分号前后强制执行一致的间距
    'semi-spacing': [
      2,
      {
        before: false,
        after: true
      }
    ],
    // ↓在块之前强制执行一致的间距
    'space-before-blocks': [2, 'always'],
    // ↓在定义左括号之前强制执行一致的间距
    'space-before-function-paren': [2, 'never'],
    // ↓在括号内强制使用一致的间距
    'space-in-parens': [2, 'never'],
    // ↓要求中缀运算符周围有间距
    'space-infix-ops': 2,
    // ↓在一元运算符之前或之后强制执行一致的间距
    'space-unary-ops': [
      2,
      {
        words: true,
        nonwords: false
      }
    ],
    // ↓在//之后或/*中强制使用一致的间距
    'spaced-comment': [
      2,
      'always',
      {
        markers: ['global', 'globals', 'eslint', 'eslint-disable', '*package', '!', ',']
      }
    ],
    // ↓要求或不允许模板字符串的嵌入表达式周围有空格
    'template-curly-spacing': [2, 'never'],
    // ↓isNaN()检查时需要调用NaN
    'use-isnan': 2,
    // ↓强制将typeof表达式与有效字符串进行比较
    'valid-typeof': 2,
    // ↓需要在立即调用周围加上function括号
    'wrap-iife': [2, 'any'],
    // ↓要求或不允许*inyield*表达式周围有空格
    'yield-star-spacing': [2, 'both'],
    // ↓要求或禁止“Yoda”条件
    yoda: [2, 'never'],
    // ↓要求const声明后永远不会重新分配的变量的声明
    'prefer-const': 2,
    // ↓禁止使用debugger
    'no-debugger': 2,
    // ↓在大括号内强制执行一致的间距
    'object-curly-spacing': [
      2,
      'always',
      {
        objectsInObjects: false
      }
    ],
    // ↓在数组括号内强制执行一致的间距
    'array-bracket-spacing': [2, 'never']
  },
  globals: { defineOptions: 'readonly' }
}
