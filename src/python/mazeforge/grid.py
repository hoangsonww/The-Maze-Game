# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""Core maze data structures.

`mazeforge` models a maze with the *linking* representation popularised by
Jamis Buck's "Mazes for Programmers": the grid is a set of cells, and a passage
between two adjacent cells is represented by a reciprocal link. This is far more
flexible than a raw wall grid — every generation and solving algorithm operates
on the same structure, and it converts cleanly to/from a wall grid for interop.
"""

from __future__ import annotations

import random
from collections import deque
from typing import Dict, Iterator, List, Optional, Tuple

Coord = Tuple[int, int]


class Cell:
    """A single maze cell at ``(row, col)`` that tracks passages to neighbours."""

    __slots__ = ("row", "col", "_links", "north", "south", "east", "west")

    def __init__(self, row: int, col: int) -> None:
        self.row = row
        self.col = col
        self._links: Dict["Cell", bool] = {}
        self.north: Optional["Cell"] = None
        self.south: Optional["Cell"] = None
        self.east: Optional["Cell"] = None
        self.west: Optional["Cell"] = None

    def link(self, other: "Cell", *, bidirectional: bool = True) -> "Cell":
        """Carve a passage to ``other``."""
        self._links[other] = True
        if bidirectional and other is not None:
            other.link(self, bidirectional=False)
        return self

    def unlink(self, other: "Cell", *, bidirectional: bool = True) -> "Cell":
        """Remove a passage to ``other`` (re-erect the wall)."""
        self._links.pop(other, None)
        if bidirectional and other is not None:
            other.unlink(self, bidirectional=False)
        return self

    def is_linked(self, other: Optional["Cell"]) -> bool:
        return other in self._links

    @property
    def links(self) -> List["Cell"]:
        return list(self._links.keys())

    @property
    def neighbors(self) -> List["Cell"]:
        """Adjacent cells (regardless of whether a passage exists)."""
        return [c for c in (self.north, self.south, self.east, self.west) if c is not None]

    @property
    def coords(self) -> Coord:
        return (self.row, self.col)

    def direction_to(self, other: "Cell") -> Optional[str]:
        """Return 'north'|'south'|'east'|'west' for an orthogonal neighbour."""
        if other is self.north:
            return "north"
        if other is self.south:
            return "south"
        if other is self.east:
            return "east"
        if other is self.west:
            return "west"
        return None

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return f"Cell({self.row}, {self.col})"


class Grid:
    """A rectangular grid of :class:`Cell` objects — the maze itself.

    A freshly constructed grid has no passages; run a generator
    (:mod:`mazeforge.generators`) to carve one.
    """

    def __init__(self, rows: int, cols: int) -> None:
        if rows < 1 or cols < 1:
            raise ValueError("rows and cols must both be >= 1")
        self.rows = rows
        self.cols = cols
        self._grid: List[List[Cell]] = [
            [Cell(r, c) for c in range(cols)] for r in range(rows)
        ]
        self._configure_neighbors()

    def _configure_neighbors(self) -> None:
        for cell in self.each_cell():
            r, c = cell.row, cell.col
            cell.north = self.cell_at(r - 1, c)
            cell.south = self.cell_at(r + 1, c)
            cell.west = self.cell_at(r, c - 1)
            cell.east = self.cell_at(r, c + 1)

    # -- access ----------------------------------------------------------------

    def cell_at(self, row: int, col: int) -> Optional[Cell]:
        if 0 <= row < self.rows and 0 <= col < self.cols:
            return self._grid[row][col]
        return None

    def __getitem__(self, pos: Coord) -> Optional[Cell]:
        row, col = pos
        return self.cell_at(row, col)

    def __contains__(self, cell: object) -> bool:
        return isinstance(cell, Cell) and self.cell_at(cell.row, cell.col) is cell

    @property
    def size(self) -> int:
        return self.rows * self.cols

    def each_row(self) -> Iterator[List[Cell]]:
        yield from self._grid

    def each_cell(self) -> Iterator[Cell]:
        for row in self._grid:
            yield from row

    def random_cell(self, rng: Optional[random.Random] = None) -> Cell:
        r = rng or random
        return r.choice(r.choice(self._grid))

    def corner(self, which: str = "nw") -> Cell:
        """Return a corner cell: one of 'nw', 'ne', 'sw', 'se'."""
        pos = {
            "nw": (0, 0),
            "ne": (0, self.cols - 1),
            "sw": (self.rows - 1, 0),
            "se": (self.rows - 1, self.cols - 1),
        }[which]
        return self._grid[pos[0]][pos[1]]

    # -- topology --------------------------------------------------------------

    def deadends(self) -> List[Cell]:
        """Cells with exactly one passage."""
        return [c for c in self.each_cell() if len(c.links) == 1]

    def edge_count(self) -> int:
        """Number of passages (carved walls)."""
        return sum(len(c.links) for c in self.each_cell()) // 2

    def is_connected(self) -> bool:
        """True when every cell is reachable from the top-left via passages."""
        start = self._grid[0][0]
        seen = {start}
        queue: deque[Cell] = deque([start])
        while queue:
            cell = queue.popleft()
            for nxt in cell.links:
                if nxt not in seen:
                    seen.add(nxt)
                    queue.append(nxt)
        return len(seen) == self.size

    def is_perfect(self) -> bool:
        """A *perfect* maze is a spanning tree: connected with no loops."""
        return self.edge_count() == self.size - 1 and self.is_connected()

    def braid(self, p: float = 1.0, rng: Optional[random.Random] = None) -> "Grid":
        """Remove a fraction ``p`` of dead ends by linking each to a neighbour.

        Produces a *braided* maze (loops, multiple solutions). ``p=1`` removes
        every dead end; ``p=0`` is a no-op.
        """
        r = rng or random
        deadends = self.deadends()
        r.shuffle(deadends)
        for cell in deadends:
            if len(cell.links) != 1 or r.random() > p:
                continue
            # Prefer linking to a neighbour that is itself a dead end.
            options = [n for n in cell.neighbors if not cell.is_linked(n)]
            best = [n for n in options if len(n.links) == 1] or options
            if best:
                cell.link(r.choice(best))
        return self

    # -- interop ---------------------------------------------------------------

    def to_wall_grid(self) -> List[List[int]]:
        """Convert to a ``(2*rows+1) x (2*cols+1)`` wall grid (1=wall, 0=path).

        Compatible with the wall-grid representation used by the web game and by
        most grid maze renderers/solvers.
        """
        h, w = 2 * self.rows + 1, 2 * self.cols + 1
        grid = [[1] * w for _ in range(h)]
        for cell in self.each_cell():
            r, c = 2 * cell.row + 1, 2 * cell.col + 1
            grid[r][c] = 0
            if cell.is_linked(cell.south):
                grid[r + 1][c] = 0
            if cell.is_linked(cell.east):
                grid[r][c + 1] = 0
        return grid

    @classmethod
    def from_wall_grid(cls, walls: List[List[int]]) -> "Grid":
        """Build a Grid from a ``(2r+1) x (2c+1)`` wall grid (inverse of above)."""
        if not walls or not walls[0]:
            raise ValueError("wall grid must be non-empty")
        rows = (len(walls) - 1) // 2
        cols = (len(walls[0]) - 1) // 2
        grid = cls(rows, cols)
        for cell in grid.each_cell():
            r, c = 2 * cell.row + 1, 2 * cell.col + 1
            if cell.south and walls[r + 1][c] == 0:
                cell.link(cell.south)
            if cell.east and walls[r][c + 1] == 0:
                cell.link(cell.east)
        return grid

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return f"Grid(rows={self.rows}, cols={self.cols}, passages={self.edge_count()})"


# A friendly alias — a generated Grid *is* the maze.
Maze = Grid
