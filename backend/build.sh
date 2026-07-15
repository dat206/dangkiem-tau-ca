#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing pip dependencies..."
pip install -r requirements.txt

# Download static 7z binary if it doesn't exist
if [ ! -f "7zz" ]; then
    echo "Downloading static 7z binary..."
    curl -L -o 7z.tar.xz https://www.7-zip.org/a/7z2301-linux-x64.tar.xz
    tar -xf 7z.tar.xz 7zz
    chmod +x 7zz
    rm 7z.tar.xz
    echo "Static 7z binary downloaded successfully."
else
    echo "7zz already exists, skipping download."
fi
