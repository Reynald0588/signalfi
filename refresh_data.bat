@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在采集并生成最新数据...
python scripts\collect.py
echo.
echo 完成。刷新浏览器即可看到更新后的数据。
pause
