#!/usr/bin/env python3
"""Blank-frame scanner for the screenshots artifact.

Downloads nothing: point it at a directory of PNGs (gh run download -n
screenshots -D <dir>) and it classifies each frame by signal:

  BLANK  stddev < 1.0                        — nothing rendered
  LOW    stddev < 6.0                        — uniform field + text (loading /
                                                 "probing WebGL2…" states land here;
                                                 eyeball before reclassifying)
  OK     otherwise

Writes a markdown table to stdout, worst first, plus a summary block. Pure
PIL, no numpy.

Usage: python3 scripts/scan-screenshots.py <dir-of-pngs> [--blank 1.0] [--low 6.0]
"""
import argparse
import pathlib
import sys

from PIL import Image, ImageStat


def classify(path: pathlib.Path, blank: float, low: float) -> tuple[str, float, float]:
    img = Image.open(path).convert('L')
    stat = ImageStat.Stat(img)
    std = stat.stddev[0]
    hist = img.histogram()
    total = sum(hist)
    modal = max(hist) / total if total else 0.0
    if std < blank:
        verdict = 'BLANK'
    elif std < low:
        verdict = 'LOW'
    else:
        verdict = 'OK'
    return verdict, std, modal


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('dir', type=pathlib.Path)
    ap.add_argument('--blank', type=float, default=1.0)
    ap.add_argument('--low', type=float, default=6.0)
    args = ap.parse_args()

    pngs = sorted(args.dir.rglob('*.png'))
    if not pngs:
        print(f'no PNGs under {args.dir}', file=sys.stderr)
        return 1

    rows = []
    for p in pngs:
        verdict, std, modal = classify(p, args.blank, args.low)
        rows.append((verdict, std, modal, p.name))

    rows.sort(key=lambda r: r[1])

    print('| verdict | stddev | modal-px | frame |')
    print('| --- | --- | --- | --- |')
    for verdict, std, modal, name in rows:
        if verdict != 'OK':
            print(f'| {verdict} | {std:.2f} | {modal:.2%} | {name} |')

    counts = {'BLANK': 0, 'LOW': 0, 'OK': 0}
    for verdict, _, _, _ in rows:
        counts[verdict] += 1
    print()
    print(f'total {len(rows)} — OK {counts["OK"]} · LOW {counts["LOW"]} · BLANK {counts["BLANK"]}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
