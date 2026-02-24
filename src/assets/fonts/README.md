# Пользовательские шрифты

Поместите файлы ваших шрифтов (например, `.woff2`, `.ttf`) в эту папку.

Затем добавьте следующее в `src/index.css`:

```css
@font-face {
  font-family: 'MyFontName';
  src: url('./assets/fonts/MyFontFile.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}
```
