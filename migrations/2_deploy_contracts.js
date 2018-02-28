var NaughtsAndCrosses = artifacts.require("./NaughtsAndCrosses.sol");

module.exports = function(deployer) {
  deployer.deploy(NaughtsAndCrosses);
};
