# Obsidian2Github
Change Obsidian Markdown files to fit the GitHub view

## 🔧 Tech Stack

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white)![LaTeX](https://img.shields.io/badge/LaTeX-008080?style=for-the-badge&logo=latex&logoColor=white)

## 📁 Directory Structure

``` plaintext
Obsidian2Github/
├── github_notes/          /* .md Notes for Github */
├── obsidian_notes         /* .md Notes of Obsidian */
├── Docs/                  /* Image files Refered in Notes */
├── obsidian2github.py     /* Macro Application */
└── README.md              /* README */
```

## 📢 Markdown Syntax Recognition

When using this macro, be aware that your `.md` Obsidian Notes should adhere to some of the following grammar.

### (1) Image Insertion

The image insertion syntax should follow the following form and follow the **relative path** when referring to local images.
```
![{Image_size}](Image_URL)

e.g.

![300](https://... .png)
![300](../../Your_Image_folder/Image_name.png)
```

### (2) Formula

The formula syntax must follow **Latex** and form the following formula structure.
```
$${Latex_formula}$$
${Latex_formula}$

e.g.

$$
\begin{align}
\text{Newton's Second Law} \\
F = ma
\end{align}
$$

$1 + 1 = 2$
```

## 🚀 Execution

### 1️⃣ Folder Setting

Please organize the folder and add `obsidian2github.py` as follows.
``` plaintext
Your_Folder/
├── github_notes/          /* .md Notes for Github */
├── obsidian_notes         /* .md Notes of Obsidian */
├── Docs/                  /* Image files Refered in Notes */
└── obsidian2github.py     /* Macro Application */
```

### 2️⃣ Move Files

1. `obsidian_note/`: Copy or move your `.md` Obsidian Notes.
2. `Docs/`: Copy or move the images that the notes refer to.

### 3️⃣ Execution

Run the macro using the following command.
```
python obsidian2github.py
```
