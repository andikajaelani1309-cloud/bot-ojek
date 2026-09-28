const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
let sudahBalas = false
const KATA_KUNCI = ['ojek','ojk','free']

async function startBot(){
  console.log('Bot starting...');
  const { state, saveCreds } = await useMultiFileAuthState('sesi')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({level:'silent'}),
    auth: state,
    browser:['Ubuntu','Chrome','124.0.0.0']
  })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (u)=>{
    const { connection, qr } = u
    if(qr){
      console.log('SCAN QR INI:')
      qrcode.generate(qr, {small:true})
    }
    if(connection==='open') console.log('Bot CONNECT! Silakan test kirim ojek')
    if(connection==='close') console.log('Koneksi tertutup')
  })

  sock.ev.on('messages.upsert', async ({messages})=>{
    if(sudahBalas) return
    const msg = messages[0]
    if(!msg.message || msg.key.fromMe) return
    const teks = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    if(KATA_KUNCI.some(k=>teks.toLowerCase().includes(k))){
      sudahBalas = true
      await sock.sendMessage(msg.key.remoteJid, {text:'Kt'}, {quoted:msg})
      console.log('Sudah dibalas, bot mati.')
      setTimeout(()=>process.exit(0), 1000)
    }
  })
}
startBot()
