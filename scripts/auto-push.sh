#!/bin/bash
# 自动推送更新到Gitee仓库脚本

echo "开始推送更新到Gitee仓库..."

# 添加所有更改的文件
git add .

# 提交更改
git commit -m "Auto update: $(date '+%Y-%m-%d %H:%M:%S')"

# 推送到Gitee
git push gitee master

echo "推送完成！"