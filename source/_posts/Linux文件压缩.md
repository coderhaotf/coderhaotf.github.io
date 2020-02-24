---
title: Linux文件压缩
date: 2020-02-24 21:43:47
categories:
tags:
---
文件压缩是Linux环境下非常常见的操作，我们可以通过一个常用的常见来熟悉相关命令。

#### 查看文件
```linux
[root@localhost ~]# ll -hS /etc/* | head -n 3
// -h: 显示默认单位
// -S： 按照大小排序
// -n: 从头显示前3行
-rw-r--r--.  1 root root 655K Jun  7  2013 /etc/services
-rw-r--r--.  1 root root  25K Aug  5  2015 /etc/dnsmasq.conf
-rw-r--r--.  1 root root  19K Mar 31 07:47 /etc/ld.so.cache
```

#### 拷贝文件
```linux
[root@localhost ~]# ll /home/user1
total 0
-rw-rw-r--. 1 user1 user1 0 Apr 18 09:00 a
[root@localhost ~]# cp -ai /etc/services  /home/user1/services.cp
- a 保留链接和文件属性，递归拷贝目录，相当于下面的d、p、r三个选项组合。
- d 拷贝时保留链接。
- f 删除已经存在目标文件而不提示。
- i 覆盖目标文件前将给出确认提示，属交互式拷贝。
- p 复制源文件内容后，还将把其修改时间和访问权限也复制到新文件中。
- r 若源文件是一目录文件，此时cp将递归复制该目录下所有的子目录和文件
[root@localhost ~]# ll /home/user1/
// total后面的数字是指当前目录下所有文件所占用的空间总和
total 656
-rw-rw-r--. 1 user1 user1      0 Apr 18 09:00 a
-rw-r--r--. 1 root  root  670293 Jun  7  2013 services.cp
```

#### 打包与压缩
首先要弄清两个概念：打包和压缩。

打包是指将一大堆文件或目录变成一个总的文件；

压缩则是将一个大的文件通过一些压缩算法变成一个小文件。

为什么要区分这两个概念呢？这源于Linux中很多压缩程序只能针对一个文件进行压缩，这样当你想要压缩一大堆文件时，你得先将这一大堆文件先打成一个包（tar命令），然后再用压缩程序进行压缩（gzip bzip2命令）。

###### 准备拷贝文件
```linux
// 拷贝两份文件
[root@localhost user1]# cp services.cp services.cp01
[root@localhost user1]# cp services.cp services.cp02
```

###### 打包压缩
```linux
// 打包
[root@localhost user1]# tar -cvf 1.tar services.cp services.cp01 services.cp02

// 打包与压缩
[root@localhost user1]# tar -zcvf 1.tar.gz services.cp services.cp01
// 打包与压缩
[root@localhost user1]# tar -jcvf 1.tar.bz2 services.cp services.cp02
选项与参数：
-c ：创建打包文件，可搭配 -v 来察看过程中被打包的文件名（filename）
-t ：察看打包文件的内容含有哪些文件名，重点在察看“文件名”就是了；
-x ：解打包或解压缩的功能，可以搭配 -C （大写） 在特定目录解开
特别留意的是， -c, -t, -x 不可同时出现在一串命令行中。
-z ：通过 gzip 的支持进行压缩/解压缩：此时文件名最好为 *.tar.gz
-j ：通过 bzip2 的支持进行压缩/解压缩：此时文件名最好为 *.tar.bz2
-v ：在压缩/解压缩的过程中，将正在处理的文件名显示出来！
-f filename：-f 后面要立刻接要被处理的文件名！建议 -f 单独写一个选项啰！
-C 目录 ：这个选项用在解压缩，若要在特定目录解压缩，可以使用这个选项。

-p（小写） ：保留备份数据的原本权限与属性，常用于备份（-c）重要的配置文件
-P（大写） ：保留绝对路径，亦即允许备份数据中含有根目录存在之意；
--exclude=FILE：在压缩的过程中，不要将 FILE 打包！
```

###### 查看打包效果
```linux
// 查看打包与压缩效果
[root@localhost user1]# ll -hS
total 84K
-rw-r--r--. 1 root root 40K Apr 24 10:35 1.tar
-rw-r--r--. 1 root root 10K Apr 24 10:07 services.cp
-rw-r--r--. 1 root root 10K Apr 24 10:34 services.cp01
-rw-r--r--. 1 root root 10K Apr 24 10:34 services.cp02
-rw-r--r--. 1 root root 161 Apr 24 10:38 1.tar.gz
-rw-r--r--. 1 root root 148 Apr 24 10:38 1.tar.bz2
```

###### 查看打包后包含文件
```linux
[root@localhost user1]# tar -tvf 1.tar
-rw-r--r-- root/root     10240 2019-04-24 10:07 services.cp
-rw-r--r-- root/root     10240 2019-04-24 10:34 services.cp01
-rw-r--r-- root/root     10240 2019-04-24 10:34 services.cp02

[root@localhost user1]# tar -tvf 1.tar.gz
-rw-r--r-- root/root     10240 2019-04-24 10:07 services.cp
-rw-r--r-- root/root     10240 2019-04-24 10:34 services.cp01

[root@localhost user1]# tar -tvf 1.tar.bz2
-rw-r--r-- root/root     10240 2019-04-24 10:07 services.cp
-rw-r--r-- root/root     10240 2019-04-24 10:34 services.cp02
```

#### 解压

###### 解压打包文件
```linux
[root@localhost user1]# mkdir untar
[root@localhost user1]# tar -xvf 1.tar -C ./untar/
services.cp
services.cp01
services.cp02
[root@localhost user1]# ll ./untar/
total 36
-rw-r--r--. 1 root root 10240 Apr 24 10:07 services.cp
-rw-r--r--. 1 root root 10240 Apr 24 10:34 services.cp01
-rw-r--r--. 1 root root 10240 Apr 24 10:34 services.cp02
```

###### 解压压缩文件
```linux
[root@localhost user1]# mkdir untar.gz
[root@localhost user1]# tar -xvf 1.tar.gz -C ./untar.gz/
// 也可以加上压缩类型 -zxvf , -jxvf
services.cp
services.cp01
[root@localhost user1]# ll ./untar.gz/
total 24
-rw-r--r--. 1 root root 10240 Apr 24 10:07 services.cp
-rw-r--r--. 1 root root 10240 Apr 24 10:34 services.cp01
```

###### 解压部分文件
```linux
[root@localhost user1]# mkdir untar.bz2
[root@localhost user1]# tar -jxvf 1.tar.bz2 services.cp02 -C ./untar.bz2/
services.cp02
[root@localhost user1]# ll ./untar.bz2/
total 0 ???为什么没有解压过来？
```

