# The Maze Game
#
# @author Son Nguyen <hoangson091104@gmail.com>
# @copyright Copyright (c) 2026 Son Nguyen. All rights reserved.
# @license MIT
# @see https://github.com/hoangsonww/The-Maze-Game

"""Command-line interface for mazeforge.

Examples::

    mazeforge generate --rows 20 --cols 30 --algo recursive_backtracker --solve
    mazeforge generate -r 25 -c 25 --algo wilson --format png --out maze.png --solve
    mazeforge list
    mazeforge benchmark --rows 40 --cols 40
    mazeforge play
"""

from __future__ import annotations

import argparse
import sys
import time
from typing import List, Optional

from . import __version__
from .generators import ALGORITHMS, DEFAULT_ALGORITHM, generate
from .render import to_ascii
from .solvers import DEFAULT_SOLVER, HEURISTICS, SOLVERS, solve


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="mazeforge", description=__doc__.split("\n")[0])
    parser.add_argument("--version", action="version", version=f"mazeforge {__version__}")
    sub = parser.add_subparsers(dest="command", required=True)

    gen = sub.add_parser("generate", help="generate (and optionally solve) a maze")
    gen.add_argument("-r", "--rows", type=int, default=15)
    gen.add_argument("-c", "--cols", type=int, default=15)
    gen.add_argument("--algo", choices=sorted(ALGORITHMS), default=DEFAULT_ALGORITHM)
    gen.add_argument("--seed", type=int, default=None)
    gen.add_argument("--braid", type=float, default=0.0, help="fraction of dead ends to remove")
    gen.add_argument("--solve", action="store_true", help="also solve the maze")
    gen.add_argument("--solver", choices=sorted(SOLVERS), default=DEFAULT_SOLVER)
    gen.add_argument("--heuristic", choices=sorted(HEURISTICS), default="manhattan")
    gen.add_argument("--format", choices=["ascii", "png", "wall"], default="ascii")
    gen.add_argument("--out", default=None, help="output file (png/wall formats)")

    sub.add_parser("list", help="list available algorithms")

    bench = sub.add_parser("benchmark", help="time every generator and solver")
    bench.add_argument("-r", "--rows", type=int, default=40)
    bench.add_argument("-c", "--cols", type=int, default=40)
    bench.add_argument("--seed", type=int, default=0)

    sub.add_parser("play", help="play interactively (needs the [play] extra: pygame)")
    return parser


def _cmd_generate(args: argparse.Namespace) -> int:
    maze = generate(args.rows, args.cols, args.algo, seed=args.seed, braid=args.braid)
    path = None
    if args.solve:
        kwargs = {}
        if args.solver in ("astar", "greedy"):
            kwargs["heuristic"] = args.heuristic
        result = solve(maze, algorithm=args.solver, **kwargs)
        if not result.found:
            print("No solution found.", file=sys.stderr)
            return 1
        path = result.path

    if args.format == "ascii":
        print(to_ascii(maze, path=path))
    elif args.format == "wall":
        rows = ["".join("#" if v else " " for v in row) for row in maze.to_wall_grid()]
        text = "\n".join(rows)
        if args.out:
            with open(args.out, "w", encoding="utf-8") as fh:
                fh.write(text + "\n")
            print(f"Wrote {args.out}")
        else:
            print(text)
    elif args.format == "png":
        from .render import render_image

        out = args.out or "maze.png"
        render_image(maze, path=path, save_to=out)
        print(f"Wrote {out}")

    if args.solve and path is not None:
        print(f"\nSolved with {args.solver}: {result.cost} steps, "
              f"{result.explored} cells explored.", file=sys.stderr)
    return 0


def _cmd_list(_: argparse.Namespace) -> int:
    print("Generators:")
    for name in sorted(ALGORITHMS):
        print(f"  {name}")
    print("\nSolvers:")
    for name in sorted(SOLVERS):
        print(f"  {name}")
    print("\nHeuristics (for astar/greedy):")
    for name in sorted(HEURISTICS):
        print(f"  {name}")
    return 0


def _cmd_benchmark(args: argparse.Namespace) -> int:
    print(f"Maze size: {args.rows}x{args.cols} ({args.rows * args.cols} cells)\n")
    print("Generators:")
    sample = None
    for name in sorted(ALGORITHMS):
        t0 = time.perf_counter()
        maze = generate(args.rows, args.cols, name, seed=args.seed)
        dt = (time.perf_counter() - t0) * 1000
        perfect = "perfect" if maze.is_perfect() else "braided"
        print(f"  {name:<24} {dt:8.2f} ms   ({perfect}, {len(maze.deadends())} dead ends)")
        if sample is None:
            sample = maze

    assert sample is not None
    print("\nSolvers (on a recursive_backtracker maze):")
    sample = generate(args.rows, args.cols, "recursive_backtracker", seed=args.seed)
    for name in sorted(SOLVERS):
        t0 = time.perf_counter()
        result = solve(sample, algorithm=name)
        dt = (time.perf_counter() - t0) * 1000
        status = f"{result.cost} steps, {result.explored} explored" if result.found else "NO PATH"
        print(f"  {name:<24} {dt:8.2f} ms   ({status})")
    return 0


def _cmd_play(_: argparse.Namespace) -> int:
    try:
        from .play import main as play_main
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    play_main()
    return 0


_DISPATCH = {
    "generate": _cmd_generate,
    "list": _cmd_list,
    "benchmark": _cmd_benchmark,
    "play": _cmd_play,
}


def main(argv: Optional[List[str]] = None) -> int:
    args = _build_parser().parse_args(argv)
    return _DISPATCH[args.command](args)


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
