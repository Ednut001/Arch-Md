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
downloadContentFromMessage
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs')
const path = require('path')
const { Boom } = require("@hapi/boom");
const PhoneNumber = require("awesome-phonenumber");
const fetch = require('node-fetch')
const FileType = require('file-type')
const readline = require("readline");
const { smsg, imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif, toPTT, toAudio, toVideo } = require("./lib/myfunc")

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
const question = (text) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise((resolve) => { rl.question(text, resolve) }) };

async function startBotz() {
const { state, saveCreds } = await useMultiFileAuthState("session")
const ednut = makeWASocket({
logger: pino({ level: "silent" }),
printQRInTerminal: false,
auth: state,
connectTimeoutMs: 60000,
defaultQueryTimeoutMs: 0,
keepAliveIntervalMs: 10000,
emitOwnEvents: true,
fireInitQueries: true,
generateHighQualityLinkPreview: true,
syncFullHistory: true,
markOnlineOnConnect: false,
browser: ["Ubuntu", "Chrome", "20.0.04"],
});

if (!ednut.authState.creds.registered) {
const phoneNumber = await question('input your number for pair code sir in 234 format :\n');
let code = await ednut.requestPairingCode(phoneNumber);
code = code?.match(/.{1,4}/g)?.join("-") || code;
console.log(`𝒉𝒆𝒓𝒆𝒔 𝒚𝒐𝒖𝒓 𝒑𝒂𝒊𝒓 𝒄𝒐𝒅𝒆 :`, code);
}
store.bind(ednut.ev);

ednut.ev.on("messages.upsert", async (chatUpdate) => {
try {
mek = chatUpdate.messages[0];
if (!mek.message) return;
mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
if (mek.key && mek.key.remoteJid === "status@broadcast") return;
if (!ednut.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
m = smsg(ednut, mek, store);
require("./case")(ednut, m, chatUpdate, store);
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

ednut.public = false;

ednut.serializeM = (m) => smsg(ednut, m, store);
ednut.ev.on('connection.update', (update) => {
const { connection, lastDisconnect } = update;
if (connection === 'close') {
let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
if (reason === DisconnectReason.badSession || reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.connectionReplaced || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
startBotz();
} else if (reason === DisconnectReason.loggedOut) {
} else {
ednut.end(`Unknown DisconnectReason: ${reason}|${connection}`);
}
} else if (connection === 'open') {
console.log('[Connected] ' + JSON.stringify(ednut.user.id, null, 2));
}
});

ednut.ev.on("creds.update", saveCreds);

ednut.sendText = (jid, text, quoted = "", options) => ednut.sendMessage(jid, { text: text, ...options }, { quoted });

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
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
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
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
let buffer;
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options);
} else {
buffer = await videoToWebp(buff);
}
await ednut.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
return buffer;
};

ednut.getFile = async (PATH, returnAsFilename) => {
let res, filename
const data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
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

startBotz();

let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(`Update ${__filename}`);
delete require.cache[file];
require(file);
});
