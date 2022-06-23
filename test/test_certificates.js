const { expect } = require("chai");
const { ethers } = require("hardhat");
//const { beforeEach } = require("mocha"); *** Don't use this when using Chai and Hardhat
const { Contract, BigNumber } = require("ethers");
const { SignerWithAddress } = require("@nomiclabs/hardhat-ethers/signers");
const { delay } = require("bluebird");
const { parseEther, getAddress } = ethers.utils;

describe("TDC Certificate", () => {
    let certificateContract;
    let owner;
    let address1;
    let address2;

    beforeEach(async () => {
        const CertificateFactory = await ethers.getContractFactory(
            "TDCCertificates"
        );
        [owner, address1, address2] = await ethers.getSigners();
        certificateContract = await CertificateFactory.deploy(
        );
    });

    it("Should initialize the Certificate contract", async () => {
        expect(await certificateContract.totalSupply()).to.equal(0);
    });

    it("Should give away certificates", async () => {
        const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
        let tokenId = await certificateContract.totalSupply();
        // Test Mint permissions
        await expect(certificateContract.safeMint(address1.address))
            .to.be.revertedWith("Only addresses with minter role can perform this action.");
        // Grant Minter Role
        await certificateContract.grantRole(MINTER_ROLE, owner.address);
        // Mint to address 1
        expect(
            await certificateContract.safeMint(address1.address)
        )
            .to.emit(certificateContract, "Transfer")
            .withArgs(ethers.constants.AddressZero, address1.address, tokenId);
        // Transfer to address 2
        console.log("mint #1 transfer");
        expect(
            await certificateContract.connect(address1).transferFrom(address1.address, address2.address, tokenId)
        )
            .to.emit(certificateContract, "Transfer")
            .withArgs(address1.address, address2.address, tokenId);

        tokenId++
        // Mint to address 2
        expect(
            await certificateContract.safeMint(address2.address)
        )
            .to.emit(certificateContract, "Transfer")
            .withArgs(ethers.constants.AddressZero, address2.address, tokenId);

        // test out of bounds token
        await expect(certificateContract.tokenURI(tokenId + 1))
            .to.be.revertedWith("Certificate token does not exist");

        // Test default URI
        expect(await certificateContract.tokenURI(1)).to.equal("");
        // change base URI and try again
        await certificateContract.setBaseURI("foo/");
        expect(await certificateContract.tokenURI(1)).to.equal("foo/1.json");
        // Test default contract URI
        expect(await certificateContract.contractURI()).to.equal("");
        // Test contract metadata URI:
        await certificateContract.setContractURI("foobar.json");
        expect(await certificateContract.contractURI()).to.equal("foobar.json");
    });

    it("Should transfer contract ownership", async () => {
        expect(
            await certificateContract.transferOwnership(address1.address)
        )
            .to.emit(certificateContract, "OwnershipTransferred")
            .withArgs(owner.address, address1.address);
    });
});