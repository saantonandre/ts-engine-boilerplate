// Default spritesheet
import  spritesheet from "assets/sheet.png";
const sheet = new Image();
sheet.src = spritesheet;

/** Class representing a sprite,
 * i.e. an object capable of iterating through a set of image frames, creating the illusion of animation.
 */
export class Sprite {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Each entity has the same spritesheet by default, but it can be changed */
  sheet: HTMLImageElement = sheet;
  /** The animation currently rendering (defaults to 'idle') */
  animation: string = "idle";
  /** Whenever a new animation is created, it will end up here */
  animations: any = {};
  /** Toggle used to skip this entity's rendering, for a reason or another */
  display: boolean = true;
  /** Defines if this sprite is facing to the left */
  left: number = 0;
  /** Represents the current frame of the current sprite animation */
  frame: number = 0;
  /** Counts the amount of rendering iterations since the last animation frame change */
  frameCounter: number = 0;
  removed: boolean = false;
  rot: number = 0;
  /**
   * Creates a new Sprite object at the given coordinates and of the specified size.
   * Commonly used as an extension to children classes, like entities or visual effects.
   *
   * *Note: Coordinates and sizes are expressed in tilesize units*
   * @param {Number} x Horizontal coordinate relative to the drawing environment
   * @param {Number} y Vertical coordinate relative to the drawing environment
   * @param {Number} w Width
   * @param {Number} h Height
   */
  constructor(x: number, y: number, w: number = 1, h: number = 1) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // eg. setting an animation:
    //this.setAnimation("idle", [0], [0]);
  }
  /** Returns true if the animation has changed, false otherwise
   *  Usage example: this.loadAnimation('attack')
   */
  loadAnimation(label: string) {
    if (this.animation === label) {
      return false;
    }
    this.frameCounter = 0;
    this.frame = 0;
    this.animation = label;
    return true;
  }
  /**
   * What happens after the current animation ends.
   * Entities/vfxs will overwrite this function when needed, to add functionalities.
   * If no actions are specified, then the current animation will loop endlessly.
   *
   */
  onAnimationEnd() {
    /**
     * Example code inside this function:
     *
     *  switch(this.animation){
     *      case 'death':
     *          this.removed=true;
     *          break;
     *      case 'attack':
     *          this.loadAnimation('idle');
     *          break;
     *  }
     *
     */
  }

  renderHitbox(
    context: CanvasRenderingContext2D,
    tilesize: number,
    ratio: number,
    camera: { x: number; y: number }
  ): void {
  }
  /** Renders the base sprite, not animated, as a static icon in a specific location */
  renderItem(
    x: number,
    y: number,
    context: CanvasRenderingContext2D,
    tilesize: number,
    ratio: number,
    w = 1,
    h = 1
  ) {
    context.drawImage(
      this.sheet, // source of the sprite
      this.animations["idle"].keyframesX[0][0] * tilesize, // x pos of the sprite
      this.animations["idle"].keyframesY[0][0] * tilesize, // y pos of the sprite
      this.animations["idle"].w * tilesize, // width of the sprite
      this.animations["idle"].h * tilesize, // height of the sprite
      x * tilesize * ratio, // x of the entity
      y * tilesize * ratio, // y of the entity
      w * tilesize * ratio, // width of the entity
      h * tilesize * ratio // height of the entity
    );
  }
  /** Progresses the sprite animation
   * @param {Number} deltaTime Time multiplier
   */
  updateSprite(deltaTime: number = 1) {
    this.frameCounter += deltaTime;
    if (this.frameCounter >= this.animations[this.animation].slowness) {
      this.frame++;
      this.frameCounter = 0;
    }
    // If the current frame exceeded the current animation's length:
    if (
      this.frame >= this.animations[this.animation].keyframesX[this.left].length
    ) {
      this.frame = 0;
      this.frameCounter = 0;
      this.onAnimationEnd();
    }
  }
  /** Adds or overwrites an animation
   *
   * @param {String} label The name of the animation (using an already existing name will overwrite the animation)
   * @param {Number[]} keyframesX The positions of the sprite frames in the spritesheet (horizontal), expressed in tilesize
   * @param {Number[]} keyframesY The positions of the sprite frames in the spritesheet (vertical), expressed in tilesize
   * @param {0 | 1} left If set to 1 it will create a different animation whenever this object is facing to the left (has this.left = 1)
   *
   * @example
   * this.setAnimation('attack',[0,0,0],[1,2,3])  // Creates an animation labeled 'attack' composed of 3 animation frames
   *
   * this.setAnimation('attack',[1,1,1],[1,2,3], 1) // Sets a different animation for whenever the sprite faces to the left (optional)
   *
   */
  setAnimation(
    label: string,
    keyframesX: number[],
    keyframesY: number[],
    left: 0 | 1 = 0
  ) {
    if (!this.animations[label]) {
      this.animations[label] = new Animation(this);
    }
    if (left) {
      this.animations[label].keyframesX[1] = keyframesX;
      this.animations[label].keyframesY[1] = keyframesY;
    } else {
      /** If left-facing animation was not specified use the keyframes for both ways */
      this.animations[label].keyframesX[0] = keyframesX;
      this.animations[label].keyframesY[0] = keyframesY;

      this.animations[label].keyframesX[1] = keyframesX;
      this.animations[label].keyframesY[1] = keyframesY;
    }
  }
  /**
   * Renders this sprite current animation, at the given coordinates
   *
   * @param {CanvasRenderingContext2D} context The canvas drawing context
   * @param {Number} tilesize  The size of a single tile
   * @param {Number} ratio The scaling of each pixel
   * @param {object} camera Optional Camera abstraction representing an offset relative to the map (0,0) coordinates
   * @param {object} pivot The pivot of the rotation (defaults to the center of the current animation)
   */
  renderSprite(
    context: CanvasRenderingContext2D,
    tilesize: number,
    ratio: number,
    camera: { x: number; y: number } = { x: 0, y: 0 },
    pivot: { x: number; y: number } = { x: this.w / 2, y: this.h / 2 }
  ) {
    if (!this.display) {
      // Skips rendering
      return;
    }
    if (this.removed) {
      //console.log('rendering a removed entity!!!')
    }

    if (this.rot) {
      /** Rotated Rendering */
      context.save();
      context.translate(
        ((this.x +
          this.animations[this.animation].offsetX +
          pivot.x +
          camera.x) *
          tilesize *
          ratio) |
          0,
        ((this.y +
          this.animations[this.animation].offsetY +
          pivot.y +
          camera.y) *
          tilesize *
          ratio) |
          0
      );
      context.rotate(this.rot);
      context.drawImage(
        this.sheet, // source of the sprite
        this.animations[this.animation].keyframesX[this.left][this.frame] *
          tilesize, // x pos of the sprite
        this.animations[this.animation].keyframesY[this.left][this.frame] *
          tilesize, // y pos of the sprite
        this.animations[this.animation].w * tilesize, // width of the sprite
        this.animations[this.animation].h * tilesize, // height of the sprite
        (-pivot.x * tilesize * ratio) | 0, // x of the entity
        (-pivot.y * tilesize * ratio) | 0, // y of the entity
        (this.animations[this.animation].w * tilesize * ratio) | 0, // width of the entity
        (this.animations[this.animation].h * tilesize * ratio) | 0 // height of the entity
      );
      context.restore();
    } else {
      /** Default Rendering */
      context.drawImage(
        this.sheet, // source of the sprite
        this.animations[this.animation].keyframesX[this.left][this.frame] *
          tilesize, // x pos of the sprite
        this.animations[this.animation].keyframesY[this.left][this.frame] *
          tilesize, // y pos of the sprite
        this.animations[this.animation].w * tilesize, // width of the sprite
        this.animations[this.animation].h * tilesize, // height of the sprite
        ((this.x + this.animations[this.animation].offsetX + camera.x) *
          tilesize *
          ratio) |
          0, // x of the entity
        ((this.y + this.animations[this.animation].offsetY + camera.y) *
          tilesize *
          ratio) |
          0, // y of the entity
        (this.animations[this.animation].w * tilesize * ratio) | 0, // width of the entity
        (this.animations[this.animation].h * tilesize * ratio) | 0 // height of the entity
      );
    }
  }
  /**
   * Disregards the animation and renders an entity as a filled square,
   * can be used for debugging or as a placeholder.
   *
   * @param {CanvasRenderingContext2D} context The canvas drawing context
   * @param {Number} tilesize  The size of a single tile
   * @param {Number} ratio The scaling of each pixel
   * @param {Object} camera Optional Camera abstraction representing an offset relative to the map (0,0) coordinates
   * @param {Object} pivot The pivot of the rotation (defaults to the center of the current animation)
   */
  renderSquare(
    context: CanvasRenderingContext2D,
    tilesize: number,
    ratio: number,
    camera: { x: number; y: number } = { x: 0, y: 0 },
    pivot: { x: number; y: number } = { x: this.w / 2, y: this.h / 2 }
  ) {
    if (!this.display) {
      // Skips rendering
      return;
    }
    if (this.removed) {
      console.log("rendering a removed entity!!!");
    }
    if (this.rot) {
      // Rotated Rendering
      context.save();
      context.translate(
        ((this.x + pivot.x + camera.x) * tilesize * ratio) | 0,
        ((this.y + pivot.y + camera.y) * tilesize * ratio) | 0
      );
      context.rotate(this.rot);
      context.fillRect(
        (-pivot.x * tilesize * ratio) | 0, // x of the entity
        (-pivot.y * tilesize * ratio) | 0, // y of the entity
        (this.w * tilesize * ratio) | 0, // width of the entity
        (this.h * tilesize * ratio) | 0 // height of the entity
      );
      context.restore();
    } else {
      // Default Rendering
      context.fillRect(
        ((this.x + camera.x) * tilesize * ratio) | 0, // x of the entity
        ((this.y + camera.y) * tilesize * ratio) | 0, // y of the entity
        (this.w * tilesize * ratio) | 0, // width of the entity
        (this.h * tilesize * ratio) | 0 // height of the entity
      );
    }
  }
}
class Animation {
  keyframesX: never[][];
  keyframesY: never[][];
  slowness: number;
  w: any;
  h: any;
  offsetX: number;
  offsetY: number;
  constructor(entity: { x: number; y: number; w: number; h: number }) {
    /** X positions on the spritesheet */
    this.keyframesX = [[], []];
    /** Y positions on the spritesheet */
    this.keyframesY = [[], []];
    /** Defines how many game-frames should be skipped before each next animation-frame */
    this.slowness = 6;

    // The size of the sprite defaults to the entity size, but can be changed
    this.w = entity.w;
    this.h = entity.h;

    // Some Animations may need an offset relative to the Entity position
    this.offsetX = (entity.w - this.w) / 2;
    this.offsetY = (entity.h - this.h) / 2;
  }
}
