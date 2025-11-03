@echo off
REM 自动推送更新到Gitee仓库脚本

echo 开始推送更新到Gitee仓库...

REM 添加所有更改的文件
git add .

REM 提交更改
git commit -m "Auto update: %date% %time%"

REM 推送到Gitee
git push gitee master

echo 推送完成！

pause