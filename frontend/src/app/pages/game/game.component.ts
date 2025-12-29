import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
      <!-- Encabezado -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="margin: 0; color: #333;">🎯 Bingo-Finds</h2>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
            ¡Atrapa Pokémon completando tu cartilla!
            Sala: <span style="color: #2196f3; font-weight: bold;">{{ roomCode }}</span>
            <span *ngIf="isHost" style="margin-left: 10px; background: #ff9800; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
              🎮 Host
            </span>
          </p>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button *ngIf="isHost" (click)="goToHostPanel()" 
                  style="background: #ff9800; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px;">
            <span>🎮</span> Panel del Host
          </button>
          
          <button (click)="togglePokemonTheme()" 
                  [style.background]="showPokemon ? '#9c27b0' : '#4caf50'"
                  style="color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px;">
            <span>{{ showPokemon ? '🐭' : '🎨' }}</span>
            {{ showPokemon ? 'Ocultar Pokémon' : 'Mostrar Pokémon' }}
          </button>
          
          <div style="font-size: 14px; color: #666; padding: 8px 12px; background: #f5f5f5; border-radius: 6px;">
            {{ isHost ? '🎮 Eres el Host' : '👤 Jugador' }}
          </div>
        </div>
      </div>
      
      <!-- Área de Número Actual -->
      <div style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 10px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
          <div>
            <h3 style="color: #1976d2; margin: 0 0 10px 0; font-size: 18px;">ÚLTIMO NÚMERO CANTADO</h3>
            <div *ngIf="lastBingoNumber" style="display: flex; align-items: center; gap: 15px;">
              <div style="background: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <div style="font-size: 48px; font-weight: bold; color: #d32f2f; line-height: 1;">
                  {{ lastBingoNumber.full }}
                </div>
                <div style="font-size: 16px; color: #666; text-align: center; margin-top: 5px;">
                  {{ lastBingoNumber.letter }}-{{ lastBingoNumber.number }}
                </div>
              </div>
              <div style="font-size: 14px; color: #1976d2;">
                <div>Números cantados: {{ calledNumbers.length }}/75</div>
                <div>Progreso: {{ (calledNumbers.length / 75 * 100).toFixed(1) }}%</div>
              </div>
            </div>
            <div *ngIf="!lastBingoNumber" style="text-align: center; color: #666; padding: 20px; font-style: italic;">
              ⏳ Esperando que el host cante el primer número...
            </div>
          </div>
          
          <div>
            <button (click)="checkBingo()" 
                    [disabled]="!hasBingoLine"
                    style="background: #9c27b0; color: white; border: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; min-width: 180px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 8px rgba(156, 39, 176, 0.3);"
                    [style.background]="hasBingoLine ? '#9c27b0' : '#cccccc'"
                    [style.cursor]="hasBingoLine ? 'pointer' : 'not-allowed'">
              <span>{{ hasBingoLine ? '🏆' : '📝' }}</span>
              {{ hasBingoLine ? '¡CANTAR LÍNEA!' : 'Sin línea completa' }}
            </button>
            <p style="font-size: 12px; color: #666; margin: 8px 0 0 0; text-align: center;">
              {{ hasBingoLine ? '¡Tienes una línea completa!' : 'Marca todos los números de una línea' }}
            </p>
          </div>
        </div>
        
        <!-- Últimos números -->
        <div *ngIf="calledNumbers.length > 0" style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #90caf9;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #1976d2; font-weight: bold;">ÚLTIMOS 10 NÚMEROS:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span *ngFor="let num of lastTenNumbers" 
                  [style.background]="isNumberInBoard(num) ? '#4caf50' : '#2196f3'"
                  [style.border]="isNumberInBoard(num) && isNumberMarked(num) ? '2px solid #2e7d32' : ''"
                  style="color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; position: relative;">
              {{ num }}
              <span *ngIf="isNumberInBoard(num) && isNumberMarked(num)" 
                    style="position: absolute; top: -5px; right: -5px; background: #2e7d32; color: white; width: 20px; height: 20px; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center;">
                ✓
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Mensaje de línea completada -->
      <div *ngIf="lineCompletedMessage" 
           style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #ffeb3b, #ff9800); border: 3px solid #ff5722; border-radius: 10px; text-align: center; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);">
        <h3 style="color: #d32f2f; margin: 0 0 10px 0; font-size: 24px;">🎉 ¡LÍNEA COMPLETADA! 🎉</h3>
        <p style="color: #333; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">{{ lineCompletedMessage }}</p>
        <p style="color: #666; font-size: 14px; margin: 0;">
          ¡Sigue jugando para completar el APAGÓN (todo el tablero)!
        </p>
      </div>

      <!-- Notificación de otros jugadores -->
      <div *ngIf="otherPlayerBingo" 
           style="margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #bbdefb, #64b5f6); border: 2px solid #1976d2; border-radius: 8px; text-align: center;">
        <h4 style="color: #0d47a1; margin: 0 0 10px 0; font-size: 16px;">🎉 ¡OTRO JUGADOR HA COMPLETADO UNA LÍNEA!</h4>
        <p style="color: #1565c0; font-size: 16px; margin: 0;">{{ otherPlayerBingo }}</p>
        <p style="color: #1976d2; font-size: 14px; margin: 10px 0 0 0;">
          ¡El juego continúa! Completa tu línea para unirte a la celebración.
        </p>
      </div>

      <!-- Controles del jugador -->
      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0;">
        <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">⚙️ Controles de Cartilla</h4>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          
          <button (click)="clearMarks()" 
                  style="background: #9c27b0; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px;">
            <span>🧹</span> Limpiar Marcas
          </button>
          
          <button (click)="toggleAutoMark()" 
                  [style.background]="autoMarkEnabled ? '#4caf50' : '#f44336'"
                  style="color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px;">
            <span>{{ autoMarkEnabled ? '✅' : '❌' }}</span>
            {{ autoMarkEnabled ? 'Auto-marcado: ON' : 'Auto-marcado: OFF' }}
          </button>
          
          <button *ngIf="blackoutMode" 
                  style="background: #673ab7; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; display: flex; align-items: center; gap: 5px;">
            <span>🎯</span> Modo APAGÓN Activado
          </button>
        </div>
      </div>

      <!-- Tablero de Bingo con Pokémon -->
      <div style="display: flex; justify-content: center; margin-top: 30px;">
        <div>
          <!-- Encabezados B I N G O -->
          <div style="display: flex; justify-content: center; margin-bottom: 0px;">
            <div *ngFor="let letter of ['B', 'I', 'N', 'G', 'O']; let i = index" 
                 style="width: 100px; text-align: center; font-weight: bold; font-size: 24px; 
                        padding: 15px 0; 
                        color: white;
                        background: 
                          {{i === 0 ? '#d32f2f' : 
                            i === 1 ? '#1976d2' : 
                            i === 2 ? '#388e3c' : 
                            i === 3 ? '#f57c00' : 
                            '#7b1fa2'}};
                        border-radius: 8px 8px 0 0; margin: 0; border: 1px solid rgba(0,0,0,0.1);">
              {{ letter }}
            </div>
          </div>
          
          <!-- Tablero -->
          <table style="border: 4px solid #333; box-shadow: 0 6px 16px rgba(0,0,0,0.2); background: white; border-radius: 8px; overflow: hidden;">
            <tr *ngFor="let row of board; let i = index">
              <td *ngFor="let cell of row; let j = index"
                  (click)="mark(i, j)"
                  [class.marked]="cell.marked"
                  [class.completed-line]="isCellInCompletedLine(i, j)"
                  [style.background]="cell.value === 0 ? 'linear-gradient(135deg, #fff9c4, #ffecb3)' : ''"
                  [style.cursor]="cell.value === 0 ? 'default' : 'pointer'"
                  [style.box-shadow]="cell.value === 0 ? 'inset 0 0 0 3px #ffb300, 0 0 10px rgba(255, 179, 0, 0.3)' : ''"
                  style="width: 90px; height: 110px; position: relative; padding: 5px; text-align: center;">
                
                <!-- Imagen del Pokémon o Karla en FREE -->
                <div style="height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
                  <ng-container *ngIf="cell.value === 0">
                    <!-- Imagen especial de Karla para FREE -->
                    <div style="position: relative;">
                      <img src="assets/images/karla.png" 
                           alt="Karla"
                           style="max-width: 45px; max-height: 45px; object-fit: contain; border-radius: 50%; border: 2px solid #ffb300;">
                      <!-- Efecto de brillo -->
                      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                                  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
                                  animation: pulseGlow 2s infinite;"></div>
                    </div>
                  </ng-container>
                  <ng-container *ngIf="cell.value !== 0 && showPokemon">
                    <!-- Imagen del Pokémon normal -->
                    <img [src]="getPokemonImage(cell.value)" 
                         [alt]="getPokemonName(cell.value)"
                         style="max-width: 45px; max-height: 45px; object-fit: contain;">
                  </ng-container>
                </div>
                
                <!-- Número o Karla -->
                <div [style.font-size]="cell.value === 0 ? '16px' : '20px'" 
                     [style.font-weight]="'bold'" 
                     [style.color]="cell.value === 0 ? '#e65100' : '#333'"
                     [style.text-shadow]="cell.value === 0 ? '1px 1px 2px rgba(0,0,0,0.2)' : 'none'"
                     [style.margin-top]="cell.value === 0 ? '10px' : '0'">
                  {{ cell.value === 0 ? 'Karla' : cell.value }}
                </div>
                
                <!-- Nombre del Pokémon (solo si showPokemon es true y no es FREE) -->
                <div *ngIf="showPokemon && cell.value !== 0" style="font-size: 10px; color: #666; margin-top: 2px; height: 14px; overflow: hidden; text-overflow: ellipsis;">
                  {{ getPokemonName(cell.value) }}
                </div>
                
                <!-- Estado -->
                <div style="position: absolute; bottom: 5px; left: 0; right: 0; text-align: center;">
                  <div *ngIf="cell.marked && cell.value !== 0" style="font-size: 11px; color: #2e7d32; font-weight: bold;">
                    ✓ MARCADO
                  </div>
                  <div *ngIf="!cell.marked && isNumberCalled(cell.value) && cell.value !== 0" 
                       style="font-size: 10px; color: #ff5722; font-weight: bold;">
                    ● DISPONIBLE
                  </div>
                </div>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 15px; text-align: center; font-size: 13px; color: #666; padding: 10px; background: #f5f5f5; border-radius: 6px;">
            <p style="margin: 0;">Haz clic en los números para marcarlos. El centro está pre-marcado.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
              Números en tu cartilla que han sido cantados: {{ numbersInBoardCalled }} / {{ totalCells - 1 }}
            </p>
          </div>
        </div>
      </div>

      <!-- Panel de estadísticas -->
      <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
          <!-- Progreso personal -->
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h4 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 16px;">📊 TU PROGRESO</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
              <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 6px;">
                <div style="font-size: 12px; color: #1976d2;">MARCADOS</div>
                <div style="font-size: 28px; font-weight: bold; color: #0d47a1;">{{ markedCount }}</div>
              </div>
              <div style="text-align: center; padding: 15px; background: #f1f8e9; border-radius: 6px;">
                <div style="font-size: 12px; color: #388e3c;">TOTAL</div>
                <div style="font-size: 28px; font-weight: bold; color: #1b5e20;">{{ totalCells }}</div>
              </div>
            </div>
            <div style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #ddd;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="font-size: 13px; color: #666;">Progreso:</span>
                <span style="font-weight: bold; color: #4caf50; font-size: 16px;">{{ progressPercentage }}%</span>
              </div>
              <div style="height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden;">
                <div [style.width]="progressPercentage + '%'" 
                     style="height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); border-radius: 5px; transition: width 0.5s;"></div>
              </div>
            </div>
          </div>
          
          <!-- Patrones completados -->
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h4 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 16px;">🎯 PATRONES COMPLETADOS</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;">
              <div *ngFor="let pattern of completedPatterns" 
                   style="padding: 10px; background: #e8f5e9; border: 2px solid #4caf50; border-radius: 6px; font-size: 12px; color: #2e7d32; text-align: center; font-weight: bold;">
                ✅ {{ pattern }}
              </div>
              <div *ngIf="completedPatterns.length === 0" 
                   style="padding: 15px; background: #f5f5f5; border-radius: 6px; font-size: 13px; color: #666; text-align: center; grid-column: span 2;">
                📝 Aún no has completado ningún patrón
              </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                <strong>🎯 Objetivo:</strong> Completa 1 línea para cantar BINGO, 
                o todo el tablero para ganar el APAGÓN.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Información del juego -->
        <div style="margin-top: 20px; padding: 15px; background: #e8eaf6; border-radius: 8px; border-left: 4px solid #3f51b5;">
          <h5 style="color: #3f51b5; margin: 0 0 10px 0; font-size: 14px;">ℹ️ INFORMACIÓN DEL JUEGO</h5>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px; color: #555;">
            <div>• Estado: <span [style.color]="gameStarted ? '#4caf50' : '#f44336'">{{ gameStarted ? '🎮 EN CURSO' : '⏸️ EN ESPERA' }}</span></div>
            <div>• Pausado: {{ gamePaused ? '⏸️ SÍ' : '▶️ NO' }}</div>
            <div>• Modo: {{ blackoutMode ? '🎯 APAGÓN' : '📝 NORMAL' }}</div>
            <div>• Líneas completadas en sala: {{ totalLinesCompleted }}</div>
            <div>• Números disponibles: {{ 75 - calledNumbers.length }}</div>
          </div>
        </div>
      </div>

      <!-- Mensajes del sistema -->
      <div *ngIf="systemMessage" 
           style="margin-top: 20px; padding: 15px; background: #e8f5e8; border: 2px solid #4caf50; border-radius: 8px; color: #2e7d32; text-align: center; font-weight: bold;">
        {{ systemMessage }}
      </div>
      
      <!-- Notificación de apagón -->
      <div *ngIf="blackoutCompletedMessage" 
           style="margin-top: 20px; padding: 25px; background: linear-gradient(135deg, #ffeb3b, #ff9800); border: 4px solid #ff5722; border-radius: 12px; text-align: center; box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);">
        <h3 style="color: #d32f2f; margin: 0 0 15px 0; font-size: 28px;">🏆 ¡APAGÓN COMPLETADO! 🏆</h3>
        <p style="color: #333; font-size: 20px; margin: 0 0 10px 0; font-weight: bold;">{{ blackoutCompletedMessage }}</p>
        <p style="color: #666; font-size: 16px; margin: 0;">
          🎉 ¡Felicidades al ganador! La partida ha terminado.
        </p>
      </div>
    </div>
  `,
  styles: [`
    table { 
      border-collapse: collapse; 
    }
    td { 
      border: 2px solid #555; 
      text-align: center; 
      cursor: pointer; 
      font-size: 20px;
      transition: all 0.3s;
      position: relative;
    }
    td:hover {
      background: #f0f0f0 !important;
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .marked { 
      background: linear-gradient(135deg, #4caf50, #2e7d32) !important; 
      color: white; 
      font-weight: bold;
    }
    .marked:hover {
      background: linear-gradient(135deg, #388e3c, #1b5e20) !important;
    }
    .completed-line {
      box-shadow: inset 0 0 0 3px #ff9800;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: inset 0 0 0 3px #ff9800; }
      50% { box-shadow: inset 0 0 0 3px #ff5722; }
      100% { box-shadow: inset 0 0 0 3px #ff9800; }
    }
    /* Animación para el brillo de Karla */
    @keyframes pulseGlow {
      0% { opacity: 0.5; }
      50% { opacity: 0.8; }
      100% { opacity: 0.5; }
    }
  `]
})
export class GameComponent implements OnInit {
  board: any[][] = [];
  roomCode = '';
  isHost = false;
  gameStarted = false;
  gamePaused = false;
  blackoutMode = false;
  lastBingoNumber: { letter: string, number: number, full: string } | null = null;
  calledNumbers: number[] = [];
  markedCount = 0;
  totalCells = 25;
  systemMessage = '';
  lineCompletedMessage = '';
  otherPlayerBingo = '';
  blackoutCompletedMessage = '';
  autoMarkEnabled = false;
  completedLines: number[][] = [];
  completedPatterns: string[] = [];
  hasBingoLine = false;
  lastTenNumbers: number[] = [];
  numbersInBoardCalled = 0;
  totalLinesCompleted = 0;

  // Nuevas propiedades para Pokémon
  showPokemon = true;
  pokemonImages: {[key: number]: string} = {};
  pokemonNames: {[key: number]: string} = {};

  constructor(
    private socket: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.roomCode = this.route.snapshot.paramMap.get('code')!;
    
    // Cargar estado guardado
    this.loadSavedBoard();
    this.loadCalledNumbers();
    
    this.calculateMarkedCount();
    this.updateNumbersInBoardCalled();
    this.checkBingoLine();

    const myId = this.socket.getPlayerId();
    const session = this.socket.getSession();

    // RECONEXIÓN AUTOMÁTICA
    if (session.nickname && session.roomCode === this.roomCode) {
      this.socket.joinRoom(this.roomCode, session.nickname);
    }

    // Inicializar Pokémon para el tablero actual
    this.initializePokemonForBoard();

    // Listeners
    this.setupSocketListeners(myId, session);
    
    // Cargar estado del juego del servidor
    setTimeout(() => {
      this.socket.getGameState(this.roomCode);
    }, 1000);
  }

  setupSocketListeners(myId: string, session: any) {
    // Lista de jugadores
    this.socket.onPlayerList(players => {
      const me = players.find(p => p.playerId === myId);
      this.isHost = me ? me.host : false;
    });

    // Estado del juego
    this.socket.onGameState((state: any) => {
      this.gameStarted = state.gameStarted || false;
      this.gamePaused = state.gamePaused || false;
      this.blackoutMode = state.blackoutMode || false;
      this.calledNumbers = state.calledNumbers || [];
      this.totalLinesCompleted = state.completedLines || 0;
      this.lastBingoNumber = state.lastNumber || null;
      this.updateLastTenNumbers();
      this.updateNumbersInBoardCalled();
      
      if (this.autoMarkEnabled) {
        this.calledNumbers.forEach(n => this.autoMark(n));
      }
    });

    // Números cantados
    this.socket.onBingoNumberCalled((bingoNumber: { letter: string, number: number, full: string }) => {
      this.lastBingoNumber = bingoNumber;
      if (!this.calledNumbers.includes(bingoNumber.number)) {
        this.calledNumbers.push(bingoNumber.number);
      }
      
      if (this.autoMarkEnabled) {
        this.autoMark(bingoNumber.number);
      }
      
      this.updateLastTenNumbers();
      this.updateNumbersInBoardCalled();
      this.checkBingoLine();
      this.saveCalledNumbers();
    });

    // Todos los números cantados
    this.socket.onAllNumbersCalled((numbers: number[]) => {
      this.calledNumbers = numbers;
      this.updateLastTenNumbers();
      this.updateNumbersInBoardCalled();
      this.saveCalledNumbers();
      this.checkBingoLine();
    });

    // Juego iniciado
    this.socket.onGameStarted(() => {
      this.gameStarted = true;
      this.systemMessage = '🎮 ¡El juego ha comenzado!';
      setTimeout(() => this.systemMessage = '', 5000);
    });

    // Juego pausado
    this.socket.onGamePaused((data: { paused: boolean, message: string }) => {
      this.gamePaused = data.paused;
      this.systemMessage = data.message;
      setTimeout(() => this.systemMessage = '', 3000);
    });

    // Modo apagón activado
    this.socket.onBlackoutActivated((data: { message: string }) => {
      this.blackoutMode = true;
      this.systemMessage = data.message;
      setTimeout(() => this.systemMessage = '', 5000);
    });

    // Línea completada por otro jugador
    this.socket.onLineCompleted((data: { winner: string, message: string, patterns: string[], totalLines: number, isFirstLine: boolean }) => {
      this.totalLinesCompleted = data.totalLines;
      if (data.winner !== session.nickname) {
        this.otherPlayerBingo = `${data.winner} ha completado una línea! (${data.patterns[0]})`;
        setTimeout(() => this.otherPlayerBingo = '', 8000);
      }
    });

    // Apagón completado
    this.socket.onBlackoutCompleted((data: { winner: string, message: string, totalNumbers: number, numbersCalled: number[], totalLines: number }) => {
      this.totalLinesCompleted = data.totalLines;
      if (data.winner === session.nickname) {
        this.blackoutCompletedMessage = `🎊 ¡FELICIDADES! ¡HAS GANADO EL APAGÓN! 🎊`;
      } else {
        this.systemMessage = `🏆 ${data.winner} ha ganado el APAGÓN con ${data.totalNumbers} números!`;
        setTimeout(() => this.systemMessage = '', 10000);
      }
      this.gameStarted = false;
    });

    // Partida finalizada
    this.socket.onGameEnded((data: { message: string, winner: string, totalLines: number, totalNumbers: number, winners: any[] }) => {
      this.systemMessage = `🏁 ${data.message} Ganador: ${data.winner}`;
      this.gameStarted = false;
      setTimeout(() => this.systemMessage = '', 10000);
    });

    // Juego reiniciado
    this.socket.onGameReset((data: { message: string, calledNumbers: number[] }) => {
      this.calledNumbers = data.calledNumbers;
      this.gameStarted = false;
      this.gamePaused = false;
      this.blackoutMode = false;
      this.lastBingoNumber = null;
      this.updateLastTenNumbers();
      this.updateNumbersInBoardCalled();
      this.systemMessage = data.message;
      setTimeout(() => this.systemMessage = '', 5000);
    });

    // Números limpiados
    this.socket.onNumbersCleared((data: { message: string, calledNumbers: number[] }) => {
      this.calledNumbers = data.calledNumbers;
      this.lastBingoNumber = null;
      this.updateLastTenNumbers();
      this.updateNumbersInBoardCalled();
      this.systemMessage = data.message;
      setTimeout(() => this.systemMessage = '', 5000);
    });
  }

  // Métodos del juego
  generateBoard() {
    const playerId = this.socket.getPlayerId();
    const roomCode = this.roomCode;
    
    const seed = this.stringToSeed(playerId + roomCode);
    const random = this.seededRandom(seed);
    
    this.board = [];
    this.completedLines = [];
    this.completedPatterns = [];
    this.hasBingoLine = false;
    
    const ranges = [
      { min: 1, max: 15 },
      { min: 16, max: 30 },
      { min: 31, max: 45 },
      { min: 46, max: 60 },
      { min: 61, max: 75 }
    ];
    
    for (let i = 0; i < 5; i++) {
      this.board[i] = [];
      for (let j = 0; j < 5; j++) {
        if (i === 2 && j === 2) {
          this.board[i][j] = { value: 0, marked: true };
        } else {
          const usedNumbers = new Set<number>();
          for (let k = 0; k < i; k++) {
            usedNumbers.add(this.board[k][j].value);
          }
          
          let num;
          do {
            num = Math.floor(random() * (ranges[j].max - ranges[j].min + 1)) + ranges[j].min;
          } while (usedNumbers.has(num));
          
          this.board[i][j] = { value: num, marked: false };
        }
      }
    }
    
    this.saveBoard();
    this.calculateMarkedCount();
    this.updateNumbersInBoardCalled();
    this.checkBingoLine();
    
    // Inicializar Pokémon para el nuevo tablero
    this.initializePokemonForBoard();
  }
  
  seededRandom(seed: number) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  autoMark(n: number) {
    let markedAny = false;
    for (const row of this.board) {
      for (const cell of row) {
        if (cell.value === n && !cell.marked) {
          cell.marked = true;
          markedAny = true;
        }
      }
    }
    if (markedAny) {
      this.calculateMarkedCount();
      this.checkBingoLine();
    }
  }

  mark(i: number, j: number) {
    if (this.board[i][j].value === 0) return;
    
    this.board[i][j].marked = !this.board[i][j].marked;
    this.calculateMarkedCount();
    this.checkBingoLine();
    this.saveBoard();
  }
  
  calculateMarkedCount() {
    this.markedCount = this.board.flat().filter(cell => cell.marked).length;
  }
  
  updateNumbersInBoardCalled() {
    this.numbersInBoardCalled = this.board.flat()
      .filter(cell => cell.value !== 0)
      .filter(cell => this.calledNumbers.includes(cell.value))
      .length;
  }
  
  checkBingoLine() {
    this.hasBingoLine = false;
    this.completedLines = [];
    this.completedPatterns = [];
    
    // Verificar líneas horizontales
    for (let i = 0; i < 5; i++) {
      if (this.board[i].every(cell => cell.marked)) {
        this.hasBingoLine = true;
        this.completedLines.push([i, -1]);
        this.completedPatterns.push(`Línea ${i + 1}`);
      }
    }
    
    // Verificar columnas verticales
    for (let j = 0; j < 5; j++) {
      let columnComplete = true;
      for (let i = 0; i < 5; i++) {
        if (!this.board[i][j].marked) {
          columnComplete = false;
          break;
        }
      }
      if (columnComplete) {
        this.hasBingoLine = true;
        this.completedLines.push([-1, j]);
        this.completedPatterns.push(`Columna ${String.fromCharCode(65 + j)}`);
      }
    }
    
    // Verificar diagonal principal
    let diag1Complete = true;
    for (let i = 0; i < 5; i++) {
      if (!this.board[i][i].marked) {
        diag1Complete = false;
        break;
      }
    }
    if (diag1Complete) {
      this.hasBingoLine = true;
      this.completedLines.push([-2, -2]);
      this.completedPatterns.push('Diagonal \\');
    }
    
    // Verificar diagonal secundaria
    let diag2Complete = true;
    for (let i = 0; i < 5; i++) {
      if (!this.board[i][4 - i].marked) {
        diag2Complete = false;
        break;
      }
    }
    if (diag2Complete) {
      this.hasBingoLine = true;
      this.completedLines.push([-3, -3]);
      this.completedPatterns.push('Diagonal /');
    }
    
    // Verificar cuatro esquinas
    if (this.board[0][0].marked && this.board[0][4].marked && 
        this.board[4][0].marked && this.board[4][4].marked) {
      this.hasBingoLine = true;
      this.completedPatterns.push('4 Esquinas');
    }
  }
  
  checkBingo() {
    if (!this.hasBingoLine) {
      this.systemMessage = '❌ Aún no has completado ninguna línea. ¡Sigue jugando!';
      setTimeout(() => this.systemMessage = '', 3000);
      return;
    }
    
    const session = this.socket.getSession();
    const pattern = this.completedPatterns[0] || 'una línea';
    this.lineCompletedMessage = `¡Has completado ${pattern}!`;
    
    // Verificar si es apagón completo
    const isBlackout = this.markedCount === 25;
    
    // Notificar al servidor
    this.socket.checkBingo(this.roomCode, this.board, isBlackout);
    
    // Limpiar mensaje después de 10 segundos
    setTimeout(() => {
      this.lineCompletedMessage = '';
    }, 10000);
  }
  
  isCellInCompletedLine(i: number, j: number): boolean {
    for (const line of this.completedLines) {
      const [lineType, index] = line;
      
      if (lineType === -1 && i === index) {
        return true; // Línea horizontal
      }
      
      if (lineType === -2 && i === j) {
        return true; // Diagonal principal
      }
      
      if (lineType === -3 && i === 4 - j) {
        return true; // Diagonal secundaria
      }
      
      if (index >= 0 && j === index && lineType === -1) {
        return true; // Columna
      }
    }
    return false;
  }
  
  isNumberCalled(num: number): boolean {
    return this.calledNumbers.includes(num);
  }
  
  isNumberInBoard(num: number): boolean {
    for (const row of this.board) {
      for (const cell of row) {
        if (cell.value === num) {
          return true;
        }
      }
    }
    return false;
  }
  
  isNumberMarked(num: number): boolean {
    for (const row of this.board) {
      for (const cell of row) {
        if (cell.value === num && cell.marked) {
          return true;
        }
      }
    }
    return false;
  }
  
  updateLastTenNumbers() {
    this.lastTenNumbers = this.calledNumbers.slice(-10).reverse();
  }
  
  toggleAutoMark() {
    this.autoMarkEnabled = !this.autoMarkEnabled;
    if (this.autoMarkEnabled) {
      this.systemMessage = '✅ Auto-marcado activado: los números se marcarán automáticamente';
      // Marcar todos los números ya cantados
      this.calledNumbers.forEach(n => this.autoMark(n));
    } else {
      this.systemMessage = '❌ Auto-marcado desactivado: marca los números manualmente';
    }
    setTimeout(() => this.systemMessage = '', 3000);
    this.saveBoard();
  }
  
  get progressPercentage(): number {
    return Math.round((this.markedCount / this.totalCells) * 100);
  }
  
  goToHostPanel() {
    window.location.href = `/host/${this.roomCode}`;
  }
  
  saveBoard() {
    const boardData = {
      board: this.board,
      roomCode: this.roomCode,
      playerId: this.socket.getPlayerId(),
      timestamp: new Date().getTime(),
      autoMarkEnabled: this.autoMarkEnabled,
      showPokemon: this.showPokemon
    };
    sessionStorage.setItem(`bingo-board-${this.roomCode}-${this.socket.getPlayerId()}`, JSON.stringify(boardData));
  }
  
  loadSavedBoard() {
    const key = `bingo-board-${this.roomCode}-${this.socket.getPlayerId()}`;
    const saved = sessionStorage.getItem(key);
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.roomCode === this.roomCode && data.playerId === this.socket.getPlayerId()) {
          this.board = data.board;
          this.autoMarkEnabled = data.autoMarkEnabled || false;
          this.showPokemon = data.showPokemon !== false; // Por defecto true
          return true;
        }
      } catch (e) {
        console.error('Error al cargar tablero:', e);
      }
    }
    
    this.generateBoard();
    return false;
  }
  
  saveCalledNumbers() {
    const data = {
      numbers: this.calledNumbers,
      roomCode: this.roomCode,
      timestamp: new Date().getTime()
    };
    sessionStorage.setItem(`bingo-called-${this.roomCode}`, JSON.stringify(data));
  }
  
  loadCalledNumbers() {
    const key = `bingo-called-${this.roomCode}`;
    const saved = sessionStorage.getItem(key);
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.roomCode === this.roomCode) {
          this.calledNumbers = data.numbers || [];
          this.updateLastTenNumbers();
          this.updateNumbersInBoardCalled();
        }
      } catch (e) {
        console.error('Error al cargar números cantados:', e);
      }
    }
  }
  
  clearMarks() {
    if (confirm('¿Limpiar todas las marcas? (Excepto Karla)')) {
      for (const row of this.board) {
        for (const cell of row) {
          if (cell.value !== 0) {
            cell.marked = false;
          }
        }
      }
      this.calculateMarkedCount();
      this.checkBingoLine();
      this.saveBoard();
    }
  }

  // Métodos para Pokémon
  initializePokemonForBoard() {
    const pokemonIds = new Set<number>();
    
    // Obtener todos los números únicos del tablero (excepto 0)
    for (const row of this.board) {
      for (const cell of row) {
        if (cell.value !== 0) {
          pokemonIds.add(cell.value);
        }
      }
    }
    
    // Lista COMPLETA de Pokémon populares con sus números
    const pokemonList: {[key: number]: {name: string, id: number}} = {
      1: {name: 'Bulbasaur', id: 1},
      2: {name: 'Ivysaur', id: 2},
      3: {name: 'Venusaur', id: 3},
      4: {name: 'Charmander', id: 4},
      5: {name: 'Charmeleon', id: 5},
      6: {name: 'Charizard', id: 6},
      7: {name: 'Squirtle', id: 7},
      8: {name: 'Wartortle', id: 8},
      9: {name: 'Blastoise', id: 9},
      10: {name: 'Caterpie', id: 10},
      11: {name: 'Metapod', id: 11},
      12: {name: 'Butterfree', id: 12},
      13: {name: 'Weedle', id: 13},
      14: {name: 'Kakuna', id: 14},
      15: {name: 'Beedrill', id: 15},
      16: {name: 'Pidgey', id: 16},
      17: {name: 'Pidgeotto', id: 17},
      18: {name: 'Pidgeot', id: 18},
      19: {name: 'Rattata', id: 19},
      20: {name: 'Raticate', id: 20},
      25: {name: 'Pikachu', id: 25},
      26: {name: 'Raichu', id: 26},
      27: {name: 'Sandshrew', id: 27},
      28: {name: 'Sandslash', id: 28},
      29: {name: 'Nidoran♀', id: 29},
      30: {name: 'Nidorina', id: 30},
      31: {name: 'Nidoqueen', id: 31},
      32: {name: 'Nidoran♂', id: 32},
      33: {name: 'Nidorino', id: 33},
      34: {name: 'Nidoking', id: 34},
      35: {name: 'Clefairy', id: 35},
      36: {name: 'Clefable', id: 36},
      37: {name: 'Vulpix', id: 37},
      38: {name: 'Ninetales', id: 38},
      39: {name: 'Jigglypuff', id: 39},
      40: {name: 'Wigglytuff', id: 40},
      41: {name: 'Zubat', id: 41},
      42: {name: 'Golbat', id: 42},
      43: {name: 'Oddish', id: 43},
      44: {name: 'Gloom', id: 44},
      45: {name: 'Vileplume', id: 45},
      46: {name: 'Paras', id: 46},
      47: {name: 'Parasect', id: 47},
      48: {name: 'Venonat', id: 48},
      49: {name: 'Venomoth', id: 49},
      50: {name: 'Diglett', id: 50},
      51: {name: 'Dugtrio', id: 51},
      52: {name: 'Meowth', id: 52},
      53: {name: 'Persian', id: 53},
      54: {name: 'Psyduck', id: 54},
      55: {name: 'Golduck', id: 55},
      56: {name: 'Mankey', id: 56},
      57: {name: 'Primeape', id: 57},
      58: {name: 'Growlithe', id: 58},
      59: {name: 'Arcanine', id: 59},
      60: {name: 'Poliwag', id: 60},
      61: {name: 'Poliwhirl', id: 61},
      62: {name: 'Poliwrath', id: 62},
      63: {name: 'Abra', id: 63},
      64: {name: 'Kadabra', id: 64},
      65: {name: 'Alakazam', id: 65},
      66: {name: 'Machop', id: 66},
      67: {name: 'Machoke', id: 67},
      68: {name: 'Machamp', id: 68},
      69: {name: 'Bellsprout', id: 69},
      70: {name: 'Weepinbell', id: 70},
      71: {name: 'Victreebel', id: 71},
      72: {name: 'Tentacool', id: 72},
      73: {name: 'Tentacruel', id: 73},
      74: {name: 'Geodude', id: 74},
      75: {name: 'Graveler', id: 75},
      76: {name: 'Golem', id: 76},
      77: {name: 'Ponyta', id: 77},
      78: {name: 'Rapidash', id: 78},
      79: {name: 'Slowpoke', id: 79},
      80: {name: 'Slowbro', id: 80},
      81: {name: 'Magnemite', id: 81},
      82: {name: 'Magneton', id: 82},
      83: {name: 'Farfetch\'d', id: 83},
      84: {name: 'Doduo', id: 84},
      85: {name: 'Dodrio', id: 85},
      86: {name: 'Seel', id: 86},
      87: {name: 'Dewgong', id: 87},
      88: {name: 'Grimer', id: 88},
      89: {name: 'Muk', id: 89},
      90: {name: 'Shellder', id: 90},
      91: {name: 'Cloyster', id: 91},
      92: {name: 'Gastly', id: 92},
      93: {name: 'Haunter', id: 93},
      94: {name: 'Gengar', id: 94},
      95: {name: 'Onix', id: 95},
      96: {name: 'Drowzee', id: 96},
      97: {name: 'Hypno', id: 97},
      98: {name: 'Krabby', id: 98},
      99: {name: 'Kingler', id: 99},
      100: {name: 'Voltorb', id: 100},
      101: {name: 'Electrode', id: 101},
      102: {name: 'Exeggcute', id: 102},
      103: {name: 'Exeggutor', id: 103},
      104: {name: 'Cubone', id: 104},
      105: {name: 'Marowak', id: 105},
      106: {name: 'Hitmonlee', id: 106},
      107: {name: 'Hitmonchan', id: 107},
      108: {name: 'Lickitung', id: 108},
      109: {name: 'Koffing', id: 109},
      110: {name: 'Weezing', id: 110},
      111: {name: 'Rhyhorn', id: 111},
      112: {name: 'Rhydon', id: 112},
      113: {name: 'Chansey', id: 113},
      114: {name: 'Tangela', id: 114},
      115: {name: 'Kangaskhan', id: 115},
      116: {name: 'Horsea', id: 116},
      117: {name: 'Seadra', id: 117},
      118: {name: 'Goldeen', id: 118},
      119: {name: 'Seaking', id: 119},
      120: {name: 'Staryu', id: 120},
      121: {name: 'Starmie', id: 121},
      122: {name: 'Mr. Mime', id: 122},
      123: {name: 'Scyther', id: 123},
      124: {name: 'Jynx', id: 124},
      125: {name: 'Electabuzz', id: 125},
      126: {name: 'Magmar', id: 126},
      127: {name: 'Pinsir', id: 127},
      128: {name: 'Tauros', id: 128},
      129: {name: 'Magikarp', id: 129},
      130: {name: 'Gyarados', id: 130},
      131: {name: 'Lapras', id: 131},
      132: {name: 'Ditto', id: 132},
      133: {name: 'Eevee', id: 133},
      134: {name: 'Vaporeon', id: 134},
      135: {name: 'Jolteon', id: 135},
      136: {name: 'Flareon', id: 136},
      137: {name: 'Porygon', id: 137},
      138: {name: 'Omanyte', id: 138},
      139: {name: 'Omastar', id: 139},
      140: {name: 'Kabuto', id: 140},
      141: {name: 'Kabutops', id: 141},
      142: {name: 'Aerodactyl', id: 142},
      143: {name: 'Snorlax', id: 143},
      144: {name: 'Articuno', id: 144},
      145: {name: 'Zapdos', id: 145},
      146: {name: 'Moltres', id: 146},
      147: {name: 'Dratini', id: 147},
      148: {name: 'Dragonair', id: 148},
      149: {name: 'Dragonite', id: 149},
      150: {name: 'Mewtwo', id: 150},
      151: {name: 'Mew', id: 151}
    };
    
    // Asignar Pokémon a cada número
    pokemonIds.forEach(num => {
      // Si el número está en nuestra lista, usar ese Pokémon
      if (pokemonList[num]) {
        this.pokemonImages[num] = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonList[num].id}.png`;
        this.pokemonNames[num] = pokemonList[num].name;
      } else {
        // Si el número es mayor que 151, usar un Pokémon aleatorio (1-151)
        const pokemonId = ((num - 1) % 151) + 1;
        this.pokemonImages[num] = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
        // Obtener el nombre del Pokémon correspondiente al ID
        this.pokemonNames[num] = pokemonList[pokemonId]?.name || `Pokemon ${num}`;
      }
    });
  }

  getPokemonImage(num: number): string {
    return this.pokemonImages[num] || 
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${((num - 1) % 151) + 1}.png`;
  }

  getPokemonName(num: number): string {
    return this.pokemonNames[num] || `Pokemon ${num}`;
  }

  togglePokemonTheme() {
    this.showPokemon = !this.showPokemon;
    this.systemMessage = this.showPokemon ? 
      '🎨 Pokémon mostrados' : 
      '🐭 Pokémon ocultados';
    setTimeout(() => this.systemMessage = '', 3000);
    this.saveBoard();
  }
}