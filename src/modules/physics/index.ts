export type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Point = {
  x: number;
  y: number;
};
export type Rect = Point & {
  w: number;
  h: number;
  hitbox?: Rect;
};
export type EntityLike = Rect & {
  hitbox?: Rect;
  grounded: boolean;
  removed: boolean;
  onCollision?: Function;
  yVelExt: number;
  yVel: number;
  xVelExt: number;
  xVel: number;
  solid: boolean;
  col?: {
    L: number;
    R: number;
    T: number;
    B: number;
  };
};
/**
 *  To use this:
 *  - Check for all the simple collisions
 *  - Send the collided entities' array and the colliding object
 *
 * @returns {Rect[]} An array of the merged colliders.
 */
export function assembleChunk(chunk: Rect[], obj: EntityLike): Rect[] {
  let assembledChunks: Rect[] = [];
  let brokenChunk: Rect[] = [];
  if (chunk.length == 1) {
    return chunk;
  }
  for (let i = 0; i < chunk.length; i++) {
    for (let j = 0; j < chunk[i].w; j++) {
      for (let k = 0; k < chunk[i].h; k++) {
        let part: Rect = {
          x: chunk[i].x + j,
          y: chunk[i].y + k,
          w: 1,
          h: 1,
        };
        if (collided(obj, part)) {
          brokenChunk.push(part);
        }
      }
    }
  }
  if (brokenChunk.length == 0) {
    return [] as Rect[];
  }
  let firstBlock = {
    x: brokenChunk[0].x,
    y: brokenChunk[0].y,
    w: brokenChunk[0].w,
    h: brokenChunk[0].h,
  };
  assembledChunks.push(firstBlock);
  let a: Rect, b: Rect;
  for (let i = 0; i < brokenChunk.length; i++) {
    for (let j = 0; j < assembledChunks.length; j++) {
      a =
        brokenChunk[i].hitbox !== undefined
          ? brokenChunk[i].hitbox!
          : brokenChunk[i];
      b = assembledChunks[j];
      if (a.y == b.y && a.h == b.h) {
        if (a.x + a.w > b.x + b.w) {
          b.w = a.x + a.w - b.x;
        }
        if (a.x < b.x) {
          b.w += b.x - a.x;
          b.x = a.x;
        }
      } else if (a.x == b.x && a.w == b.w) {
        if (a.y + a.h > b.y + b.h) {
          b.h = a.y + a.h - b.y;
        }
        if (a.y < b.y) {
          b.h += b.y - a.y;
          b.y = a.y;
        }
      } else {
        let temp = {
          x: a.x,
          y: a.y,
          w: a.w,
          h: a.h,
        };
        assembledChunks.push(temp);
      }
    }
  }
  return assembledChunks;
}
/**
 *  Checks whether two rect-shaped objects are colliding
 * @param {Boolean} forceSpriteBox Defines whether the computation has to ignore the rectange hitbox and use it's absolute sizes
 *
 * @returns {Boolean} True if the rects are colliding, false otherwise
 */
export function collided(
  a: Rect,
  b: Rect,
  forceSpriteBox: boolean = false
): boolean {
  let rect1 = typeof a.hitbox !== "undefined" && !forceSpriteBox ? a.hitbox : a;
  let rect2 = typeof b.hitbox !== "undefined" && !forceSpriteBox ? b.hitbox : b;
  if (rect1.x < rect2.x + rect2.w) {
    if (rect1.x + rect1.w > rect2.x) {
      if (rect1.y < rect2.y + rect2.h) {
        if (rect1.y + rect1.h > rect2.y) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Checks if a point is contained withing a rectangle shaped object
 * @param {Boolean} forceSpriteBox Defines whether the computation has to ignore the rectange hitbox and use it's absolute sizes
 *
 * @returns {Boolean} True if contained, false otherwise
 */
export function pointRectCol(
  point: Point,
  rectangle: Rect,
  forceSpriteBox: boolean = false
): boolean {
  let rect = rectangle.hitbox && !forceSpriteBox ? rectangle.hitbox : rectangle;
  if (point.x >= rect.x) {
    if (point.x <= rect.x + rect.w) {
      if (point.y >= rect.y) {
        if (point.y <= rect.y + rect.h) {
          return true;
        }
      }
    }
  }
  return false;
}
/**
 * Checks for intersections between a line and a rect shaped object
 * @returns {boolean} True if there's an intersection, false otherwise
 */
export function lineRectCol(line: Line, sq: Rect): boolean {
  let squareLines = getRectSides(sq);
  for (let i = 0; i < squareLines.length; i++) {
    if (
      intersect(
        squareLines[i].x1,
        squareLines[i].y1,
        squareLines[i].x2,
        squareLines[i].y2,
        line.x1,
        line.y1,
        line.x2,
        line.y2
      )
    ) {
      return true;
    }
  }

  return false;
}
/**
 * Given two lines(expressed in 8 coordinates of 4 points), checks whether there's an intersection between them
 *
 * @returns {Point | false} The coords of the intersection or false if there's no contact
 */
export function intersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): Point | false {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }

  let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  if (denominator === 0) {
    return false;
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }

  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);

  return {
    x,
    y,
  };
}
/**
 *
 * @returns {Line[]} Array containing each line of the rect as 2 points coordinates
 */
export function getRectSides(rect: Rect): Line[] {
  let sides = [];
  let sq = rect;
  if (rect.hitbox !== undefined) {
    sq = rect.hitbox;
  }
  sides.push({
    x1: sq.x,
    y1: sq.y,
    x2: sq.x + sq.w,
    y2: sq.y,
  });
  sides.push({
    x1: sq.x + sq.w,
    y1: sq.y,
    x2: sq.x + sq.w,
    y2: sq.y + sq.h,
  });
  sides.push({
    x1: sq.x + sq.w,
    y1: sq.y + sq.h,
    x2: sq.x,
    y2: sq.y + sq.h,
  });
  sides.push({
    x1: sq.x,
    y1: sq.y + sq.h,
    x2: sq.x,
    y2: sq.y,
  });

  return sides;
}

/**
 * Computes the angle between the given points coordinates
 *
 * @returns {number} Rotation expressed in radians
 */
export function getAngle({ x1, y1, x2, y2 }: Line): number {
  let deltaX = x2 - x1;
  let deltaY = y2 - y1;
  return Math.atan2(deltaY, deltaX);
}
/**
 * Computes the angle between the centers of two rectangles
 *
 * @returns {number} Rotation expressed in radians
 */
export function getRectsAngle(
  { x: x1, w: w1, y: y1, h: h1 }: Rect,
  { x: x2, w: w2, y: y2, h: h2 }: Rect
): number {
  let deltaX = x2 + w2 / 2 - (x1 + w2 / 2);
  let deltaY = y2 + h2 / 2 - (y1 + h2 / 2);
  return Math.atan2(deltaY, deltaX);
}
/**
 * Computes the Cosine and Sine between 2 points
 *
 * @returns {number[]} Array containing the cosine and sine values, respectively.
 */
export function cosSin({ x1, y1, x2, y2 }: Line): number[] {
  let rotation = getAngle({ x1, y1, x2, y2 });
  let cosine = Math.cos(rotation);
  let sine = Math.sin(rotation);
  return [cosine, sine];
}
/**
 * Given two rectangles, returns the angle between their center point
 *
 * @returns {number} Rotation expressed in radians
 */
export function getRotation(obj1: Rect, obj2: Rect): number {
  let x1 = obj1.x + obj1.w / 2;
  let y1 = obj1.y + obj1.h / 2;
  let x2 = obj2.x + obj2.w / 2;
  let y2 = obj2.y + obj2.h / 2;
  return getAngle({ x1, y1, x2, y2 });
}

/**
 * Returns the distance between the center of two rect shaped objects
 *
 * @returns {number} Distance between the rectangles centers.
 */
export function distance(
  obj1: Point & { w?: number; h?: number },
  obj2: Point & { w?: number; h?: number }
): number {
  let x1 = obj1.w ? obj1.x + obj1.w / 2 : obj1.x;
  let y1 = obj1.h ? obj1.y + obj1.h / 2 : obj1.y;

  let x2 = obj2.w ? obj2.x + obj2.w / 2 : obj2.x;
  let y2 = obj2.h ? obj2.y + obj2.h / 2 : obj2.y;

  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
