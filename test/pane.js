import { UniV2Helper } from './utils/UniV2'
import * as utils from './utils/Common';
import {withBalanceChange, expectError}  from './utils/TestHelper';

const Pane = artifacts.require('NyanCatToken')

const _uniswapV2Router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const _treasuryWallet = "0x35CaaBA865BD019dc738eCB96Ec7D0a7Ab349015";
const pvk = "0x542cd99bdcf472bb748dcacab0878269ba6d8224602eaab88cb3a7e9fa9b325b"
const aliceAddress = "0x480828077CEB6dF32bFB48A03D8d6A934A685247"

const uniV2 = new UniV2Helper(web3);
let panToken;

contract('Pane', ([alice, bob, carol, vv, tom]) => {
    it('add liquidity - remove liquidity ', async () => {
        // panToken = await Pane.new(
        //     _uniswapV2Router,
        //     1,
        //     1,
        //     1 ** 11 * 2,
        //     true,
        //     _treasuryWallet,
        //     { from: alice })
        panToken = await Pane.new({from : alice})
        await uniV2.registerToken(panToken.address, "Pane", "Propane");
        await uniV2.allowRouter(panToken.address, alice);
        // await panToken.transfer(ctx.accounts[1], utils.toWei('50'));
        // await panToken.transfer(ctx.accounts[2], utils.toWei('50'));
        await uniV2.allowRouter(panToken.address, bob);
        await uniV2.allowRouter(panToken.address, carol);
        
        console.log("Adding liquidity  ")
        await uniV2.addLiquidityEth(alice, panToken.address,
            1, 1 * 0.8, 1, 1 * 0.8);

        const poolAddr = uniV2.pairAddress(panToken.address, utils.WETH);

        let amountLiq = await uniV2.tokenBalanceOf(poolAddr, alice);
        console.log("amountLiq ", amountLiq)
        await uniV2.allowRouter(poolAddr, alice);
        console.log(`Allowed pool ${poolAddr}. We are about to remove ${amountLiq} liq`);

        // let res = await uniV2.removeLiquidityEth(alice, panToken.address,
        //   amountLiq, 0, 0);

        let res = await uniV2.removeLiquidityEth(alice, panToken.address,
            0.2, 0, 0);

        let aliceBal = await panToken.balanceOf(alice)
        console.log("aliceBal ", aliceBal.toString())

        // 
    })

    it('Simple transfer, cant withdraw on liquidity ', async () => {
        // panToken = await Pane.new(
        //     _uniswapV2Router,
        //     1,
        //     1,
        //     1 ** 11 * 2,
        //     true,
        //     _treasuryWallet,
        //     { from: alice })
        panToken = await Pane.new({from : alice})
        await uniV2.registerToken(panToken.address, "Pane", "Propane");
        await uniV2.allowRouter(panToken.address, alice);
        // await panToken.transfer(ctx.accounts[1], utils.toWei('50'));
        // await panToken.transfer(ctx.accounts[2], utils.toWei('50'));
        await uniV2.allowRouter(panToken.address, bob);
        await uniV2.allowRouter(panToken.address, carol);

        await uniV2.addLiquidityEth(alice, panToken.address,
            1, 1 * 0.8, 1, 1 * 0.8);

        await panToken.transfer(carol, 10 ** 15, { from: alice })
        let res = await panToken.transfer(bob, 10 ** 13, { from: carol })
        console.log("transfer gasUsed: ", res.receipt.gasUsed);
        let bobBal = await panToken.balanceOf(bob)
        let balanceOfPoolForSwap = await panToken.balanceOf(panToken.address)
        let balanceOfTreasury = await panToken.balanceOf(_treasuryWallet)
        let expectedBalanceOfPoolForSwap = (10 ** 13 * 0.01).toFixed(0).toString()
        let expectedBalanceOfTreasury = (10 ** 13 * 0.01).toFixed(0).toString()
        // assert.equal(expectedBalanceOfPoolForSwap, balanceOfPoolForSwap.toString())
        // assert.equal(expectedBalanceOfTreasury, balanceOfTreasury.toString())
        // assert.equal(bobBal.toString(), (10 ** 13 * 0.98).toFixed(0).toString())

        // trigger swapLiquidity 
        const carolBalance = await panToken.balanceOf(carol)
        res = await panToken.transfer(bob, 10 ** 13, { from: carol })
        console.log("transfer gasUsed: ", res.receipt.gasUsed);
        bobBal = await panToken.balanceOf(bob)
        balanceOfPoolForSwap = await panToken.balanceOf(panToken.address)
        balanceOfTreasury = await panToken.balanceOf(_treasuryWallet)
        expectedBalanceOfTreasury = (10 ** 13 * 0.01 * 2).toFixed(0).toString()

        // assert.equal(expectedBalanceOfTreasury, balanceOfTreasury.toString())
        /** why ???
         * -200000000000
          +200988530023
         *  */

        // assert.equal(bobBal.toString(), (10 ** 13 * 0.98 * 2).toFixed(0).toString())
        // assert.equal("200000000000", balanceOfPoolForSwap.toString())

        // check liquidity

        res = await panToken.transfer(bob, 10 ** 13, { from: carol })
        console.log("transfer gasUsed: ", res.receipt.gasUsed);
        bobBal = await panToken.balanceOf(bob)
        balanceOfPoolForSwap = await panToken.balanceOf(panToken.address)
        balanceOfTreasury = await panToken.balanceOf(_treasuryWallet)
        expectedBalanceOfTreasury = (10 ** 13 * 0.01 * 3).toFixed(0).toString()

        // assert.equal(expectedBalanceOfTreasury, balanceOfTreasury.toString())
        /** why ???
         * -200000000000
          +200988530023
         *  */

        // assert.equal(bobBal.toString(), (10 ** 13 * 0.98 * 3).toFixed(0).toString())
        // assert.equal("104271050521", balanceOfPoolForSwap.toString())

        // check alice balance
        let aliceBal = await panToken.balanceOf(alice)
        console.log("aliceBal ", aliceBal.toString())
        // assert.equal("19998999000000000000000", balanceOfPoolForSwap.toString())
        // assert.equal("104271050521", balanceOfPoolForSwap.toString())

        // withdraw liquidity
        const poolAddr = uniV2.pairAddress(panToken.address, utils.WETH);

        let amountLiq = await uniV2.tokenBalanceOf(poolAddr, alice);
        console.log("amountLiq ", amountLiq)
        await uniV2.allowRouter(poolAddr, alice);
        console.log(`Allowed pool ${poolAddr}. We are about to remove ${amountLiq} liq`);

        res = await uniV2.removeLiquidityEth(alice, panToken.address,
          amountLiq, 0, 0);

        // res = await uniV2.removeLiquidityEth(alice, panToken.address,
        //     0.9, 0.05, 0.05);

        // console.log(res)

        aliceBal = await panToken.balanceOf(alice)
        console.log("aliceBal ", aliceBal.toString())

        // 
    })

    it('Uniswap actions', async () => {
        // panToken = await Pane.new(
        //     _uniswapV2Router,
        //     1,
        //     1,
        //     1 ** 11 * 2,
        //     true,
        //     _treasuryWallet,
        //     { from: alice })
        panToken = await Pane.new({from : alice})
        console.log("panToken.address ", panToken.address)
        await uniV2.registerToken(panToken.address, "Pane", "Propane");
        await uniV2.allowRouter(panToken.address, alice);
        await uniV2.allowRouter(panToken.address, bob);
        await uniV2.allowRouter(panToken.address, carol);
        
        await uniV2.addLiquidityEth(alice, panToken.address,
            1, 1 * 0.8, 1, 1 * 0.8);
        
        let balanceOfPoolForSwap = await panToken.balanceOf(panToken.address)
        // assert.equal(balanceOfPoolForSwap, "0")

        // Buy some tokens, buyer charge fee
        // console.log('About to buy some tokens for tom. Should succeed');
        // await uniV2.buy(panToken.address, utils.WETH, 0.1, 50, alice);
        // await uniV2.swapExactETHForTokensSupportingFeeOnTransferTokens(tom, 0.01, [utils.WETH, panToken.address], tom)
        // await uniV2.swapExactETHForTokensSupportingFeeOnTransferTokens(tom, 0.01, [utils.WETH, panToken.address], tom)
        // await uniV2.swapExactETHForTokensSupportingFeeOnTransferTokens(tom, 0.01, [utils.WETH, panToken.address], tom)
        // await uniV2.swapExactETHForTokensSupportingFeeOnTransferTokens(tom, 0.01, [utils.WETH, panToken.address], tom)
        // await uniV2.swapExactETHForTokensSupportingFeeOnTransferTokens(tom, 0.01, [utils.WETH, panToken.address], tom)

        // console.log('Bought the tokens');

        // await uniV2.buy(panToken.address, utils.WETH, 0.1, 5, tom);
        
        // balanceOfPoolForSwap = await panToken.balanceOf(panToken.address)
        // let tomBalance = await panToken.balanceOf(tom)
        // console.log("tomBalance ", tomBalance.toString())
        // // assert.equal(tomBalance.toString() , "100000000000000000")
        // assert.equal(balanceOfPoolForSwap, 0)
        
        await panToken.transfer(tom, utils.toWei('1'), { from: alice })

        // Sell some tokens
        console.log('About to sell some tokens for tom. Should succeed');
        await uniV2.allowRouter(panToken.address, tom);
        // let res1 = await uniV2.sell(panToken.address, utils.WETH, 0.01, 90, tom);
        let res1 = await uniV2.swapExactTokensForETHSupportingFeeOnTransferTokens(tom, 0.01, 0.002, [panToken.address, utils.WETH], tom);
        console.log('Sold the tokens ', res1);

        balanceOfPoolForSwap = await panToken.balanceOf(panToken.address)
        let tomBalance = await panToken.balanceOf(tom)
        console.log("tomBalance ", tomBalance.toString())
        // assert.equal(tomBalance.toString() , "0")
        // assert.equal(balanceOfPoolForSwap, 0)


        // let amountLiq = await uniV2.tokenBalanceOf(poolAddr, alice);
        // console.log("amountLiq ", amountLiq)
        // res = await uniV2.removeLiquidityEth(alice, panToken.address,
        //     amountLiq, 0, 0);

        // console.log(res)
    })

})