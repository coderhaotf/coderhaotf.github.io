---
title: Linux权限命令
date: 2020-02-24 21:43:49
categories:
tags:
---
#### 查看文件权限
```linux
ll /
lrwxrwxrwx.   1 root root     7 Mar 29 11:44 bin -> usr/bin
dr-xr-xr-x.   5 root root  4096 Mar 29 11:48 boot
//...
```
输出结果的第一个字段就是描述文件和目录权限的编码。这个字段的第一个字符代表了对象的类型：

 - \-  代表文件
 - d  代表目录
 - l  代表链接
 - c  代表字符型设备
 - b  代表块设备
 - n  代表网络设备

之后有3组三字符的编码。每一组定义了3种访问权限：

 - r 代表对象是可读的
 - w 代表对象是可写的
 - x 代表对象是可执行的

若没有某种权限，在该权限位会出现单破折线。这3组权限分别对应对象的3个安全级别：

 - 对象的属主
 - 对象的属组
 - 系统其他用户


#### 默认文件权限
umask值用于设置用户在创建文件时的默认权限，当我们在系统中创建目录或文件时，目录或文件所具有的默认权限就是由umask值决定的。

对于root用户，系统默认的umask值是0022；对于普通用户，系统默认的umask值是0002。执行umask命令可以查看当前用户的umask值。
```linux
[root@localhost ~]# umask
0022
[user1@localhost ~]$ umask
0002
```

umask值一共有4组数字，其中第1组数字用于定义**特殊权限**，我们一般不予考虑，与一般权限有关的是后3组数字。

默认情况下，对于目录，用户所能拥有的**最大权限是777**；
对于文件，用户所能拥有的最大权限是目录的**最大权限去掉执行权限，即666**。
因为x执行权限对于目录是必须的，没有执行权限就无法进入目录，而对于文件则不必默认赋予x执行权限。

默认权限是所能拥有的权限减去umask值：
创建目录默认权限是 rwxr-xr-x (777 - 022  ->  755)
创建文件默认权限是 rw-r--r-- (666 - 022 -> 644)
```linux
[root@localhost ~]# touch a.txt
[root@localhost ~]# mkdir b
[root@localhost ~]# ll
-rw-r--r--. 1 root root    0 Apr 18 09:25 a.txt
drwxr-xr-x. 2 root root 4096 Apr 18 09:25 b
```

umask可以通过修改/etc/profile或者/etc/bashrc里面的值进行永久修改：
```linux
[root@localhost ~]# cat /etc/profile | grep umask
# By default, we want umask to get set. This sets it for login shell
    umask 002
    umask 022
```

他们的区别是/etc/profile只在用户第一次登录时被执行，而/etc/bashrc则在用户每次登录加载Bash Shell时都会被执行。

因而，如果是修改/etc/profile文件，将只对新创建的用户生效；而如果是修改/etc/bashrc文件，则对所有用户都生效。

#### 查看群组与用户
查看当前系统所有组
```linux
[root@localhost ~]# cat /etc/group
root:x:0:
bin:x:1:
// ...
daemon:x:2:
sshd:x:74:
haotengfei:x:1000:
user1:x:1001:
```

查看当前系统所有用户名
```linux
cat /etc/passwd|grep -v nologin|grep -v halt|grep -v shutdown|awk -F":" '{ print $1"|"$3"|"$4 }'|more
root|0|0
sync|5|0
haotengfei|1000|1000
user1|1001|1001
user2|1002|1002
user3|1003|1003
```

#### 权限操作
改变所属用户组
```linux
[root@localhost ~]# chgrp user1 a.txt
[root@localhost ~]# ll
-rw-r--r--. 1 root user1    0 Apr 18 09:25 a.txt
```

改变所属用户
```linux
[root@localhost ~]# chown user2 a.txt
[root@localhost ~]# ll
-rw-r--r--. 1 user2 root    0 Apr 18 09:25 a.txt
```

改变所属权限
```linux
[root@localhost ~]# chmod 777 a.txt
[root@localhost ~]# ll
-rwxrwxrwx. 1 root root    0 Apr 18 09:25 a.txt
```
```linux
// u代表用户，g代表用户组，o代表其他人
[root@localhost ~]# chmod u=x,g=x,o=x a.txt
[root@localhost ~]# ll
---x--x--x. 1 root root    0 Apr 18 09:25 a.txt
```

改变文件夹下文件权限
```linux
[root@localhost ~]# mv a.txt b/
[root@localhost ~]# cd b
[root@localhost b]# ll
---x--x--x. 1 root root 0 Apr 18 09:25 a.txt

[root@localhost ~]# chmod 777 b
[root@localhost ~]# ll
drwxrwxrwx. 2 root root 4096 Apr 18 10:01 b
[root@localhost ~]# ll b/a.txt
---x--x--x. 1 root root 0 Apr 18 09:25 b/a.txt // 文件夹下权限没有被修改

[root@localhost ~]# chmod -R 777 b
[root@localhost ~]# ll b/a.txt
-rwxrwxrwx. 1 root root 0 Apr 18 09:25 b/a.txt // 此时被修改
```



