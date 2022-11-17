import { Contract, ContractFactory, Signer } from "ethers";

export class Base<C extends Contract> {
  contract: C;

  constructor(factory: ContractFactory, address: string) {
    this.contract = factory.attach(address) as C;
  }

  // Connects the API to a specific signer
  public connect(signer: Signer) {
    this.contract = this.contract.connect(signer) as C;

    return this;
  }
}
