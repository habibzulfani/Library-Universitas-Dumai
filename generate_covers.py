#!/usr/bin/env python3
"""
Script to generate placeholder cover images for books and papers
"""

from PIL import Image, ImageDraw, ImageFont
import os
import mysql.connector
from mysql.connector import Error


def create_cover_image(title, filename, width=400, height=600, bg_color=(52, 73, 94), text_color=(255, 255, 255)):
    """Create a placeholder cover image with the given title"""
    
    # Create image
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to basic if not available
    try:
        # Try to use a system font
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
        small_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 16)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Calculate text position (center)
    bbox = draw.textbbox((0, 0), title, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # Draw title (with word wrapping)
    words = title.split()
    lines = []
    current_line = []
    
    for word in words:
        current_line.append(word)
        test_line = ' '.join(current_line)
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] > width - 40:  # 20px margin on each side
            if current_line:
                current_line.pop()
                lines.append(' '.join(current_line))
                current_line = [word]
    
    if current_line:
        lines.append(' '.join(current_line))
    
    # Draw lines
    line_height = text_height + 10
    total_height = len(lines) * line_height
    start_y = (height - total_height) // 2
    
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        line_width = bbox[2] - bbox[0]
        line_x = (width - line_width) // 2
        line_y = start_y + i * line_height
        draw.text((line_x, line_y), line, font=font, fill=text_color)
    
    # Add subtitle
    subtitle = "E-Repository"
    bbox = draw.textbbox((0, 0), subtitle, font=small_font)
    subtitle_width = bbox[2] - bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    subtitle_y = height - 50
    draw.text((subtitle_x, subtitle_y), subtitle, font=small_font, fill=text_color)
    
    # Save image
    img.save(filename, 'JPEG', quality=95)
    print(f"Created: {filename}")

def main():
    """Generate all cover images"""
    
    # Ensure covers directory exists
    covers_dir = "uploads/covers"
    os.makedirs(covers_dir, exist_ok=True)
    
    # Book covers
    books = [
        ("Clean Code", "clean_code_cover.jpg", (41, 128, 185)),
        ("Calculus", "calculus_cover.jpg", (155, 89, 182)),
        ("Database Concepts", "database_cover.jpg", (230, 126, 34)),
        ("Physics", "physics_cover.jpg", (231, 76, 60)),
        ("Test Book", "test_book_cover.jpg", (46, 204, 113))
    ]
    
    # Paper covers
    papers = [
        ("Database Optimization", "db_optimization_cover.jpg", (52, 152, 219)),
        ("Economic Growth", "economic_growth_cover.jpg", (26, 188, 156)),
        ("Renewable Energy", "renewable_energy_cover.jpg", (46, 204, 113)),
        ("Test Paper", "test_paper_cover.jpg", (155, 89, 182))
    ]
    
    print("Generating book covers...")
    for title, filename, color in books:
        filepath = os.path.join(covers_dir, filename)
        create_cover_image(title, filepath, bg_color=color)
    
    print("Generating paper covers...")
    for title, filename, color in papers:
        filepath = os.path.join(covers_dir, filename)
        create_cover_image(title, filepath, bg_color=color)
    
    print("All cover images generated successfully!")

def generate_missing_covers_from_db():
    """Generate placeholder covers for all missing cover images referenced in the DB, using the title as text."""
    db_config = {
        'host': 'localhost',
        'port': 3307,  # Docker MySQL port
        'user': 'root',
        'password': 'rootpassword',
        'database': 'e_repository_db',
    }
    covers_dir = "uploads/covers"
    os.makedirs(covers_dir, exist_ok=True)

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        # Get all cover image filenames and titles from books and papers
        queries = [
            ("SELECT title, cover_image_url FROM books WHERE cover_image_url IS NOT NULL AND cover_image_url != ''", "book"),
            ("SELECT title, cover_image_url FROM papers WHERE cover_image_url IS NOT NULL AND cover_image_url != ''", "paper"),
        ]
        missing = []
        for query, typ in queries:
            cursor.execute(query)
            for title, cover_url in cursor.fetchall():
                if not cover_url:
                    continue
                # Normalize path
                if cover_url.startswith("/uploads/covers/"):
                    filename = cover_url[len("/uploads/covers/"):]
                else:
                    filename = os.path.basename(cover_url)
                filepath = os.path.join(covers_dir, filename)
                if not os.path.exists(filepath):
                    missing.append((title, filepath))
        if not missing:
            print("No missing cover images to generate!")
            return
        print(f"Generating {len(missing)} missing cover images...")
        for title, filepath in missing:
            create_cover_image(title, filepath)
        print("All missing cover images generated!")
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "db":
        generate_missing_covers_from_db()
    else:
        main() 