const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ruta a la carpeta SoundBarrier (Ajusta la ruta si tu script está en la raíz del proyecto)
const SOUND_BARRIER_PATH = path.join(__dirname, 'assets', 'Sounds', 'SoundBarrier');

function processAudioFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  // Procesar solo MP3 y WAV (ignora archivos de texto o carpetas)
  if (ext !== '.mp3' && ext !== '.wav') return;

  // El archivo resultante SIEMPRE será un MP3 optimizado
  const baseName = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);
  const targetMp3Path = path.join(dirName, `${baseName}.mp3`);
  const tempPath = path.join(dirName, `${baseName}_temp.mp3`);

  // Comando FFmpeg: Filtro de frecuencias + Normalización LUFS + Compresión a 128kbps (SIN FADES)
  const ffmpegCmd = `ffmpeg -y -i "${filePath}" -af "highpass=f=40, lowpass=f=15000, loudnorm=I=-18:TP=-1.5" -b:a 128k -ar 44100 "${tempPath}"`;

  try {
    console.log(`Procesando: ${path.basename(filePath)}...`);
    execSync(ffmpegCmd, { stdio: 'pipe' });

    // Si el archivo original era WAV, se borra el WAV
    if (ext === '.wav') {
      fs.unlinkSync(filePath);
    } else if (fs.existsSync(targetMp3Path)) {
      // Si era MP3, se elimina el original para reemplazarlo por el optimizado
      fs.unlinkSync(targetMp3Path);
    }

    // Renombrar el temporal a MP3 final
    fs.renameSync(tempPath, targetMp3Path);
    console.log(`✔ Optimizado e integrado como MP3: ${baseName}.mp3`);
  } catch (err) {
    console.error(`✖ Error procesando ${path.basename(filePath)}:`, err.message);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

// Recorrer la estructura de carpetas de forma recursiva
function walkDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`La carpeta no existe: ${dirPath}`);
    return;
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDirectory(fullPath); // Recorre Ambient, Classic, Lo-Fi...
    } else if (stat.isFile()) {
      processAudioFile(fullPath);
    }
  }
}

console.log('--- Iniciando optimización de audio para Foki ---');
walkDirectory(SOUND_BARRIER_PATH);
console.log('--- Proceso finalizado. Todos los audios están listos ---');