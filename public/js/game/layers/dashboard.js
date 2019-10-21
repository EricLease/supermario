export function createDashboardLayer(font, playerEnvironment) {    
    const Line1 = font.size;
    const Line2 = font.size * 2;
    const PlayerCol = 8;
    const CoinCol = 96;
    const WorldCol = 152;
    const TimeCol = 208;

    const coins = 13;
    
    return function drawDashboard(context) {
        const { score, time } = playerEnvironment.playerController;

        font.print('MARIO', context, PlayerCol, Line1);
        font.print(score.toString().padStart(6, '0'), context, PlayerCol, Line2);

        font.print(`@x${coins.toString().padStart(2, '0')}`, context, CoinCol, Line2);

        font.print('WORLD', context, WorldCol, Line1);
        font.print('1-1', context, WorldCol + 8, Line2);

        font.print('TIME', context, TimeCol, Line1);
        font.print(time.toFixed().toString().padStart(3, '0'), context, TimeCol + 8, Line2);
    }
}