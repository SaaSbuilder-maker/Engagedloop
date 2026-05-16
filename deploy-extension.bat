@echo off
echo Creating Chrome Extension ZIP for Web Store...
cd extension
powershell -Command "Compress-Archive -Path * -DestinationPath ..\engagedloop-extension.zip -Force"
cd ..
echo.
echo ✅ Extension ZIP created: engagedloop-extension.zip
echo.
echo Next steps:
echo 1. Go to https://chrome.google.com/webstore/devconsole
echo 2. Click "New Item"
echo 3. Upload engagedloop-extension.zip
echo.
pause
