#!/bin/bash
set -e

echo "Packaging Chrome extension..."

mkdir -p build
rm -f build/extension.zip

for file in manifest.json config.js content.js icons/icon128.png; do
  if [ ! -f "$file" ]; then
    echo "Error: Missing $file"
    exit 1
  fi
done

zip -r build/extension.zip manifest.json config.js content.js icons/

echo "Done! Contents:"
unzip -l build/extension.zip
