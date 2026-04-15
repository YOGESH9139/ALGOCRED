import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { AlgocredBountyManagerClient } from '../contracts/AlgocredBountyManagerClient';
import algosdk from 'algosdk';

async function main() {
  // Use public node for TestNet
  const algorand = AlgorandClient.fromConfig({
    algodConfig: {
      server: "https://testnet-api.algonode.cloud",
      port: "",
      token: "",
    },
    indexerConfig: {
      server: "https://testnet-api.algonode.cloud",
      port: "",
      token: "",
    },
  });

  // We need an account with funds on TestNet. 
  // Let's use the local dispenser if possible, but testnet requires real testnet ALGO.
  // I will generate a new account and print its mnemonic so the user can fund it OR I can fund it via the dispenser API!
  const deployer = algorand.account.random();
  console.log("Generated Deployer Address:", deployer.addr);
  console.log("Mnemonic:", algosdk.secretKeyToMnemonic(deployer.sk));

  try {
    console.log("Funding deployer account from dispnser...");
    await algorand.account.dispenserFromEnvironment();
    // Dispenser might not work if env vars aren't set. We will try passing the address to Algokit testnet dispenser programmatically.
    await algorand.send.payment({
      sender: await algorand.account.dispenser(),
      receiver: deployer.addr,
      amount: algosdk.algos(10),
    });
  } catch (e) {
    console.log("Failed to fund automatically. You might need to manually fund this address via https://bank.testnet.algorand.network/");
    console.log(e.message);
    console.log(`Please fund: ${deployer.addr} and run this again.`);
    // process.exit(1);
  }

  // Waiting for human or if the dispenser worked:
  console.log("Attempting to deploy...");
  
  const client = new AlgocredBountyManagerClient({
    algorand,
    defaultSender: deployer.addr,
    defaultSigner: algorand.account.getSigner(deployer.addr)
  });

  try {
    const { appClient } = await client.create.createApplication({ maintainerAddress: deployer.addr });
    const appId = await appClient.getAppId();
    console.log("SUCCESS! Deployed AlgocredBountyManager to TestNet.");
    console.log("App ID:", appId.toString());
    console.log("App Address:", (await appClient.getAppAddress()).toString());
  } catch (err) {
    console.error("Deployment failed:", err.message);
  }
}

main();
