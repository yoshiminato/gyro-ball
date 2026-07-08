### p5js用ビルド方法

古い構文でビルドしなおす必要あり
p5jsのwebEditorでは最新構文は解釈できない

```bash
npx esbuild src/main.js \
  --bundle \
  --target=es2015 \
  --outfile=sketch.js
```