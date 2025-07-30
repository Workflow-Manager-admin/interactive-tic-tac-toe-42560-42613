import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Tic-Tac-Toe main App for responsive, modern UI with local score tracking,
 * vs Computer and vs Player modes, restart & reset controls.
 */

// Color palette constants (match with CSS)
const COLORS = {
  primary: "#1976d2",
  secondary: "#ff9800",
  accent: "#e91e63",
};

/**
 * Determine winner or draw.
 * @param {Array} squares Array of board values
 * @returns {Object} {winner: "X"|"O"|null, line: [i,j,k]|null, isDraw: bool}
 */
// PUBLIC_INTERFACE
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],[3, 4, 5],[6, 7, 8], // rows
    [0, 3, 6],[1, 4, 7],[2, 5, 8], // cols
    [0, 4, 8],[2, 4, 6], // diagonals
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line, isDraw: false };
    }
  }
  const isDraw = squares.every((sq) => sq);
  return { winner: null, line: null, isDraw };
}

// PUBLIC_INTERFACE
function getAvailableMoves(squares) {
  return squares
    .map((val, idx) => (val ? null : idx))
    .filter((idx) => idx !== null);
}

/**
 * Simple "unbeatable" AI using minimax (depth-limited for speed)
 * @param {*} squares 
 * @param {*} isMax Turn for 'O' (AI)
 * @param {*} depth Search depth
 * @returns 
 */
// PUBLIC_INTERFACE
function minimax(squares, isMax, depth, aiMark = "O", plMark = "X") {
  const winnerObj = calculateWinner(squares);
  if (winnerObj.winner) {
    if (winnerObj.winner === aiMark) return { score: 10 - depth };
    if (winnerObj.winner === plMark) return { score: depth - 10 };
  }
  if (winnerObj.isDraw) return { score: 0 };

  let bestMove = null;
  let bestScore = isMax ? -Infinity : Infinity;
  for (let idx of getAvailableMoves(squares)) {
    squares[idx] = isMax ? aiMark : plMark;
    const { score } = minimax(squares, !isMax, depth + 1, aiMark, plMark);
    squares[idx] = null;
    if (isMax ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return { score: bestScore, move: bestMove };
}

/**
 * Given board, returns AI's best move (can add randomness for non-perfect AI)
 */
function computeAIMove(squares, aiMark = "O", plMark = "X") {
  // To keep it quick, if turn 1-2, random; else minimax
  const empties = getAvailableMoves(squares);
  if (empties.length >= 7) {
    return empties[Math.floor(Math.random() * empties.length)];
  }
  return minimax([...squares], true, 0, aiMark, plMark).move;
}

// PUBLIC_INTERFACE
function Header({ mode }) {
  return (
    <nav className="ttt-header" role="navigation" aria-label="Minimal main header">
      <span className="ttt-title" style={{color: COLORS.primary}}>
        Tic-Tac-Toe
      </span>
      <span className="ttt-modechip" style={{background: COLORS.secondary}}>
        {mode === "cpu" ? "vs Computer" : "Two Players"}
      </span>
    </nav>
  );
}

// PUBLIC_INTERFACE
function Scoreboard({ scores, currentPlayer, winner }) {
  return (
    <section className="ttt-scoreboard" aria-label="Scoreboard">
      <div>
        <span className={`ttt-score ttt-x ${winner==="X"||currentPlayer==="X"?"active":""}`}>X&nbsp;
          <span className="ttt-number">{scores.X}</span>
        </span>
      </div>
      <div>
        <span className={`ttt-score ttt-o ${winner==="O"||currentPlayer==="O"?"active":""}`}>O&nbsp;
          <span className="ttt-number">{scores.O}</span>
        </span>
      </div>
      <div>
        <span className="ttt-score ttt-draw">Draw&nbsp;
          <span className="ttt-number">{scores.draw}</span>
        </span>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function GameBoard({ squares, onSquareClick, highlight }) {
  return (
    <div className="ttt-board" role="group" aria-label="Game board">
      {[...Array(9)].map((_, idx) => (
        <button
          key={idx}
          className={`ttt-square${highlight && highlight.includes(idx) ? " highlight" : ""}`}
          onClick={() => onSquareClick(idx)}
          aria-label={`Cell ${idx}`}
          disabled={!!squares[idx] || highlight}
        >
          {squares[idx]}
        </button>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function Controls({ gameMode, setGameMode, onRestart, onReset }) {
  return (
    <div className="ttt-controls">
      <div className="ttt-radio-group" role="group" aria-label="Game mode">
        <button
          className={`ttt-btn ttt-btn-mode${gameMode === "cpu" ? " selected" : ""}`}
          onClick={() => setGameMode("cpu")}
          style={gameMode==="cpu"?{backgroundColor:COLORS.secondary}:{}} 
        >
          vs Computer
        </button>
        <button
          className={`ttt-btn ttt-btn-mode${gameMode === "player" ? " selected" : ""}`}
          onClick={() => setGameMode("player")}
          style={gameMode==="player"?{backgroundColor:COLORS.secondary}:{}} 
        >
          Two Players
        </button>
      </div>
      <div className="ttt-action-group">
        <button className="ttt-btn ttt-btn-restart" onClick={onRestart} style={{color: COLORS.primary}}>
          Restart Round
        </button>
        <button className="ttt-btn ttt-btn-reset" onClick={onReset} style={{color: COLORS.accent}}>
          Reset Game
        </button>
      </div>
    </div>
  );
}

const defaultScore = { X: 0, O: 0, draw: 0 };

// PUBLIC_INTERFACE
function App() {
  // LOCAL STATE
  const [gameMode, setGameMode] = useState(
    localStorage.getItem("ttt_mode") || "cpu"
  );
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState({ winner: null, line: null, isDraw: false });
  const [scores, setScores] = useState(() => {
    // Use localStorage if avail
    try {
      const val = localStorage.getItem("ttt_scores");
      return val ? JSON.parse(val) : { ...defaultScore };
    } catch {
      return { ...defaultScore };
    }
  });

  // STATE PERSISTENCE for scores and mode
  useEffect(() => {
    try {
      localStorage.setItem("ttt_scores", JSON.stringify(scores));
      localStorage.setItem("ttt_mode", gameMode);
    } catch { /* Storage fail-safe. */ }
  }, [scores, gameMode]);

  // Check for winner after every move.
  useEffect(() => {
    const res = calculateWinner(squares);
    setWinnerInfo(res);
    if (res.winner) {
      // Update scores
      setScores((prev) => ({
        ...prev,
        [res.winner]: prev[res.winner] + 1,
      }));
    } else if (res.isDraw) {
      setScores((prev) => ({
        ...prev,
        draw: prev.draw + 1,
      }));
    }
    // eslint-disable-next-line
  }, [squares]);

  // AI PLAY (CPU always "O")
  useEffect(() => {
    if (
      gameMode === "cpu" &&
      !winnerInfo.winner &&
      !winnerInfo.isDraw &&
      !xIsNext
    ) {
      const aiMove = computeAIMove(squares, "O", "X");
      if (aiMove !== undefined) {
        setTimeout(() => {
          setSquares((prev) => {
            if (!prev[aiMove]) {
              const arr = [...prev];
              arr[aiMove] = "O";
              return arr;
            }
            return prev;
          });
          setXIsNext(true);
        }, 400); // AI move slight delay for realism
      }
    }
    // eslint-disable-next-line
  }, [gameMode, winnerInfo, xIsNext, squares]);

  // PUBLIC_INTERFACE
  function handleSquareClick(idx) {
    if (squares[idx] || winnerInfo.winner || winnerInfo.isDraw) return;
    setSquares((prevSquares) => {
      const arr = [...prevSquares];
      arr[idx] = xIsNext ? "X" : "O";
      return arr;
    });
    setXIsNext((prev) => !prev);
  }

  // PUBLIC_INTERFACE
  function startNewRound() {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setWinnerInfo({ winner: null, line: null, isDraw: false });
  }

  // PUBLIC_INTERFACE
  function resetGame() {
    setScores({ ...defaultScore });
    startNewRound();
  }

  // PUBLIC_INTERFACE
  function onSetGameMode(mode) {
    setGameMode(mode);
    resetGame();
  }

  // HANDLING round end auto restart
  useEffect(() => {
    if (winnerInfo.winner || winnerInfo.isDraw) {
      const timer = setTimeout(() => startNewRound(), 2000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [winnerInfo.winner, winnerInfo.isDraw]);

  const currentPlayer = xIsNext ? "X" : "O";
  let statusMsg = "";
  if (winnerInfo.winner) {
    statusMsg = `Player ${winnerInfo.winner} wins!`;
  } else if (winnerInfo.isDraw) {
    statusMsg = "It's a draw!";
  } else {
    statusMsg =
      gameMode === "cpu" && !xIsNext
        ? "Computer's turn (O)"
        : `Player ${currentPlayer}'s turn`;
  }

  return (
    <div className="ttt-app">
      <Header mode={gameMode} />
      <main className="ttt-main">
        <Scoreboard
          scores={scores}
          currentPlayer={currentPlayer}
          winner={winnerInfo.winner}
        />
        <div className="ttt-board-wrapper">
          <GameBoard
            squares={squares}
            onSquareClick={handleSquareClick}
            highlight={winnerInfo.line}
          />
        </div>
        <div
          className={`ttt-status${winnerInfo.winner || winnerInfo.isDraw ? " ttt-status-final" : ""}`}
          aria-live="polite"
        >
          {statusMsg}
        </div>
        <Controls
          gameMode={gameMode}
          setGameMode={onSetGameMode}
          onRestart={startNewRound}
          onReset={resetGame}
        />
      </main>
    </div>
  );
}

export default App;

