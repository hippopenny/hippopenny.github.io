import os
import re

def update_markdown_titles(directory):
    for filename in os.listdir(directory):
        # print(filename)
        if filename.endswith(".md"):
            file_path = os.path.join(directory, filename)
            print(filename)
            permalink_match = re.match(r'\d{4}-\d{2}-\d{2}-(.+)\.md', filename)
            print(permalink_match)
            if permalink_match:
                game_title_kebab = permalink_match.group(1)
                game_title_words = game_title_kebab.replace('-', ' ').title()
                new_title = f"{game_title_words} by Hippo Penny Deep View!"
                
                with open(file_path, 'r') as file:
                    content = file.read()
                
                updated_content = re.sub(r'title: Game Scores By HippoPenny AI', f'title: {new_title}', content)

                with open(file_path, 'w') as file:
                    file.write(updated_content)
                print(f"Updated title in {filename} to: {new_title}")

if __name__ == "__main__":
    scores_directory = "."
    update_markdown_titles(scores_directory)
