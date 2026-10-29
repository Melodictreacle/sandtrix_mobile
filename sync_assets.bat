@echo off
setlocal
cd /d "%~dp0"
echo Syncing web assets to Android project assets...
copy /y index.html android\app\src\main\assets\
copy /y style.css android\app\src\main\assets\
copy /y sand_engine.js android\app\src\main\assets\
copy /y audio.js android\app\src\main\assets\
copy /y app.js android\app\src\main\assets\
copy /y manifest.json android\app\src\main\assets\
copy /y sw.js android\app\src\main\assets\
copy /y icon-192.png android\app\src\main\assets\
copy /y icon-512.png android\app\src\main\assets\
echo Assets synced successfully!
