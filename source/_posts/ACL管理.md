---
title: ACL管理
date: 2020-02-24 21:43:46
categories:
tags:
---

## ACL(Access Control List)

传统的权限仅有三种身份（owner, group, others）搭配三种权限 （r,w,x)而已，并没有办法单纯的针对某一个使用者或某一个群组来设置特定的权
限需求， 此时就得要使用 ACL 这个机制。

测试系统是否有支持 ACL：
```linux
// dmesg命令显示linux内核的环形缓冲区信息，我们可以从中获得诸如系统架构、cpu、挂载的硬件，RAM等多个运行级别的大量的系统信息。
[root@localhost ~]# dmesg | grep -i acl
[    1.138270] systemd[1]: systemd 219 running in system mode. (+PAM +AUDIT +SELINUX +IMA -APPARMOR +SMACK +SYSVINIT +UTMP +LIBCRYPTSETUP +GCRYPT +GNUTLS +ACL +XZ -LZ4 -SECCOMP +BLKID +ELFUTILS +KMOD +IDN)
[    2.320454] SGI XFS with ACLs, security attributes, no debug enabled
```

##### 查看ACL
```linux
[root@localhost ~]# touch acl.test1
[root@localhost ~]# ll acl.test1
-rw-r--r--. 1 root root 0 May 13 06:19 acl.test2

[root@localhost ~]# getfacl acl.test1
# file: acl.test1
# owner: root
# group: root
user::rw-
group::r--
other::r--
```

##### 设置ACL
```linux
[root@localhost ~]# setfacl -m u:user1:rwx acl.test1 
[root@localhost ~]# ll acl.test1 
-rw-rwxr--+ 1 root root 0 May 13 06:12 acl.test1
```

选项与参数：
    -m ：设置后续的 acl 参数给文件使用，不可与 -x 合用；
    -x ：删除后续的 acl 参数，不可与 -m 合用；
    -b ：移除“所有的” ACL 设置参数；
    -k ：移除“默认的” ACL 参数，关于所谓的“默认”参数于后续范例中介绍；
    -R ：递回设置 acl ，亦即包括次目录都会被设置起来；
    -d ：设置“默认 acl 参数”的意思！只对目录有效，在该目录新建的数据会引用此默认值

```linux
[root@localhost ~]# getfacl acl.test1 
# file: acl.test1
# owner: root
# group: root
user::rw-
user:user1:rwx  // 新增
group::r--
mask::rwx       // 新增
other::r--
```


##### 移除ACL
```linux
[root@localhost ~]# setfacl -x u:user1 acl.test1
[root@localhost ~]# getfacl acl.test1
# file: acl.test1
# owner: root
# group: root
user::rw-
group::r--
mask::r--
other::r--
```


##### 测试ACL权限
```linux
[root@localhost ~]# cd /home/user1/
[root@localhost user1]# ll
total 0
[root@localhost user1]# touch acl.test
[root@localhost user1]# setfacl -m u:user1:rx acl.test 
[root@localhost user1]# su user1
[user1@localhost ~]$ ll
total 4
-rw-r-xr--+ 1 root root 0 May 13 07:01 acl.test

// 没有w权限
[user1@localhost ~]$ echo 'some text' >> acl.test 
bash: acl.test: Permission denied

// 有x权限，可以删除
[user1@localhost ~]$ rm -f acl.test 
[user1@localhost ~]$ ll
total 0
```


##### 有效权限：“ m:权限 ”

细心的朋友可能注意到设置ACL值的时候，出现了一个`mask`值；

意义是： 使用者或群组所设置的权限必须要存在于 mask 的权限设置范围内才会生效，此即“有效权限 （effective permission）”

```linux
[root@localhost user1]# touch acl.mask.test
[root@localhost user1]# setfacl -m u:user1:rwx acl.mask.test 
[root@localhost user1]# getfacl acl.mask.test 
# file: acl.mask.test
# owner: root
# group: root
user::rw-
user:user1:rwx
group::r--
mask::rwx      // 默认rwx
other::r--

[root@localhost user1]# setfacl -m m:x acl.mask.test 
[root@localhost user1]# getfacl acl.mask.test 
# file: acl.mask.test
# owner: root
# group: root
user::rw-
user:user1:rwx          #effective:--x  // 表示起效果的权限
group::r--              #effective:---
mask::--x
other::r--
```


测试验证一番：
```linux
[root@localhost user1]# su user1
[user1@localhost ~]$ ll
total 4
-rw---xr--+ 1 root root 0 May 13 07:34 acl.mask.test

[user1@localhost ~]$ echo 'other text' >> acl.mask.test 
bash: acl.mask.test: Permission denied

[user1@localhost ~]$ rm -f acl.mask.test 
[user1@localhost ~]$ ll
total 0
```


##### 使用默认权限给文件夹设置ACL

```linux
[root@localhost user1]# setfacl -m d:u:user1:rwx acl.dir/
[root@localhost user1]# getfacl acl.dir/
# file: acl.dir/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x
default:user::rwx
default:user:user1:rwx
default:group::r-x
default:mask::rwx
default:other::r-x

// 不能默认权限设置文件
[root@localhost user1]# touch acl.txt
[root@localhost user1]# setfacl -m d:u:user1:rwx acl.txt 
setfacl: acl.txt: Only directories can have default ACLs
```