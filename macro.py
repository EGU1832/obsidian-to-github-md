import os
import re
import urllib.parse

# Detect LaTeX block positions
def find_latex_blocks(content: str):
    blocks = []
    for match in re.finditer(r'\${1,2}.*?\${1,2}', content, flags=re.DOTALL):
        blocks.append((match.start(), match.end()))
    return blocks

# Detect code block positions
def find_code_block_ranges(content: str):
    ranges = []
    for match in re.finditer(r'```.*?\n(.*?)```', content, flags=re.DOTALL):
        ranges.append((match.start(1), match.end(1)))
    return ranges

# Check whether a specific index is inside any block
def is_inside_blocks(index: int, blocks: list):
    return any(start <= index < end for start, end in blocks)

# Add line breaks
def add_line_breaks(content: str) -> str:
    latex_blocks = find_latex_blocks(content)
    code_blocks = find_code_block_ranges(content)

    lines = content.split('\n')
    new_lines = []
    current_index = 0

    for i, line in enumerate(lines):
        line_len = len(line) + 1
        next_line = lines[i + 1] if i + 1 < len(lines) else ''

        if is_inside_blocks(current_index, latex_blocks) or is_inside_blocks(current_index, code_blocks):
            new_lines.append(line)
        else:
            if line.strip() == '' or next_line.strip().startswith('$$') or next_line.strip().startswith('$'):
                new_lines.append(line + '\n<br>\n')
            else:
                new_lines.append(line + '  ')  # Force line break

        current_index += line_len

    return '\n'.join(new_lines)

# Transform LaTeX blocks
def transform_latex_blocks(content: str) -> str:
    # $$...$$ → ```math ... ```
    def transform_display_math(match):
        inner = match.group(1).strip()
        return f"\n```math\n{inner}\n```\n"

    content = re.sub(r'\$\$(.*?)\$\$', transform_display_math, content, flags=re.DOTALL)

    # $...$ → $`...`$
    def transform_inline_math(match):
        inner = match.group(1)
        return f"$`{inner}`$"

    content = re.sub(r'(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)', transform_inline_math, content, flags=re.DOTALL)

    return content

# Transform image syntax
def convert_image_syntax(content: str) -> str:
    def replace_image(match):
        width = match.group(1)
        full_path = match.group(2)

        # If it's an absolute URL, use as is
        if full_path.startswith('http://') or full_path.startswith('https://'):
            return f'<img src="{full_path}" width="{width}">\n'

        # Only modify if it's a local file path
        decoded_path = urllib.parse.unquote(full_path)   # %20 → space
        filename = os.path.basename(decoded_path)         # e.g., image.png
        new_path = f"Docs/{filename}"
        return f'<img src="{new_path}" width="{width}">\n'

    return re.sub(r'!\[(\d+)\]\((.*?)\)', replace_image, content)

# Remove tabs outside code blocks
def remove_tabs_outside_codeblocks(content: str) -> str:
    code_block_ranges = find_code_block_ranges(content)

    result = []
    index = 0
    while index < len(content):
        inside = is_inside_blocks(index, code_block_ranges)

        if inside:
            result.append(content[index])
        else:
            result.append('' if content[index] == '\t' else content[index])

        index += 1

    return ''.join(result)

# Full conversion function
def convert_obsidian_to_github_md(content: str) -> str:
    content = add_line_breaks(content)
    content = transform_latex_blocks(content)
    content = convert_image_syntax(content)
    content = remove_tabs_outside_codeblocks(content)
    return content

# File-level conversion
def convert_file(input_path: str, output_path: str):
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    converted = convert_obsidian_to_github_md(content)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(converted)

    print(f"Converted: {input_path} → {output_path}")

# Batch conversion for a folder
def convert_folder(input_dir: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    for filename in os.listdir(input_dir):
        if filename.endswith('.md'):
            convert_file(os.path.join(input_dir, filename),
                         os.path.join(output_dir, filename))

# Example execution
if __name__ == '__main__':
    convert_folder('obsidian_notes', 'github_notes')
