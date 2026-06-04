# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""Distance fields over a maze (BFS/Dijkstra) and longest-path discovery."""

from __future__ import annotations

from collections import deque
from typing import Dict, List, Optional, Tuple

from .grid import Cell, Grid


class Distances:
    """Shortest-path distances from a root cell to every reachable cell."""

    def __init__(self, root: Cell) -> None:
        self.root = root
        self._cells: Dict[Cell, int] = {root: 0}

    def __getitem__(self, cell: Cell) -> Optional[int]:
        return self._cells.get(cell)

    def __setitem__(self, cell: Cell, distance: int) -> None:
        self._cells[cell] = distance

    def __contains__(self, cell: object) -> bool:
        return cell in self._cells

    def cells(self) -> List[Cell]:
        return list(self._cells.keys())

    def max(self) -> Tuple[Cell, int]:
        """Return the farthest cell from the root and its distance."""
        far, dist = self.root, 0
        for cell, d in self._cells.items():
            if d > dist:
                far, dist = cell, d
        return far, dist

    def path_to(self, goal: Cell) -> Optional[List[Cell]]:
        """Reconstruct a shortest path from the root to ``goal``."""
        if goal not in self._cells:
            return None
        current = goal
        path = [current]
        while current is not self.root:
            d = self._cells[current]
            nxt = next((n for n in current.links if self._cells.get(n) == d - 1), None)
            if nxt is None:  # pragma: no cover - shouldn't happen on a valid field
                return None
            path.append(nxt)
            current = nxt
        path.reverse()
        return path


def distances_from(root: Cell) -> Distances:
    """Breadth-first distance field from ``root`` (unit-weight passages)."""
    dist = Distances(root)
    queue: deque[Cell] = deque([root])
    while queue:
        cell = queue.popleft()
        d = dist[cell]
        assert d is not None
        for nxt in cell.links:
            if nxt not in dist:
                dist[nxt] = d + 1
                queue.append(nxt)
    return dist


def longest_path(grid: Grid) -> List[Cell]:
    """Return the maze's diameter — the longest shortest-path between two cells.

    Uses the classic double-BFS: BFS from any cell to find one end of the
    diameter, then BFS from that end to find the other.
    """
    start = grid.cell_at(0, 0)
    assert start is not None
    far_a, _ = distances_from(start).max()
    field = distances_from(far_a)
    far_b, _ = field.max()
    path = field.path_to(far_b)
    return path or [start]
