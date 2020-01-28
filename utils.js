const spawn = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

var questions = [
  {
    type: 'input',
    name: 'dirPath',
    message: "请输入导入源markdown文件目录：",
    default: function() {
        return 'C:\\home\\study\\blog\\blog-asset\\markdown';
    }
  }
];

inquirer.prompt(questions).then(answers => {
    const { dirPath } = answers;
    fs.pathExists(dirPath).then(exists => {
        if (exists) {
            exec(dirPath)
        } else {
            console.error('文件目录不存在！')
        }
    })
    .catch(err => {
        console.error(err)
    })
});

function exec(dirPath) {
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error(err);
        } else {
            files.forEach((filename, index) => {
                const name = createFile(filename);
                fs.readFile(path.resolve(dirPath, filename), 'utf-8', (err, data) => {
                    if (err) {
                        console.warn(err)
                    } else {
                        try {
                            appendContent(path.resolve(__dirname, './source/_posts', name), data)
                        } catch (error) {
                            console.warn(error)
                        }
                    }
                })  
            })
        }
    })
}

function appendContent(filepath, data) {
    console.log(filepath)
    fs.appendFile(filepath, data, (err, ret) => {
        if (err) {
          console.warn(err)
        } else {
            try {
                console.info('生成文件成功！')
            } catch (error) {
                console.warn(error)
            }
        }
    })  
}

function createFile(name) {
    name = name.split('.')[0].trim();
    const filename = name.replace(/[()（）@#$&*\s]/g, '-').replace(/-+(?!$)/g, '-').trim().replace(/-+$/g, '');
    const result = spawn.sync('hexo', ['new', 'post', filename], { stdio: 'inherit' });
    return filename + '.md';
}
