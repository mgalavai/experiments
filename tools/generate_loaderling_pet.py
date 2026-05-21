#!/usr/bin/env python3
"""Generate the Loaderling Codex pet source strips.

The art is intentionally deterministic: a compact, logo-free wheel-loader
mascot with stable proportions across every animation row.
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
RUN_DIR = ROOT / "pets" / "loaderling-run"
DECODED_DIR = RUN_DIR / "decoded"
REFERENCES_DIR = RUN_DIR / "references"
CELL_WIDTH = 192
CELL_HEIGHT = 208
SCALE = 4
FRAME_COUNTS = {
    "idle": 6,
    "running-right": 8,
    "running-left": 8,
    "waving": 4,
    "jumping": 5,
    "failed": 8,
    "waiting": 6,
    "running": 6,
    "review": 6,
}


COLORS = {
    "outline": (42, 45, 48, 255),
    "outline_soft": (68, 73, 78, 255),
    "yellow": (247, 184, 32, 255),
    "yellow_dark": (214, 143, 28, 255),
    "yellow_light": (255, 210, 72, 255),
    "glass": (111, 174, 204, 255),
    "glass_dark": (58, 92, 112, 255),
    "bucket": (86, 91, 96, 255),
    "bucket_dark": (54, 58, 64, 255),
    "tire": (32, 34, 38, 255),
    "tread": (88, 91, 94, 255),
    "rim": (235, 170, 32, 255),
    "orange": (238, 103, 30, 255),
    "white": (245, 248, 246, 255),
    "blush": (255, 139, 96, 255),
    "smoke": (114, 119, 122, 255),
}


def sxy(points: list[tuple[float, float]]) -> list[tuple[int, int]]:
    return [(round(x * SCALE), round(y * SCALE)) for x, y in points]


def box(x0: float, y0: float, x1: float, y1: float) -> tuple[int, int, int, int]:
    left = min(x0, x1)
    right = max(x0, x1)
    top = min(y0, y1)
    bottom = max(y0, y1)
    return (
        round(left * SCALE),
        round(top * SCALE),
        round(right * SCALE),
        round(bottom * SCALE),
    )


def draw_line(draw: ImageDraw.ImageDraw, points, fill, width: int) -> None:
    draw.line(sxy(points), fill=fill, width=round(width * SCALE), joint="curve")


def draw_tire(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, phase: float) -> None:
    draw.ellipse(box(cx - r, cy - r, cx + r, cy + r), fill=COLORS["tire"], outline=COLORS["outline"], width=4 * SCALE)
    for n in range(10):
        angle = phase + n * math.tau / 10
        ox = math.cos(angle)
        oy = math.sin(angle)
        x = cx + ox * r * 0.76
        y = cy + oy * r * 0.76
        draw.line(
            sxy([(x - oy * 7, y + ox * 7), (x + oy * 7, y - ox * 7)]),
            fill=COLORS["tread"],
            width=3 * SCALE,
        )
    draw.ellipse(box(cx - r * 0.43, cy - r * 0.43, cx + r * 0.43, cy + r * 0.43), fill=COLORS["rim"], outline=COLORS["outline"], width=2 * SCALE)
    draw.ellipse(box(cx - r * 0.16, cy - r * 0.16, cx + r * 0.16, cy + r * 0.16), fill=COLORS["yellow_light"])


def base_frame(
    *,
    facing: int = 1,
    body_y: float = 0,
    body_x: float = 0,
    bucket_lift: float = 0,
    bucket_tilt: float = 0,
    eye: str = "normal",
    arm_wave: float = 0,
    sad: float = 0,
    think: float = 0,
    tire_phase: float = 0,
) -> Image.Image:
    canvas = Image.new("RGBA", (CELL_WIDTH * SCALE, CELL_HEIGHT * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    def tx(x: float) -> float:
        return 96 + facing * (x - 96) + body_x

    def pts(raw):
        return [(tx(x), y + body_y) for x, y in raw]

    # Bucket and loader arms remain attached to the machine silhouette.
    bucket_y = 129 + body_y - bucket_lift
    bucket_front = tx(167)
    bucket_back = tx(132)
    lip = 12 * facing
    bucket_poly = [
        (bucket_back, bucket_y - 4),
        (bucket_front + lip, bucket_y - 12 + bucket_tilt),
        (bucket_front + lip * 0.8, bucket_y + 29 + bucket_tilt * 0.4),
        (bucket_back - 3 * facing, bucket_y + 24),
    ]
    draw.polygon(sxy(bucket_poly), fill=COLORS["bucket"], outline=COLORS["outline"])
    draw.polygon(
        sxy([(bucket_back + 2 * facing, bucket_y + 2), (bucket_front + lip * 0.65, bucket_y - 5 + bucket_tilt), (bucket_front + lip * 0.55, bucket_y + 6 + bucket_tilt * 0.2), (bucket_back + 5 * facing, bucket_y + 12)]),
        fill=COLORS["bucket_dark"],
    )

    draw_line(draw, pts([(86, 107), (119, 95 - bucket_lift * 0.25), (143, 118 - bucket_lift)]), COLORS["outline"], 10)
    draw_line(draw, pts([(88, 107), (120, 96 - bucket_lift * 0.25), (143, 118 - bucket_lift)]), COLORS["yellow"], 6)
    draw_line(draw, pts([(84, 120), (115, 112 - bucket_lift * 0.18), (134, 133 - bucket_lift)]), COLORS["outline"], 8)
    draw_line(draw, pts([(85, 120), (115, 112 - bucket_lift * 0.18), (134, 133 - bucket_lift)]), COLORS["yellow_dark"], 4)

    # Wheels first so the body naturally connects them.
    draw_tire(draw, tx(63), 145 + body_y, 25, tire_phase)
    draw_tire(draw, tx(122), 145 + body_y, 29, tire_phase + 0.6)

    # Main body panels.
    draw.rounded_rectangle(box(min(tx(43), tx(135)), 91 + body_y, max(tx(43), tx(135)), 136 + body_y), radius=14 * SCALE, fill=COLORS["yellow"], outline=COLORS["outline"], width=4 * SCALE)
    draw.polygon(sxy(pts([(44, 107), (66, 86), (117, 87), (136, 111), (132, 137), (50, 137)])), fill=COLORS["yellow"], outline=COLORS["outline"])
    draw.polygon(sxy(pts([(52, 99), (72, 89), (104, 90), (96, 111), (51, 113)])), fill=COLORS["yellow_light"])
    draw.rectangle(box(min(tx(46), tx(63)), 118 + body_y, max(tx(46), tx(63)), 129 + body_y), fill=COLORS["orange"], outline=COLORS["outline"], width=2 * SCALE)

    # Cab glass doubles as the face.
    cab = pts([(74, 52), (111, 52), (124, 91), (65, 91)])
    draw.polygon(sxy(cab), fill=COLORS["outline"], outline=COLORS["outline"])
    glass = pts([(78, 57), (107, 57), (117, 86), (70, 86)])
    draw.polygon(sxy(glass), fill=COLORS["glass"], outline=COLORS["glass_dark"])
    draw.line(sxy(pts([(95, 56), (95, 88)])), fill=COLORS["glass_dark"], width=2 * SCALE)
    draw.line(sxy(pts([(67, 51), (61, 37)])), fill=COLORS["outline_soft"], width=3 * SCALE)
    draw.ellipse(box(tx(58) - 3, 34 + body_y, tx(58) + 3, 40 + body_y), fill=COLORS["orange"], outline=COLORS["outline"])

    eye_y = 72 + body_y + sad * 3
    if eye == "blink":
        draw_line(draw, pts([(82, eye_y), (89, eye_y + 1), (96, eye_y)]), COLORS["outline"], 2)
        draw_line(draw, pts([(101, eye_y), (108, eye_y + 1), (114, eye_y)]), COLORS["outline"], 2)
    else:
        dx = think * 2
        draw.ellipse(box(tx(84 + dx) - 4, eye_y - 4, tx(84 + dx) + 4, eye_y + 4), fill=COLORS["outline"])
        draw.ellipse(box(tx(106 + dx) - 4, eye_y - 4, tx(106 + dx) + 4, eye_y + 4), fill=COLORS["outline"])
        draw.ellipse(box(tx(85 + dx) - 1.2, eye_y - 2.5, tx(85 + dx) + 1.2, eye_y - 0.1), fill=COLORS["white"])
        draw.ellipse(box(tx(107 + dx) - 1.2, eye_y - 2.5, tx(107 + dx) + 1.2, eye_y - 0.1), fill=COLORS["white"])

    if sad:
        draw.arc(box(tx(86), 78 + body_y, tx(108), 93 + body_y), 200 if facing == 1 else -20, 340 if facing == 1 else 160, fill=COLORS["outline"], width=2 * SCALE)
        draw.ellipse(box(tx(115) - 2, 83 + body_y, tx(115) + 2, 90 + body_y), fill=COLORS["glass_dark"])
    else:
        draw.arc(box(tx(84), 74 + body_y, tx(109), 91 + body_y), 20 if facing == 1 else 200, 160 if facing == 1 else 340, fill=COLORS["outline"], width=2 * SCALE)
        draw.ellipse(box(tx(116) - 3, 82 + body_y, tx(116) + 3, 88 + body_y), fill=COLORS["blush"])

    # Orange rail can wave without becoming detached.
    rail_top = 64 + body_y - arm_wave
    draw_line(draw, pts([(124, 69), (136, rail_top), (139, rail_top + 22)]), COLORS["outline"], 5)
    draw_line(draw, pts([(124, 69), (136, rail_top), (139, rail_top + 22)]), COLORS["orange"], 2)

    if sad:
        draw.ellipse(box(tx(48) - 10, 84 + body_y, tx(48) + 10, 100 + body_y), fill=COLORS["smoke"], outline=COLORS["outline_soft"], width=2 * SCALE)

    return canvas.resize((CELL_WIDTH, CELL_HEIGHT), Image.Resampling.LANCZOS)


def make_frames(state: str) -> list[Image.Image]:
    frames: list[Image.Image] = []
    count = FRAME_COUNTS[state]
    for i in range(count):
        t = i / count
        wave = math.sin(t * math.tau)
        if state == "idle":
            frames.append(base_frame(body_y=1.5 * math.sin(t * math.tau), eye="blink" if i == 2 else "normal"))
        elif state == "running-right":
            frames.append(base_frame(facing=1, body_x=-8 + i * 2.0, body_y=2 * math.sin(t * math.tau * 2), bucket_lift=2 + 2 * math.sin(t * math.tau), tire_phase=t * math.tau * 2))
        elif state == "running-left":
            frames.append(base_frame(facing=-1, body_x=8 - i * 2.0, body_y=2 * math.sin(t * math.tau * 2), bucket_lift=2 + 2 * math.sin(t * math.tau), tire_phase=-t * math.tau * 2))
        elif state == "waving":
            frames.append(base_frame(arm_wave=[0, 16, 8, 0][i], bucket_lift=1, eye="blink" if i == 2 else "normal"))
        elif state == "jumping":
            frames.append(base_frame(body_y=[10, -6, -18, -6, 8][i], bucket_lift=[0, 4, 8, 4, 0][i], tire_phase=i * 0.5))
        elif state == "failed":
            frames.append(base_frame(body_y=2 + (i % 2), bucket_lift=-2, bucket_tilt=4, eye="blink" if i in {2, 5} else "normal", sad=1, tire_phase=0.2 * i))
        elif state == "waiting":
            frames.append(base_frame(body_y=1.5 * wave, bucket_lift=6 + 3 * math.sin(t * math.tau), eye="blink" if i == 4 else "normal", think=math.sin(t * math.tau)))
        elif state == "running":
            frames.append(base_frame(body_y=1.2 * math.sin(t * math.tau * 2), bucket_lift=8 + 4 * math.sin(t * math.tau * 2), eye="blink" if i == 3 else "normal", tire_phase=0.25 * math.sin(t * math.tau)))
        elif state == "review":
            frames.append(base_frame(body_x=1.5 * math.sin(t * math.tau), bucket_lift=10, bucket_tilt=-3, eye="blink" if i == 1 else "normal", think=1))
    return frames


def save_strip(state: str, frames: list[Image.Image]) -> None:
    strip = Image.new("RGBA", (CELL_WIDTH * len(frames), CELL_HEIGHT), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * CELL_WIDTH, 0))
    strip.save(DECODED_DIR / f"{state}.png")


def mark_jobs_complete() -> None:
    manifest_path = RUN_DIR / "imagegen-jobs.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for job in manifest["jobs"]:
        job["status"] = "complete"
        job["source_path"] = str((RUN_DIR / job["output_path"]).resolve())
        job["completed_at"] = completed_at
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    DECODED_DIR.mkdir(parents=True, exist_ok=True)
    REFERENCES_DIR.mkdir(parents=True, exist_ok=True)
    base = base_frame(bucket_lift=3)
    base.save(DECODED_DIR / "base.png")
    base.save(REFERENCES_DIR / "canonical-base.png")
    for state in FRAME_COUNTS:
        save_strip(state, make_frames(state))
    mark_jobs_complete()


if __name__ == "__main__":
    main()
