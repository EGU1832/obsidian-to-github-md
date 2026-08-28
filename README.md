<p align="center">
  <a href="https://grapeve12.github.io/obsidian-to-github-md/">
    <img src="icon.png" alt="Obsidian to GitHub Markdown Converter Icon" width="180" height="180" style="border-radius: 20px;">
  </a>
</p>

<h3 align="center">Obsidian to GitHub Markdown Converter</h3>

<p align="center">
  Convert and preview Obsidian-flavored Markdown<br>
  in a live GitHub-style viewer — with LaTeX, code highlighting, and safe rendering.<br><br>
  <b>v2.1.1 (Release)</b>
  <br>
  <a href="https://grapeve12.github.io/obsidian-to-github-md/"><strong>Open Live Demo »</strong></a>
  <br><br>
  <a href="https://github.com/grapeve12/obsidian-to-github-md/issues/new?labels=bug&template=bug_report.yml">Report bug</a>
  ·
  <a href="https://github.com/grapeve12/obsidian-to-github-md/issues/new?labels=enhancement&template=feature_request.yml">Request feature</a>
</p>

---

## Demo

<p align="center">
  <img src="demo.gif" alt="obsidian-to-github-md Demo" width="800">
</p>


## Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![MathJax](https://img.shields.io/badge/MathJax-1A1A1A?style=for-the-badge&logo=latex&logoColor=white)
![Highlight.js](https://img.shields.io/badge/Highlight.js-FFB000?style=for-the-badge&logo=javascript&logoColor=white)
![Markdown-it](https://img.shields.io/badge/Markdown_it-000000?style=for-the-badge&logo=markdown&logoColor=white)


## Directory Structure
```
obsidian-to-github-md/
├── README.md          /* Project info and usage */
├── index.html         /* Main page layout */
├── style.css          /* UI styling and theme */
├── app.js             /* Core conversion + rendering logic */
├── icon.png           /* App icon */
└── Docs/              /* Image assets used in Markdown examples */

```

## Features
- Convert **Obsidian Markdown** to **GitHub-flavored Markdown (GFM)**.
- Live **GitHub-style preview** with synced code and LaTeX rendering.
- **MathJax** rendering for `$...$` and `$$...$$` blocks.
- Code highlighting powered by **Highlight.js**.
- Adjustable **split view** with draggable divider.
- Safe rendering using **DOMPurify** to prevent XSS.
- Lightweight, **client-side only** — no server or backend needed.

## Conversion Rules

### Image Conversion
Convert Obsidian-style embedded image syntax:
```
![600](Image_URL)
```
→  
```html
![600](https://... .png)
![600](../../Your_Image_folder/Image_name.png)
```
  
Later, you have to organize the Img folder like below:
```
Your_Folder/
├── github_notes/          /* .md Notes for Github */
├── obsidian_notes         /* .md Notes of Obsidian */
└── Docs/                  /* Image files Refered in Notes */
```

### LaTeX Math Conversion

Display and inline math are automatically parsed and rendered:
```
$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

$a^2 + b^2 = c^2$
```


## Usage

1. Open [**Live Demo**](https://grapeve12.github.io/obsidian-to-github-md/).
2. Click **📂 Upload** to import your `.md` file.
3. Review and edit converted text in the left editor.
4. Press **🔄 다시 컴파일하기** to render the preview.
5. Optionally, download the converted Markdown file.

## Security

All file processing happens **entirely in your browser**.
No Markdown or image data is uploaded anywhere — full local privacy.


## License

MIT License — free for personal, academic, and educational use.
