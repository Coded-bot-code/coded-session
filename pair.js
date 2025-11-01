const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const {
    default: Gifted_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("maher-zubair-baileys");

// Utility: safely remove temp folder
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function TRUVAGPT_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);

        try {
            let TruvaGPT_Session = Gifted_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS('Safari'),
            });

            if (!TruvaGPT_Session.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await TruvaGPT_Session.requestPairingCode(num);
                if (!res.headersSent) await res.send({ code });
            }

            TruvaGPT_Session.ev.on('creds.update', saveCreds);
            TruvaGPT_Session.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    console.log(`✅ Connected with ${TruvaGPT_Session.user.id}`);

                    // Wait for full connection
                    await delay(3000);

                    // Copy session data to bot folder
                    const sessionPath = './truvagpt_auth';
                    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
                    fs.cpSync(`./temp/${id}`, sessionPath, { recursive: true });
                    console.log(`✅ Auth state saved to ${sessionPath}`);

                    // Send confirmation message
                    const confirmMessage = `
╭─────────────────────────────╮
│ *🤖 TruvaGPT Pairing Successful!* 
│─────────────────────────────
│✅ Your WhatsApp is now linked to TruvaGPT AI.
│📡 Powered by: *DevAfeez*
│⚙️ System: Node.js + Baileys
│🔗 Repo: https://github.com/Coded-bot-code
│🌍 AI Name: TruvaGPT
╰─────────────────────────────╯
`;
                    await TruvaGPT_Session.sendMessage(TruvaGPT_Session.user.id, { text: confirmMessage });

                    // Close temp connection and cleanup
                    await delay(2000);
                    await TruvaGPT_Session.ws.close();
                    await removeFile(`./temp/${id}`);
                } 
                else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    console.log("⚠️ Connection closed. Retrying...");
                    await delay(10000);
                    TRUVAGPT_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("⚠️ Error occurred:", err);
            await removeFile(`./temp/${id}`);
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }

    return await TRUVAGPT_PAIR_CODE();
});

module.exports = router;