---
title: MySql的安装
date: 2020-01-28 14:31:39
categories:
tags:
---
#####MySql解压版的安装配置
1、配置环境变量；
2、配置my.ini文件；
3、切换到自己MySQL根目录的bin目录下并执行mysqld --remove；
4、继续运行mysqld  --initialize-insecure，生成data文件（删除旧的data文件）；
5、运行mysqld --install，安装服务;
6、运行net start mysql启动服务；
7、运行mysql -u root -p,连续回车进入，无需输入密码；
8、接着运行set password for root@localhost = password('123')，设置密码（若退出，则可能已经生成随机密码，此时重复步骤3）；
9、grant all privileges on *.* to 'root'@'%' identified by '123456' with grant option;  flush privileges;（
1. *.* 第一个*是指数据库
1. 
1. *代表所有数据库
1. 
1. 第二个*指数据库对象
1. 
1. *代表数据库中所有对象
1. 
1.  'root'@'%' root是制定要授权的数据库用户
1. 
1. %代表允许登录的IP
1. 
1. 123456是你的数据库密码）；