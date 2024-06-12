import pygame
import random
import sys

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH, SCREEN_HEIGHT = 800, 600
BACKGROUND_COLOR = (0, 0, 0)
WALL_COLOR = (255, 255, 255)
PATH_COLOR = (0, 0, 255)
PLAYER_COLOR = (255, 0, 0)
CELL_SIZE = 40
WALL_THICKNESS = 2
FPS = 60

# Screen setup
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption('Maze Game')
clock = pygame.time.Clock()


class Player:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

    def move(self, dx, dy):
        self.rect.x += dx * CELL_SIZE
        self.rect.y += dy * CELL_SIZE


def draw_maze(maze, player):
    maze_width = len(maze[0]) * CELL_SIZE
    maze_height = len(maze) * CELL_SIZE

    x_offset = (SCREEN_WIDTH - maze_width) // 2
    y_offset = (SCREEN_HEIGHT - maze_height) // 2

    for y in range(len(maze)):
        for x in range(len(maze[y])):
            cell = maze[y][x]
            if cell == 'W':
                pygame.draw.rect(screen, WALL_COLOR, (x_offset + x * CELL_SIZE, y_offset + y * CELL_SIZE, CELL_SIZE, CELL_SIZE))
            else:
                pygame.draw.rect(screen, PATH_COLOR, (x_offset + x * CELL_SIZE, y_offset + y * CELL_SIZE, CELL_SIZE, CELL_SIZE))
    pygame.draw.rect(screen, PLAYER_COLOR, (x_offset + player.rect.x, y_offset + player.rect.y, CELL_SIZE, CELL_SIZE))


def is_path(maze, x, y):
    if 0 <= x < len(maze[0]) and 0 <= y < len(maze) and maze[y][x] == 'P':
        return True
    return False


def find_neighbors(x, y, width, height, maze):
    """Identify and return valid neighboring cells for maze generation."""
    neighbors = []
    if x > 1 and maze[y][x - 2] == 'W':
        neighbors.append((x - 2, y))
    if x < width - 2 and maze[y][x + 2] == 'W':
        neighbors.append((x + 2, y))
    if y > 1 and maze[y - 2][x] == 'W':
        neighbors.append((x, y - 2))
    if y < height - 2 and maze[y + 2][x] == 'W':
        neighbors.append((x, y + 2))
    return neighbors


def connect_cells(maze, cell, next_cell):
    """Connect the current cell to the chosen next cell in the maze."""
    x, y = cell
    nx, ny = next_cell
    if nx == x:
        maze[min(ny, y) + 1][x] = 'P'
    else:
        maze[y][min(nx, x) + 1] = 'P'


def generate_maze(width, height):
    maze = [['W' for _ in range(width)] for _ in range(height)]
    stack = [(1, 1)]

    while stack:
        cell = stack[-1]
        x, y = cell
        maze[y][x] = 'P'
        neighbors = find_neighbors(x, y, width, height, maze)

        if neighbors:
            next_cell = random.choice(neighbors)
            connect_cells(maze, cell, next_cell)
            stack.append(next_cell)
        else:
            stack.pop()

    return maze


def process_events(player, maze):
    """Handle all Pygame events and return a boolean status for the game loop."""
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            return False
        if event.type == pygame.KEYDOWN:
            if process_keydown(event.key, player, maze):
                return False
    return True


def process_keydown(key, player, maze):
    """Process keydown events and move the player if the path is valid."""
    directions = {
        pygame.K_LEFT: (-1, 0),
        pygame.K_RIGHT: (1, 0),
        pygame.K_UP: (0, -1),
        pygame.K_DOWN: (0, 1),
    }
    if key in directions:
        dx, dy = directions[key]
        new_x = player.rect.x // CELL_SIZE + dx
        new_y = player.rect.y // CELL_SIZE + dy
        if is_path(maze, new_x, new_y):
            player.move(dx, dy)


def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    clock = pygame.time.Clock()

    maze = generate_maze(SCREEN_WIDTH // CELL_SIZE, SCREEN_HEIGHT // CELL_SIZE)
    player = Player(1, 1)

    running = True
    while running:
        running = process_events(player, maze)

        screen.fill(BACKGROUND_COLOR)
        draw_maze(maze, player)
        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
