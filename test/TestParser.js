const Client = artifacts.require("Client");
const chai = require("chai");
chai.use(require("chai-bn")(web3.utils.BN));
chai.use(require("chai-as-promised"));
chai.should();

contract("Client", async () => {
  let client;
  before(async () => {
    client = await Client.new();
  });

  describe("mmr root test", async () => {
    it("should return expected mmr root", async () => {
      let res = await client.mmrRoot();
      // console.log(res);
      // res.should.eventually.equal(true);
    });
  });
});
