---
title: MongoDB安装与启动
date: 2020-01-28 14:31:37
categories:
tags:
---
##MongoDB的安装与启动
本次安装环境是在win10下，一开始下载的是msi版本，结果遇到一个不可描述的BUG，怎么也无法安装window服务，索性下载了一个解压版的，马上就安装成功了。下面记录一下安装过程：

1.下载解压包安装包，解压到任意目录下，我下载的版本是`mongodb-win32-x86_64-2008plus-ssl-3.4.15`；
2.配置环境变量，新建变量`MongoDB_HOME`(随意)，路径为解压所在路径，即`C:\home\software\install\mongodb-win32-x86_64-2008plus-ssl-3.4.15`;配置`path`变量，值为`%MongoDB_HOOME%\bin`;
3.在解压目录下新建`data`与`log`文件夹，分别存放数据库数据与日志文件；
4.使用管理员身份打开命令行，运行`mongod.exe --dbpath C:\home\software\install\mongodb-win32-x86_64-2008plus-ssl-3.4.15\data --logpath C:\home\software\install\mongodb-win32-x86_64-2008plus-ssl-3.4.15\log\mongod.log --install --serviceName "MongoDB"`;
- `--dbpath`用来指定数据库文件路径；
- `--logpath`用来指定日记文件路径；
- `--install --serviceName "MongoDB"`用来安装window服务；

5.使用命令行运行`net start MongoDB`，即可成功启动服务；
6.进入解压目录，进入`bin`目录下，可以看到相关命令，`mongod.exe`是服务，`mongo.exe`是链接，`mongos.exe`是路由;双击`mongod.exe`，即可连接到数据库，到浏览器下打开`http://127.0.0.1:27017`，看到`It looks like you are trying to access MongoDB over HTTP on the native driver port.`，即代表数据库连接成功；