import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  private sessionData: any = {};

  constructor() {
    // URL DINÁMICA para localhost/Vercel
    const socketUrl = this.getSocketUrl();
    console.log('🔌 Conectando a Socket.io en:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io/'  // IMPORTANTE para Vercel
    });

    this.setupConnectionEvents();
    this.loadSession();
  }

  // MÉTODO NUEVO - URL dinámica
  private getSocketUrl(): string {
    // Si estamos en desarrollo (localhost)
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '4200') {
      return 'http://localhost:3001';
    }
    
    // Para producción en Vercel - usa el mismo dominio
    return window.location.origin;
  }

  // MÉTODO NUEVO - Manejo de eventos de conexión
  private setupConnectionEvents(): void {
    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor Socket.io - ID:', this.socket.id);
      
      // Reconectar automáticamente si hay sesión guardada
      if (this.sessionData.roomCode && this.sessionData.nickname) {
        console.log('🔄 Reconectando a sala:', this.sessionData.roomCode);
        this.reconnectToRoom();
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado del servidor:', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.io:', error.message);
    });
  }

  // Guardar sesión
  private saveSession(): void {
    this.sessionData.lastSaved = new Date().toISOString();
    localStorage.setItem('bingo-session', JSON.stringify(this.sessionData));
    console.log('💾 Sesión guardada:', this.sessionData);
  }

  // Cargar sesión
  private loadSession(): void {
    const saved = localStorage.getItem('bingo-session');
    if (saved) {
      try {
        this.sessionData = JSON.parse(saved);
        console.log('📂 Sesión cargada:', this.sessionData);
      } catch (e) {
        console.error('Error al cargar sesión:', e);
      }
    }
  }

  // Reconectar a sala
  private reconnectToRoom(): void {
    if (this.sessionData.roomCode && this.sessionData.nickname) {
      console.log('🔗 Reconectando a sala:', this.sessionData.roomCode);
      this.joinRoom(this.sessionData.roomCode, this.sessionData.nickname);
    }
  }

  // Genera un ID que solo vive mientras la pestaña esté abierta
  public getPlayerId(): string {
    let id = sessionStorage.getItem('playerId');
    if (!id) {
      id = 'player-' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('playerId', id);
      console.log('🆔 Nuevo Player ID generado:', id);
    } else {
      console.log('🆔 Player ID recuperado:', id);
    }
    return id;
  }

  // Métodos de Sala MEJORADOS
  createRoom(nickname: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const playerId = this.getPlayerId();
      console.log('🏠 Creando sala - Nickname:', nickname, 'Player ID:', playerId);
      
      this.socket.emit('create-room', { nickname, playerId });
      
      this.socket.once('room-created', (data: { roomCode: string }) => {
        console.log('✅ Sala creada en servidor:', data.roomCode);
        
        // Guardar sesión
        this.sessionData = {
          roomCode: data.roomCode,
          nickname: nickname,
          playerId: playerId,
          isHost: true
        };
        this.saveSession();
        
        resolve(data.roomCode);
      });
      
      this.socket.once('error', (error: { message: string }) => {
        console.log('❌ Error al crear sala:', error);
        reject(error.message);
      });
    });
  }

  joinRoom(roomCode: string, nickname: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const playerId = this.getPlayerId();
      console.log('🚪 Uniéndose a sala - Room:', roomCode, 'Nickname:', nickname, 'Player ID:', playerId);
      
      this.socket.emit('join-room', { roomCode, nickname, playerId });
      
      this.socket.once('player-list', () => {
        console.log('✅ Unido a sala exitosamente:', roomCode);
        
        // Guardar sesión
        this.sessionData = {
          roomCode: roomCode,
          nickname: nickname,
          playerId: playerId,
          isHost: false
        };
        this.saveSession();
        
        resolve(true);
      });
      
      this.socket.once('error', (error: { message: string }) => {
        console.log('❌ Error al unirse a sala:', error);
        reject(error.message);
      });
    });
  }

  getSession() {
    return { ...this.sessionData };
  }

  clearSession() {
    this.sessionData = {};
    localStorage.removeItem('bingo-session');
    sessionStorage.removeItem('playerId');
    console.log('🧹 Sesión limpiada');
  }

  // Métodos de Juego Básicos
  callNumber(roomCode: string) {
    console.log('🎲 Cantando número en sala:', roomCode);
    this.socket.emit('call-number', { roomCode });
  }

  // Métodos para Control del Host
  startGame(roomCode: string) {
    console.log('🎮 Iniciando juego en sala:', roomCode);
    this.socket.emit('start-game', { roomCode });
  }

  togglePause(roomCode: string) {
    console.log('⏸️ Alternando pausa en sala:', roomCode);
    this.socket.emit('toggle-pause', { roomCode });
  }

  activateBlackout(roomCode: string) {
    console.log('🎯 Activando modo apagón en sala:', roomCode);
    this.socket.emit('activate-blackout', { roomCode });
  }

  checkBingo(roomCode: string, board: any[][], isBlackout: boolean = false) {
    console.log('🏆 Verificando BINGO en sala:', roomCode, 'Apagón:', isBlackout);
    this.socket.emit('check-bingo', { roomCode, board, isBlackout });
  }

  endGame(roomCode: string, winner?: string) {
    console.log('🏁 Finalizando partida en sala:', roomCode);
    this.socket.emit('end-game', { roomCode, winner });
  }

  resetGame(roomCode: string) {
    console.log('🔄 Reiniciando juego en sala:', roomCode);
    this.socket.emit('reset-game', { roomCode });
  }

  clearNumbers(roomCode: string) {
    console.log('🧹 Limpiando números en sala:', roomCode);
    this.socket.emit('clear-numbers', { roomCode });
  }

  getCalledNumbers(roomCode: string) {
    this.socket.emit('get-called-numbers', { roomCode });
  }

  getGameState(roomCode: string) {
    console.log('📊 Solicitando estado del juego para:', roomCode);
    this.socket.emit('get-game-state', { roomCode });
  }

  // Listeners Básicos
  onRoomCreated(callback: (data: { roomCode: string }) => void) {
    this.socket.off('room-created');
    this.socket.on('room-created', (data) => {
      console.log('✅ Sala creada en servidor:', data.roomCode);
      callback(data);
    });
  }

  onPlayerList(callback: (players: any[]) => void) {
    this.socket.off('player-list');
    this.socket.on('player-list', (players) => {
      console.log('👥 Lista de jugadores recibida:', players);
      callback(players);
    });
  }

  onNumberCalled(callback: (number: number) => void) {
    this.socket.off('number-called');
    this.socket.on('number-called', (number) => {
      console.log('🔢 Número cantado recibido:', number);
      callback(number);
    });
  }

  onAllNumbersCalled(callback: (numbers: number[]) => void) {
    this.socket.off('all-numbers-called');
    this.socket.on('all-numbers-called', (numbers) => {
      console.log('🔢 Todos los números cantados recibidos:', numbers);
      callback(numbers);
    });
  }

  onBingoNumberCalled(callback: (bingoNumber: { letter: string, number: number, full: string }) => void) {
    this.socket.off('bingo-number-called');
    this.socket.on('bingo-number-called', (bingoNumber) => {
      console.log('🔠 Número BINGO llamado:', bingoNumber);
      callback(bingoNumber);
    });
  }

  onCalledNumbers(callback: (numbers: number[]) => void) {
    this.socket.off('called-numbers');
    this.socket.on('called-numbers', (numbers) => {
      console.log('📋 Números cantados recibidos:', numbers);
      callback(numbers);
    });
  }

  // Listeners para Control del Juego
  onGameStarted(callback: (data: any) => void) {
    this.socket.off('game-started');
    this.socket.on('game-started', (data) => {
      console.log('🎮 Juego iniciado:', data);
      callback(data);
    });
  }

  onGamePaused(callback: (data: { paused: boolean, message: string }) => void) {
    this.socket.off('game-paused');
    this.socket.on('game-paused', (data) => {
      console.log('⏸️ Estado de pausa:', data);
      callback(data);
    });
  }

  onBlackoutActivated(callback: (data: { message: string }) => void) {
    this.socket.off('blackout-activated');
    this.socket.on('blackout-activated', (data) => {
      console.log('🎯 Modo apagón activado:', data);
      callback(data);
    });
  }

  onLineCompleted(callback: (data: { 
    winner: string, 
    message: string, 
    patterns: string[], 
    totalLines: number, 
    isFirstLine: boolean 
  }) => void) {
    this.socket.off('line-completed');
    this.socket.on('line-completed', (data) => {
      console.log('🎉 Línea completada:', data);
      callback(data);
    });
  }

  onBlackoutCompleted(callback: (data: { 
    winner: string, 
    message: string, 
    totalNumbers: number, 
    numbersCalled: number[], 
    totalLines: number 
  }) => void) {
    this.socket.off('blackout-completed');
    this.socket.on('blackout-completed', (data) => {
      console.log('🎊 Apagón completado:', data);
      callback(data);
    });
  }

  onGameEnded(callback: (data: { 
    message: string, 
    winner: string, 
    totalLines: number, 
    totalNumbers: number, 
    winners: any[] 
  }) => void) {
    this.socket.off('game-ended');
    this.socket.on('game-ended', (data) => {
      console.log('🏁 Partida finalizada:', data);
      callback(data);
    });
  }

  onGameReset(callback: (data: { message: string, calledNumbers: number[] }) => void) {
    this.socket.off('game-reset');
    this.socket.on('game-reset', (data) => {
      console.log('🔄 Juego reiniciado:', data);
      callback(data);
    });
  }

  onNumbersCleared(callback: (data: { message: string, calledNumbers: number[] }) => void) {
    this.socket.off('numbers-cleared');
    this.socket.on('numbers-cleared', (data) => {
      console.log('🧹 Números limpiados:', data);
      callback(data);
    });
  }

  onGameState(callback: (state: any) => void) {
    this.socket.off('game-state');
    this.socket.on('game-state', (state) => {
      console.log('📊 Estado del juego recibido:', state);
      callback(state);
    });
  }

  // Para debug
  verifyRoomState(roomCode: string) {
    console.log('🔍 Solicitando estado de sala:', roomCode);
    this.socket.emit('get-room-state', { roomCode });
  }

  onRoomState(callback: (state: any) => void) {
    this.socket.off('room-state');
    this.socket.on('room-state', (state) => {
      console.log('🔍 Estado del servidor recibido:', state);
      callback(state);
    });
  }

  // Para debug - ver errores
  onError(callback: (error: any) => void) {
    this.socket.off('error');
    this.socket.on('error', (error) => {
      console.log('❌ Error del servidor:', error);
      callback(error);
    });
  }

  // Nuevo método para desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('🔌 Socket desconectado manualmente');
    }
  }

  // Verificar si está conectado
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Obtener ID del socket
  getSocketId(): string {
    return this.socket?.id || 'no-conectado';
  }
}