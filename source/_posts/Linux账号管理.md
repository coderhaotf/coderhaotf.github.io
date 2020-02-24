---
title: Linux账号管理
date: 2020-02-24 21:43:52
categories:
tags:
---
## 查看用户信息

##### 查看账号
```linux
[root@localhost ~]# head -n 4 /etc/passwd
root:x:0:0:root:/root:/bin/bash
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
adm:x:3:4:adm:/var/adm:/sbin/nologin
```
 - 1. 帐号名称
 - 2. 密码： 具体密码放在/etc/shadow 中了，所以这里只会看到一个“ x ”
 - 3. UID： 这个就是使用者识别码；0（系统管理员）| 1~999（系统帐号） | 1000~60000（可登陆帐号）给一般使用者用的。
 - 4. GID： 这个与 /etc/group 有关；
 - 5. 使用者信息说明栏;
 - 6. 主文件夹： 这是使用者的主文件夹;
 - 7. Shell： 当使用者登陆系统后就会取得一个 Shell 来与系统的核心沟通以进行使用者的操作任务。

##### 查看密码
```linux
[root@localhost ~]# head -n 4 /etc/shadow
root:$1$PVouuTVF$M9aj8PmDWwU4026X2VAAe0:18026:0:99999:7:::
bin:*:16659:0:99999:7:::
daemon:*:16659:0:99999:7:::
adm:*:16659:0:99999:7:::

// 查看上一次修改密码的日期
[root@localhost ~]# date -u -d "1970-01-01 UTC $((18026 * 86400 )) seconds"
Fri May 10 00:00:00 UTC 2019
```
 - 1. 帐号名称;
 - 2. 密码： 这个字段内的数据才是真正的密码，而且是经过编码的密码;
 - 3. 最近更动密码的日期;
 - 4. 密码不可被更动的天数；


## 查看群组信息

用户帐号相关的两个文件是 /etc/passwd 与 /etc/shadow ，与此类似，群组相关信息在 /etc/group 与 /etc/gshadow 文件中；

##### 查看群组
```linux
[root@localhost ~]# head -n 4 /etc/group
root:x:0:
bin:x:1:
daemon:x:2:
sys:x:3:
```

##### 查看密码
```linux
[root@localhost ~]# head -n 4 /etc/gshadow
root:::
bin:::
daemon:::
sys:::
```

 - 1. 群组名称
 - 2. 密码栏，同样的，开头为 ! 表示无合法密码，所以无群组管理员
 - 3. 群组管理员的帐号 （相关信息在 gpasswd 中介绍）
 - 4. 有加入该群组支持的所属帐号 （与 /etc/group 内容相同！）


## 账号管理

##### 新增用户
```linux
[root@localhost ~]# useradd user1
[root@localhost ~]# grep user1 /etc/passwd /etc/shadow /etc/group
/etc/passwd:user1:x:1001:1001::/home/user1:/bin/bash
/etc/shadow:user1:!!:18027
/etc/group:user1:x:1001:  // 默认会创建一个与帐号一模一样的群组名

[root@localhost ~]# su user1
[user1@localhost root]$ cd ~
[user1@localhost ~]$ pwd
/home/user1   // 默认在home目录下创建一个同名用户目录

// -D 查看该命令的默认配置
[root@localhost user1]# useradd -D
GROUP=100
HOME=/home  // 使用者主文件夹的基准目录（basedir）
INACTIVE=-1
EXPIRE=
SHELL=/bin/bash
SKEL=/etc/skel
CREATE_MAIL_SPOOL=yes
```


##### 修改密码

使用 useradd 创建了帐号之后，在默认的情况下，该帐号是暂时被封锁的， 也就是说，该帐号是无法登陆的，你可以去瞧一瞧 /etc/shadow 内的第二个字段就知道了（`/etc/shadow:user1:!!:18027`）。

```linux
[root@localhost user1]# passwd --stdin user1
Changing password for user user1.
user1
passwd: all authentication tokens updated successfully.
[root@localhost user1]# grep user1 /etc/shadow
user1:$1$zQ.ACG7G$BOzh/LS6Zfa7uBIwjlV1j1:18027:0:99999:7:::
```

passwd 的使用真的要很注意，要帮一般帐号创建密码需要使用“ passwd 帐号 ”的格式，使用“ passwd ”表示修改自己的密码！

##### 锁定账号
```linux
// -l 锁定账号
[root@localhost ~]# passwd -l user1
Locking password for user user1.
passwd: Success

// -S 查看账号密码状态，需要root权限
[root@localhost ~]# passwd -S user1
user1 LK 2019-05-10 0 99999 7 -1 (Password locked.)

// 密码前面加上!!
[root@localhost ~]# grep user1 /etc/shadow
user1:!!$1$zQ.ACG7G$BOzh/LS6Zfa7uBIwjlV1j1:18027:0:99999:7:::

// -u 解锁账号
[root@localhost ~]# passwd -u user1
Unlocking password for user user1.
passwd: Success

// !! 去掉了
[root@localhost ~]# grep user1 /etc/shadow
user1:$1$zQ.ACG7G$BOzh/LS6Zfa7uBIwjlV1j1:18027:0:99999:7:::
```

##### 查看密码状态
上例用到了`passwd -S username`来查看密码状态，但是显然信息太过简略了，下面介绍一个新命令chage:
```linux
[root@localhost ~]# chage -l user1
Last password change                                : May 11, 2019
Password expires                                    : never
Password inactive                                   : never
Account expires                                     : never
Minimum number of days between password change      : 0
Maximum number of days between password change      : 99999
Number of days of warning before password expires   : 7
```
选项与参数：
    -l ：列出该帐号的详细密码参数；
    -d ：后面接日期，修改 shadow 第三字段（最近一次更改密码的日期），格式 YYYY-MM-DD
    -E ：后面接日期，修改 shadow 第八字段（帐号失效日），格式 YYYY-MM-DD
    -I ：后面接天数，修改 shadow 第七字段（密码失效日期）
    -m ：后面接天数，修改 shadow 第四字段（密码最短保留天数）
    -M ：后面接天数，修改 shadow 第五字段（密码多久需要进行变更）
    -W ：后面接天数，修改 shadow 第六字段（密码过期前警告日期）

##### 修改用户

所谓这“人有失手，马有乱蹄”，有的时候在useradd 的时候加入了错误的设置数据。或者是，在使用 useradd 后，发现某些地方还可以进行细部修改。 此时，当然我们可以直接到 /etc/passwd 或 /etc/shadow 去修改相对应字段的数据， 或者使用命令`usermod` 。

值得注意的是，修改用户时需要退出相关进程：
```linux
[root@localhost ~]# usermod -l user11 user1
usermod: user user1 is currently used by process 3060

[root@localhost ~]# pkill -9 -u user1
[root@localhost ~]# Killed
[root@localhost ~]# exit

[root@localhost ~]# usermod -l user11 user1
[root@localhost ~]# grep user /etc/passwd
user11:x:1001:1001::/home/user1:/bin/bash  // 用户名变为user11
```

选项与参数：
    -c ：后面接帐号的说明，即 /etc/passwd 第五栏的说明栏，可以加入一些帐号的说明。
    -d ：后面接帐号的主文件夹，即修改 /etc/passwd 的第六栏；
    -e ：后面接日期，格式是 YYYY-MM-DD 也就是在 /etc/shadow 内的第八个字段数据啦！
    -f ：后面接天数，为 shadow 的第七字段。
    -g ：后面接初始群组，修改 /etc/passwd 的第四个字段，亦即是 GID 的字段！
    -G ：后面接次要群组，修改这个使用者能够支持的群组，修改的是 /etc/group 啰～
    -a ：与 -G 合用，可“增加次要群组的支持”而非“设置”喔！
    -l ：后面接帐号名称。亦即是修改帐号名称， /etc/passwd 的第一栏！
    -s ：后面接 Shell 的实际文件，例如 /bin/bash 或 /bin/csh 等等。
    -u ：后面接 UID 数字啦！即 /etc/passwd 第三栏的数据；
    -L ：暂时将使用者的密码冻结，让他无法登陆。其实仅改 /etc/shadow 的密码栏。
    -U ：将 /etc/shadow 密码栏的 ! 拿掉，解冻啦！


##### 删除用户

`userdel`指令的目的在删除使用者的相关数据，而使用者的数据有：

 - 使用者帐号/密码相关参数：/etc/passwd, /etc/shadow
 - 使用者群组相关参数：/etc/group, /etc/gshadow
 - 使用者个人文件数据： /home/username, /var/spool/mail/username..

```linux
[root@localhost ~]# userdel -r user1
[root@localhost ~]# grep user1 /etc/passwd
[root@localhost ~]# 
```
选项与参数：
-r ：连同使用者的主文件夹也一起删除

如果想要完整的将某个帐号完整的移除，最好可以在下达 userdel -r username 之前， 先以“ find / -user username ”查出整个系统内属于 username 的文件，然后再加以删除。

