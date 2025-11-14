export type GameResult = 'win' | 'lose' | 'draw';

export interface GameResultInfo {
  message: string;
  result: GameResult;
}

export function getResult(player: string, ai: string): GameResultInfo {
  if (player === ai) {
    return {
      message: 'Draw!',
      result: 'draw',
    };
  }
  if (
    (player === 'rock' && ai === 'scissors') ||
    (player === 'paper' && ai === 'rock') ||
    (player === 'scissors' && ai === 'paper')
  ) {
    return {
      message: `You Win! \nAI chose ${ai}`,
      result: 'win',
    };
  }
  return {
    message: `You Lose! \nAI chose ${ai}`,
    result: 'lose',
  };
}
