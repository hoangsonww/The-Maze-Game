# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""Maze solving algorithms.

All solvers operate on a carved :class:`~mazeforge.grid.Grid` (passages are
edges) and return a :class:`Solution`. BFS, Dijkstra and A* return a guaranteed
shortest path; DFS and the wall follower return *a* path; dead-end filling
returns the unique corridor on a perfect maze.
"""

from __future__ import annotations

import heapq
import math
from collections import deque
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Tuple

from .grid import Cell, Grid

Heuristic = Callable[[Cell, Cell], float]


@dataclass
class Solution:
    """Result of a solve: the path plus search bookkeeping."""

    found: bool
    path: List[Cell] = field(default_factory=list)
    explored: int = 0

    @property
    def cost(self) -> int:
        """Number of steps (passages traversed)."""
        return max(0, len(self.path) - 1)

    @property
    def coords(self) -> List[Tuple[int, int]]:
        return [c.coords for c in self.path]

    def __bool__(self) -> bool:
        return self.found


# ---------------------------------------------------------------------------
# Heuristics for A* / greedy best-first
# ---------------------------------------------------------------------------


def manhattan(a: Cell, b: Cell) -> float:
    return abs(a.row - b.row) + abs(a.col - b.col)


def euclidean(a: Cell, b: Cell) -> float:
    return math.hypot(a.row - b.row, a.col - b.col)


def chebyshev(a: Cell, b: Cell) -> float:
    return max(abs(a.row - b.row), abs(a.col - b.col))


HEURISTICS: Dict[str, Heuristic] = {
    "manhattan": manhattan,
    "euclidean": euclidean,
    "chebyshev": chebyshev,
}


def _endpoints(
    grid: Grid, start: Optional[Cell], goal: Optional[Cell]
) -> Tuple[Cell, Cell]:
    s = start or grid.cell_at(0, 0)
    g = goal or grid.cell_at(grid.rows - 1, grid.cols - 1)
    assert s is not None and g is not None
    return s, g


def _reconstruct(came_from: Dict[Cell, Cell], goal: Cell) -> List[Cell]:
    path = [goal]
    while path[-1] in came_from:
        path.append(came_from[path[-1]])
    path.reverse()
    return path


# ---------------------------------------------------------------------------
# Algorithms
# ---------------------------------------------------------------------------


def bfs(grid: Grid, start: Optional[Cell] = None, goal: Optional[Cell] = None) -> Solution:
    """Breadth-first search — shortest path on an unweighted maze."""
    s, g = _endpoints(grid, start, goal)
    came_from: Dict[Cell, Cell] = {}
    seen = {s}
    queue: deque[Cell] = deque([s])
    explored = 0
    while queue:
        cell = queue.popleft()
        explored += 1
        if cell is g:
            return Solution(True, _reconstruct(came_from, g), explored)
        for nxt in cell.links:
            if nxt not in seen:
                seen.add(nxt)
                came_from[nxt] = cell
                queue.append(nxt)
    return Solution(False, [], explored)


def dfs(grid: Grid, start: Optional[Cell] = None, goal: Optional[Cell] = None) -> Solution:
    """Depth-first search — finds *a* path (not necessarily shortest)."""
    s, g = _endpoints(grid, start, goal)
    came_from: Dict[Cell, Cell] = {}
    seen = {s}
    stack: List[Cell] = [s]
    explored = 0
    while stack:
        cell = stack.pop()
        explored += 1
        if cell is g:
            return Solution(True, _reconstruct(came_from, g), explored)
        for nxt in cell.links:
            if nxt not in seen:
                seen.add(nxt)
                came_from[nxt] = cell
                stack.append(nxt)
    return Solution(False, [], explored)


def dijkstra(
    grid: Grid, start: Optional[Cell] = None, goal: Optional[Cell] = None
) -> Solution:
    """Dijkstra's algorithm (unit weights here — generalises to weighted mazes)."""
    s, g = _endpoints(grid, start, goal)
    dist: Dict[Cell, int] = {s: 0}
    came_from: Dict[Cell, Cell] = {}
    counter = 0
    heap: List[Tuple[int, int, Cell]] = [(0, counter, s)]
    explored = 0
    while heap:
        d, _, cell = heapq.heappop(heap)
        if d > dist.get(cell, math.inf):
            continue
        explored += 1
        if cell is g:
            return Solution(True, _reconstruct(came_from, g), explored)
        for nxt in cell.links:
            nd = d + 1
            if nd < dist.get(nxt, math.inf):
                dist[nxt] = nd
                came_from[nxt] = cell
                counter += 1
                heapq.heappush(heap, (nd, counter, nxt))
    return Solution(False, [], explored)


def astar(
    grid: Grid,
    start: Optional[Cell] = None,
    goal: Optional[Cell] = None,
    *,
    heuristic: str = "manhattan",
) -> Solution:
    """A* search — Dijkstra guided by an admissible heuristic."""
    s, g = _endpoints(grid, start, goal)
    h = HEURISTICS[heuristic]
    g_score: Dict[Cell, int] = {s: 0}
    came_from: Dict[Cell, Cell] = {}
    counter = 0
    heap: List[Tuple[float, int, Cell]] = [(h(s, g), counter, s)]
    explored = 0
    while heap:
        _, _, cell = heapq.heappop(heap)
        explored += 1
        if cell is g:
            return Solution(True, _reconstruct(came_from, g), explored)
        for nxt in cell.links:
            tentative = g_score[cell] + 1
            if tentative < g_score.get(nxt, math.inf):
                g_score[nxt] = tentative
                came_from[nxt] = cell
                counter += 1
                heapq.heappush(heap, (tentative + h(nxt, g), counter, nxt))
    return Solution(False, [], explored)


def greedy_best_first(
    grid: Grid,
    start: Optional[Cell] = None,
    goal: Optional[Cell] = None,
    *,
    heuristic: str = "manhattan",
) -> Solution:
    """Greedy best-first — expands the cell that looks closest to the goal.

    Fast but not optimal (path may be longer than BFS/A*).
    """
    s, g = _endpoints(grid, start, goal)
    h = HEURISTICS[heuristic]
    came_from: Dict[Cell, Cell] = {}
    seen = {s}
    counter = 0
    heap: List[Tuple[float, int, Cell]] = [(h(s, g), counter, s)]
    explored = 0
    while heap:
        _, _, cell = heapq.heappop(heap)
        explored += 1
        if cell is g:
            return Solution(True, _reconstruct(came_from, g), explored)
        for nxt in cell.links:
            if nxt not in seen:
                seen.add(nxt)
                came_from[nxt] = cell
                counter += 1
                heapq.heappush(heap, (h(nxt, g), counter, nxt))
    return Solution(False, [], explored)


_HEADINGS = ("north", "east", "south", "west")
_VECTORS = {"north": (-1, 0), "east": (0, 1), "south": (1, 0), "west": (0, -1)}


def wall_follower(
    grid: Grid,
    start: Optional[Cell] = None,
    goal: Optional[Cell] = None,
    *,
    hand: str = "left",
) -> Solution:
    """Wall follower (left- or right-hand rule). Works on any connected maze."""
    s, g = _endpoints(grid, start, goal)
    turn = -1 if hand == "left" else 1
    heading = 1  # facing east
    cell = s
    path = [s]
    explored = 0
    limit = grid.size * 4 + 8  # safety bound
    while cell is not g and explored < limit:
        explored += 1
        for delta in (turn, 0, -turn, 2):  # left, straight, right, back
            new_heading = (heading + delta) % 4
            name = _HEADINGS[new_heading]
            nxt = getattr(cell, name)
            if nxt is not None and cell.is_linked(nxt):
                heading = new_heading
                cell = nxt
                path.append(cell)
                break
    if cell is g:
        return Solution(True, path, explored)
    return Solution(False, [], explored)


def dead_end_filling(
    grid: Grid, start: Optional[Cell] = None, goal: Optional[Cell] = None
) -> Solution:
    """Dead-end filling — repeatedly plug dead ends; the rest is the solution.

    Optimal and complete on perfect mazes.
    """
    s, g = _endpoints(grid, start, goal)
    degree: Dict[Cell, int] = {c: len(c.links) for c in grid.each_cell()}
    filled: set[Cell] = set()
    queue: deque[Cell] = deque(
        c for c in grid.each_cell() if degree[c] == 1 and c is not s and c is not g
    )
    while queue:
        cell = queue.popleft()
        if cell in filled or degree[cell] != 1:
            continue
        filled.add(cell)
        for nxt in cell.links:
            if nxt in filled:
                continue
            degree[nxt] -= 1
            if degree[nxt] == 1 and nxt is not s and nxt is not g:
                queue.append(nxt)
    # The surviving cells form the corridor; order them with a BFS.
    survivors = grid.size - len(filled)
    came_from: Dict[Cell, Cell] = {}
    seen = {s}
    bq: deque[Cell] = deque([s])
    while bq:
        cell = bq.popleft()
        if cell is g:
            return Solution(True, _reconstruct(came_from, g), survivors)
        for nxt in cell.links:
            if nxt not in seen and nxt not in filled:
                seen.add(nxt)
                came_from[nxt] = cell
                bq.append(nxt)
    return Solution(False, [], survivors)


SOLVERS: Dict[str, Callable[..., Solution]] = {
    "bfs": bfs,
    "dfs": dfs,
    "dijkstra": dijkstra,
    "astar": astar,
    "greedy": greedy_best_first,
    "wall_follower": wall_follower,
    "dead_end_filling": dead_end_filling,
}

DEFAULT_SOLVER = "astar"


def solve(
    grid: Grid,
    start: Optional[Cell] = None,
    goal: Optional[Cell] = None,
    algorithm: str = DEFAULT_SOLVER,
    **kwargs: object,
) -> Solution:
    """Solve ``grid`` from ``start`` to ``goal`` (defaults: NW corner → SE corner)."""
    if algorithm not in SOLVERS:
        raise ValueError(f"unknown solver {algorithm!r}; choose from {sorted(SOLVERS)}")
    return SOLVERS[algorithm](grid, start, goal, **kwargs)  # type: ignore[arg-type]
