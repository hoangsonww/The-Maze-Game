# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

import pytest

import mazeforge as mf
from mazeforge.grid import Cell, Grid


def test_grid_dimensions_and_access():
    g = Grid(4, 6)
    assert g.rows == 4 and g.cols == 6
    assert g.size == 24
    assert g.cell_at(0, 0).coords == (0, 0)
    assert g.cell_at(-1, 0) is None
    assert g.cell_at(4, 0) is None
    assert g[(3, 5)] is g.cell_at(3, 5)


def test_invalid_dimensions():
    with pytest.raises(ValueError):
        Grid(0, 5)


def test_neighbors_and_corners():
    g = Grid(3, 3)
    center = g.cell_at(1, 1)
    assert len(center.neighbors) == 4
    nw = g.corner("nw")
    assert len(nw.neighbors) == 2
    assert g.corner("se").coords == (2, 2)


def test_link_unlink_bidirectional():
    g = Grid(2, 2)
    a, b = g.cell_at(0, 0), g.cell_at(0, 1)
    a.link(b)
    assert a.is_linked(b) and b.is_linked(a)
    assert b in a.links and a in b.links
    a.unlink(b)
    assert not a.is_linked(b) and not b.is_linked(a)


def test_direction_to():
    g = Grid(3, 3)
    c = g.cell_at(1, 1)
    assert c.direction_to(c.north) == "north"
    assert c.direction_to(c.east) == "east"
    assert c.direction_to(g.cell_at(0, 0)) is None


def test_wall_grid_roundtrip():
    maze = mf.generate(8, 10, "recursive_backtracker", seed=1)
    walls = maze.to_wall_grid()
    assert len(walls) == 2 * 8 + 1
    assert len(walls[0]) == 2 * 10 + 1
    rebuilt = Grid.from_wall_grid(walls)
    assert rebuilt.edge_count() == maze.edge_count()
    assert rebuilt.is_perfect()


def test_braid_removes_dead_ends():
    maze = mf.generate(12, 12, "recursive_backtracker", seed=2)
    before = len(maze.deadends())
    assert before > 0
    maze.braid(1.0)
    assert len(maze.deadends()) == 0
    assert maze.is_connected()


def test_maze_alias():
    assert mf.Maze is Grid
