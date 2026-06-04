# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""mazeforge — production-grade maze generation, solving, and rendering.

A small, dependency-free (core) library that models mazes as cell graphs and
ships a wide set of classic algorithms.

Quick start::

    import mazeforge as mf

    maze = mf.generate(20, 20, algorithm="recursive_backtracker", seed=42)
    solution = mf.solve(maze, algorithm="astar")
    print(mf.to_ascii(maze, path=solution.path))

See :data:`mazeforge.generators.ALGORITHMS` and
:data:`mazeforge.solvers.SOLVERS` for the full menu.
"""

from __future__ import annotations

from .distances import Distances, distances_from, longest_path
from .generators import ALGORITHMS, DEFAULT_ALGORITHM, generate
from .grid import Cell, Coord, Grid, Maze
from .render import render_image, to_ascii
from .solvers import HEURISTICS, SOLVERS, Solution, solve

__version__ = "1.0.0"

__all__ = [
    "__version__",
    # core
    "Cell",
    "Coord",
    "Grid",
    "Maze",
    # generation
    "generate",
    "ALGORITHMS",
    "DEFAULT_ALGORITHM",
    # solving
    "solve",
    "Solution",
    "SOLVERS",
    "HEURISTICS",
    # distances
    "Distances",
    "distances_from",
    "longest_path",
    # rendering
    "to_ascii",
    "render_image",
]
