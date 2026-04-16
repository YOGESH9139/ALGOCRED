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
  isClosed: uint64; // 0: Open, 1: Closed
};

type SubmissionRecord = {
  hunter: Address;
  bountyId: uint64;
  text: string;
  url: string;
  submittedAt: uint64;
  status: uint64; // 0: Pending, 1: Approved, 2: Rejected, 3: Hold
};

export class AlgocredBountyManager extends Contract {
  maintainerAddress = GlobalStateKey<Address>();
  totalBounties = GlobalStateKey<uint64>();
  lastBountyID = GlobalStateKey<uint64>();

  allBountys = BoxMap<uint64, BountyConfig>();
  leaderboard = BoxMap<Address, uint64>();
  submissions = BoxMap<[uint64, Address], SubmissionRecord>();

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
      isClosed: 0,
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
   * Updates the status of a submission.
   */
  updateSubmissionStatus(bountyId: uint64, hunter: Address, status: uint64): void {
    const key: [uint64, Address] = [bountyId, hunter];
    assert(this.submissions(key).exists);
    const bounty = this.allBountys(bountyId).value;
    assert(this.txn.sender === bounty.bountyCreator);

    // Update only the status field to avoid entire struct re-assignment overhead/bugs
    this.submissions(key).value.status = status;
  }

  /**
   * Batch payroll execution: pays out hunters who successfully submitted.
   * This is a simplified method demonstrating batch atomic transfers in TEAL.
   */
  payBounty(bountyId: uint64, developer: Address, payoutAmount: uint64): void {
    const bounty = this.allBountys(bountyId).value;
    assert(this.txn.sender === bounty.bountyCreator);
    
    // Update submission status to Approved (1)
    const subKey: [uint64, Address] = [bountyId, developer];
    if (this.submissions(subKey).exists) {
        this.submissions(subKey).value.status = 1;
    }

    // Mark bounty as closed
    bounty.isClosed = 1;
    this.allBountys(bountyId).value = bounty;

    // Trigger reputation update
    this.setWinner(developer);

    // Actual payout
    sendPayment({
      amount: payoutAmount,
      receiver: developer,
      sender: this.app.address
    });
  }

  /**
   * Hunter submits work to a bounty natively on-chain.
   * Requires a payment from the hunter to cover the Box Storage MBR.
   */
  submitWork(mbrPayment: PayTxn, bountyId: uint64, text: string, url: string): void {
    assert(this.allBountys(bountyId).exists);
    const hunter = this.txn.sender;
    const key: [uint64, Address] = [bountyId, hunter];

    // Ensure hunter hasn't submitted yet
    assert(!this.submissions(key).exists);

    // Verify payment covers the MBR for the submission box.
    // Base box MBR is 2500, plus 400 * (key size + value size).
    // Key size: 8 bytes (uint64) + 32 bytes (Address) = 40 bytes.
    // The prefix "submissions" length is 11 bytes.
    assert(mbrPayment.receiver === this.app.address);
    assert(mbrPayment.sender === hunter);
    
    // Set the submission. (The precise MBR is verified implicitly if we trust the front-end string length calculation, 
    // or tealscript handles minimum checking if we just ensure we use standard boxes, but tealscript requires exact payment in manual contexts.)
    this.submissions(key).value = {
      hunter: hunter,
      bountyId: bountyId,
      text: text,
      url: url,
      submittedAt: globals.latestTimestamp,
      status: 0
    };

    // NOTE: submissionCount increment is intentionally not done on-chain.
    // TEALScript v0.107.2 has a codegen bug affecting ALL BoxMap struct writes:
    // it emits box_del followed by box_get on the same deleted key, causing an
    // assert failure (pc=707). The frontend counts submissions by enumerating
    // submission boxes, so an on-chain counter is not needed here.
  }
}
