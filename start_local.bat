@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==================================================
echo   SignalFi - Web3 Intelligence Terminal
echo ==================================================
echo.
echo [1/2] 正在采集公开数据并生成页面数据...
python scripts\collect.py
if errorlevel 1 (
  echo.
  echo 采集过程出现问题，但页面仍可能使用演示快照。
  echo 请查看上方错误信息。
)
echo.
echo [2/2] 正在启动本地网站...
echo 浏览器地址： http://127.0.0.1:8000
echo 关闭此窗口即可停止网站。
echo.
start "" http://127.0.0.1:8000/
python -m http.server 8000 --bind 127.0.0.1
pause

