const MOD_FILE_EXT = ".pak";
const GAME_ID = 'bluefire';
const STEAMAPP_ID = '1220150';
const GOGAPP_ID = '1280776741';
const PRIME_ID = 'amzn1.adg.product.0d364464-032c-40c9-a6da-c633a53e3374' //Pickysaurus sent a suggestion to vortex to add auto-detection for amazon games
const path = require('path');
const { fs, log, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const moddingTools = [
  {
    id: 'Unrealmodloader',
    name: 'Unreal Engine Modloader',
    shortName: 'UML',
    logo: 'UML.png',
    executable: () => 'UnrealEngineModLauncher.exe',
    requiredFiles: [
      'UnrealEngineModLauncher.exe',
      'ModLoaderInfo.ini',
      'UnrealEngineModLoader.dll'
    ],
    shell:true
  },
  {
    id:'Fmodel',
    name:'Fmodel',
    shortName:'Fmodel',
    logo: 'Fmodel.png',
    executable: () => 'Fmodel.exe',
    requiredFiles: [
      'Fmodel.exe'
    ]
  }
];

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
  return fs.ensureDirAsync(path.join(discovery.path, 'Blue Fire', 'Content', 'Paks', '~mods')) && fs.ensureDirAsync(path.join(discovery.path, 'Blue Fire', 'Content', 'Paks', 'LogicMods')) && fs.ensureDirAsync(path.join(discovery.path, 'Blue Fire', 'Content', 'CoreMods'));
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  let supported = (gameId === GAME_ID) &&
    (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(files) {
  // The .pak file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
  const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT || '.dll');
  const rootPath = path.dirname(modFile);

  // Remove directories and anything that isn't in the rootPath.
  const filtered = files.filter(file =>
  ((file.indexOf(rootPath) !== -1)
    && (!file.endsWith(path.sep))));

  const instructions = filtered.map(file => {
    if (path.extname(file) == ".dll") {
      return {
        type: 'copy',
        source: file,
        destination: path.join('CoreMods',file)
      };
    }
    else if (path.basename(file, '.pak').endsWith('_P')) {
      return {
        type: 'copy',
        source: file,
        destination: path.join('Paks', '~mods',file)
      };
    }
    else {
      return {
        type: 'copy',
        source: file,
        destination: path.join('Paks', 'LogicMods',file)
      };
    }
  });

  return Promise.resolve({ instructions });
}

function main(context) {
  //This is the main function Vortex will run when detecting the game extension. 
  context.registerGame({
    id: GAME_ID,
    name: 'Blue Fire',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: moddingTools,
    queryModPath: () => path.join('Blue Fire', 'Content'),
    logo: 'gameart.png',
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
  context.registerInstaller('bluefire-mod', 25, testSupportedContent, installContent);
  return true
}


module.exports = {
  default: main,
};
