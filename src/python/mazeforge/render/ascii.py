# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""ASCII rendering of a maze, with optional path or distance-field overlay."""

from __future__ import annotations

from typing import Dict, Iterable, Optional

from ..distances import Distances
from ..grid import Cell, Grid


def _base36(n: int) -> str:
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    if n < len(digits):
        return digits[n]
    out = ""
    while n:
        n, r = divmod(n, 36)
        out = digits[r] + out
    return out


def to_ascii(
    grid: Grid,
    *,
    path: Optional[Iterable[Cell]] = None,
    distances: Optional[Distances] = None,
    marker: str = "*",
) -> str:
    """Render ``grid`` as ASCII art (``+---+`` style).

    Args:
        path: if given, cells on the path are marked.
        distances: if given, each cell shows its distance (base-36) from the root.
        marker: character used for path cells.
    """
    path_set = set(path) if path is not None else set()

    def contents(cell: Cell) -> str:
        if cell in path_set:
            return f" {marker} "
        if distances is not None:
            d = distances[cell]
            if d is not None:
                return _base36(d).center(3)
        return "   "

    lines = ["+" + "---+" * grid.cols]
    for row in grid.each_row():
        top = "|"
        bottom = "+"
        for cell in row:
            top += contents(cell) + (" " if cell.is_linked(cell.east) else "|")
            bottom += ("   " if cell.is_linked(cell.south) else "---") + "+"
        lines.append(top)
        lines.append(bottom)
    return "\n".join(lines)
