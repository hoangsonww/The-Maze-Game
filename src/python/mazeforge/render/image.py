# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""PNG rendering of a maze via Pillow (an optional dependency).

Install with ``pip install mazeforge[image]``.
"""

from __future__ import annotations

from typing import Iterable, Optional, Tuple

from ..grid import Cell, Grid

RGB = Tuple[int, int, int]


def render_image(
    grid: Grid,
    *,
    path: Optional[Iterable[Cell]] = None,
    cell_size: int = 24,
    wall: int = 2,
    background: RGB = (245, 246, 255),
    wall_color: RGB = (16, 22, 47),
    path_color: RGB = (255, 106, 77),
    start_color: RGB = (255, 106, 77),
    goal_color: RGB = (30, 215, 96),
    save_to: Optional[str] = None,
):
    """Render ``grid`` to a Pillow ``Image`` (and optionally save it).

    Returns the ``PIL.Image.Image``. Raises a clear error if Pillow is absent.
    """
    try:
        from PIL import Image, ImageDraw
    except ImportError as exc:  # pragma: no cover - exercised only without Pillow
        raise RuntimeError(
            "PNG rendering needs Pillow. Install it with: pip install mazeforge[image]"
        ) from exc

    path_list = list(path) if path is not None else []
    path_set = set(path_list)

    width = grid.cols * cell_size + wall
    height = grid.rows * cell_size + wall
    img = Image.new("RGB", (width, height), background)
    draw = ImageDraw.Draw(img)

    # Path highlight (under the walls).
    for cell in path_set:
        x0 = cell.col * cell_size + wall
        y0 = cell.row * cell_size + wall
        draw.rectangle(
            [x0, y0, x0 + cell_size - wall, y0 + cell_size - wall], fill=path_color
        )
    if path_list:
        for cell, color in ((path_list[0], start_color), (path_list[-1], goal_color)):
            x0 = cell.col * cell_size + wall
            y0 = cell.row * cell_size + wall
            draw.rectangle(
                [x0, y0, x0 + cell_size - wall, y0 + cell_size - wall], fill=color
            )

    # Walls: draw a segment wherever there is no passage.
    for cell in grid.each_cell():
        x0 = cell.col * cell_size
        y0 = cell.row * cell_size
        x1 = x0 + cell_size
        y1 = y0 + cell_size
        if cell.north is None:
            draw.line([(x0, y0), (x1, y0)], fill=wall_color, width=wall)
        if cell.west is None:
            draw.line([(x0, y0), (x0, y1)], fill=wall_color, width=wall)
        if not cell.is_linked(cell.east):
            draw.line([(x1, y0), (x1, y1)], fill=wall_color, width=wall)
        if not cell.is_linked(cell.south):
            draw.line([(x0, y1), (x1, y1)], fill=wall_color, width=wall)

    if save_to:
        img.save(save_to)
    return img
