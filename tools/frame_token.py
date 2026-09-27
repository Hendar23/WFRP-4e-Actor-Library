"""Composite an existing square crop with the OMFG circular token frame.

Usage: python3 tools/frame_token.py input.png output.png
Requires Pillow. No image generation or retouching is performed.
"""

from argparse import ArgumentParser
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
FRAME = ROOT / "art/frames/OMFG_Tokenizer_v12_07.png"


def frame_token(source: Path, destination: Path) -> None:
    border = Image.open(FRAME).convert("RGBA")
    if border.size != (400, 400):
        raise ValueError("The OMFG frame must be 400 by 400 pixels")

    artwork = Image.open(source).convert("RGBA")
    if artwork.width != artwork.height:
        raise ValueError("Crop the artwork to a square before applying the frame")
    artwork = artwork.resize(border.size, Image.Resampling.LANCZOS)

    # Supersampling gives the circular cutout smooth edges while preserving
    # the source image and the supplied frame as separate layers.
    mask = Image.new("L", (1600, 1600), 0)
    ImageDraw.Draw(mask).ellipse((68, 68, 1532, 1532), fill=255)
    mask = mask.resize(border.size, Image.Resampling.LANCZOS)

    token = Image.new("RGBA", border.size, (0, 0, 0, 0))
    token.paste(artwork, (0, 0), mask)
    token = Image.alpha_composite(token, border)
    destination.parent.mkdir(parents=True, exist_ok=True)
    token.save(destination)


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Existing square artwork crop")
    parser.add_argument("destination", type=Path, help="Framed PNG to write")
    args = parser.parse_args()
    frame_token(args.source, args.destination)
