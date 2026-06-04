# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""Renderers for mazes: ASCII text and (optional) PNG images."""

from .ascii import to_ascii
from .image import render_image

__all__ = ["to_ascii", "render_image"]
