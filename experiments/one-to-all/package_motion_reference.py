#!/usr/bin/env python3
"""Package native-rate One-to-All output frames as a review-only motion reference."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import cv2
from PIL import Image, ImageDraw


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def package_video(input_video: Path, output_dir: Path, *, reference_asset_id: str,
                  driving_video_id: str, model_id: str, checkpoint_id: str,
                  columns: int = 4, thumb_width: int = 256) -> dict:
    input_video = input_video.expanduser().resolve()
    output_dir = output_dir.expanduser().resolve()
    if not input_video.is_file():
        raise FileNotFoundError(f"Input video not found: {input_video}")
    if columns < 1 or columns > 8:
        raise ValueError("columns must be between 1 and 8")
    if thumb_width < 96 or thumb_width > 640:
        raise ValueError("thumb_width must be between 96 and 640")
    if output_dir.exists() and any(output_dir.iterdir()):
        raise FileExistsError(f"Output directory is not empty: {output_dir}")

    frames_dir = output_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    capture = cv2.VideoCapture(str(input_video))
    if not capture.isOpened():
        raise RuntimeError("OpenCV could not open the generated MP4")
    fps = float(capture.get(cv2.CAP_PROP_FPS))
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if not math.isfinite(fps) or fps <= 0 or width <= 0 or height <= 0:
        capture.release()
        raise RuntimeError("The MP4 has invalid native FPS or dimensions")

    frame_records = []
    thumbnails = []
    index = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            if frame is None or frame.size == 0:
                raise RuntimeError(f"Invalid decoded frame at index {index}")
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(rgb)
            filename = f"frame_{index:06d}.png"
            target = frames_dir / filename
            image.save(target, format="PNG", optimize=True)
            frame_records.append({
                "index": index,
                "timestamp_seconds": round(index / fps, 6),
                "file": f"frames/{filename}",
                "sha256": sha256_file(target),
            })
            scale = thumb_width / width
            thumb_height = max(1, round(height * scale))
            thumb = image.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
            thumbnails.append((index, thumb))
            index += 1
    finally:
        capture.release()

    if not frame_records:
        shutil.rmtree(output_dir, ignore_errors=True)
        raise RuntimeError("No frames were decoded from the MP4")

    label_h, pad = 24, 10
    cell_w, cell_h = thumb_width, thumbnails[0][1].height + label_h
    rows = math.ceil(len(thumbnails) / columns)
    sheet = Image.new("RGB", (columns * cell_w + (columns + 1) * pad,
                               rows * cell_h + (rows + 1) * pad), "white")
    draw = ImageDraw.Draw(sheet)
    for i, (frame_index, thumb) in enumerate(thumbnails):
        x = pad + (i % columns) * cell_w
        y = pad + (i // columns) * cell_h
        sheet.paste(thumb, (x, y))
        draw.text((x + 2, y + thumb.height + 4),
                  f"#{frame_index:06d}  {frame_index / fps:.3f}s", fill="black")
    sheet_path = output_dir / "contact_sheet.png"
    sheet.save(sheet_path, format="PNG", optimize=True)

    manifest = {
        "format": "zero-studio-motion-reference",
        "version": 1,
        "role": "motion-reference-not-final-art",
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "model_id": model_id,
        "checkpoint_id": checkpoint_id,
        "reference_asset_id": reference_asset_id,
        "driving_video_id": driving_video_id,
        "generated_video": {
            "filename": input_video.name,
            "sha256": sha256_file(input_video),
            "native_fps": fps,
            "width": width,
            "height": height,
            "frame_count": len(frame_records),
            "duration_seconds": round(len(frame_records) / fps, 6),
        },
        "frame_policy": "Extracted every decoded source frame at native rate; no interpolation, duplication, or FPS conversion.",
        "frames": frame_records,
        "contact_sheet": "contact_sheet.png",
    }
    manifest_path = output_dir / "motion_manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    archive_path = output_dir / "motion-reference-frames.zip"
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.write(manifest_path, "motion_manifest.json")
        archive.write(sheet_path, "contact_sheet.png")
        for record in frame_records:
            source = output_dir / record["file"]
            archive.write(source, record["file"])

    return {
        "output_dir": str(output_dir),
        "frame_count": len(frame_records),
        "native_fps": fps,
        "width": width,
        "height": height,
        "duration_seconds": round(len(frame_records) / fps, 6),
        "manifest": str(manifest_path),
        "contact_sheet": str(sheet_path),
        "zip": str(archive_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Generated One-to-All MP4")
    parser.add_argument("--output", required=True, type=Path, help="New output directory")
    parser.add_argument("--reference-asset-id", default="", help="ZERO STUDIO gallery asset ID; never an image URL")
    parser.add_argument("--driving-video-id", default="", help="Optional source motion clip ID or filename")
    parser.add_argument("--model-id", default="One-to-All Animation 1.3B v2")
    parser.add_argument("--checkpoint-id", default="Kijai/WanVideo_comfy/OneToAllAnimation/Wan21-OneToAllAnimation_1_3B_v2_fp16.safetensors")
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--thumb-width", type=int, default=256)
    args = parser.parse_args()
    result = package_video(args.input, args.output,
                           reference_asset_id=args.reference_asset_id,
                           driving_video_id=args.driving_video_id,
                           model_id=args.model_id,
                           checkpoint_id=args.checkpoint_id,
                           columns=args.columns,
                           thumb_width=args.thumb_width)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
