const fs = require ('fs');
const { join, dirname } = require("path");
const { fileURLToPath } = require("url");

let dirr = "."
const file = {
    config: join(dirr,"isSelf.json")
}

try {
    fs.accessSync(file.config);
} catch (err) {
    if (String(err).includes("no such file or directory")) {
        fs.writeFileSync(file.config, JSON.stringify({}, null, 2));
    }
}

try{
global.dbc = JSON.parse(fs.readFileSync(file.config))
} catch (err) {
    global.dbc = {}
}



setInterval(() => {
    fs.writeFileSync(file.config, JSON.stringify(dbc, null, 2));
}, 900);