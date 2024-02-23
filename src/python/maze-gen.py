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
    for y in range(len(maze)):
        for x in range(len(maze[y])):
            cell = maze[y][x]
            if cell == 'W':
                pygame.draw.rect(screen, WALL_COLOR, (x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE))
            else:
                pygame.draw.rect(screen, PATH_COLOR, (x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE))
    pygame.draw.rect(screen, PLAYER_COLOR, player.rect)

def is_path(maze, x, y):
    if 0 <= x < len(maze[0]) and 0 <= y < len(maze) and maze[y][x] == 'P':
        return True
    return False

def generate_maze(width, height):
    maze = [['W' for _ in range(width)] for _ in range(height)]
    stack = [(1, 1)]

    while stack:
        cell = stack[-1]
        x, y = cell
        maze[y][x] = 'P'  # Mark cell as path
        neighbors = []

        if x > 1 and maze[y][x - 2] == 'W':
            neighbors.append((x - 2, y))
        if x < width - 2 and maze[y][x + 2] == 'W':
            neighbors.append((x + 2, y))
        if y > 1 and maze[y - 2][x] == 'W':
            neighbors.append((x, y - 2))
        if y < height - 2 and maze[y + 2][x] == 'W':
            neighbors.append((x, y + 2))

        if neighbors:
            next_cell = random.choice(neighbors)
            nx, ny = next_cell
            if nx == x:
                maze[min(ny, y) + 1][x] = 'P'
            else:
                maze[y][min(nx, x) + 1] = 'P'
            stack.append(next_cell)
        else:
            stack.pop()

    return maze

def main():
    maze = generate_maze(SCREEN_WIDTH // CELL_SIZE, SCREEN_HEIGHT // CELL_SIZE)
    player = Player(1, 1)

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    if is_path(maze, player.rect.x // CELL_SIZE - 1, player.rect.y // CELL_SIZE):
                        player.move(-1, 0)
                elif event.key == pygame.K_RIGHT:
                    if is_path(maze, player.rect.x // CELL_SIZE + 1, player.rect.y // CELL_SIZE):
                        player.move(1, 0)
                elif event.key == pygame.K_UP:
                    if is_path(maze, player.rect.x // CELL_SIZE, player.rect.y // CELL_SIZE - 1):
                        player.move(0, -1)
                elif event.key == pygame.K_DOWN:
                    if is_path(maze, player.rect.x // CELL_SIZE, player.rect.y // CELL_SIZE + 1):
                        player.move(0, 1)

        screen.fill(BACKGROUND_COLOR)
        draw_maze(maze, player)
        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
