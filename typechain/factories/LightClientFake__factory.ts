/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  LightClientFake,
  LightClientFakeInterface,
} from "../LightClientFake";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "blockHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "receiptsHash",
        type: "bytes32",
      },
    ],
    name: "VerifyReceiptsHash",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "number",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "blocksByHeight",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506103c5806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806329e141af1461003b5780633c6c6b731461006b575b600080fd5b61005560048036038101906100509190610279565b61009b565b60405161006291906102d4565b60405180910390f35b61008560048036038101906100809190610325565b610183565b6040516100929190610374565b60405180910390f35b60006100c97f09938557c5c82f067fe86665116c48ac88721eaff0f83799a68f4469af8e5df060001b61023b565b6100f57f5d28eefebb4f07ff206aef90459aecdf832c9e83aaea880ae3180e7cc328545660001b61023b565b6101217ff1aaf87d9b951109007e71e705f582428ad79112cfca2f592a86ff2a6728d8b960001b61023b565b61014d7f80c71662f5466c24ce3e5961eff89b492df864941c50543517f5921f8b702b3960001b61023b565b6101797f082ab270bcc21449fd81a5a98e946cf696184672389ed985c4e599a953f8d12260001b61023b565b6001905092915050565b60006101b17f0c2c0397e7f4c5ecad92517096ebc2ac6384543a4be6e5c5706175a12fe537dd60001b61023b565b6101dd7f41c377afa76531c72f33ea9a9f29899ccec608865071538e15287d316166730660001b61023b565b6102097f3af30d542f172b31d55d8e2ca07d2e600e482bc2c755617bf3cc09c4db5c9a2c60001b61023b565b8260405160200161021a9190610374565b6040516020818303038152906040528051906020012060001c905092915050565b50565b600080fd5b6000819050919050565b61025681610243565b811461026157600080fd5b50565b6000813590506102738161024d565b92915050565b600080604083850312156102905761028f61023e565b5b600061029e85828601610264565b92505060206102af85828601610264565b9150509250929050565b60008115159050919050565b6102ce816102b9565b82525050565b60006020820190506102e960008301846102c5565b92915050565b6000819050919050565b610302816102ef565b811461030d57600080fd5b50565b60008135905061031f816102f9565b92915050565b6000806040838503121561033c5761033b61023e565b5b600061034a85828601610310565b925050602061035b85828601610310565b9150509250929050565b61036e816102ef565b82525050565b60006020820190506103896000830184610365565b9291505056fea26469706673582212204467b71b7f77961142b70ca85dc3768883f2af73fbdb9cfde24e0dcf5327ddb364736f6c63430008090033";

export class LightClientFake__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<LightClientFake> {
    return super.deploy(overrides || {}) as Promise<LightClientFake>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): LightClientFake {
    return super.attach(address) as LightClientFake;
  }
  connect(signer: Signer): LightClientFake__factory {
    return super.connect(signer) as LightClientFake__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LightClientFakeInterface {
    return new utils.Interface(_abi) as LightClientFakeInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): LightClientFake {
    return new Contract(address, _abi, signerOrProvider) as LightClientFake;
  }
}
