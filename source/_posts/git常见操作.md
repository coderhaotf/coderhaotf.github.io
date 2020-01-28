---
title: git常见操作
date: 2020-01-28 14:31:41
categories:
tags:
---
## 添加修改到暂存区跟提交本地仓库

```js
//提交修改到暂存区
git add .
//提交到本地仓库
git commit -m "annotation"
```


## 版本回退

```js
//查看版本
git log
//查看全部历史版本
git reflog
//回退到指定版本
git reset --hard versionId
git reset --hard head^ || head^^
```

## 撤销修改

```js
//当文件未add或者commit时，撤销修改到修改前或者add状态
git checkout --file
git checkout .
//当文件已经add未commit时，撤销到最近一次commit状态
git reset --hard head^
//当已经commit且未推送远程仓库时，回退到上一版本
git reset --hard head^
```


## 分支命令

```js
//查看分支：
git branch
//创建分支：
git branch <name>
//切换分支：
git checkout <name>
//创建+切换分支：
git checkout -b <name>
//合并某分支到当前分支：
git merge <name>
//删除分支：
git branch -d <name>
```


## 解决冲突

 - 合并某分支到当前分支：`git merge <name>`
 - 手动解决冲突，Git用 `<<<<<<<`，`=======`，`>>>>>>>` 标记出不同分支的内容
 - 再提交，`git add`，`git commit`
 - 查看分支合并情况，`git log --graph --pretty=oneline --abbrev-commit`



## 常见快捷键

 - 退出 git log ; 按q键
 - git commit --amend 命令（修改最近一次提交的注释信息），会进入到vim 编辑器
 - 按下字母键 c（此时进入编辑状态），可以开始修改注释信息了
 - 按下Esc (退出编辑状态)； 接着连按两次大写字母Z，退出VIM编辑器