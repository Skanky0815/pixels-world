/** Reuse bundled game PNGs; undiscovered entries never render an image element. */
export const ALBUM_ART: Readonly<Record<string, string>> = {
  'vase-terracotta': new URL(
    '../../../assets/objects/vases/vase-terracotta-intact.png',
    import.meta.url,
  ).href,
  'vase-blue': new URL('../../../assets/objects/vases/vase-blue-intact.png', import.meta.url).href,
  'vase-gold': new URL('../../../assets/objects/vases/vase-gold-intact.png', import.meta.url).href,
  'vase-mellow': new URL('../../../assets/objects/vases/vase-mellow-intact.png', import.meta.url)
    .href,
  'couch-cozy': new URL('../../../assets/objects/couch/couch-cozy.png', import.meta.url).href,
  'couch-worn': new URL('../../../assets/objects/couch/couch-worn.png', import.meta.url).href,
  'curtain-rust': new URL('../../../assets/objects/curtain/curtain-rust.png', import.meta.url).href,
  'catgrass-intact': new URL(
    '../../../assets/objects/catgrass/catgrass-intact.png',
    import.meta.url,
  ).href,
  'books-stacked': new URL('../../../assets/objects/books/books-stacked.png', import.meta.url).href,
  'books-upright': new URL('../../../assets/objects/books/books-upright.png', import.meta.url).href,
  'picture-pixel': new URL('../../../assets/objects/pictures/picture-pixel.png', import.meta.url)
    .href,
  'picture-berlin': new URL('../../../assets/objects/pictures/picture-berlin.png', import.meta.url)
    .href,
  'picture-cozy': new URL('../../../assets/objects/pictures/picture-cozy.png', import.meta.url)
    .href,
  hairball: new URL('../../../assets/objects/carpet/hairball.png', import.meta.url).href,
};
