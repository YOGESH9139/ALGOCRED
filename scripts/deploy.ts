import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { AlgocredBountyManagerClient, AlgocredBountyManagerFactory } from '../contracts/AlgocredBountyManagerClient';
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

  const deployer = process.env.DEPLOYER_MNEMONIC ? 
      algosdk.mnemonicToSecretKey(process.env.DEPLOYER_MNEMONIC) : 
      algosdk.generateAccount();

  console.log("Deployer Address:", deployer.addr);
  if (!process.env.DEPLOYER_MNEMONIC) {
      console.log("Mnemonic:", algosdk.secretKeyToMnemonic(deployer.sk));
      console.log("--------------------------------------------------------------------------------");
      console.log(`Please fund: ${deployer.addr} via https://bank.testnet.algorand.network/`);
      console.log(`Then re-run this script with:`);
      console.log(`set DEPLOYER_MNEMONIC="${algosdk.secretKeyToMnemonic(deployer.sk)}"`);
      console.log(`npx tsx scripts/deploy.ts`);
      console.log("--------------------------------------------------------------------------------");
      process.exit(0);
  }
  console.log("Attempting to deploy...");
  
  const factory = new AlgocredBountyManagerFactory({
    algorand,
    defaultSender: deployer.addr.toString(),
    defaultSigner: algosdk.makeBasicAccountTransactionSigner(deployer)
  });

  try {
    const { result, appClient } = await factory.send.create.createApplication({
      args: { maintainerAddress: deployer.addr.toString() }
    });
    const appId = appClient.appId;
    console.log("SUCCESS! Deployed AlgocredBountyManager to TestNet.");
    console.log("App ID:", appId.toString());
    console.log("App Address:", (await appClient.appAddress).toString());
  } catch (err) {
    console.error("Deployment failed:", err.message);
  }
}

main();
