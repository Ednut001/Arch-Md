/*
 * Base By Ednut
 * Created On 11/10/2024
 * Contact Me on wa.me/2348102487241
*/

const chalk = require("chalk")
const fs = require("fs")

//======= Change settings =======\\
global.owner = ["2347036214381"] // owner number 
global.botname = ["Arch Md"] // don't change 
global.simbol = "♘" // don't change 
global.typeMenu = 'v1' //don't change 
global.anticall = false // your choice 
global.xprefix = '.' // your desired prefix
//======= Don't change =======\\

global.prefa = ['.']

//======= Don't touch =======\\
global.msg = {
    succes: 'Success',
    owner: 'This feature could be used by owner only',
	admin: 'This feature could be used by group admin only',
    group: 'Features Used Only For Groups!',
    private: 'Features Used Only For Private Chat!',
    bot: 'This feature could be used by bot only',
    wait: 'processing...',
    linkm: 'Where is the link?',
    }
//==========================
    
let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(`Update ${__filename}`);
delete require.cache[file];
require(file);
});