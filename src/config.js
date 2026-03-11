/**
 * Configuração central do jogo.
 * Altere aqui para ajustar velocidade progressiva, obstáculos, recompensas, etc.
 */

// —— Velocidade —————————————————————————————————————————————————————————————
// Níveis de velocidade: intervalo entre movimentos em ms (quanto menor, mais rápido)
export const SPEED_LEVEL_MS = {
  1: 250,
  2: 200,
  3: 150,
  4: 100,
  5: 70,
};
export const SPEED_LEVELS = [1, 2, 3, 4, 5];

// Velocidade progressiva: a cada X pontos o jogo sobe um nível de velocidade
export const POINTS_PER_SPEED_LEVEL = 10;
// Nível máximo de velocidade (não passa desse nível mesmo com muitos pontos)
export const SPEED_LEVEL_MAX = 5;

// —— Recompensas (comidas) ———————————————————————————————————————————————————
// Comidas de 2 e 3 pontos: piscam após X ms e expiram após Y ms
export const FOOD_BLINK_START_MS = 4000;
export const FOOD_EXPIRE_MS = 8000;
export const FOOD_BLINK_INTERVAL_MS = 200;
// Tempo sem nenhuma comida visível para gerar novas (ms)
export const NO_FOOD_SPAWN_MS = 5000;

// —— Obstáculos ——————————————————————————————————————————————————————————————
// Renovam a cada X ms (só aplicado quando atinge mínimo de pontos ou tempo)
export const OBSTACLE_CHANGE_MS = 8000;
export const OBSTACLE_COUNT_MIN = 3;
export const OBSTACLE_COUNT_MAX = 7;
// Obstáculos só passam a mudar a partir de X pontos OU X segundos de jogo
export const OBSTACLE_MIN_SCORE = 100;
export const OBSTACLE_MIN_TIME_SEC = 60;

// —— Bônus no game over (cálculo da pontuação) ——————————————————————————————
export const MOVES_REF = 80;
export const TIME_REF_SEC = 90;
export const BONUS_MAX = 0.5;

// —— Cobrinhas de fundo (tela inicial) ———————————————————————————————————————
// Quantidade de cobras (sorteada no range ao carregar a tela)
export const MENU_SNAKES_COUNT_MIN = 10;
export const MENU_SNAKES_COUNT_MAX = 15;
// Velocidade: pixels por tick (cada cobra sorteia um valor no range)
export const MENU_SNAKES_SPEED_MIN = 10;
export const MENU_SNAKES_SPEED_MAX = 15;
// Opacidade: 0–1 (cada cobra sorteia um valor no range)
export const MENU_SNAKES_OPACITY_MIN = 0.2;
export const MENU_SNAKES_OPACITY_MAX = 0.5;
// Mudança de rota: ticks entre curvas (menor = mais curvas; cada cobra sorteia no range)
export const MENU_SNAKES_TURN_TICKS_MIN = 8;
export const MENU_SNAKES_TURN_TICKS_MAX = 25;
// Tempo de vida em segundos (cada cobra sorteia no range); ao acabar inicia o fade out
export const MENU_SNAKES_LIFETIME_MIN = 12;
export const MENU_SNAKES_LIFETIME_MAX = 28;
// Duração do fade out em segundos (sumir suavemente antes de renascer na lateral)
export const MENU_SNAKES_FADEOUT_SEC = 4;
