/*
 * Base By Ednut
 * Created On 11/10/2024
 * Contact Me on wa.me/2348102487241
*/
require("./config.js")
const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
makeInMemoryStore,
jidDecode,
downloadContentFromMessage,
delay
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const {delArrSave} = require('./lib/arrfunction.js')
const fs = require('fs')
const path = require('path')
const { Boom } = require("@hapi/boom");
const yargs = require('yargs/yargs')
const _ = require('lodash')
const chalk = require("chalk")
const moment = require('moment-timezone')
const text2png = require ('wa-sticker-formatter')
const PhoneNumber = require("awesome-phonenumber");
const fetch = require('node-fetch')
const FileType = require('file-type')
const readline = require("readline");
const { smsg, imageToWebp, videoToWebp, sleep, writeExif, toPTT, toAudio, toVideo } = require("./all/myfunc")
const { getTime, tanggal, toRupiah, telegraPh, pinterest, ucapan, generateProfilePicture } = require('./all/function.js')
const { writeExifImg, writeExifVid } = require('./all/exif2')
let wlcm = JSON.parse(fs.readFileSync('./all/database/welcome.json'))

var low
try {
low = require('lowdb')
} catch (e) {
low = require('./all/lowdb')
}

const { Low, JSONFile } = low
const mongoDB = require('./all/mongoDB')

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(
  /https?:\/\//.test(opts['db'] || '') ?
    new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
      new mongoDB(opts['db']) :
      new JSONFile('all/database/database.json')
)
global.DATABASE = global.db // Backwards Compatibility
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
    users: {},
    chats: {},
    database: {},
    settings: {},
    others: {},
    sticker: {},
    ...(global.db.data || {})
  }
  global.db.chain = _.chain(global.db.data)
}
loadDatabase()


const deleteFolderRecursive = function (pathsesi) {
  if (fs.existsSync(pathsesi)) {
    fs.readdirSync(pathsesi).forEach(function (file, index) {
      const curPath = pathsesi + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(pathsesi);
  }
}
const pairingCode = false
// save database every 30seconds
if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write()
  }, 30 * 1000)

const question = (text) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise((resolve) => { rl.question(text, resolve) }) };

const startBotz = async() => {
const { state, saveCreds } = await useMultiFileAuthState('./sesion')
const ednut = makeWASocket({
logger: pino({ level: "silent" }),
printQRInTerminal: !pairingCode,
auth: state,
connectTimeoutMs: 60000,
defaultQueryTimeoutMs: 0,
keepAliveIntervalMs: 10000,
emitOwnEvents: true,
fireInitQueries: true,
generateHighQualityLinkPreview: true,
syncFullHistory: true,
markOnlineOnConnect: true,
browser: ["Ubuntu", "Chrome", "20.0.04"],
});


store.bind(ednut.ev);

if (!ednut.authState.creds.registered) {
const phoneNumber = await question('input your number for pair code sir in 234 format :\n');
let code = await ednut.requestPairingCode(phoneNumber);
code = code?.match(/.{1,4}/g)?.join("-") || code;
console.log(`𝒉𝒆𝒓𝒆𝒔 𝒚𝒐𝒖𝒓 𝒑𝒂𝒊𝒓 𝒄𝒐𝒅𝒆 :`, code);
}

ednut.ev.on("messages.upsert", async (chatUpdate) => {
try {
mek = chatUpdate.messages[0];
if (!mek.message) return;
mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
if (mek.key && mek.key.remoteJid === "status@broadcast") return;
if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
m = smsg(ednut, mek, store);
require("./ednut.js")(ednut, m, chatUpdate, mek, store);
} catch (err) {
console.log(err);
}
});

ednut.decodeJid = (jid) => {
if (!jid) return jid;
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {};
return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
} else return jid;
};

ednut.getName = (jid, withoutContact = false) => {
id = ednut.decodeJid(jid);
withoutContact = ednut.withoutContact || withoutContact;
let v;
if (id.endsWith("@g.us"))
return new Promise(async (resolve) => {
v = store.contacts[id] || {};
if (!(v.name || v.subject)) v = ednut.groupMetadata(id) || {};
resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
});
else
v =
id === "0@s.whatsapp.net"
? {
id,
name: "WhatsApp",
}
: id === ednut.decodeJid(ednut.user.id)
? ednut.user
: store.contacts[id] || {};
return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
};

ednut.serializeM = (m) => smsg(ednut, m, store);
//read messages
ednut.ev.on("connection.update",async  (koneksi) => {
  const {connection, lastDisconnect} = koneksi

  if(connection == "open"){
  console.log('[Arch Connected to] ' + JSON.stringify(ednut.user.id, null, 2));
} 
	if (connection === 'close') {
			let reason = new Boom(lastDisconnect?.error)?.output.statusCode
			if (reason === DisconnectReason.badSession) {
				console.log(`Bad Session File, Please Delete Session and Scan Again`);
			} else if (reason === DisconnectReason.connectionClosed) {
				console.log("Connection closed, reconnecting....");
			} else if (reason === DisconnectReason.connectionLost) {
				console.log("Connection Lost from Server, reconnecting...");
			} else if (reason === DisconnectReason.loggedOut) {
				console.log(`Device Logged Out, Please Delete Session and Scan Again.`);
			} else if (reason === DisconnectReason.restartRequired) {
				console.log("Restart Required, Restarting...");
			} else if (reason === DisconnectReason.timedOut) {
				console.log("Connection TimedOut, Reconnecting...");
			} else ednut.end(`Unknown DisconnectReason: ${reason}|${connection}`)
		}
		{
  }
	startBotz()
  })
  
ednut.ev.on("creds.update", saveCreds);

ednut.sendText = (jid, text, quoted = "", options) => ednut.sendMessage(jid, { text: text, ...options }, { quoted });

ednut.sendContact = async (jid, kon, desk = "Developer Bot", quoted = '', opts = {}) => {
let list = []
for (let i of kon) {
list.push({
displayName: botname,
  vcard: 'BEGIN:VCARD\n' +
    'VERSION:3.0\n' +
    `N:;${botname};;;\n` +
    `FN:${botname}\n` +
    'ORG:null\n' +
    'TITLE:\n' +
    `item1.TEL;waid=${i}:${i}\n` +
    'item1.X-ABLabel:Ponsel\n' +
    `X-WA-BIZ-DESCRIPTION:${desk}\n` +
    `X-WA-BIZ-NAME:${botname}\n` +
    'END:VCARD'
})
}
ednut.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })
}

ednut.ev.on('group-participants.update', async (anu) => {
    let wlcm = JSON.parse(fs.readFileSync('./all/database/welcome.json'))
    if (!wlcm.includes(anu.id)) return
    console.log(anu)
    try {
      let metadata = await ednut.groupMetadata(anu.id)
      const groupDesc = metadata.desc;
      const welDate = moment.tz('Afria/Lagos').format('DD/MM/YYYY')
      let members = metadata.participants.length
      let participants = anu.participants
      for (let num of participants) {
        // Get Profile Picture User
        try {
          ppuser = await ednut.profilePictureUrl(num, 'image')
        } catch {
          ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
        }
        // Get Profile Picture Group
        if (anu.action == 'add') {
          let wel = `Hɪ 🦋 @${num.split("@")[0]},\nᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ${metadata.subject},ᴊᴏɪɴᴇᴅ ᴀᴛ ${getTime().split("T")[1].split("+")[0]},${welDate} ᴍᴇᴍʙᴇʀ ᴄᴏᴜɴᴛ ${members}\n\nʀᴇᴀᴅɪɴɢ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ ɪs ᴄᴏᴍᴘᴜʟsᴏʀʏ ғᴏʀ ᴍᴏʀᴇ ɪɴғᴏ ᴛʏᴘᴇ *.ɢᴄɪɴғᴏ*\n\nɢʀᴏᴜᴘ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ ɪs 👇\n${groupDesc}`
          await ednut.sendMessage(anu.id, {
            image: {url:ppuser},
            caption: wel,
          }).catch(e=>{})
        } else if (anu.action == 'remove') {
          let txtLeft = `Gᴏᴏᴅʙʏᴇ @${num.split("@")[0]} 👋\nʟᴇᴀᴠɪɴɢ ғʀᴏᴍ ${metadata.subject}\nʟᴇғᴛ ɢᴄ ᴀᴛ  ${getTime().split("T")[1].split("+")[0]}  ${welDate}\nᴡᴇ ᴀʀᴇ ɴᴏᴡ ${members} ɪɴ ᴛʜᴇ ɢʀᴏᴜᴘ`
          await ednut.sendMessage(anu.id, {
            image: {url:ppuser},
            caption: txtLeft,
          })
        }
  await delay(1000) //for prevent socket rate-limited
      }
        } catch (err) {
      console.log(err)
    }
  })

ednut.ev.on('call', async (user) => {
if (!global.anticall) return
let botNumber = await ednut.decodeJid(ednut.user.id)
for (let ff of user) {
if (ff.isGroup == false) {
if (ff.status == "offer") {
let sendcall = await ednut.sendMessage(ff.from, {text: `@${ff.from.split("@")[0]} Sorry, I Will Block You Because the Bot Owner Turned on the *Anti Call* Feature\nIf You Accidentally Contact the Owner Immediately to Unblock This`, contextInfo: {mentionedJid: [ff.from], externalAdReply: {thumbnailUrl: "https://telegra.ph/file/d29baa62079de1f3e9ba7.jpg", title: "CALL DETECTED", previewType: "PHOTO"}}}, {quoted: null})
ednut.sendContact(ff.from, [owner], "Call or Vc = Block", sendcall)
await sleep(8000)
await ednut.updateBlockStatus(ff.from, "block")
}}
}})


ednut.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
return buffer
}

ednut.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
let buffer;
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options);
} else {
buffer = await imageToWebp(buff);
}
await ednut.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
return buffer;
};

ednut.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
let buffer;
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options);
} else {
buffer = await videoToWebp(buff);
}
await ednut.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
return buffer;
};

ednut.reply = (jid, text = '', quoted, options) => {
        return Buffer.isBuffer(text) ? this.sendFile(jid, text, 'file', '', quoted, false, options) : ednut.sendMessage(jid, { ...options, text }, { quoted, ...options })
}

ednut.sendMedia = async (jid, path, quoted, options = {}) => {
        let { ext, mime, data } = await ednut.getFile(path)
        messageType = mime.split("/")[0]
        pase = messageType.replace('application', 'document') || messageType
        return await ednut.sendMessage(jid, { [`${pase}`]: data, mimetype: mime, ...options }, { quoted })
}

ednut.getFile = async (PATH, returnAsFilename) => {
let res, filename
const data = Buffer.isBuffer(PATH) ? PATH : /^data:.?\/.?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
const type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'
}
if (data && returnAsFilename && !filename)(filename = path.join(__dirname, './tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
return {
res,
filename,
...type,
data,
deleteFile() {
return filename && fs.promises.unlink(filename)
}
}
}
ednut.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
let type = await ednut.getFile(path, true)
let { res, data: file, filename: pathFile } = type
if (res && res.status !== 200 || file.length <= 65536) {
try { throw { json: JSON.parse(file.toString()) } }
catch (e) { if (e.json) throw e.json }
}
let opt = { filename }
if (quoted) opt.quoted = quoted
if (!type) options.asDocument = true
let mtype = '', mimetype = type.mime, convert
if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
else if (/video/.test(type.mime)) mtype = 'video'
else if (/audio/.test(type.mime)) (
convert = await (ptt ? toPTT : toAudio)(file, type.ext),
file = convert.data,
pathFile = convert.filename,
mtype = 'audio',
mimetype = 'audio/ogg; codecs=opus'
)
else mtype = 'document'
if (options.asDocument) mtype = 'document'

let message = {
...options,
caption,
ptt,
[mtype]: { url: pathFile },
mimetype
}
let m
try {
m = await ednut.sendMessage(jid, message, { ...opt, ...options })
} catch (e) {
console.error(e)
m = null
} finally {
if (!m) m = await ednut.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
return m
}
}
ednut.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.m ? message.m : message
        let mime = (message.m || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
	let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        // save to file
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }
return ednut;
}


startBotz()

let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(`Update ${__filename}`);
delete require.cache[file];
require(file);
});
