# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

import pytest

import mazeforge as mf
from mazeforge.distances import distances_from, longest_path
from mazeforge.solvers import SOLVERS, solve


def _maze():
    return mf.generate(15, 18, "recursive_backtracker", seed=11)


def _valid_path(maze, path):
    if not path:
        return False
    if path[0].coords != (0, 0) or path[-1].coords != (maze.rows - 1, maze.cols - 1):
        return False
    for a, b in zip(path, path[1:]):
        if not a.is_linked(b):
            return False
        if abs(a.row - b.row) + abs(a.col - b.col) != 1:
            return False
    return True


@pytest.mark.parametrize("algo", sorted(SOLVERS))
def test_every_solver_finds_a_valid_path(algo):
    maze = _maze()
    result = solve(maze, algorithm=algo)
    assert result.found, f"{algo} found no path"
    assert _valid_path(maze, result.path), f"{algo} returned an invalid path"


def test_shortest_path_algorithms_agree():
    maze = _maze()
    optimal = solve(maze, algorithm="bfs").cost
    for algo in ("dijkstra", "astar", "dead_end_filling"):
        assert solve(maze, algorithm=algo).cost == optimal


def test_non_optimal_solvers_are_at_least_optimal_length():
    maze = _maze()
    optimal = solve(maze, algorithm="bfs").cost
    for algo in ("dfs", "greedy", "wall_follower"):
        assert solve(maze, algorithm=algo).cost >= optimal


def test_astar_heuristics():
    maze = _maze()
    for h in ("manhattan", "euclidean", "chebyshev"):
        assert solve(maze, algorithm="astar", heuristic=h).found


def test_astar_explores_no_more_than_bfs():
    # On a perfect maze A* with an admissible heuristic never expands more
    # nodes than uninformed BFS.
    maze = _maze()
    assert solve(maze, algorithm="astar").explored <= solve(maze, algorithm="bfs").explored


def test_distances_and_longest_path():
    maze = _maze()
    field = distances_from(maze.cell_at(0, 0))
    far, dist = field.max()
    assert dist > 0
    assert field.path_to(far)[0].coords == (0, 0)

    diameter = longest_path(maze)
    assert len(diameter) >= dist  # the diameter is at least the radius


def test_unknown_solver_raises():
    with pytest.raises(ValueError):
        solve(_maze(), algorithm="nope")
