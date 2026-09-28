const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const readline = require('readline')

const NOMOR_BOT = '6285175456851' // nomor bot kamu, tanpa +

function tanya(teks){
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(res => rl.question(teks, ans => { rl.close(); res(ans) }))
}

async function start(){
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
    if(u.connection==='open') console.log('\nBOT CONNECT! Folder sesi/ sudah jadi.')
    if(u.connection==='close') console.log('Koneksi tutup, jalankan lagi.')
  })

  if(!sock.authState.creds.registered){
    console.log('Meminta kode pairing...')
    await new Promise(r=>setTimeout(r,3000))
    try{
      const kode = await sock.requestPairingCode(NOMOR_BOT)
      console.log('\n================================')
      console.log('KODE PAIRING KAMU: '+kode)
      console.log('================================')
      console.log('Buka WA nomor 6285175456851 > Setelan > Perangkat Tertaut > Tautkan Perangkat > Tautkan dengan nomor telepon > masukkan kode di atas')
    }catch(e){
      console.log('Gagal minta kode:', e.message)
    }
  }
}
start()
