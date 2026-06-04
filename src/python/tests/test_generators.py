# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

import pytest

import mazeforge as mf
from mazeforge.generators import ALGORITHMS, generate


@pytest.mark.parametrize("algo", sorted(ALGORITHMS))
def test_every_generator_makes_a_perfect_maze(algo):
    maze = generate(12, 15, algo, seed=7)
    assert maze.rows == 12 and maze.cols == 15
    # A perfect maze is a spanning tree: fully connected with no loops.
    assert maze.is_connected(), f"{algo} produced a disconnected maze"
    assert maze.is_perfect(), f"{algo} produced loops (not a perfect maze)"
    assert maze.edge_count() == maze.size - 1


@pytest.mark.parametrize("algo", sorted(ALGORITHMS))
def test_generators_are_reproducible_with_seed(algo):
    a = generate(10, 10, algo, seed=123).to_wall_grid()
    b = generate(10, 10, algo, seed=123).to_wall_grid()
    assert a == b


def test_different_seeds_differ():
    a = generate(12, 12, "wilson", seed=1).to_wall_grid()
    b = generate(12, 12, "wilson", seed=2).to_wall_grid()
    assert a != b


def test_growing_tree_strategies():
    from mazeforge.generators import growing_tree
    from mazeforge.grid import Grid

    for strategy in ("newest", "oldest", "random", "mixed"):
        g = Grid(10, 10)
        growing_tree(g, __import__("random").Random(0), strategy=strategy)
        assert g.is_perfect()


def test_braided_generation_has_no_dead_ends():
    maze = mf.generate(14, 14, "recursive_backtracker", seed=4, braid=1.0)
    assert len(maze.deadends()) == 0
    assert maze.is_connected()
    # Braiding adds loops, so it is no longer a perfect maze.
    assert not maze.is_perfect()


def test_unknown_algorithm_raises():
    with pytest.raises(ValueError):
        generate(5, 5, "does_not_exist")
