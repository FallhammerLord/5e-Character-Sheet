/**
 * Token sizes kept through image swaps (user, 2026-11-08). Token HUD Wildcard writes width, height, alpha, texture scale
 * and anchor on every image swap: from tags in the new file's name (`_width2`, `_scale1.5`), else from the actor's
 * prototype token, which wipes a token's per-scene size. Pure, so the unit check runs it offline.
 */

/** Each size key, and the filename tags that set it. */
export const SIZE_TAGS = {
   width: ['width'],
   height: ['height'],
   alpha: ['alpha'],
   'texture.scaleX': ['scale', 'scaleX'],
   'texture.scaleY': ['scale', 'scaleY'],
   'texture.anchorX': ['anchor'],
   'texture.anchorY': ['anchor']
};

/** Whether a file name carries a tag with a number: `_scale1.5`, `_width2`. `_scale` alone doesn't match `_scaleX2`. */
export const hasSizeTag = (src, tag) => new RegExp(`_${tag}(\\d*\\.)?\\d+`).test(src);

/**
 * The size keys an update should leave as they are: the image changes, the new name has no tag for the key, and the
 * value written is the prototype's (Wildcard's fallback). A size typed by hand that differs from the prototype stands.
 * @param {string|undefined} oldSrc  The token's image now.
 * @param {object} flat              The update, flattened (`texture.src`, `width`, …).
 * @param {(key: string) => unknown} prototype  The prototype token's value for a key; undefined without an actor.
 * @returns {string[]} Keys to keep at the token's current value.
 */
export function sizesToKeep(oldSrc, flat, prototype)
{
   const src = flat['texture.src'];
   if (!src || src === oldSrc) { return []; }
   return Object.entries(SIZE_TAGS)
      .filter(([key, tags]) => (key in flat) && !tags.some((tag) => hasSizeTag(src, tag)))
      .filter(([key]) => prototype(key) !== undefined && flat[key] === prototype(key))
      .map(([key]) => key);
}
