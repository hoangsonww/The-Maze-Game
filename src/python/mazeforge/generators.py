# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""Maze generation algorithms.

Every generator carves passages into a :class:`~mazeforge.grid.Grid` by linking
adjacent cells, and (except where noted) produces a *perfect* maze — a spanning
tree with exactly one path between any two cells.

Each function accepts an optional ``rng`` (``random.Random``) for reproducible
output, and a convenience :func:`generate` dispatcher selects one by name.
"""

from __future__ import annotations

import random
from typing import Callable, Dict, List, Optional

from .grid import Cell, Grid

Generator = Callable[[Grid, Optional[random.Random]], Grid]


def _rng(rng: Optional[random.Random]) -> random.Random:
    return rng or random.Random()


# ---------------------------------------------------------------------------
# Simple, biased generators (fast, O(n))
# ---------------------------------------------------------------------------


def binary_tree(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Binary tree: for each cell carve north or east. Strong diagonal bias."""
    r = _rng(rng)
    for cell in grid.each_cell():
        neighbors: List[Cell] = [n for n in (cell.north, cell.east) if n is not None]
        if neighbors:
            cell.link(r.choice(neighbors))
    return grid


def sidewinder(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Sidewinder: carve east-running runs, closing each with a north passage."""
    r = _rng(rng)
    for row in grid.each_row():
        run: List[Cell] = []
        for cell in row:
            run.append(cell)
            at_east_bound = cell.east is None
            at_north_bound = cell.north is None
            close_run = at_east_bound or (not at_north_bound and r.random() < 0.5)
            if close_run:
                member = r.choice(run)
                if member.north is not None:
                    member.link(member.north)
                run = []
            else:
                # Not at the east boundary, so a passage east always exists.
                assert cell.east is not None
                cell.link(cell.east)
    return grid


# ---------------------------------------------------------------------------
# Spanning-tree generators (unbiased / classic)
# ---------------------------------------------------------------------------


def recursive_backtracker(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Recursive backtracker (randomised DFS). Long, winding corridors."""
    r = _rng(rng)
    start = grid.random_cell(r)
    stack: List[Cell] = [start]
    visited = {start}
    while stack:
        current = stack[-1]
        unvisited = [n for n in current.neighbors if n not in visited]
        if not unvisited:
            stack.pop()
            continue
        nxt = r.choice(unvisited)
        current.link(nxt)
        visited.add(nxt)
        stack.append(nxt)
    return grid


def growing_tree(
    grid: Grid,
    rng: Optional[random.Random] = None,
    *,
    strategy: str = "newest",
) -> Grid:
    """Growing tree — generalises backtracker/Prim via cell selection.

    ``strategy``: ``newest`` (= recursive backtracker), ``random`` (= Prim-like,
    short and bushy), ``oldest``, or ``mixed`` (50/50 newest/random).
    """
    r = _rng(rng)
    active: List[Cell] = [grid.random_cell(r)]
    visited = set(active)

    def pick() -> Cell:
        if strategy == "newest":
            return active[-1]
        if strategy == "oldest":
            return active[0]
        if strategy == "random":
            return r.choice(active)
        return active[-1] if r.random() < 0.5 else r.choice(active)

    while active:
        cell = pick()
        unvisited = [n for n in cell.neighbors if n not in visited]
        if not unvisited:
            active.remove(cell)
            continue
        nxt = r.choice(unvisited)
        cell.link(nxt)
        visited.add(nxt)
        active.append(nxt)
    return grid


def randomized_prim(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Randomised Prim's algorithm (edge-based). Many short branches."""
    r = _rng(rng)
    start = grid.random_cell(r)
    visited = {start}
    frontier = [(start, n) for n in start.neighbors]
    while frontier:
        idx = r.randrange(len(frontier))
        cell, nxt = frontier.pop(idx)
        if nxt in visited:
            continue
        cell.link(nxt)
        visited.add(nxt)
        frontier.extend((nxt, n) for n in nxt.neighbors if n not in visited)
    return grid


def randomized_kruskal(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Randomised Kruskal's algorithm using a union-find of cell sets."""
    r = _rng(rng)
    parent: Dict[Cell, Cell] = {c: c for c in grid.each_cell()}

    def find(c: Cell) -> Cell:
        root = c
        while parent[root] is not root:
            root = parent[root]
        while parent[c] is not root:  # path compression
            parent[c], c = root, parent[c]
        return root

    edges = []
    for cell in grid.each_cell():
        if cell.south is not None:
            edges.append((cell, cell.south))
        if cell.east is not None:
            edges.append((cell, cell.east))
    r.shuffle(edges)
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra is not rb:
            a.link(b)
            parent[ra] = rb
    return grid


def aldous_broder(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Aldous-Broder random walk. Unbiased uniform spanning tree (can be slow)."""
    r = _rng(rng)
    cell = grid.random_cell(r)
    unvisited = grid.size - 1
    while unvisited > 0:
        nxt = r.choice(cell.neighbors)
        if not nxt.links:
            cell.link(nxt)
            unvisited -= 1
        cell = nxt
    return grid


def wilson(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Wilson's algorithm (loop-erased random walks). Unbiased, usually faster."""
    r = _rng(rng)
    unvisited = list(grid.each_cell())
    r.shuffle(unvisited)
    first = unvisited.pop()
    in_maze = {first}
    while unvisited:
        cell = r.choice(unvisited)
        path = [cell]
        while cell not in in_maze:
            cell = r.choice(cell.neighbors)
            if cell in path:
                path = path[: path.index(cell) + 1]  # erase the loop
            else:
                path.append(cell)
        for a, b in zip(path, path[1:]):
            a.link(b)
            in_maze.add(a)
        unvisited = [c for c in unvisited if c not in in_maze]
    return grid


def hunt_and_kill(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Hunt-and-kill: random walk, then 'hunt' for the next unvisited start."""
    r = _rng(rng)
    current: Optional[Cell] = grid.random_cell(r)
    visited = {current}
    while current is not None:
        unvisited = [n for n in current.neighbors if n not in visited]
        if unvisited:
            nxt = r.choice(unvisited)
            current.link(nxt)
            visited.add(nxt)
            current = nxt
            continue
        # Hunt: find an unvisited cell adjacent to a visited one.
        current = None
        for cell in grid.each_cell():
            if cell in visited:
                continue
            linked = [n for n in cell.neighbors if n in visited]
            if linked:
                cell.link(r.choice(linked))
                visited.add(cell)
                current = cell
                break
    return grid


def eller(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Eller's algorithm — row by row, constant memory. Great for huge mazes."""
    r = _rng(rng)
    next_set = 0
    row_set: Dict[Cell, int] = {}

    def set_of(cell: Cell) -> int:
        nonlocal next_set
        if cell not in row_set:
            row_set[cell] = next_set
            next_set += 1
        return row_set[cell]

    rows = list(grid.each_row())
    for i, row in enumerate(rows):
        last = i == len(rows) - 1
        # 1. randomly join adjacent cells in different sets
        for cell in row:
            if cell.east is None:
                continue
            s1, s2 = set_of(cell), set_of(cell.east)
            join = last or (s1 != s2 and r.random() < 0.5)
            if join and s1 != s2:
                cell.link(cell.east)
                for c, s in list(row_set.items()):
                    if s == s2:
                        row_set[c] = s1
        if last:
            break
        # 2. carry at least one vertical passage per set into the next row
        members: Dict[int, List[Cell]] = {}
        for cell in row:
            members.setdefault(set_of(cell), []).append(cell)
        new_row_set: Dict[Cell, int] = {}
        for s, cells in members.items():
            carriers = r.sample(cells, k=max(1, r.randint(1, len(cells))))
            for cell in carriers:
                south = cell.south
                if south is not None:
                    cell.link(south)
                    new_row_set[south] = s
        row_set = new_row_set
    return grid


def recursive_division(grid: Grid, rng: Optional[random.Random] = None) -> Grid:
    """Recursive division — start fully open, then recursively add walls.

    Produces long straight walls and a distinctive 'roomy' character.
    """
    r = _rng(rng)
    # Begin with every cell linked to its neighbours (no interior walls).
    for cell in grid.each_cell():
        if cell.south is not None:
            cell.link(cell.south)
        if cell.east is not None:
            cell.link(cell.east)

    def divide(top: int, left: int, height: int, width: int) -> None:
        if height <= 1 or width <= 1:
            return
        if width > height or (width == height and r.random() < 0.5):
            # vertical wall between columns (left+wx) and (left+wx+1)
            wx = r.randrange(width - 1)
            passage = r.randrange(height)
            for y in range(height):
                if y == passage:
                    continue
                a = grid.cell_at(top + y, left + wx)
                b = grid.cell_at(top + y, left + wx + 1)
                if a and b:
                    a.unlink(b)
            divide(top, left, height, wx + 1)
            divide(top, left + wx + 1, height, width - wx - 1)
        else:
            wy = r.randrange(height - 1)
            passage = r.randrange(width)
            for x in range(width):
                if x == passage:
                    continue
                a = grid.cell_at(top + wy, left + x)
                b = grid.cell_at(top + wy + 1, left + x)
                if a and b:
                    a.unlink(b)
            divide(top, left, wy + 1, width)
            divide(top + wy + 1, left, height - wy - 1, width)

    divide(0, 0, grid.rows, grid.cols)
    return grid


ALGORITHMS: Dict[str, Generator] = {
    "binary_tree": binary_tree,
    "sidewinder": sidewinder,
    "recursive_backtracker": recursive_backtracker,
    "growing_tree": growing_tree,
    "prim": randomized_prim,
    "kruskal": randomized_kruskal,
    "aldous_broder": aldous_broder,
    "wilson": wilson,
    "hunt_and_kill": hunt_and_kill,
    "eller": eller,
    "recursive_division": recursive_division,
}

DEFAULT_ALGORITHM = "recursive_backtracker"


def generate(
    rows: int,
    cols: int,
    algorithm: str = DEFAULT_ALGORITHM,
    *,
    seed: Optional[int] = None,
    braid: float = 0.0,
) -> Grid:
    """Create and carve a maze.

    Args:
        rows, cols: maze dimensions in cells.
        algorithm: one of :data:`ALGORITHMS`.
        seed: optional seed for reproducible mazes.
        braid: fraction of dead ends to remove (0 = perfect maze, 1 = no dead ends).
    """
    if algorithm not in ALGORITHMS:
        raise ValueError(
            f"unknown algorithm {algorithm!r}; choose from {sorted(ALGORITHMS)}"
        )
    rng = random.Random(seed)
    grid = Grid(rows, cols)
    ALGORITHMS[algorithm](grid, rng)
    if braid > 0:
        grid.braid(braid, rng)
    return grid
