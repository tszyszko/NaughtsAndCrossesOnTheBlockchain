// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import naughtsandcrosses_artifacts from '../../build/contracts/NaughtsAndCrosses.json'


var NaughtsAndCrosses = contract(naughtsandcrosses_artifacts);
NaughtsAndCrosses.setProvider(window.web3.currentProvider);

let playerID = null;
let gameAddress = null;

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
  },

  betSubmit: () => {
    payInitial(document.getElementById("enterBet").value);
    toggleElement("enterBetDiv", false);
  },

  addressSubmit: () => {
    gameAddress = document.getElementById("enterAddress").value;
    toggleElement("enterAddressDiv", false);
    addressBanner(gameAddress);
  },

  getState: () => getState(),




};

const getState = () => {
  NaughtsAndCrosses.setProvider(window.web3.currentProvider);
  NaughtsAndCrosses.deployed().then((instance) => {
    // console.log(instance);
    return instance.getState.call({from: window.web3.eth.accounts[0]});
  }).then(result => {
    alert(contractStates[result]);
  }).catch(err => alert(err));
};

const displayContractAddress = () => {
  newContract().then(address => {
    gameAddress = address;
    addressBanner(address);
  })
};

const addressBanner = (address) => {
  document.getElementById("gameAddress").innerHTML = `<h2> This games address is ${address}</h2>`;
};



const toggleElement = (id, bool) => {
  const element = document.getElementById(id);
  if (bool) element.style.display = 'contents';
  else element.style.display = 'none';
};

const payInitial = (amount) => {
  NaughtsAndCrosses.at(gameAddress).then((instance) => {
    return instance.player1StartGame({from: window.web3.eth.accounts[0], value: amount});
  }).then((result) => {

  }).catch(err => {
    // There was an error! Handle it.
    alert(err);
  });
};

// New Contract Code broken - use existing deployed for now

const newContract = () => {
  return NaughtsAndCrosses.deployed().then((instance) => {
    return instance.address;
  });
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



window.addEventListener('load', function() {
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
