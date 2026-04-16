import { Contract } from '@algorandfoundation/tealscript';

type BountyConfig = {
  bountyId: uint64;
  bountyName: string;
  bountyCategory: string;
  bountyDescription: string;
  bountyCreator: Address;
  bountyImage: string;
  bountyCost: uint64;
  endTime: uint64;
  submissionCount: uint64;
  requiredPosterRep: uint64;
  requiredHunterRep: uint64;
};

export class AlgocredBountyManager extends Contract {
  maintainerAddress = GlobalStateKey<Address>();
  totalBounties = GlobalStateKey<uint64>();
  lastBountyID = GlobalStateKey<uint64>();

  allBountys = BoxMap<uint64, BountyConfig>();
  leaderboard = BoxMap<Address, uint64>();

  /**
   * Initializes the manager contract.
   */
  createApplication(maintainerAddress: Address): void {
    this.totalBounties.value = 0;
    this.maintainerAddress.value = maintainerAddress;
    this.lastBountyID.value = 1;
  }

  /**
   * Creates a new bounty and stores it in box storage.
   */
  createBounty(config: BountyConfig): void {
    const bountyId = this.lastBountyID.value;

    const newBounty: BountyConfig = {
      bountyId: bountyId,
      bountyName: config.bountyName,
      bountyCategory: config.bountyCategory,
      bountyDescription: config.bountyDescription,
      bountyCreator: config.bountyCreator,
      bountyImage: config.bountyImage,
      bountyCost: config.bountyCost,
      endTime: config.endTime,
      submissionCount: 0,
      requiredPosterRep: config.requiredPosterRep,
      requiredHunterRep: config.requiredHunterRep,
    };

    assert(!this.allBountys(bountyId).exists);
    this.allBountys(bountyId).value = newBounty;

    this.lastBountyID.value = bountyId + 1;
    this.totalBounties.value = this.totalBounties.value + 1;
  }

  /**
   * Sets the winner for a bounty and updates the leaderboard.
   */
  setWinner(developer: Address): void {
    if (!this.leaderboard(developer).exists) {
        this.leaderboard(developer).value = 1;
    } else {
        this.leaderboard(developer).value = this.leaderboard(developer).value + 1;
    }
  }

  /**
   * Batch payroll execution: pays out hunters who successfully submitted.
   * This is a simplified method demonstrating batch atomic transfers in TEAL.
   */
  payBounty(bountyId: uint64, developer: Address, payoutAmount: uint64): void {
    assert(this.txn.sender === this.allBountys(bountyId).value.bountyCreator);
    
    sendPayment({
      amount: payoutAmount,
      receiver: developer,
      sender: this.app.address
    });
  }
}
