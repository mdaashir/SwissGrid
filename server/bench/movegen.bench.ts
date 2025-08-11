import { Game } from '../src/chess-engine/game';

const positions = [
    // Initial position
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    // Midgame
    'r1bq1rk1/ppp2ppp/2n2n2/3pp3/1b1P4/2N1PN2/PPP2PPP/R1BQKB1R w KQ - 0 7',
    // Endgame
    '8/8/8/8/2k5/8/5K2/8 w - - 0 1',
];

function bench(name: string, fn: () => void) {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    console.log(`${name}: ${ms.toFixed(2)} ms`);
}

for (const fen of positions) {
    const game = new Game(fen);
    console.log(`\nFEN: ${fen}`);
    bench('Original generatePseudoLegalMoves', () => {
        for (let i = 0; i < 10000; ++i) game['generatePseudoLegalMoves']();
    });
    bench('Optimized generatePseudoLegalMovesOptimized', () => {
        for (let i = 0; i < 10000; ++i)
            game.generatePseudoLegalMovesOptimized();
    });
}
