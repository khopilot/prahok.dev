'use client';

import React, { useState, useEffect } from 'react';

// ប្រភេទទិន្នន័យសម្រាប់ការលេង - Data types for the game
type Player = 'X' | 'O' | null;
type Board = Player[];

// ខែលវិការដែលអាចឈ្នះបាន - Winning combinations
const WINNING_COMBINATIONS = [
  [0, 1, 2], // ជួរទី១ - Row 1
  [3, 4, 5], // ជួរទី២ - Row 2
  [6, 7, 8], // ជួរទី៣ - Row 3
  [0, 3, 6], // ជួរឈរទី១ - Column 1
  [1, 4, 7], // ជួរឈរទី២ - Column 2
  [2, 5, 8], // ជួរឈរទី៣ - Column 3
  [0, 4, 8], // ត្រកោងធំ - Main diagonal
  [2, 4, 6], // ត្រកោងរង - Anti diagonal
];

export default function TicTacToe() {
  // ស្ថានភាពនៃការលេង - Game state
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winningCombination, setWinningCombination] = useState<number[]>([]);

  // ពិនិត្យមើលអ្នកឈ្នះ - Check for winner
  const checkWinner = (board: Board): { winner: Player; combination: number[] } => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], combination };
      }
    }
    return { winner: null, combination: [] };
  };

  // ពិនិត្យថាតាមរហាំស្មើ - Check for tie
  const checkTie = (board: Board): boolean => {
    return board.every(cell => cell !== null);
  };

  // ដោះស្រាយការចុច - Handle cell click
  const handleCellClick = (index: number) => {
    // មិនអាចចុចបាននៅពេលការលេងចប់ ឬក្រឡាមានអ្វីហើយ - Can't click if game over or cell occupied
    if (isGameOver || board[index] !== null) return;

    // បន្ថែមការលេងថ្មី - Add new move
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    // ពិនិត្យមើលអ្នកឈ្នះ - Check for winner
    const { winner: gameWinner, combination } = checkWinner(newBoard);
    
    if (gameWinner) {
      setWinner(gameWinner);
      setWinningCombination(combination);
      setIsGameOver(true);
    } else if (checkTie(newBoard)) {
      setIsGameOver(true);
    } else {
      // ផ្លាស់ប្តូរអ្នកលេង - Switch player
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  // ចាប់ផ្តើមការលេងថ្មី - Start new game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsGameOver(false);
    setWinningCombination([]);
  };

  // សារដែលត្រូវបង្ហាញ - Status message
  const getStatusMessage = (): string => {
    if (winner) {
      return `🎉 អ្នកលេង ${winner} ឈ្នះ! - Player ${winner} wins!`;
    }
    if (isGameOver) {
      return '🤝 ស្មើគ្នា! - It\'s a tie!';
    }
    return `🎮 វេនរបស់អ្នកលេង ${currentPlayer} - Player ${currentPlayer}'s turn`;
  };

  return (
    <div className="tic-tac-toe-container">
      <div className="game-header">
        <h1 className="game-title">
          🎮 Tic Tac Toe
          <span className="khmer-subtitle">លេងហ្គេម X O</span>
        </h1>
        <div className="status-message">
          {getStatusMessage()}
        </div>
      </div>

      <div className="game-board">
        {board.map((cell, index) => (
          <button
            key={index}
            className={`game-cell ${
              winningCombination.includes(index) ? 'winning-cell' : ''
            } ${cell ? 'filled' : ''}`}
            onClick={() => handleCellClick(index)}
            disabled={isGameOver || cell !== null}
          >
            <span className={`cell-content ${cell === 'X' ? 'player-x' : 'player-o'}`}>
              {cell}
            </span>
          </button>
        ))}
      </div>

      <div className="game-controls">
        <button 
          className="reset-button"
          onClick={resetGame}
        >
          🔄 ចាប់ផ្តើមថ្មី - New Game
        </button>
      </div>

      <div className="game-info">
        <p className="instructions">
          📝 របៀបលេង៖ ចុចលើក្រឡាទទេដើម្បីដាក់សញ្ញារបស់អ្នក។ អ្នកណាដែលអាចដាក់សញ្ញា ៣ ជាជួរ មុនគេនោះឈ្នះ!
        </p>
        <p className="instructions-en">
          How to play: Click on empty cells to place your mark. First to get 3 in a row wins!
        </p>
      </div>
    </div>
  );
}