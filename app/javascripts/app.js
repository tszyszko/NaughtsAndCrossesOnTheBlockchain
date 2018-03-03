// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import {default as Web3} from 'web3';
import {default as contract} from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import naughtsandcrosses_artifacts from '../../build/contracts/NaughtsAndCrosses.json'


let NaughtsAndCrosses = contract(naughtsandcrosses_artifacts);
NaughtsAndCrosses.setProvider(window.web3.currentProvider);


let playerID = null;
let gameAddress = null;
let instance = null;

// Hardcoded for now
NaughtsAndCrosses.deployed().then(_instance => {
  instance = _instance;
  gameAddress = instance.address;
  App.refresh();

});


const contractStates = {
  0: "PLAYER_1_PAY",
  1: "PLAYER_2_PAY",
  2: "PLAYER_1_TURN",
  3: "PLAYER_2_TURN",
  4: "PLAYER_1_WIN",
  5: "PLAYER_2_WIN",
  6: "GAME_DRAW"
};

window.App = {
  startGame: () => {
    displayContractAddress();
    toggleElement("startButtons", false);
    toggleElement("enterBetDiv", true);
    playerID = 1;
  },

  joinGame: () => {
    toggleElement("startButtons", false);
    toggleElement("enterAddressDiv", true);
    playerID = 2;
    if (player === 1) makeMovePlayer1(position);
  },

  betSubmit: () => {
    payInitial(document.getElementById("enterBet").value);
    toggleElement("enterBetDiv", false);
  },

  addressSubmit: () => {
    // Hardcoded value for now
    // gameAddress = document.getElementById("enterAddress").value;
    toggleElement("enterAddressDiv", false);
    addressBanner(gameAddress);
    payPlayer2();
  },


  refresh: () => {
    getState().then(state => handleGameState(state));
  },

  cellClick: (pos) => {
    // dependant on player
    console.log(`clicked ${pos}`);
    makeMove(pos).then(() => promiseSleep(10000)).then(() => console.log("called refresh")).then(() => window.App.refresh());

  },

  withdraw: () => {
    makeWithdrawal().then(promiseSleep(10000)).then(() => console.log("called refresh")).then(() => App.refresh());
  }

};

const promiseSleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time)
  });
};

const handleGameState = (state) => {
  switch (state) {
    case "PLAYER_1_PAY":
    case "PLAYER_2_PAY":
    case "PLAYER_1_TURN":
      getBoard().then((board) => updateBoard(board));
      break;
    case "PLAYER_2_TURN":
      getBoard().then((board) => updateBoard(board));
      break;
    case "PLAYER_1_WIN":
      toggleElement("gameBoardDiv", false);
      toggleElement("resultDiv", true);
      document.getElementById("resultDiv").innerHTML = "<h2> Player 1 Win</h2>" +
        "<button id=\\\"withdraw\\\" onclick=\"App.withdraw()\">Withdraw funds</button>";
      break;
    case "PLAYER_2_WIN":
      toggleElement("gameBoardDiv", false);
      toggleElement("resultDiv", true);
      document.getElementById("resultDiv").innerHTML = "<h2> Player 2 Win</h2>" +
        "<button id=\"withdraw\" onclick=\"App.withdraw()\">Withdraw funds</button>";
      break;
    case "GAME_DRAW":
      toggleElement("gameBoardDiv", false);
      toggleElement("resultDiv", true);
      document.getElementById("resultDiv").innerHTML = "<h2> Draw </h2>" +
        "<button id=\"withdraw\" onclick=\"App.withdraw()\">Withdraw funds</button>";
      break;
    default:
      console.log("state fail");
  }
  displayState(state);
};

const getState = () => {
  return instance.getState.call({from: window.web3.eth.accounts[0]}).then(result => {
    return (contractStates[result]);
  }).catch(err => alert(err));
};

const getBet = () => {
  return instance.bet.call({from: window.web3.eth.accounts[0]}).then(result => {
    return result;
  }).catch(err => alert(err));
};

const displayState = (state) => {
  document.getElementById("displayState").innerHTML = `<h2>Current contract state is ${state}</h2>`
};

const getBoard = () => {
  let promises = [];
  for (let i = 0; i < 9; i++) {
    promises.push(instance.getBoardValue.call(i, {from: window.web3.eth.accounts[0]}).then(result => {
      return result;
    }).catch(err => {
      return err
    }));
  }
  return Promise.all(promises);

};

const makeWithdrawal = () => {
  return instance.withdraw({from: window.web3.eth.accounts[0]}).then(result => {
    return result;
  }).catch(err => alert(err));
};

const makeMove = (position) => {
  return getPlayer().then(player => {
    if (!player || player < 1 || player > 2) return false;
    if (player === 1) return makeMovePlayer1(position);
    if (player === 2) return makeMovePlayer2(position);
  })
};

const makeMovePlayer1 = (position) => {
  return instance.submitMovePlayer1(position, {from: window.web3.eth.accounts[0]}).then(result => {
    return result;
  }).catch(err => alert(err));
};

const makeMovePlayer2 = (position) => {
  return instance.submitMovePlayer2(position, {from: window.web3.eth.accounts[0]}).then(result => {
    return result;
  }).catch(err => alert(err));
};

const getPlayer = () => {
  return getState().then(state => {
    switch (state) {
      case "PLAYER_1_TURN":
        return 1;
      case "PLAYER_2_TURN":
        return 2;
      default:
        return null;
    }
  })
};


const updateBoard = (positions) => {
  for (let i = 0; i < 9; i++) {
    // Get correct game board div
    const grid = document.getElementById(`cell${i}`);
    switch (positions[i].toNumber()) {
      case 0:
        // Empty cell, place button
        grid.innerHTML = `<button id=\"makeMove\" onclick=\"App.cellClick(${i})\">Place Here</button>`;
        break;
      case 1:
        // X
        grid.innerHTML = "<h1>X</h1>";
        break;
      case 20:
        grid.innerHTML = "<h1>O</h1>";
        break;
      default:
        console.log("somethings wrong");
        console.log(positions[i].toNumber());

    }
  }
};

const displayContractAddress = () => {
  newContract().then(address => {
    gameAddress = address;
    addressBanner(address);
  })
};

const addressBanner = () => {
  document.getElementById("gameAddress").innerHTML = `<h2> This games address is ${gameAddress}</h2>`;
};


const toggleElement = (id, bool) => {
  const element = document.getElementById(id);
  if (bool) element.style.display = 'contents';
  else element.style.display = 'none';
};

const payInitial = (amount) => {
  instance.player1StartGame({from: window.web3.eth.accounts[0], value: amount}).then((result) => {
    // If this callback is called, the transaction was successfully processed.
    console.log(result);
    return true;
  }).catch((err) => {
    // There was an error! Handle it.
    alert(err);
  })
};

const payPlayer2 = () => {
  getBet().then(bet => instance.player2StartGame({from: window.web3.eth.accounts[0], value: bet})).then((result) => {
    // If this callback is called, the transaction was successfully processed.
    console.log(result);
    return true;
  }).catch((err) => {
    // There was an error! Handle it.
    alert(err);
  });
};

// New Contract Code broken - use existing deployed for now

const newContract = () => {
  return Promise.resolve(instance.address);
};

// const newContract = () => {
//   const web3 = new Web3(window.web3.currentProvider);
//   const contract = web3.eth.contract(naughtsandcrosses_artifacts.abi, { from: window.web3.eth.accounts[0] });
//   return new Promise((resolve, reject) => {
//     contract.new({
//       data: naughtsandcrosses_artifacts.bytecode,
//       from: window.web3.eth.accounts[0],
//       gas:4712388,
//       gasPrice:100000000000
//     }, (err, response) => {
//       if (err) reject(err);
//       else resolve(response);
//     })
//   }).then(response => console.log(response));
// };


window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:7545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
  }

  // App.start();
});
