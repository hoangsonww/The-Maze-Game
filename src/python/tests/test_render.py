# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

import pytest

import mazeforge as mf
from mazeforge.distances import distances_from
from mazeforge.render import to_ascii


def test_ascii_shape():
    maze = mf.generate(5, 7, "sidewinder", seed=3)
    art = to_ascii(maze)
    lines = art.splitlines()
    # 1 top border + 2 lines per row
    assert len(lines) == 1 + 2 * maze.rows
    assert all(len(line) == 1 + 4 * maze.cols for line in lines)
    assert art.count("+") >= (maze.rows + 1) * (maze.cols + 1) - maze.size


def test_ascii_path_overlay():
    maze = mf.generate(6, 6, "recursive_backtracker", seed=5)
    sol = mf.solve(maze, algorithm="astar")
    art = to_ascii(maze, path=sol.path, marker="*")
    assert "*" in art


def test_ascii_distance_overlay():
    maze = mf.generate(4, 4, "recursive_backtracker", seed=5)
    field = distances_from(maze.cell_at(0, 0))
    art = to_ascii(maze, distances=field)
    assert "0" in art  # the root distance


def test_png_render_optional():
    pytest.importorskip("PIL")
    maze = mf.generate(8, 8, "wilson", seed=9)
    sol = mf.solve(maze, algorithm="bfs")
    img = mf.render_image(maze, path=sol.path, cell_size=10)
    assert img.size[0] > 0 and img.size[1] > 0
