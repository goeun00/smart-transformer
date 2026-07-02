<p align="center">
  <img src="https://raw.githubusercontent.com/goeun00/smart-transformer/main/images/mascot.png" width="450" alt="Smart Transformer otter mascot" />
</p>

<h1 align="center">🧃 Smart Transformer</h1>

<p align="center">
  클립보드 텍스트, 파일 경로, 선택 영역을 원하는 코드 형태로 바꿔주는 VS Code 확장입니다.
</p>

---

## ✨ 주요 기능

| 기능                | 설명                                                      |
| ------------------- | --------------------------------------------------------- |
| **Smart Paste**     | 클립보드 내용을 규칙에 맞게 변환해서 붙여넣습니다.        |
| **Smart Transform** | 선택한 텍스트를 규칙에 맞게 바로 변환합니다.              |
| **Regex rules**     | `find`, `replace`, `flags` 기반으로 자유롭게 변환합니다.  |
| **Relative path**   | 현재 열려 있는 파일 기준으로 상대 경로를 자동 계산합니다. |
| **CSS sort**        | 선택한 CSS/SCSS 선언부를 사용자 지정 순서대로 정렬합니다. |

---

## ⌨️ 사용 방법

| 명령              | 단축키                                            | 사용 상황                         |
| ----------------- | ------------------------------------------------- | --------------------------------- |
| `Smart Paste`     | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | 클립보드 텍스트/경로 변환 후 삽입 |
| `Smart Transform` | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> | 선택 영역을 변환하여 교체         |

우클릭 메뉴에서도 실행할 수 있습니다.

```txt
Smart Paste
Smart Transform
```

---

## ⚙️ 기본 설정

VS Code의 `settings.json`에서 규칙을 설정합니다.

```json
"smartTransformer.rules": {
  "Component import": {
    "find": "\\.(astro|jsx|tsx|js|ts|mjs|cjs)$",
    "replace": "import {{pascalName}} from '{{relativePathAuto}}';",
    "flags": "i",
    "mode": "template"
  },
  "Style import": {
    "find": "\\.(css|scss|sass|less)$",
    "replace": "import '{{relativePath}}';",
    "flags": "i",
    "mode": "template"
  },
  "줄바꿈 → li": {
    "find": "^(.+)$",
    "replace": "<li>$1</li>",
    "flags": "gm"
  },
  "CSS declaration sort": {
    "find": ".*",
    "replace": "",
    "flags": "s",
    "mode": "cssSort",
    "when":["css"]
  }
}
```

객체의 key가 Quick Pick에 표시되는 이름입니다.

```json
"줄바꿈 → li": {}
```

위처럼 설정하면 선택창에는 `줄바꿈 → li`만 표시됩니다.

---

## 🧩 Component import

`{{relativePathAuto}}`는 JS/TS 계열 확장자는 제거하고, Astro처럼 확장자가 필요한 파일은 유지합니다.

```json
"Component import": {
  "find": "\\.(astro|jsx|tsx|js|ts|mjs|cjs)$",
  "replace": "import {{pascalName}} from '{{relativePathAuto}}';",
  "flags": "i",
  "mode": "template"
}
```

| 복사한 경로                       | 결과                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| `src/components/include-test.jsx` | `import IncludeTest from './include-test';`                |
| `src/components/ReturnInfo.astro` | `import ReturnInfo from '../components/ReturnInfo.astro';` |

---

## 🎨 Style import

```json
"Style import": {
  "find": "\\.(css|scss|sass|less)$",
  "replace": "import '{{relativePath}}';",
  "flags": "i",
  "mode": "template"
}
```

```js
import "./button.scss";
```

---

## 🧹 CSS declaration sort

선택 영역 안의 CSS/SCSS 선언을 `smartTransformer.cssPropertyOrder` 순서대로 정렬합니다.
(! 선언부만 선택하거나 블록 전체를 선택해 주세요 )
기본적으로 아래 순서를 사용하며, 필요하면 `settings.json`에서 자유롭게 변경할 수 있습니다.

```json
"smartTransformer.cssPropertyOrder": [
  "display",
  "visibility",
  "overflow",
  "overflow-x",
  "overflow-y",
  "opacity",
  "content",
  "float",
  "clear",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "box-sizing",
  "max-width",
  "width",
  "min-width",
  "max-height",
  "height",
  "min-height",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border",
  "border-width",
  "border-style",
  "border-color",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-radius",
  "background",
  "background-color",
  "background-image",
  "background-position",
  "background-repeat",
  "background-size",
  "font-size",
  "font-weight",
  "font-style",
  "font-family",
  "color",
  "line-height",
  "letter-spacing",
  "white-space",
  "word-break",
  "vertical-align",
  "text-align",
  "text-decoration",
  "text-overflow",
  "transform",
  "transform-origin",
  "transition",
  "transition-property",
  "transition-duration",
  "transition-timing-function",
  "transition-delay",
  "flex",
  "flex-direction",
  "flex-shrink",
  "flex-wrap",
  "justify-content",
  "align-items"
]
```

선택 전:

```scss
.box {
  color: #000;
  display: flex;
  margin-top: 10px;
  position: relative;

  @media (min-width: 768px) {
    margin: 0;
    position: sticky;
  }

  .child {
    color: red;
    display: block;
  }
}
```

`Smart Transform` → `CSS declaration sort` 선택 후:

```scss
.box {
  display: flex;
  position: relative;
  margin-top: 10px;
  color: #000;

  @media (min-width: 768px) {
    position: sticky;
    margin: 0;
  }

  .child {
    display: block;
    color: red;
  }
}
```

> `smartTransformer.cssPropertyOrder`에 포함된 속성은 설정한 순서대로 정렬됩니다.  
> 목록에 없는 속성은 기존 순서를 유지한 채 뒤쪽에 배치됩니다.

---

## 🔍 find / replace / flags / mode / when

| 옵션      | 설명                                                                                       |
| --------- | ------------------------------------------------------------------------------------------ |
| `find`    | 매칭할 JavaScript 정규식 문자열입니다.                                                     |
| `replace` | 변환 결과입니다. `$1`, `$2` 같은 캡처와 `{{relativePath}}` 같은 변수를 사용할 수 있습니다. |
| `flags`   | `g`, `i`, `m`, `s`, `u` 같은 정규식 플래그입니다.                                          |
| `mode`    | `replace`, `template`, `cssSort` 중 하나를 사용합니다.                                     |
| `when`    | 규칙을 Quick Pick에 표시할 컨텍스트입니다. `always`, `css`를 사용할 수 있습니다.           |

### mode

| mode       | 용도                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| `replace`  | 원본 텍스트에서 `find`에 매칭된 부분을 `replace`로 치환합니다.                     |
| `template` | `find`는 매칭 여부만 확인하고, `replace` 전체를 새로운 결과로 생성합니다.          |
| `cssSort`  | 선택 영역의 CSS 선언 순서를 `smartTransformer.cssPropertyOrder`에 맞춰 정렬합니다. |

### when

| when                | 표시 조건                                                                           |
| ------------------- | ----------------------------------------------------------------------------------- |
| `always`            | 항상 Quick Pick에 표시합니다.                                                       |
| `css`               | CSS/SCSS/Sass/Less 파일 또는 HTML/Astro/Vue/Svelte의 `<style>` 안에서만 표시합니다. |
| `astro`,`html`, ... | astro/html 등 원하는 파일 형식에서만 표시합니다.                                    |

예를 들어 CSS 정렬 기능은 CSS 영역에서만 보이게 설정할 수 있습니다.

```json
"CSS declaration sort": {
  "find": ".*",
  "replace": "",
  "flags": "s",
  "mode": "cssSort",
  "when": "css"
}
```

---

## 🧪 사용할 수 있는 변수

| 변수                    | 설명                                                            |
| ----------------------- | --------------------------------------------------------------- |
| `{{text}}`              | 클립보드 원본 텍스트 또는 선택한 원본 텍스트                    |
| `{{path}}`              | 따옴표 제거, 슬래시 정리 등이 적용된 원본 경로                  |
| `{{pathNoExt}}`         | `{{path}}`에서 확장자를 제거한 값                               |
| `{{relativePath}}`      | 현재 파일 기준 상대 경로                                        |
| `{{relativePathNoExt}}` | `{{relativePath}}`에서 확장자를 제거한 값                       |
| `{{relativePathAuto}}`  | JS/TS 계열은 확장자 제거, 그 외 확장자는 유지                   |
| `{{name}}`              | 확장자를 제외한 파일명                                          |
| `{{pascalName}}`        | `{{name}}`을 PascalCase로 변환 (`include-test` → `IncludeTest`) |
| `{{fileName}}`          | 확장자를 포함한 파일명                                          |
| `{{ext}}`               | 점 없는 확장자 (`jsx`)                                          |
| `{{extWithDot}}`        | 점이 포함된 확장자 (`.jsx`)                                     |
| `{{dir}}`               | 원본 경로의 폴더                                                |
| `{{currentPath}}`       | 현재 열려 있는 파일의 전체 경로                                 |
| `{{currentDir}}`        | 현재 열려 있는 파일의 폴더                                      |

---

## 🎛️ 추가 옵션

### 매칭되는 규칙만 표시

```json
"smartTransformer.showOnlyMatchedRules": true
```

`false`로 변경하면 모든 규칙을 표시합니다.

### 선택 취소 시 일반 붙여넣기

```json
"smartTransformer.fallbackToPlainPaste": true
```

Smart Paste에서 규칙 선택을 취소했을 때 클립보드 텍스트를 그대로 삽입합니다. Smart Transform에는 적용되지 않습니다.

---

## 📄 License

MIT
