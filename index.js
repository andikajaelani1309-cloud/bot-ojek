const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
let sudahBalas = false
const KATA_KUNCI = ['ojek','ojk','free']
const NOMOR_BOT = '6285175456851'

async function startBot(){
  console.log('Bot starting...');
  const { state, saveCreds } = await useMultiFileAuthState('sesi')
  const { version } = await fetchLatestBaileysVersion()
  console.log('Using WA version', version)

  const sock = makeWASocket({
    version,
    logger: pino({level:'silent'}),
    auth: state,
    browser:['Ubuntu','Chrome','124.0.0.0']
  })
  sock.ev.on('creds.update', saveCreds)

  // Tunggu 3 detik biar konek dulu sebelum minta pairing
  await new Promise(r => setTimeout(r, 3000))

  if(!sock.authState.creds.registered){
    try{
      const code = await sock.requestPairingCode(NOMOR_BOT)
      console.log('KODE PAIRING KAMU: '+code)
    }catch(e){
      console.log('Gagal pairing: '+e.message)
      console.log('Coba deploy ulang 10 menit lagi, IP Render kadang diblokir WA')
    }
  }
  sock.ev.on('connection.update', (u)=>{
    if(u.connection==='open') console.log('Bot CONNECT! Silakan test kirim ojek')
    if(u.connection==='close') console.log('Koneksi tertutup, cek log atas')
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
