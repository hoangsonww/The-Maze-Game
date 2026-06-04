# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""Interactive pygame maze — a thin player built on the mazeforge library.

Run with ``mazeforge play`` (after ``pip install mazeforge[play]``) or
``python -m mazeforge play``.

Controls: arrow keys / WASD to move, ``H`` to reveal the A* solution, ``R`` for
a new maze, ``Esc`` to quit.
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass

from .generators import generate
from .grid import Grid
from .solvers import solve


def _require_pygame():
    try:
        import pygame  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "Interactive play needs pygame. Install it with: pip install mazeforge[play]"
        ) from exc
    return pygame


BG = (11, 14, 17)
WALL = (16, 22, 47)
FLOOR = (238, 243, 233)
PLAYER = (255, 106, 77)
GOAL = (30, 215, 96)
HINT = (255, 210, 74)
TEXT = (238, 243, 233)


@dataclass
class _Game:
    maze: Grid
    rows: int
    cols: int
    pr: int = 0
    pc: int = 0
    show_hint: bool = False
    won: bool = False
    start: float = 0.0

    def reset(self) -> None:
        self.maze = generate(self.rows, self.cols, "recursive_backtracker")
        self.pr = self.pc = 0
        self.show_hint = False
        self.won = False
        self.start = time.time()

    def try_move(self, dr: int, dc: int) -> None:
        if self.won:
            return
        cur = self.maze.cell_at(self.pr, self.pc)
        nxt = self.maze.cell_at(self.pr + dr, self.pc + dc)
        if cur is not None and nxt is not None and cur.is_linked(nxt):
            self.pr, self.pc = nxt.row, nxt.col
            if (nxt.row, nxt.col) == (self.rows - 1, self.cols - 1):
                self.won = True


def main(rows: int = 16, cols: int = 24, cell: int = 28) -> None:
    pygame = _require_pygame()
    pygame.init()

    margin = 24
    hud = 44
    width = cols * cell + margin * 2
    height = rows * cell + margin * 2 + hud
    screen = pygame.display.set_mode((width, height))
    pygame.display.set_caption("mazeforge — Maze Game")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("menlo,consolas,monospace", 18)

    game = _Game(generate(rows, cols, "recursive_backtracker"), rows, cols, start=time.time())

    moves = {
        pygame.K_LEFT: (0, -1), pygame.K_a: (0, -1),
        pygame.K_RIGHT: (0, 1), pygame.K_d: (0, 1),
        pygame.K_UP: (-1, 0), pygame.K_w: (-1, 0),
        pygame.K_DOWN: (1, 0), pygame.K_s: (1, 0),
    }

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key == pygame.K_r:
                    game.reset()
                elif event.key == pygame.K_h:
                    game.show_hint = not game.show_hint
                elif event.key in moves:
                    game.try_move(*moves[event.key])

        maze = game.maze
        screen.fill(BG)

        for c in maze.each_cell():
            x = margin + c.col * cell
            y = margin + c.row * cell
            pygame.draw.rect(screen, FLOOR, (x, y, cell, cell))
        for c in maze.each_cell():
            x = margin + c.col * cell
            y = margin + c.row * cell
            if c.north is None:
                pygame.draw.line(screen, WALL, (x, y), (x + cell, y), 2)
            if c.west is None:
                pygame.draw.line(screen, WALL, (x, y), (x, y + cell), 2)
            if not c.is_linked(c.east):
                pygame.draw.line(screen, WALL, (x + cell, y), (x + cell, y + cell), 2)
            if not c.is_linked(c.south):
                pygame.draw.line(screen, WALL, (x, y + cell), (x + cell, y + cell), 2)

        if game.show_hint:
            for c in solve(maze, algorithm="astar").path:
                cx = margin + c.col * cell + cell // 2
                cy = margin + c.row * cell + cell // 2
                pygame.draw.circle(screen, HINT, (cx, cy), max(2, cell // 8))

        gx = margin + (cols - 1) * cell
        gy = margin + (rows - 1) * cell
        pygame.draw.rect(screen, GOAL, (gx + 4, gy + 4, cell - 8, cell - 8), border_radius=4)
        px = margin + game.pc * cell
        py = margin + game.pr * cell
        pygame.draw.circle(screen, PLAYER, (px + cell // 2, py + cell // 2), cell // 3)

        elapsed = 0.0 if game.won else time.time() - game.start
        label = "Solved! Press R" if game.won else f"{elapsed:5.1f}s"
        hud_text = f"{label}   ·   H: hint   R: new   Esc: quit"
        screen.blit(font.render(hud_text, True, TEXT), (margin, height - hud + 12))

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    sys.exit(0)


if __name__ == "__main__":  # pragma: no cover
    main()
