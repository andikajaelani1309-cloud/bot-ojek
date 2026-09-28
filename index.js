const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')
const QRCode = require('qrcode')

let qrTerakhir = ''
const app = express()
app.get('/', (req,res)=>{
  if(!qrTerakhir) return res.send('<h1>Tunggu QR muncul... refresh 5 detik lagi</h1>')
  res.send(`<div style="text-align:center;margin-top:50px"><h2>Scan QR WhatsApp</h2><img src="${qrTerakhir}" style="width:300px;height:300px"/><p>Refresh jika sudah expired</p></div>`)
})
const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>console.log('Web QR jalan di port '+PORT))

let sudahBalas = false
const KATA_KUNCI = ['ojek','ojk','free']

async function startBot(){
  console.log('Bot starting...')
  const { state, saveCreds } = await useMultiFileAuthState('sesi')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({ version, logger: pino({level:'silent'}), auth: state, browser:['Ubuntu','Chrome','124.0.0.0'] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (u)=>{
    const { connection, qr } = u
    if(qr){
      qrTerakhir = await QRCode.toDataURL(qr)
      console.log('QR baru tersedia, buka URL service Render kamu untuk scan')
    }
    if(connection==='open'){ console.log('Bot CONNECT!'); qrTerakhir='' }
  })
  sock.ev.on('messages.upsert', async ({messages})=>{
    if(sudahBalas) return
    const msg = messages[0]
    if(!msg.message || msg.key.fromMe) return
    const teks = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    if(KATA_KUNCI.some(k=>teks.toLowerCase().includes(k))){
      sudahBalas = true
      await sock.sendMessage(msg.key.remoteJid, {text:'Kt'}, {quoted:msg})
      console.log('Sudah dibalas')
      setTimeout(()=>process.exit(0), 2000)
    }
  })
}
startBot()
