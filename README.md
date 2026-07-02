# 🧃 Smart Paste Transformer

클립보드에 복사한 텍스트나 파일 경로를 원하는 형태로 변환해서 붙여넣는 VS Code 확장입니다.

예를 들어 파일 경로를 복사한 뒤 `Ctrl + Shift + V`를 누르면, 중앙 상단 선택창(Quick Pick)에서 원하는 규칙을 고르고 아래처럼 변환할 수 있습니다.

```js
import RegisterTypeSelect from "./RegisterTypeSelect";
import ReturnInfo from "./ReturnInfo.astro";
import "./ad_manage.css";
```

텍스트 치환도 가능합니다.

```txt
사과
바나나
포도
```

↓

```html
<li>사과</li>
<li>바나나</li>
<li>포도</li>
```

---

# ✨ 주요 기능

- 클립보드 텍스트를 정규식으로 변환
- 중앙 상단 Quick Pick에서 규칙 제목만 보고 선택
- 규칙 이름을 사용자가 직접 설정 가능
- 정규식 `flags` 직접 설정 가능
- 현재 열려 있는 파일 기준 상대 경로 자동 계산
- `workspaces/...` 같은 상대 경로를 워크스페이스 기준으로 자동 보정
- `$1`, `$2` 같은 정규식 캡처 지원
- `{{relativePath}}`, `{{relativePathAuto}}`, `{{name}}` 등 다양한 템플릿 변수 지원
- 선택 영역이 있으면 변환 결과로 교체, 없으면 커서 위치에 삽입

---

# ⌨️ 사용 방법

1. 변환하고 싶은 텍스트나 파일 경로를 복사합니다.
2. 결과를 넣고 싶은 파일을 엽니다.
3. `Ctrl + Shift + V`를 누릅니다.
4. 중앙 상단 Quick Pick에서 원하는 규칙을 선택합니다.
5. 선택한 규칙대로 변환된 결과가 삽입됩니다.

우클릭 메뉴에서도 실행할 수 있습니다.

```txt
Smart Paste: Transform Paste
```

---

# ⚙️ 설정 구조

VS Code `settings.json`

```json
"smartPaste.rules": {
  "Component import": {
    "find": "\\.(astro|jsx|tsx|js|ts|mjs|cjs)$",
    "replace": "import {{name}} from '{{relativePathAuto}}';",
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
  }
}
```

객체의 **key**가 Quick Pick에 표시되는 이름입니다.

예를 들어

```json
"줄바꿈 → li": {}
```

처럼 설정하면 선택창에는

```txt
줄바꿈 → li
```

만 표시됩니다.

---

# 🧩 Component import

`{{relativePathAuto}}`를 사용하면 JS/TS 계열은 확장자를 제거하고 Astro는 확장자를 유지합니다.

```json
"Component import": {
  "find": "\\.(astro|jsx|tsx|js|ts|mjs|cjs)$",
  "replace": "import {{name}} from '{{relativePathAuto}}';",
  "flags": "i",
  "mode": "template"
}
```

React 예시

```txt
workspaces/src/components/gmarket-ad-center-new/ad_register/RegisterTypeSelect.jsx
```

↓

```js
import RegisterTypeSelect from "./RegisterTypeSelect";
```

Astro 예시

```txt
workspaces/src/components/mypage/OrderInfo/ReturnInfo.astro
```

↓

```js
import ReturnInfo from "../../components/mypage/OrderInfo/ReturnInfo.astro";
```

---

# 🎨 Style import

```json
"Style import": {
  "find": "\\.(css|scss|sass|less)$",
  "replace": "import '{{relativePath}}';",
  "flags": "i",
  "mode": "template"
}
```

↓

```js
import "./ad_manage.css";
```

---

# 🔍 find / replace / flags / mode

## find

찾을 정규식입니다.

```json
"find": "^(.+)$"
```

---

## replace

변환 결과입니다.

```json
"replace": "<li>$1</li>"
```

정규식 캡처를 사용할 수 있습니다.

```txt
$1
$2
$3
...
```

또한 Smart Paste에서 제공하는 변수도 사용할 수 있습니다.

```txt
{{text}}
{{path}}
{{relativePath}}
{{relativePathAuto}}
{{name}}
```

---

## flags

정규식 플래그입니다.

```json
"flags": "gm"
```

자주 사용하는 플래그

| 플래그 | 설명                                          |
| ------ | --------------------------------------------- |
| g      | 전체에서 반복 매칭                            |
| i      | 대소문자 무시                                 |
| m      | 여러 줄 모드 (`^`, `$`가 각 줄 기준으로 동작) |
| s      | 줄바꿈까지 `.`에 포함                         |
| u      | 유니코드 모드                                 |

---

## mode

`mode`는 변환 방식을 지정하는 옵션입니다.

### replace (기본값)

`find`에 매칭된 내용을 `replace` 값으로 치환합니다.

```json
"줄바꿈 → li": {
  "find": "^(.+)$",
  "replace": "<li>$1</li>",
  "flags": "gm"
}
```

예를 들어

```txt
사과
바나나
포도
```

↓

```html
<li>사과</li>
<li>바나나</li>
<li>포도</li>
```

처럼 **텍스트를 정규식으로 변환**할 때 사용합니다.

---

### template

`find`는 **규칙이 적용될지 판단하는 용도**로만 사용하고,

`replace` 문자열 전체를 새로운 결과로 생성합니다.

```json
"Component import": {
  "find": "\\.(astro|jsx|tsx|js|ts|mjs|cjs)$",
  "replace": "import {{name}} from '{{relativePathAuto}}';",
  "flags": "i",
  "mode": "template"
}
```

예를 들어

```txt
workspaces/src/components/mypage/OrderInfo/ReturnInfo.astro
```

↓

```js
import ReturnInfo from "../../components/mypage/OrderInfo/ReturnInfo.astro";
```

처럼 **새로운 문장을 생성**할 때 사용합니다.

| mode     | 용도                               |
| -------- | ---------------------------------- |
| replace  | 기존 텍스트를 정규식으로 치환      |
| template | 원본을 기반으로 새로운 문자열 생성 |

---

# 🧪 사용할 수 있는 변수

| 변수                    | 설명                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `{{text}}`              | 클립보드 원본 텍스트                                        |
| `{{path}}`              | 정리된 원본 경로                                            |
| `{{pathNoExt}}`         | 원본 경로 (확장자 제외)                                     |
| `{{relativePath}}`      | 현재 파일 기준 상대 경로                                    |
| `{{relativePathNoExt}}` | 상대 경로 (확장자 제외)                                     |
| `{{relativePathAuto}}`  | JS/TS는 확장자 제거, 그 외는 유지                           |
| `{{name}}`              | 파일명 (확장자 제외)                                        |
| `{{pascalName}}`        | 파일명을 PascalCase로 변환 (`include-test` → `IncludeTest`) |
| `{{fileName}}`          | 파일명 (확장자 포함)                                        |
| `{{ext}}`               | 확장자 (`jsx`)                                              |
| `{{extWithDot}}`        | 확장자 (`.jsx`)                                             |
| `{{dir}}`               | 원본 파일의 폴더                                            |
| `{{currentPath}}`       | 현재 열려 있는 파일의 전체 경로                             |
| `{{currentDir}}`        | 현재 열려 있는 파일의 폴더                                  |

---

# 🎛️ 추가 옵션

## 매칭되는 규칙만 표시

기본값

```json
"smartPaste.showOnlyMatchedRules": true
```

`false`로 변경하면 모든 규칙을 표시합니다.

---

## 선택 취소 시 일반 붙여넣기

기본값

```json
"smartPaste.fallbackToPlainPaste": true
```

Quick Pick을 취소하면 일반 붙여넣기처럼 클립보드 내용을 그대로 삽입합니다.

---

# 📄 License

MIT
