#!/usr/bin/env python3
from pathlib import Path
from PIL import Image

THUMBS_DIR = Path(__file__).resolve().parents[1] / "public" / "emperors" / "thumbs"


def is_transparent(im):
    return im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)


def pad_to_square(path: Path):
    with Image.open(path) as im:
        w, h = im.size
        if w == h:
            return False

        size = max(w, h)
        if is_transparent(im):
            background = (0, 0, 0, 0)
            canvas = Image.new("RGBA", (size, size), background)
        else:
            background = (255, 255, 255)
            canvas = Image.new("RGB", (size, size), background)

        # Portrait: center horizontally, align to top to avoid cutting heads
        if h > w:
            x = (size - w) // 2
            y = 0
        # Landscape: center vertically and horizontally
        else:
            x = (size - w) // 2
            y = (size - h) // 2

        if canvas.mode == "RGBA" and im.mode != "RGBA":
            im = im.convert("RGBA")
        canvas.paste(im, (x, y))

        # Preserve original format
        canvas.save(path)
        return True


def main():
    updated = 0
    for path in sorted(THUMBS_DIR.iterdir()):
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        if pad_to_square(path):
            updated += 1
    print("updated", updated)


if __name__ == "__main__":
    main()
