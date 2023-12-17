import { ethers } from "hardhat";
import { Swap, composeSwap } from "../SwapFactory";
import { blocktimestamp, getSwaplaceData, getMockData } from "../utils";
import { mint } from "../mint/silkroad-mint";
import { approveMock, approveLINK } from "../approve/silkroad-approve";

export async function execute(destinationChain: any) {
  // Prepare signers
  const [signer] = await ethers.getSigners();

  // Get contract address from .env
  const mockSource = await getMockData();

  // Get contract address from .env
  const mockDestination = await getMockData(destinationChain);

  // Mint token source chain
  const tokenIdSource = await mint(signer.address, mockSource.chainSelector);

  // Mint token destination chain
  const tokenIdDestination = await mint(
    signer.address,
    mockDestination.chainSelector
  );

  // Approve ERC source chain
  await approveMock(signer.address, tokenIdSource, mockSource.chainSelector);

  // Approve ERC destination chain
  await approveMock(signer.address, tokenIdDestination, destinationChain);

  // Get chain data
  const chainData = await getSwaplaceData();

  // Swaplace contract
  const Contract = await ethers.getContractAt(
    "Swaplace",
    chainData.address,
    signer
  );

  // Build swap
  const bidingAddr = [mockSource.address];
  const bidingAmountOrId = [tokenIdSource];

  const askingAddr = [mockDestination.address];
  const askingAmountOrId = [tokenIdDestination];

  const swap: Swap = await composeSwap(
    Contract, // Contract instance for parsing bitwise
    signer.address, // owner
    signer.address, // allowed
    destinationChain, // destination chain
    (await blocktimestamp()) * 2, // expiration
    bidingAddr, // biding address
    bidingAmountOrId, // biding amount or id
    askingAddr, // asking address
    askingAmountOrId // asking amount or id
  );

  // Approve LINK source chain
  await approveLINK(
    signer.address,
    ethers.constants.MaxUint256,
    mockSource.chainSelector
  );

  // Approve LINK destination chain
  await approveLINK(
    signer.address,
    ethers.constants.MaxUint256,
    destinationChain
  );

  // Execute Swap
  var tx = await Contract.executeSwap(swap, {
    gasLimit: 3000000,
    maxPriorityFeePerGas: 20001002003,
    maxFeePerGas: 20001002003,
  });
  const receipt = await tx.wait();
  console.log(
    "\nSent CCIP Message from %s \nTx %s\n",
    chainData.envName,
    receipt.transactionHash
  );
}
