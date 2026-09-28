const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')

let sudahBalas = false
const KATA_KUNCI = ['ojek','ojk','free']

async function startBot(){
  console.log('Bot starting...')
  const { state, saveCreds } = await useMultiFileAuthState('sesi')
  const { version } = await fetchLatestBaileysVersion()
  console.log('WA version:', version.join('.'))

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['Ubuntu', 'Chrome', '124.0.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update
    if (qr) {
      console.log('=== SCAN QR DI BAWAH INI ===')
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'open') {
      console.log('Bot CONNECT! Tes kirim kata ojek')
    }
    if (connection === 'close') {
      console.log('Koneksi tertutup, restart...')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (sudahBalas) return
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const teks = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    const cocok = KATA_KUNCI.some(k => teks.toLowerCase().includes(k))

    if (cocok) {
      sudahBalas = true
      await sock.sendMessage(msg.key.remoteJid, { text: 'Kt' }, { quoted: msg })
      console.log('Sudah dibalas Kt, bot berhenti.')
      setTimeout(() => process.exit(0), 2000)
    }
  })
}

startBot()
