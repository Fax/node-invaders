// this is implementing all these things:

// https://github.com/zetsin/node-sdl2#api-references
const NS = require('node-sdl2');
const SDL_video = NS.require('SDL_video');
const SDL_render = NS.require('SDL_render');
const SDL_timer = NS.require('SDL_timer');

export interface IEnemy {
  block: IBlock;
  alive: boolean;
  shotdown: boolean;
}
export interface IPlayer {
  block: IBlock;
}
export interface IBlock {
  x: number;
  y: number;
  size: number;
}

export interface IGameState {
  w: number; // window width
  h: number; // window height

  stage: number; // level = 0, 1, 2 , ...

  N: number; // max number of enemies
  enemies: IEnemy[];
  global_time: number;

  player: IPlayer;
  bullet: IBlock;
  can_shoot: boolean;
}

export interface IKey {
  scancode: number;
  scanname: string;
  keycode: number;
  keyname: string;
  repeat: boolean;
}
export interface IMousePosition {
  x: number;
  y: number;
  xrel: number;
  yrel: number;
}
export interface IMouseData {
  x: number;
  y: number;
  clicks: number;
  button: string;
}

export class ReaderCore {
  private app: any;
  private window: any;
  private gameState: IGameState;
  private time: number;
  private keep_running: boolean;
  constructor(title: string) {

    this.app = NS.app;
    this.AttachAppEvents();


    this.gameState = this.initState(0);
    this.window = new NS.window({
      title,
      show: false,
      w: this.gameState.w,
      h: this.gameState.h,
    });
    this.AttachWindowEvents();
    this.time = SDL_timer.SDL_GetTicks();
    this.Run();
  }

  private AttachAppEvents() {
    this.app.on('window-all-closed', () => { });
    this.app.on('before-quit', (event: any) => { });
    this.app.on('will-quit', (event: any) => { });
    this.app.on('drop', (file: any) => {
      console.log(file);
    });
  }

  private AttachWindowEvents() {
    this.window.on('change', (w, h) => { });
    this.window.on('close', (event) => { });
    this.window.on('show', () => { });
    this.window.on('hide', () => { });
    this.window.on('move', (x, y) => { });
    this.window.on('resize', (w, h) => { });

    this.window.on('minimize', () => { });
    this.window.on('maximize', () => { });
    this.window.on('restore', () => { });
    this.window.on('enter', () => { });
    this.window.on('leave', () => { });
    this.window.on('focus', () => { });
    this.window.on('blur', () => { });
    this.window.on('keydown', (key: IKey) => {
      let time_prev = this.time;
      this.time = SDL_timer.SDL_GetTicks();
      const dt = (this.time - time_prev) * 0.001; // in seconds
      if (key.scanname == 'Right') {
        this.gameState.player.block.x += dt * 200.0;
        if (this.gameState.player.block.x > this.gameState.w - 1) {
          this.gameState.player.block.x = this.gameState.w - 1;
        }
      }
      // Move left
      if (key.scanname == 'Left') {
        this.gameState.player.block.x -= dt * 200.0;
        if (this.gameState.player.block.x < 0) {
          this.gameState.player.block.x = 0;
        }
      }
      // Shoot
      if (key.scanname == 'Space' && this.gameState.can_shoot) {
        this.gameState.can_shoot = false;
        this.gameState.bullet.x = this.gameState.player.block.x;
        this.gameState.bullet.y = this.gameState.player.block.y - this.gameState.player.block.size;
      }
    });
    this.window.on('keyup', (key: IKey) => { });
    this.window.on('editing', ({ str, start, length }) => { });
    this.window.on('textinput', (str: string) => { });
    this.window.on('mousemove', (pos: IMousePosition) => { });
    this.window.on('mousedown', (mou: IMouseData) => {
      console.log('mousedown', mou);
    });
    this.window.on('mouseup', (mou: IMouseData) => { });

    this.window.on('close', () => {
      this.keep_running = false;
      this.app.quit();
    });
    this.window.on('change', () => {
      this.Render();
    });
  }

  public Show() {
    this.window.show = true;
  }
  public Hide() {
    this.window.show = false;
  }

  public TestLog() {
    console.log('something something');
  }
  public Run() {
    let time_prev = 0;
    this.keep_running = true;
    setInterval(
      () => {
        time_prev = this.time;
        this.time = SDL_timer.SDL_GetTicks();
        const dt = (this.time - time_prev) * 0.001; // in seconds
        this.updateState(dt);
        this.Render();
        SDL_timer.SDL_Delay(2);
      }
    );

  }

  public Render() {
    let time_prev = 0;
    time_prev = this.time;
    this.time = SDL_timer.SDL_GetTicks();
    const dt = (this.time - time_prev) * 0.001; // in seconds
    this.updateState(dt);

    const render = this.window.render;
    const size = render.outputSize;

    const renderer = render._render;
    SDL_render.SDL_SetRenderDrawColor(renderer, 50, 50, 50, 255);
    SDL_render.SDL_RenderClear(renderer);

    if (this.gameState) {
      for (let i: number = 0; i < 10; i++) {
        this.drawBlock(renderer, this.gameState.enemies[i].block, 170, 0, 10, 255);
      }
    }

    this.drawBlock(renderer, this.gameState.player.block, 255, 0, 0, 255);
    this.drawBlock(renderer, this.gameState.bullet, 255, 0, 0, 255);

    // update window buffer
    render.present();
  }

  private drawBlock(renderer, block: IBlock, red, green, blue, alpha) {
    const eblock = block;
    const x = (eblock.x - eblock.size);
    const y = (eblock.y - eblock.size);
    const r = { x, y, w: eblock.size * 2, h: eblock.size * 2 };
    SDL_render.SDL_SetRenderDrawColor(renderer, red, green, blue, alpha);
    this.window.render.fillRect([r]);
    //SDL_render.SDL_RenderFillRect(renderer, r);
  }
  public TestSdl() {
    this.window.show = true;
  }

  private collide(a: IBlock, b: IBlock): boolean {
    return (Math.abs(a.x - b.x) < a.size + b.size) && (Math.abs(a.y - b.y) < a.size + b.size);
  }

  private updateState(deltaTime: number) {
    const gs = this.gameState;
    if (!gs.can_shoot) {
      gs.bullet.y -= 200 * deltaTime;
      if (gs.bullet.y < 0) {
        gs.can_shoot = true;
        gs.bullet.y = gs.h * 2;
      }
    }
    gs.global_time += deltaTime;
    const t = gs.global_time;
    const speed = (18.0 + 2.0 * gs.stage) * Math.sqrt(t);
    const freq = 6.0 + gs.stage / 4;
    const z = 2.0 * Math.sin(freq * t) + Math.pow(Math.sin(0.25 * freq * t), 19);
    const displace_x = speed * z * deltaTime;
    const displace_y = 0.03 * speed * Math.pow(z, 4) * deltaTime;
    let player_died = false;
    let enemies_dead = true;
    for (let i = 0; i < gs.N; i++) {
      if (gs.enemies[i] && gs.enemies[i].alive) {
        enemies_dead = false;
        if (gs.enemies[i].shotdown) {
          // shotdown enemies
          gs.enemies[i].block.y += 200.0 * deltaTime;
          gs.enemies[i].block.x += 100.0 * ((gs.enemies[i].block.x < gs.w / 2 ? -1 : 1) + 0.2 * z) * deltaTime;
        }
        else {
          // normal enemies
          gs.enemies[i].block.x += displace_x;
          gs.enemies[i].block.y += displace_y;
        }
        // if collides with a bullet
        if (this.collide(gs.enemies[i].block, gs.bullet)) {
          if (!gs.enemies[i].shotdown) {
            gs.enemies[i].shotdown = true;
          }

          gs.can_shoot = true;
          gs.bullet.y = gs.h * 2;
        }
        if (this.collide(gs.enemies[i].block, gs.player.block)) {
          player_died = true;
        }

        // an enemy falls on the ground
        if (gs.enemies[i].block.y > gs.h + gs.enemies[i].block.size) {
          gs.enemies[i].alive = false;
        }
      }
    }
    if (player_died) {
      let prev_stage = gs.stage - 1;
      if (prev_stage < 0) { prev_stage = 0; }
      this.gameState = this.initState(prev_stage);
    }
    if (enemies_dead) {
      const x = gs.player.block.x;
      this.gameState = this.initState(gs.stage + 1);
      gs.player.block.x = x;
    }

  }

  private initState(stage: number): IGameState {
    const state: IGameState = {
      w: 200,
      h: 300,
      player: {
        block: {
          x: 0,
          y: 0,
          size: 0,
        },
      },
      stage,
      enemies: <IEnemy[]>[],
      bullet: <IBlock>{},
      can_shoot: false,
      global_time: 0,
      N: 100,
    };
    state.player.block.size = 10;
    state.player.block.x = state.w / 2;
    state.player.block.y = state.h - 2 * state.player.block.size;

    state.bullet = {
      x: 0,
      y: 0,
      size: 0,
    };

    state.bullet.x = 0;
    state.bullet.y = state.h * 2;
    state.bullet.size = 3;
    state.can_shoot = true;
    state.stage = stage;

    state.global_time = 0.0;

    const enemy_size = 8;
    const ww = 4; // number of columns
    const hh = 4; // number of rows
    const shiftx = state.w / 2 - enemy_size * 4 * (ww - 1) / 2;
    const shifty = enemy_size * 2;
    state.enemies = [];
    for (let i = 0; i < ww; i++) {
      for (let j = 0; j < hh; j++) {
        const index = i + j * ww;
        let size = enemy_size - (Math.random() % (stage + 1));
        if (size < enemy_size / 2) {
          size = enemy_size / 2;
        }
        const enemy = {
          alive: true,
          shotdown: false,
          block: {
            x: i * enemy_size * 4 + shiftx,
            y: j * enemy_size * 4 + shifty,
            size: size,
          }
        }
        // small shifts
        enemy.block.y += Math.random() % (enemy_size - size + 1) / 2;
        enemy.block.x += Math.random() % (enemy_size - size + 1) / 2 *
          (Math.random() % 2 * 2 - 1);

        state.enemies.push(enemy);
      }
    }

    return state;
  }
}

const reader = new ReaderCore('new window');

reader.TestLog();
reader.TestSdl();

//console.log(SDL2_render.SDL_RenderDrawLine);