from pathlib import Path
from PIL import Image

image_dir = Path("public/images")
for path in image_dir.glob("*.jpg"):
    with Image.open(path) as image:
        image = image.convert("RGB")
        if image.width > 1400:
            ratio = 1400 / image.width
            image = image.resize((1400, round(image.height * ratio)), Image.Resampling.LANCZOS)
        image.save(path, "JPEG", quality=82, optimize=True, progressive=True)
        print(f"optimized {path}: {image.width}x{image.height}")
