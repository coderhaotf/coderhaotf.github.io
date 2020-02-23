<!--
 * @Author: haotengfei
 * @Date: 2020-01-29 10:58:58
 * @LastEditors: haotengfei
 * @LastEditTime: 2020-02-23 21:28:39
 -->
# coderhaotf.github.io
博客开发分支

## 写作流程

#### 创建文章

```bash
$ hexo new [layout] <title>
```
Hexo 有三种默认布局：post、page 和 draft。在创建者三种不同类型的文件时，它们将会被保存到不同的路径；而您自定义的其他布局和 post 相同，都将储存到 source/_posts 文件夹。

|  布局   | 路径  |
|  ----  | ----  |
| post  | source/_posts |
| page  | source |
| draft  | source/_drafts |

> #### 不要处理我的文章
> 如果你不想你的文章被处理，你可以将 Front-Matter 中的layout: 设为 false 。

#### 草稿

刚刚提到了 Hexo 的一种特殊布局：draft，这种布局在建立时会被保存到 source/_drafts 文件夹，您可通过 publish 命令将草稿移动到 source/_posts 文件夹，该命令的使用方式与 new 十分类似，您也可在命令中指定 layout 来指定布局。

```bash
$ hexo publish [layout] <title>
```

草稿默认不会显示在页面中，您可在执行时加上 --draft 参数，或是把 render_drafts 参数设为 true 来预览草稿。

#### 模版（Scaffold）

在新建文章时，Hexo 会根据 scaffolds 文件夹内相对应的文件来建立文件，例如：

```bash
$ hexo new photo "My Gallery"
```

在执行这行指令时，Hexo 会尝试在 scaffolds 文件夹中寻找 photo.md，并根据其内容建立文章，以下是您可以在模版中使用的变量：

|  变量   | 描述  |
|  ----  | ----  |
| layout  | 布局 |
| title  | 标题 |
| date  | 创建日期 |

