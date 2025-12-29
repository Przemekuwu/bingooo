const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Configuración MEJORADA para Vercel
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',  // IMPORTANTE para Vercel
  transports: ['polling', 'websocket']
});

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateRandomNumber(min = 1, max = 75) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBingoLetter(number) {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '';
}

// Función para verificar solo líneas (no apagón)
function checkBingoLine(board, calledNumbers) {
  // Verificar líneas horizontales
  for (let i = 0; i < 5; i++) {
    let lineComplete = true;
    for (let j = 0; j < 5; j++) {
      const cellValue = board[i][j].value;
      if (cellValue !== 0 && !board[i][j].marked) {
        lineComplete = false;
        break;
      }
    }
    if (lineComplete) return true;
  }
  
  // Verificar columnas verticales
  for (let j = 0; j < 5; j++) {
    let columnComplete = true;
    for (let i = 0; i < 5; i++) {
      const cellValue = board[i][j].value;
      if (cellValue !== 0 && !board[i][j].marked) {
        columnComplete = false;
        break;
      }
    }
    if (columnComplete) return true;
  }
  
  // Verificar diagonal principal
  let diag1Complete = true;
  for (let i = 0; i < 5; i++) {
    const cellValue = board[i][i].value;
    if (cellValue !== 0 && !board[i][i].marked) {
      diag1Complete = false;
      break;
    }
  }
  if (diag1Complete) return true;
  
  // Verificar diagonal secundaria
  let diag2Complete = true;
  for (let i = 0; i < 5; i++) {
    const cellValue = board[i][4 - i].value;
    if (cellValue !== 0 && !board[i][4 - i].marked) {
      diag2Complete = false;
      break;
    }
  }
  if (diag2Complete) return true;
  
  // Verificar cuatro esquinas
  if (board[0][0].marked && board[0][4].marked && 
      board[4][0].marked && board[4][4].marked) {
    return true;
  }
  
  return false;
}

// Función para verificar apagón (todo el tablero)
function checkBlackout(board, calledNumbers) {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const cellValue = board[i][j].value;
      if (cellValue !== 0 && !board[i][j].marked) {
        return false;
      }
    }
  }
  return true;
}

// Función para verificar qué tipo de patrón se completó
function getCompletedPatterns(board) {
  const patterns = [];
  
  // Verificar líneas horizontales
  for (let i = 0; i < 5; i++) {
    if (board[i].every(cell => cell.marked || cell.value === 0)) {
      patterns.push(`Línea ${i + 1}`);
    }
  }
  
  // Verificar columnas verticales
  for (let j = 0; j < 5; j++) {
    let columnComplete = true;
    for (let i = 0; i < 5; i++) {
      if (!board[i][j].marked && board[i][j].value !== 0) {
        columnComplete = false;
        break;
      }
    }
    if (columnComplete) {
      patterns.push(`Columna ${String.fromCharCode(65 + j)}`);
    }
  }
  
  // Verificar diagonal principal
  let diag1Complete = true;
  for (let i = 0; i < 5; i++) {
    if (!board[i][i].marked && board[i][i].value !== 0) {
      diag1Complete = false;
      break;
    }
  }
  if (diag1Complete) {
    patterns.push('Diagonal \\');
  }
  
  // Verificar diagonal secundaria
  let diag2Complete = true;
  for (let i = 0; i < 5; i++) {
    if (!board[i][4 - i].marked && board[i][4 - i].value !== 0) {
      diag2Complete = false;
      break;
    }
  }
  if (diag2Complete) {
    patterns.push('Diagonal /');
  }
  
  // Verificar cuatro esquinas
  if (board[0][0].marked && board[0][4].marked && 
      board[4][0].marked && board[4][4].marked) {
    patterns.push('4 Esquinas');
  }
  
  return patterns;
}

// Endpoint de salud para Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Bingo Pokémon Server',
    timestamp: new Date().toISOString(),
    rooms: Object.keys(rooms).length
  });
});

io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado:', socket.id);
  
  // CREAR SALA
  socket.on('create-room', ({ nickname, playerId }) => {
    console.log('📝 Creando sala para:', nickname, 'ID:', playerId);
    
    const roomCode = generateRoomCode();
    
    socket.join(roomCode);

    rooms[roomCode] = {
      players: [{
        playerId,
        socketId: socket.id,
        nickname,
        host: true 
      }],
      createdAt: new Date(),
      calledNumbers: [],
      gameStarted: false,
      gamePaused: false,
      blackoutMode: false,
      completedLines: 0,
      winners: [],
      lastNumber: null
    };

    console.log('✅ Sala creada:', roomCode, 'Host:', nickname, 'Player ID:', playerId);
    socket.emit('room-created', { roomCode });
    io.to(roomCode).emit('player-list', rooms[roomCode].players);
  });

  // UNIRSE A SALA
  socket.on('join-room', ({ roomCode, nickname, playerId }) => {
    console.log('🚪 Intentando unir a sala:', roomCode, 'Jugador:', nickname, 'Player ID:', playerId);
    
    const room = rooms[roomCode];
    if (!room) {
      console.log('❌ Sala no existe:', roomCode);
      socket.emit('error', { message: 'La sala no existe' });
      return;
    }

    socket.join(roomCode);

    const existingPlayerIndex = room.players.findIndex(p => p.playerId === playerId);
    
    if (existingPlayerIndex !== -1) {
      const existingPlayer = room.players[existingPlayerIndex];
      console.log('🔄 Jugador existente reconectando:', {
        nickname: existingPlayer.nickname,
        host: existingPlayer.host,
        originalPlayerId: existingPlayer.playerId
      });
      
      room.players[existingPlayerIndex] = {
        playerId: existingPlayer.playerId,
        socketId: socket.id,
        nickname: nickname,
        host: existingPlayer.host
      };
    } else {
      console.log('👤 Nuevo jugador uniéndose:', nickname);
      room.players.push({
        playerId,
        socketId: socket.id,
        nickname,
        host: false
      });
    }

    console.log('📊 Estado final de sala', roomCode + ':');
    room.players.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.nickname} (ID: ${p.playerId}) - Host: ${p.host} - Conectado: ${!!p.socketId}`);
    });
    
    io.to(roomCode).emit('player-list', room.players);
    
    // Enviar estado actual del juego al jugador que se une
    socket.emit('game-state', {
      gameStarted: room.gameStarted,
      gamePaused: room.gamePaused,
      blackoutMode: room.blackoutMode,
      calledNumbers: room.calledNumbers,
      completedLines: room.completedLines,
      winners: room.winners,
      lastNumber: room.lastNumber
    });
    
    // Enviar números ya cantados
    if (room.calledNumbers.length > 0) {
      socket.emit('all-numbers-called', room.calledNumbers);
    }
    
    // Enviar último número en formato BINGO si existe
    if (room.lastNumber) {
      socket.emit('bingo-number-called', room.lastNumber);
    }
  });

  // INICIAR JUEGO
  socket.on('start-game', ({ roomCode }) => {
    console.log('🎮 Iniciando juego en sala:', roomCode);
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.host) {
      console.log('❌ Solo el host puede iniciar el juego');
      socket.emit('error', { message: 'Solo el host puede iniciar el juego' });
      return;
    }
    
    room.gameStarted = true;
    room.gamePaused = false;
    room.completedLines = 0;
    room.winners = [];
    
    io.to(roomCode).emit('game-started', { 
      message: '¡El juego ha comenzado!',
      blackoutMode: room.blackoutMode
    });
    
    console.log('✅ Juego iniciado en sala:', roomCode);
  });

  // PAUSAR/REANUDAR JUEGO
  socket.on('toggle-pause', ({ roomCode }) => {
    console.log('⏸️ Alternando pausa en sala:', roomCode);
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.host) {
      console.log('❌ Solo el host puede pausar el juego');
      socket.emit('error', { message: 'Solo el host puede pausar el juego' });
      return;
    }
    
    room.gamePaused = !room.gamePaused;
    
    io.to(roomCode).emit('game-paused', { 
      paused: room.gamePaused,
      message: room.gamePaused ? '⏸️ Juego pausado' : '▶️ Juego reanudado'
    });
    
    console.log('✅ Juego', room.gamePaused ? 'pausado' : 'reanudado', 'en sala:', roomCode);
  });

  // ACTIVAR MODO APAGÓN
  socket.on('activate-blackout', ({ roomCode }) => {
    console.log('🎯 Activando modo apagón en sala:', roomCode);
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.host) {
      console.log('❌ Solo el host puede activar el modo apagón');
      socket.emit('error', { message: 'Solo el host puede activar el modo apagón' });
      return;
    }
    
    room.blackoutMode = true;
    
    io.to(roomCode).emit('blackout-activated', { 
      message: '🎯 ¡Modo APAGÓN activado! El juego continúa hasta que alguien complete todo el tablero.'
    });
    
    console.log('✅ Modo apagón activado en sala:', roomCode);
  });

  // CANTAR NÚMERO
  socket.on('call-number', ({ roomCode }) => {
    console.log('🎲 Cantando número en sala:', roomCode);
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.host) {
      console.log('❌ Solo el host puede cantar números');
      socket.emit('error', { message: 'Solo el host puede cantar números' });
      return;
    }
    
    if (!room.gameStarted) {
      console.log('❌ El juego no ha comenzado');
      socket.emit('error', { message: 'El juego no ha comenzado' });
      return;
    }
    
    if (room.gamePaused) {
      console.log('❌ El juego está pausado');
      socket.emit('error', { message: 'El juego está pausado' });
      return;
    }
    
    // Generar número que no haya salido antes
    let number;
    let attempts = 0;
    const maxAttempts = 75;
    
    do {
      number = generateRandomNumber();
      attempts++;
      if (attempts > maxAttempts) {
        console.log('⚠️ Todos los números han sido cantados');
        socket.emit('error', { message: 'Todos los números han sido cantados' });
        return;
      }
    } while (room.calledNumbers.includes(number));
    
    room.calledNumbers.push(number);
    
    const letter = getBingoLetter(number);
    const bingoNumber = {
      letter,
      number,
      full: `${letter}-${number}`
    };
    
    room.lastNumber = bingoNumber;
    
    console.log('🔢 Número cantado:', bingoNumber.full, 'en sala:', roomCode);
    console.log('📊 Números cantados en esta sala:', room.calledNumbers.length);
    
    // Emitir a todos
    io.to(roomCode).emit('number-called', number);
    io.to(roomCode).emit('all-numbers-called', room.calledNumbers);
    io.to(roomCode).emit('bingo-number-called', bingoNumber);
  });

  // VERIFICAR BINGO (línea o apagón)
  socket.on('check-bingo', ({ roomCode, board, isBlackout = false }) => {
    console.log('🏆 Verificando BINGO en sala:', roomCode, 'Apagón:', isBlackout);
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    // Verificar si es una línea o apagón completo
    const hasLine = checkBingoLine(board, room.calledNumbers);
    const hasBlackout = checkBlackout(board, room.calledNumbers);
    const patterns = getCompletedPatterns(board);
    
    if (hasLine && !isBlackout) {
      console.log('🎉 ¡LÍNEA COMPLETADA! Por:', player.nickname, 'Patrones:', patterns);
      
      room.completedLines++;
      
      // Registrar ganador de línea
      const lineWinner = {
        playerId: player.playerId,
        nickname: player.nickname,
        type: 'line',
        patterns: patterns,
        timestamp: new Date(),
        numbersCalled: room.calledNumbers.length
      };
      
      room.winners.push(lineWinner);
      
      // Notificar a todos que alguien completó una línea
      io.to(roomCode).emit('line-completed', {
        winner: player.nickname,
        message: `${player.nickname} ha completado una línea!`,
        patterns: patterns,
        totalLines: room.completedLines,
        isFirstLine: room.completedLines === 1
      });
      
      console.log('✅ Línea registrada. Total líneas completadas:', room.completedLines);
    }
    
    if (hasBlackout || isBlackout) {
      console.log('🎊 ¡APAGÓN COMPLETADO! Ganador:', player.nickname);
      
      // Registrar ganador de apagón
      const blackoutWinner = {
        playerId: player.playerId,
        nickname: player.nickname,
        type: 'blackout',
        timestamp: new Date(),
        numbersCalled: room.calledNumbers.length,
        totalLines: room.completedLines
      };
      
      room.winners.push(blackoutWinner);
      
      // Notificar a todos que alguien ganó el apagón
      io.to(roomCode).emit('blackout-completed', {
        winner: player.nickname,
        message: `${player.nickname} ha completado el APAGÓN! 🎊`,
        totalNumbers: room.calledNumbers.length,
        numbersCalled: room.calledNumbers,
        totalLines: room.completedLines
      });
      
      // Detener el juego
      room.gameStarted = false;
      room.blackoutMode = false;
      
      console.log('✅ Apagón completado. Juego terminado.');
    }
  });

  // FINALIZAR PARTIDA (solo host)
  socket.on('end-game', ({ roomCode, winner }) => {
    console.log('🏁 Finalizando partida en sala:', roomCode);
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.host) {
      console.log('❌ Solo el host puede finalizar la partida');
      socket.emit('error', { message: 'Solo el host puede finalizar la partida' });
      return;
    }
    
    // Detener el juego
    room.gameStarted = false;
    room.gamePaused = false;
    room.blackoutMode = false;
    
    const finalWinner = winner || (room.winners.length > 0 ? room.winners[0].nickname : 'Ninguno');
    
    io.to(roomCode).emit('game-ended', {
      message: '🏁 ¡Partida finalizada!',
      winner: finalWinner,
      totalLines: room.completedLines,
      totalNumbers: room.calledNumbers.length,
      winners: room.winners
    });
    
    console.log('✅ Partida finalizada en sala:', roomCode, 'Ganador:', finalWinner);
  });

  // REINICIAR JUEGO (solo host)
  socket.on('reset-game', ({ roomCode }) => {
    console.log('🔄 Reiniciando juego en sala:', roomCode);
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.host) {
      console.log('❌ Solo el host puede reiniciar el juego');
      socket.emit('error', { message: 'Solo el host puede reiniciar el juego' });
      return;
    }
    
    // Reiniciar estado del juego
    room.calledNumbers = [];
    room.gameStarted = false;
    room.gamePaused = false;
    room.blackoutMode = false;
    room.completedLines = 0;
    room.winners = [];
    room.lastNumber = null;
    
    io.to(roomCode).emit('game-reset', {
      message: '🔄 Juego reiniciado',
      calledNumbers: []
    });
    
    console.log('✅ Juego reiniciado en sala:', roomCode);
  });

  // LIMPIAR NÚMEROS (solo host)
  socket.on('clear-numbers', ({ roomCode }) => {
    console.log('🧹 Limpiando números en sala:', roomCode);
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.host) {
      console.log('❌ Solo el host puede limpiar los números');
      socket.emit('error', { message: 'Solo el host puede limpiar los números' });
      return;
    }
    
    room.calledNumbers = [];
    room.lastNumber = null;
    
    io.to(roomCode).emit('numbers-cleared', {
      message: '🧹 Números limpiados',
      calledNumbers: []
    });
    
    console.log('✅ Números limpiados en sala:', roomCode);
  });

  // OBTENER NÚMEROS CANTADOS
  socket.on('get-called-numbers', ({ roomCode }) => {
    console.log('📋 Solicitando números cantados para:', roomCode);
    const room = rooms[roomCode];
    if (room) {
      socket.emit('called-numbers', room.calledNumbers);
    }
  });

  // OBTENER ESTADO DEL JUEGO
  socket.on('get-game-state', ({ roomCode }) => {
    console.log('📊 Solicitando estado del juego para:', roomCode);
    const room = rooms[roomCode];
    if (room) {
      socket.emit('game-state', {
        gameStarted: room.gameStarted,
        gamePaused: room.gamePaused,
        blackoutMode: room.blackoutMode,
        calledNumbers: room.calledNumbers,
        completedLines: room.completedLines,
        winners: room.winners,
        lastNumber: room.lastNumber
      });
    }
  });

  // VERIFICAR ESTADO DE SALA
  socket.on('get-room-state', ({ roomCode }) => {
    console.log('🔍 Solicitando estado de sala:', roomCode);
    const room = rooms[roomCode];
    if (room) {
      socket.emit('room-state', {
        players: room.players,
        totalPlayers: room.players.length,
        hosts: room.players.filter(p => p.host).map(p => ({
          nickname: p.nickname,
          playerId: p.playerId,
          connected: !!p.socketId
        })),
        calledNumbers: room.calledNumbers,
        totalCalled: room.calledNumbers.length,
        gameStarted: room.gameStarted,
        gamePaused: room.gamePaused,
        blackoutMode: room.blackoutMode,
        completedLines: room.completedLines,
        winners: room.winners,
        lastNumber: room.lastNumber
      });
    }
  });

  // DESCONEXIÓN
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
    
    for (const code in rooms) {
      const room = rooms[code];
      for (let i = 0; i < room.players.length; i++) {
        if (room.players[i].socketId === socket.id) {
          console.log('👤 Jugador desconectado:', {
            nickname: room.players[i].nickname,
            host: room.players[i].host,
            playerId: room.players[i].playerId
          });
          
          room.players[i].socketId = null;
          
          io.to(code).emit('player-list', room.players);
          break;
        }
      }
    }
  });
});

// MODIFICADO PARA VERCEL
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor listo en puerto ${PORT}`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.VERCEL_URL) {
    console.log(`📌 URL Pública: https://${process.env.VERCEL_URL}`);
  } else {
    console.log(`📌 URL Local: http://localhost:${PORT}`);
  }
  console.log('\n🎮 Eventos del servidor implementados:');
  console.log('  ✅ create-room       - Crear nueva sala');
  console.log('  ✅ join-room         - Unirse a sala existente');
  console.log('  ✅ start-game        - Iniciar juego (host)');
  console.log('  ✅ toggle-pause      - Pausar/reanudar (host)');
  console.log('  ✅ call-number       - Cantar número (host)');
  console.log('  ✅ check-bingo       - Verificar línea/apagón');
  console.log('  ✅ activate-blackout - Activar modo apagón (host)');
  console.log('  ✅ end-game          - Finalizar partida (host)');
  console.log('  ✅ reset-game        - Reiniciar juego (host)');
  console.log('  ✅ clear-numbers     - Limpiar números (host)');
  console.log('  ✅ get-game-state    - Obtener estado del juego');
  console.log('  ✅ get-room-state    - Obtener estado de sala');
  console.log('\n🎯 Sistema de líneas/apagón:');
  console.log('  • Línea completada → Juego continúa');
  console.log('  • Apagón completado → Juego termina');
  console.log('  • Modo apagón opcional para host');
});

// Exportar para Vercel
module.exports = server;