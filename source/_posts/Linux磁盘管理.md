---
title: Linux磁盘管理
date: 2020-02-24 21:43:50
categories:
tags:
---
## 一切从“/”开始

在Linux系统中，目录、字符设备、块设备、套接字、打印机等都被抽象成了文件，即“Linux系统中一切都是文件”。

在Windows操作系统中，想要找到一个文件，我们要依次进入该文件所在的磁盘分区（假设这里是D盘），然后在进入该分区下的具体目录，最终找到这个文件。但是在Linux系统中并不存在C/D/E/F等盘符，Linux系统中的一切文件都是从“根（/）”目录开始的，并按照文件系统层次化标准（FHS）采用树形结构来存放文件，以及定义了常见目录的用途。

根目录下输入`ls`，可以查看下面常见目录

 | 目录名称 |	应放置文件的内容
 |  ----  | ----  |
 | /boot |	开机所需文件—内核、开机菜单以及所需配置文件等
 |/dev	 |  以文件形式存放任何设备与接口
 |/etc	 |  配置文件
 |/home	 |  用户主目录
 |/bin	 |  存放单用户模式下还可以操作的命令
 |/lib	 |  开机时用到的函数库，以及/bin与/sbin下面的命令要调用的函数
 |/sbin	 |  开机过程中需要的命令
 |/media	 |  用于挂载设备文件的目录
 |/opt	 |  放置第三方的软件
 |/root	|  系统管理员的家目录
 |/srv	 |  一些网络服务的数据文件目录
 |/tmp	 |  任何人均可使用的“共享”临时目录
 |/proc	 |  虚拟文件系统，例如系统内核、进程、外部设备及网络状态等
 |/usr/local	 |  用户自行安装的软件
 |/usr/sbin	 |  Linux系统开机时不会使用到的软件/命令/脚本
 |/usr/share	 |  帮助与说明文件，也可放置共享文件
 |/var	 |  主要存放经常变化的文件，如日志


## 磁盘基础

##### 磁盘命名

在Linux系统中一切都是文件，硬件设备也不例外。既然是文件，就必须有文件名称。系统内核中的udev设备管理器会自动把硬件名称规范起来，目的是让用户通过设备文件的名字可以猜出设备大致的属性以及分区信息等。

常见的硬件设备及其文件名称如下：

 | 硬件设备	 | 文件名称
 |    ---     |    ---     |
 | IDE设备	 | /dev/hd[a-d]
 | SCSI/SATA/U盘	 | /dev/sd[a-p]
 | 软驱	 | /dev/fd[0-1]
 | 打印机	 | /dev/lp[0-15]
 | 光驱	 | /dev/cdrom
 | 鼠标	 | /dev/mouse

系统采用a～p来代表16块不同的硬盘（默认从a开始分配），而且硬盘的分区编号也很有讲究：

> 主分区或扩展分区的编号从1开始，到4结束；
> 逻辑分区从编号5开始。

##### 主分区、扩展分区、逻辑分区

给一块磁盘分区时，我们可以选择MBR（Master Boot Record）磁盘分区模式（还有一种更先进的GPT模式）进行分区。

**==*在MBR模式下，主分区与扩展分区之和++最多是 4++ 个，且扩展分区最多++只能有 1++ 个。在扩展分区上面，可以创建 ++n 个++逻辑分区。*==**

###### 主分区跟扩展分区为什么最多是四个呢？

 - 首先，硬盘设备是由大量的扇区组成的，每个扇区的容量为512字节。

 - 其次，MBR的意思是：主引导记录（Master Boot Record），又叫做主引导扇区，是计算机开机后访问硬盘时所必须要读取的**==首个扇区==**，它在硬盘上的三维地址为（柱面，磁头，扇区）＝（0，0，1）。

 - 接着，主引导扇区的内部结构，其开头的446字节内容特指为“主引导记录”（MBR），其后是4个16字节的“磁盘分区表”（DPT），以及2字节的结束标志（55AA）。

 - 最后，分区表中每记录一个分区的引用信息就需要16字节，这样一来最多只有4个分区信息可以写到第一个扇区中，这4个分区就是4个主分区。

###### 逻辑分区为什么可以是n个呢？

 - 类似主引导扇区，扩展分区利用最前面几个扇区来记载逻辑分区的引用信息。


##### 磁盘分区实质

 - 其实所谓的“分区”只是针对那个64 Bytes的磁盘分区表进行设置而已！
 - 硬盘默认的分区表仅能写入四组分区信息
 - 这四组分区信息我们称为主要（Primary）或延伸（Extended）分区
 - 分区的最小单位“通常”为柱面（cylinder）
 - 当系统要写入磁盘时，一定会参考磁盘分区表，才能针对某个分区进行数据的处理


## 磁盘分区

了解磁盘基础之后，我们就可以进行磁盘分区实操了。先了解一下分区整个流程：

 1. 对磁盘进行分区，以创建可用的 partition ；
 2. 对该 partition 进行格式化 （format），以创建系统可用的 filesystem；
 3. 若想要仔细一点，则可对刚刚创建好的 filesystem 进行检验；
 4. 在 Linux 系统上，需要创建挂载点 （亦即是目录），并将它挂载上来；

##### 查看分区状态

在分区之前，我们需要先了解机器的磁盘状态：

**lsblk 列出系统上的所有磁盘列表 ：**
```
[root@localhost ~]# lsblk
NAME            MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda               8:0    0   20G  0 disk 
├─sda1            8:1    0    2M  0 part 
├─sda2            8:2    0    2M  0 part 
├─sda3            8:3    0    2G  0 part /boot
├─sda4            8:4    0    1K  0 part 
└─sda5            8:5    0   18G  0 part 
  ├─centos-root 253:0    0  9.8G  0 lvm  /
  ├─centos-swap 253:1    0 1000M  0 lvm  [SWAP]
  ├─centos-var  253:2    0    2G  0 lvm  /var
  └─centos-home 253:3    0  5.3G  0 lvm  /home
sdb               8:16   0   20G  0 disk 
sr0              11:0    1    4G  0 rom  
```

为了方便演示，新增了`sdb`磁盘，原来的`sda`磁盘则已经进行了分区。

**blkid 列出设备的 UUID 等参数** :

```
[root@localhost ~]# blkid
/dev/sda3: UUID="c225904f-a210-43cc-8c8c-e210642262f6" TYPE="xfs" 
/dev/sda5: UUID="OXEomY-lqXp-6Beu-cebI-T9wv-Z4S8-UZ9Aq9" TYPE="LVM2_member" 
/dev/sr0: UUID="2015-12-09-23-14-10-00" LABEL="CentOS 7 x86_64" TYPE="iso9660" PTTYPE="dos" 
/dev/mapper/centos-root: UUID="775ac81a-210f-4089-87a3-a9a6a680b018" TYPE="xfs" 
/dev/mapper/centos-swap: UUID="f229bae3-e7f5-4da0-8f45-8269bd0f03e7" TYPE="swap" 
/dev/mapper/centos-var: UUID="9acbfd67-676d-4b0d-9c78-63e5fbdf1236" TYPE="xfs" 
/dev/mapper/centos-home: UUID="557aae02-8971-4d3f-a258-e3222b1483f1" TYPE="xfs" 
```

**parted 列出磁盘的分区表类型与分区信息** ：
```
[root@localhost ~]# parted /dev/sda print
Model: VMware, VMware Virtual S (scsi)
Disk /dev/sda: 21.5GB
Sector size (logical/physical): 512B/512B
Partition Table: msdos
Disk Flags:

Number  Start   End     Size    Type      File system  Flags
 1      1049kB  3146kB  2097kB  primary
 2      3146kB  5243kB  2097kB  primary
 3      5243kB  2102MB  2097MB  primary   xfs          boot
 4      2102MB  21.5GB  19.4GB  extended
 5      2103MB  21.5GB  19.4GB  logical                lvm
```

##### 进行分区

> “MBR 分区表请使用 `fdisk` 分区， GPT 分区表请使用 `gdisk` 分区！”

整个分区操作分两步：

 1. gdisk、fdisk分区
 2. partprobe 更新 Linux 核心的分区表信息

###### gdisk、fdisk分区

下面我们用`gdisk`命令来进行分区，没有该命令的先`yum install -y gdisk`进行安装。

```
[root@localhost ~]# gdisk /dev/sdb
GPT fdisk (gdisk) version 0.8.10

Partition table scan:
  MBR: not present
  BSD: not present
  APM: not present
  GPT: not present

Creating new GPT entries.

Command (? for help): ?
b	back up GPT data to a file
c	change a partition's name
d	delete a partition
i	show detailed information on a partition
l	list known partition types
n	add a new partition
o	create a new empty GUID partition table (GPT)
p	print the partition table
q	quit without saving changes
r	recovery and transformation options (experts only)
s	sort partitions
t	change a partition's type code
v	verify disk
w	write table to disk and exit
x	extra functionality (experts only)
?	print this menu

Command (? for help): p
Disk /dev/sdb: 41943040 sectors, 20.0 GiB
Logical sector size: 512 bytes
Disk identifier (GUID): 0F88B5F3-360F-4B70-A503-2C705CA23023
Partition table holds up to 128 entries
First usable sector is 34, last usable sector is 41943006
Partitions will be aligned on 2048-sector boundaries
Total free space is 41942973 sectors (20.0 GiB)

Number  Start (sector)    End (sector)  Size       Code  Name

Command (? for help): n
Partition number (1-128, default 1): 
First sector (34-41943006, default = 2048) or {+-}size{KMGTP}: 
Last sector (2048-41943006, default = 41943006) or {+-}size{KMGTP}: +5G
Current type is 'Linux filesystem'
Hex code or GUID (L to show codes, Enter = 8300): 
Changed type of partition to 'Linux filesystem'

Command (? for help): p
Disk /dev/sdb: 41943040 sectors, 20.0 GiB
Logical sector size: 512 bytes
Disk identifier (GUID): 0F88B5F3-360F-4B70-A503-2C705CA23023
Partition table holds up to 128 entries
First usable sector is 34, last usable sector is 41943006
Partitions will be aligned on 2048-sector boundaries
Total free space is 31457213 sectors (15.0 GiB)

Number  Start (sector)    End (sector)  Size       Code  Name
   1            2048        10487807   5.0 GiB     8300  Linux filesystem

Command (? for help):
```

该命令非常简单，输入`?`命令可以看到详细的操作命令指南，完全不需要记忆就可以对一个磁盘进行增删分区操作。

最后， 如果一切的分区状态都正常的话，还需要执行一步操作写入磁盘分区表：

```
Command (? for help): w

Final checks complete. About to write GPT data. THIS WILL OVERWRITE EXISTING
PARTITIONS!!

Do you want to proceed? (Y/N): y
OK; writing new GUID partition table (GPT) to /dev/sdb.
The operation has completed successfully.
```

###### partprobe 更新 Linux 核心的分区表信息
进行分区操作之后，如果 Linux 此时还在使用这颗磁盘，为了担心系统出问题，所以分区表并没有被更新，这时需要我们手动更新：

```
[root@localhost ~]# partprobe -s
/dev/sda: msdos partitions 1 2 3 4 <5>
/dev/sdb: gpt partitions 1 2
[root@localhost ~]# cat /proc/partitions
major minor  #blocks  name

   8        0   20971520 sda
   8        1       2048 sda1
   8        2       2048 sda2
   8        3    2048000 sda3
   8        4          0 sda4
   8        5   18917376 sda5
  11        0    4228096 sr0
   8       16   20971520 sdb
   8       17    5242880 sdb1
   8       18    6291456 sdb2
```

##### 磁盘格式化（创建文件系统）

我们常听到的“格式化”其实应该称为“创建文件系统 （make filesystem）”才对啦！所以使用的指令是 mkfs 喔！

如果我们要创建的是 xfs 文件系统， 那使用的是 mkfs.xfs 这个指令。这个指令是这样使用的： `mkfs.xfs device`；如果创建 ext4 系统，则用 `mkfs.ext4 device`;

```
[root@localhost ~]# mkfs.xfs /dev/sdb1
meta-data=/dev/sdb1              isize=256    agcount=4, agsize=327680 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=0        finobt=0
data     =                       bsize=4096   blocks=1310720, imaxpct=25
...
[root@localhost ~]# mkfs.ext4 /dev/sdb2
mke2fs 1.42.9 (28-Dec-2013)
Filesystem label=
OS type: Linux
Block size=4096 (log=2)
Fragment size=4096 (log=2)
Stride=0 blocks, Stripe width=0 blocks
393216 inodes, 1572864 blocks
...
```

查看格式化结果：

```
[root@localhost ~]# parted /dev/sdb print
Model: VMware, VMware Virtual S (scsi)
Disk /dev/sdb: 21.5GB
Sector size (logical/physical): 512B/512B
Partition Table: gpt
Disk Flags: 

Number  Start   End     Size    File system  Name              Flags
 1      1049kB  5370MB  5369MB  xfs          Linux filesystem
 2      5370MB  11.8GB  6442MB  ext4         Linux filesystem
```


#####  文件系统挂载与卸载

磁盘格式化之后是不是就能使用了呢？当然还不行，格式化就类似酒店房间已经打扫干净，最后还要给客户办理入住手续啊，毕竟一个房间只能接待一位客户，这就是所谓的挂载。

> 挂载点：挂载点是目录， 而这个目录是进入磁盘分区（其实是文件系统啦！）的入口。

进行挂载操作前，需要了解几点：

 - 单一文件系统不应该被重复挂载在不同的挂载点（目录）中；
 - 单一目录不应该重复挂载多个文件系统；
 - 要作为挂载点的目录，理论上应该都是空目录才是。

###### 挂载磁盘 mount device dirname
```
[root@localhost ~]# mkdir -p /test/xfs_test
[root@localhost ~]# mkdir -p /test/ext4_test
[root@localhost ~]# mount /dev/sdb1 /test/xfs_test/
[root@localhost ~]# mount /dev/sdb2 /test/ext4_test/

[root@localhost ~]# df /test/xfs_test/
Filesystem     1K-blocks  Used Available Use% Mounted on
/dev/sdb1        5232640 32928   5199712   1% /test/xfs_test
[root@localhost ~]# df /test/ext4_test/
Filesystem     1K-blocks  Used Available Use% Mounted on
/dev/sdb2        6061632 24568   5706108   1% /test/ext4_test
```

###### 挂载目录 mount  --bind dirname target_dirname
```
[root@localhost ~]# mkdir -p /test/var
[root@localhost ~]# mount --bind /test/var/ /test/xfs_test/

[root@localhost ~]# ls -lid /test/var/ /test/xfs_test/
34108202 drwxr-xr-x. 2 root root 6 Sep  8 10:35 /test/var/
34108202 drwxr-xr-x. 2 root root 6 Sep  8 10:35 /test/xfs_test/

[root@localhost ~]# touch /test/var/a.txt
[root@localhost ~]# ls /test/xfs_test/
a.txt
```

###### 卸载 umount device | mountpoint
```
[root@localhost ~]# umount /dev/sdb1
[root@localhost ~]# umount /dev/sdb2

[root@localhost ~]# lsblk /dev/sdb
NAME   MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
sdb      8:16   0  20G  0 disk 
├─sdb1   8:17   0   5G  0 part 
└─sdb2   8:18   0   6G  0 part 
```
此时挂载点已经消失，即卸载成功。


## 设置开机挂载
我们上面讨论整个挂载的流程，磁盘分区也顺其自然成功挂载上去了，一切看起来都很完美了！

不过，这里还有一个坑爹的地方，就是上面的所有操作都是临时有效的，当机器重启之后，我们需要重新进行挂载。

那么可不可以在开机的时候就将我要的文件系统都挂好呢？当然可以啰！那就直接到 `/etc/fstab` 里面去修改就行啰！

```
[root@localhost ~]# vim /etc/fstab
/dev/mapper/centos-root /                       xfs     defaults        0 0
UUID=c225904f-a210-43cc-8c8c-e210642262f6 /boot                   xfs     defaults        0 0
/dev/mapper/centos-home /home                   xfs     defaults        0 0
/dev/mapper/centos-var  /var                    xfs     defaults        0 0
/dev/mapper/centos-swap swap                    swap    defaults        0 0
/dev/sdb1               /test/xfs_test          xfs     defaults        0 0
/dev/sdb2               /test/ext4_test         ext4     defaults        0 0
```

```
[root@localhost ~]# reboot
[root@localhost ~]# lsblk /dev/sdb
NAME   MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
sdb      8:16   0  20G  0 disk 
├─sdb1   8:17   0   5G  0 part /test/xfs_test
└─sdb2   8:18   0   6G  0 part /test/ext4_test
```


