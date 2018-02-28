pragma solidity ^0.4.11;
contract NaughtsAndCrosses {
    address public player1;
    address public player2;
    
    /**
     * A game of Naughts and Crosses where two players place equal bets 
     * (set by the first player)
     * If a player wins they win the whole pot, otherwise money is returned
     */
     
    
    enum State {
        PLAYER_1_PAY, PLAYER_2_PAY, PLAYER_1_TURN, 
        PLAYER_2_TURN, PLAYER_1_WIN, PLAYER_2_WIN, GAME_DRAW
    }
    
    
    // Events
    
    event player1Join(address player, uint256 bet);
    event player2Join(address player, uint256 bet);
    event playerMove(uint8 player, uint pos, uint8[] board);
    event playerWin(uint8 player, uint8[] board, uint8 reason);
    event draw(uint8[] board);
    
    
    // Holds payment to winner for withdrawal
    mapping (address => uint) pendingWithdrawal;
    
    
    State public state = State.PLAYER_1_PAY;
    
    uint8[] public gameBoard = new uint8[](9);
    // 0 = empty gameBoard
    // 1 = X placed
    // 20 = O placed
    
    uint256 public bet;
    uint public moveCount;
    
    
    // Constructor
    
    function NaughtsAndCrosses() public{
        // Init board to 0
        
        for(uint i = 0; i < 9; i++) {
            gameBoard[i] = 0;
        }
    }
    
    // Game init modifiers
    
    modifier player1Pay() {
        require(state == State.PLAYER_1_PAY);
        _;
        changeState(State.PLAYER_2_PAY);
    }
    
    modifier player2Pay() {
        require(state == State.PLAYER_2_PAY);
        // Require payment amount to be equal to player 1s stake
        require(msg.value == bet);
        _;
        changeState(State.PLAYER_1_TURN);
    }
    
    // Game state modifiers
    
    modifier isPlayer1()    {
        require(msg.sender == player1);
        _;
    }
    
    modifier isPlayer2()    {
        require(msg.sender == player2);
        _;
    }
    
    modifier isPlayer1Move() {
        require(state == State.PLAYER_1_TURN);
        _;
    }
    
    modifier isPlayer2Move() {
        require(state == State.PLAYER_2_TURN);
        _;
    }
    
    modifier isValidMove(uint position) {
        require(position >= 0 && position <= 8);
        uint cell = gameBoard[position];
        require(cell == 0);
        _;
    }
    
    
    // State modifiers
  
    modifier inState(State expected) {
        require( state == expected);
        _;
    }
    
    function changeState(State _state) private {
        state = _state;
    }

    function getState() public returns (State){
        return state;
    }
    
    
    
    // Game logic
    
    function checkWon() private returns (bool){
        uint[8] memory lines;
        lines[0] = gameBoard[0] + gameBoard[1] + gameBoard[2];
        lines[1] = gameBoard[3] + gameBoard[4] + gameBoard[5];
        lines[2] = gameBoard[6] + gameBoard[7] + gameBoard[8];
        lines[3] = gameBoard[0] + gameBoard[4] + gameBoard[8];
        lines[4] = gameBoard[6] + gameBoard[4] + gameBoard[2];
        lines[5] = gameBoard[0] + gameBoard[3] + gameBoard[6];
        lines[6] = gameBoard[1] + gameBoard[4] + gameBoard[7];
        lines[7] = gameBoard[2] + gameBoard[6] + gameBoard[8];
        
        // Check every possible winning combo
        
        for(uint8 i = 0; i < 8; i++) {
            if (lines[i] == 3) {
                // Win for player1
                
                changeState(State.PLAYER_1_WIN);
                pendingWithdrawal[player1] = bet * 2;
                playerWin(1, gameBoard, i);
                return true;
            } else if (lines[i] == 60) {
                // Win for player2
                
                changeState(State.PLAYER_2_WIN);
                pendingWithdrawal[player2] = bet * 2;
                playerWin(2, gameBoard, i);
                return true;
            }
        }
        return false;
    }
    
    function checkDraw() private returns (bool) {
        if (moveCount >=9) {
             pendingWithdrawal[player1] = bet;
             pendingWithdrawal[player2] = bet;
             changeState(State.GAME_DRAW);
             draw(gameBoard);
             return true;
        }
        return false;
    }
    
    function postMoveCheck() private returns (bool) {
        moveCount++;
        return checkDraw() || checkWon ();
    }
    
    
    
    // Handle player payments
    
    function player1StartGame() public payable player1Pay {
        bet = msg.value;
        player1 = msg.sender;
        player1Join(player1, bet);
    }
    
    function player2StartGame() public payable player2Pay {
        player2 = msg.sender;
        player2Join(player2, msg.value);
    }

    
    
    // Handle player moves
    
    
    function submitMovePlayer1(uint8 boardLocation) public isPlayer1
            isPlayer1Move isValidMove(boardLocation) {
        gameBoard[boardLocation] = 1;
        if(!postMoveCheck()) changeState((State.PLAYER_2_TURN));
        playerMove(1, boardLocation, gameBoard);
    } 
    
    function submitMovePlayer2(uint8 boardLocation) public isPlayer2 
            isPlayer2Move isValidMove(boardLocation) {
        gameBoard[boardLocation] = 20;
        if(!postMoveCheck()) changeState((State.PLAYER_1_TURN));
        playerMove(2, boardLocation, gameBoard);
    } 
    
    // Handle withdrawing funds from game
    
    function validWithdrawal(address sender) private view returns (bool) {
        if((sender == player1) && ((state == State.PLAYER_1_WIN) 
                || (state == State.GAME_DRAW) )) {
            return true;
        }
        
        if((sender == player2) && ((state == State.PLAYER_2_WIN) 
                || (state == State.GAME_DRAW) )) {
            return true;
        }
        return false;
    }
    
    function withdraw() public {
        require(validWithdrawal(msg.sender));
        // From solidity's recommended way to handle payments
        uint amount = pendingWithdrawal[msg.sender];
        pendingWithdrawal[msg.sender] = 0;
        msg.sender.transfer(amount);

        
    }
    
    
}
