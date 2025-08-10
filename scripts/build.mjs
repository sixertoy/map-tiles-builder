//#region Imports
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import fse from 'fs-extra';
import { imageSizeFromFile } from 'image-size/fromFile';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const background = { alpha: 1, b: 0, g: 0, r: 0 };
const blankfile = path.join(__dirname, '..', 'build', 'blank.png');
//#endregion

//#region Utilities functions
const cleanupFolder = async (outputfile) => {
  const { dir, name, base } = path.parse(outputfile);
  const inputfolder = path.join(dir, `${base}_files`);

  if (fse.exists(inputfolder)) {
    const outputfolder = path.join(dir, name);
    await fse.rename(inputfolder, outputfolder);
  }
};

const copyBlankTile = async (outputfile) => {
  const { dir } = path.parse(outputfile);
  const file = path.join(dir, 'blank.png');
  await fse.copy(blankfile, file);
};

const createThumb = async (inputfile, outputfile) => {
  const { dir, name } = path.parse(outputfile);
  const file = path.join(dir, `${name}-thumb.png`);
  await sharp(inputfile, {
    background,
    limitInputPixels: false,
  })
    .resize({
      fit: 'cover',
      height: 64,
      width: 64,
    })
    .png()
    .toFile(file);
};

const createTiles = async (inputfile, outputfile, padding) => {
  const result = await sharp(inputfile, {
    background,
    limitInputPixels: false,
  })
    .extend({
      ...padding,
      background,
    })
    .png()
    .tile({
      background,
      center: true,
      layout: 'dz',
      maxzoom: 18,
      size: 256,
    })
    .toFile(outputfile);
  return result;
};

const getPadding = async (inputfile) => {
  const tilesize = 256;
  const dimensions = await imageSizeFromFile(inputfile);

  const paddedHeight = Math.ceil(dimensions.height / tilesize) * tilesize;
  const paddedWidth = Math.ceil(dimensions.width / tilesize) * tilesize;
  const maxDimension = Math.max(paddedHeight, paddedWidth);

  const verticalPadding = maxDimension - dimensions.height;
  const horizontalPadding = maxDimension - dimensions.width;
  const result = {
    bottom: Math.ceil(verticalPadding / 2),
    left: Math.floor(horizontalPadding / 2),
    right: Math.ceil(horizontalPadding / 2),
    top: Math.floor(verticalPadding / 2),
  };
  return result;
};

const removeExistingTiles = async (ppath) => {
  if (fse.exists(ppath)) {
    return fse.remove(ppath);
  }
  return Promise.resolve();
};
//#endregion

/* ----------------------------------------------------------
 *
 * INIT
 *
---------------------------------------------------------- */

//#region Initialization
const gamename = process.argv[2];
const inputpath = path.join(__dirname, '..', 'maps', gamename);
const outputpath = path.join(__dirname, '..', 'build', gamename);

if (!fse.exists(inputpath)) {
  console.error("> La dossier n'existe pas : ", inputpath);
  process.exit();
}

console.log('> Removing tiles from : ', path.relative(__dirname, outputpath));
await removeExistingTiles(outputpath);

const layers = await fse.readdir(inputpath);
layers.forEach(async (filename) => {
  const inputfile = path.join(inputpath, filename);
  const outputfile = path.join(outputpath, filename);

  const padding = await getPadding(inputfile);
  console.log('> Create large image : ', path.relative(__dirname, outputfile));
  await createTiles(inputfile, outputfile, padding);

  console.log('> Create thumb : ', path.relative(__dirname, outputfile));
  await createThumb(inputfile, outputfile);

  console.log('> Copy Blank tile : ', path.relative(__dirname, outputfile));
  await copyBlankTile(outputfile);

  console.log('> Remove unused filed : ', path.relative(__dirname, outputfile));
  await cleanupFolder(outputfile);
});
//#endregion
