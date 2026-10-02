"""Compress store photos and build a 1200x630 PNG social preview."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / "public" / "images" / "store"
OG_PATH = ROOT / "public" / "og-image.png"

MAX_WIDTH = {
    "hero.jpg": 1920,
    "interior.jpg": 1600,
}
DEFAULT_MAX = 1400
JPEG_QUALITY = 80


def compress_jpegs():
    for path in sorted(STORE.glob("*.jpg")):
        with Image.open(path) as im:
            im = im.convert("RGB")
            max_w = MAX_WIDTH.get(path.name, DEFAULT_MAX)
            if im.width > max_w:
                ratio = max_w / im.width
                im = im.resize((max_w, int(im.height * ratio)), Image.Resampling.LANCZOS)
            im.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            webp = path.with_suffix(".webp")
            im.save(webp, "WEBP", quality=78, method=6)
            print(
                f"compressed {path.name}: {path.stat().st_size // 1024} KB "
                f"/ {webp.name} {webp.stat().st_size // 1024} KB ({im.size[0]}x{im.size[1]})"
            )


def font(size, bold=True):
    names = [
        "segoeuib.ttf" if bold else "segoeui.ttf",
        "arialbd.ttf" if bold else "arial.ttf",
        "calibrib.ttf" if bold else "calibri.ttf",
    ]
    # Platform-appropriate font locations
    candidates = []
    if Path("C:/Windows/Fonts").exists():
        candidates.extend([Path(r"C:\Windows\Fonts") / name for name in names])
    elif Path("/System/Library/Fonts").exists():
        candidates.extend([Path(r"/System/Library/Fonts") / name for name in names])
        candidates.extend([Path(r"/Library/Fonts") / name for name in names])
    else:
        # Common Linux fontconfig paths
        candidates.extend([Path(r"/usr/share/fonts") / name for name in names])
        candidates.extend([Path(r"/usr/local/share/fonts") / name for name in names])
        candidates.extend([Path.home() / ".fonts" / name for name in names])
    
    # Try each candidate
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    
    # Fallback to default font with size-aware API when possible
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def cover_crop(im, width, height):
    src_ratio = im.width / im.height
    dest_ratio = width / height
    if src_ratio > dest_ratio:
        new_w = int(im.height * dest_ratio)
        left = (im.width - new_w) // 2
        im = im.crop((left, 0, left + new_w, im.height))
    else:
        new_h = int(im.width / dest_ratio)
        # Bias upward so the storefront sign stays in frame
        top = max(0, int((im.height - new_h) * 0.18))
        im = im.crop((0, top, im.width, top + new_h))
    return im.resize((width, height), Image.Resampling.LANCZOS)


def build_og():
    with Image.open(STORE / "hero.jpg") as hero:
        canvas = cover_crop(hero.convert("RGB"), 1200, 630)

    darkened = ImageEnhance.Brightness(canvas).enhance(0.62)
    overlay = Image.new("RGBA", (1200, 630), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(630):
        alpha = int(90 + (140 * (y / 629)))
        draw.line([(0, y), (1199, y)], fill=(20, 20, 24, alpha))
    canvas = Image.alpha_composite(darkened.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(canvas)

    red = (201, 0, 25)
    white = (255, 255, 255)
    cream = (247, 241, 231)

    draw.rounded_rectangle((64, 72, 430, 122), radius=22, fill=red)
    badge_font = font(22, bold=True)
    draw.text((86, 84), "SAGO GAS BAR PARTNER", font=badge_font, fill=white)

    title_font = font(78, bold=True)
    draw.text((64, 170), "L&M ENTERPRISES", font=title_font, fill=white)

    draw.rectangle((64, 278, 220, 286), fill=red)

    sub_font = font(34, bold=True)
    draw.text((64, 314), "Gas & Convenience", font=sub_font, fill=cream)

    detail_font = font(26, bold=False)
    draw.text((64, 372), "Deseronto, ON  ·  Tyendinaga Mohawk Territory", font=detail_font, fill=cream)
    draw.text((64, 420), "43 Dundas Street  ·  Open 6am–10pm daily", font=detail_font, fill=cream)

    draw.rounded_rectangle((64, 500, 520, 556), radius=12, fill=red)
    cta_font = font(24, bold=True)
    draw.text((86, 514), "Guaranteed lower gas prices", font=cta_font, fill=white)

    canvas.save(OG_PATH, "PNG", optimize=True)
    print(f"wrote {OG_PATH.name}: {OG_PATH.stat().st_size // 1024} KB")


if __name__ == "__main__":
    compress_jpegs()
    build_og()
