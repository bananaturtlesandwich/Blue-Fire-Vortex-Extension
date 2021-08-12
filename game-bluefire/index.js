const MOD_FILE_EXT = ".pak";
const GAME_ID = 'bluefire';
const STEAMAPP_ID = '1220150';
const GOGAPP_ID = '1280776741';
const path = require('path');
const { fs, log, util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\' + GOGAPP_ID,
      'PATH');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID])
      .then(game => game.gamePath);
  }
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, 'Blue Fire', 'Content', 'Paks', '~mods'));
}


function main(context) {
	//This is the main function Vortex will run when detecting the game extension. 
	context.registerGame({
    id: GAME_ID,
    name: 'Blue Fire',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => 'Blue Fire/Content/Paks/~mods',
    logo: 'gameart.jpg',
    executable: () => 'PROA34.exe',
    requiredFiles: [
      'PROA34.exe',
      'Blue Fire/Binaries/Win64/PROA34-Win64-Shipping.exe'
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: STEAMAPP_ID,
      gogAppId: GOGAPP_ID,
    },
  });
	return true
}

module.exports = {
    default: main,
  };