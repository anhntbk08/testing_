
// const token = artifacts.require("EvoToken");
// const dummyToken = artifacts.require("DummyTokenForTest");
// import * as utils from '../utils/Common';
// import {UniV2Helper} from '../utils/UniV2';
// import {LockUtils} from '../utils/LockUtils';
// import { ValidationUtils } from 'ferrum-plumbing';

export const Errors = {
    TRANSFER_FAILED: 'UniswapV2: TRANSFER_FAILED',
    TRANSFER_FROM_FAILED: 'TransferHelper: TRANSFER_FROM_FAILED',
}

// export function context(web3, accounts) {
//     return {
//         web3,
//         accounts,
//         owner: accounts[0],
//         uniV2: new UniV2Helper(web3),
//     };
// }

// export async function deploy(ctx) {
//     const tok = await token.new(utils.toWei(10), {from: ctx.owner}); // buffer = 100
//     // const tok = await dummyToken.new({from: ctx.owner}); // buffer = 100
//     const name = await tok.name();
//     const sym = await tok.symbol();
//     console.log(`Deployed ${name} with buffer(10)`);
//     ctx.uniV2.registerToken(tok.address, sym, name);
//     ctx.lockUtils = new LockUtils(ctx.web3, tok.address);
//     await ctx.uniV2.allowRouter(tok.address, ctx.owner);
//     await tok.transfer(ctx.accounts[1], utils.toWei('50'));
//     await tok.transfer(ctx.accounts[2], utils.toWei('50'));
//     await ctx.uniV2.allowRouter(tok.address, ctx.accounts[1]);
//     ctx.token = tok;
//     return tok;
// }

// export async function removeLiq(ctx, tok1, tok2, amountLiq, from) {
//     const poolAddr = ctx.uniV2.pairAddress(tok1, tok2);
//     // Get the price, 

//     await ctx.uniV2.allowRouter(poolAddr, from || ctx.owner);
//     console.log(`Allowed pool ${poolAddr}. We are about to remove ${amountLiq} liq`);

//     let res = await ctx.uniV2.removeLiquidity(from || ctx.owner, tok1, tok2,
//         amountLiq, 0, 0);
//     // console.log('REMOVE LIQ RES', res)

//     let pairBalance1 = await ctx.uniV2.tokenBalanceOf(tok1, poolAddr);
//     let pairBalance2 = await ctx.uniV2.tokenBalanceOf(tok2, poolAddr);
//     let liqBalance = await ctx.uniV2.tokenBalanceOf(poolAddr, from || ctx.owner);
//     let totalLiqSup = await ctx.uniV2.totalSupply(poolAddr);
//     console.log('Balance after removing liq, TOK1: ', pairBalance1, ', TOK2: ', pairBalance2, 'LIQ: ',
//         liqBalance, 'SUPPLY: ', totalLiqSup);
//     return {pairBalance1, pairBalance2, liqBalance, totalLiqSup};
// }

// export async function removeLiqEth(ctx, tok1, amountLiq, from) {
//     const poolAddr = ctx.uniV2.pairAddress(tok1, utils.WETH);
//     // Get the price, 

//     await ctx.uniV2.allowRouter(poolAddr, from || ctx.owner);
//     console.log(`Allowed pool ${poolAddr}. We are about to remove ${amountLiq} liq`);

//     let res = await ctx.uniV2.removeLiquidityEth(from || ctx.owner, tok1,
//         amountLiq, 0, 0);
//     console.log('Remmove liquidity succeeded!', res.status);
//     // console.log('REMOVE LIQ RES', res)

//     let pairBalance1 = await ctx.uniV2.tokenBalanceOf(tok1, poolAddr);
//     let pairBalance2 = await ctx.uniV2.tokenBalanceOf(utils.WETH, poolAddr);
//     let liqBalance = await ctx.uniV2.tokenBalanceOf(poolAddr, from || ctx.owner);
//     let totalLiqSup = await ctx.uniV2.totalSupply(poolAddr);
//     console.log('Balance after removing liq, TOK: ', pairBalance1, ', WETH: ', pairBalance2, 'LIQ: ',
//         liqBalance, 'SUPPLY: ', totalLiqSup);
//     return {pairBalance1, pairBalance2, liqBalance, totalLiqSup};
// }

// export async function addLiqEth(ctx, tok1, amountTok, amountEth, from) {
//     const poolAddr = ctx.uniV2.pairAddress(tok1, utils.WETH);
//     let res = await ctx.uniV2.addLiquidityEth(from || ctx.owner, tok1,
//         amountTok, amountTok * 0.8, amountEth, amountEth * 0.8);
//     // console.log('ADD LIQ RES', res)
//     // TODO: Replace this with direct call to the safeAddLiquidity.
//     await ctx.token.syncLiquiditySupply(poolAddr);

//     // What happened? No liq was added?
//     let pairBalance1 = await ctx.uniV2.tokenBalanceOf(tok1, poolAddr);
//     let pairBalance2 = await ctx.uniV2.tokenBalanceOf(utils.WETH, poolAddr);
//     let liqBalance = await ctx.uniV2.tokenBalanceOf(poolAddr, from || ctx.owner);
//     let totalLiqSup = await ctx.uniV2.totalSupply(poolAddr);
//     console.log('Balance after add liq, TOK: ', pairBalance1, ', WETH: ', pairBalance2, 'LIQ: ',
//         liqBalance, 'SUPPLY: ', totalLiqSup);
//     return {pairBalance1, pairBalance2, liqBalance, totalLiqSup};
// }


export async function price(uniV2, tok1, tok2) {
    uniV2.cleanPair(tok.address, utils.WETH);
    return (await uniV2.price(tok1, tok2)).toSignificant(6);
}

export async function expectError(pattern, fun) {
    try {
        await fun();
        console.error('Expected error ', pattern);
        ValidationUtils.isTrue(false, `Expected pattern didn't happen.`)
    } catch (e) {
        const msg = e.message || '';
        if (msg.indexOf(pattern) < 0) {
            throw e;
        }
    }
}

export async function withBalanceChange(uniV2, tok, addr, fun) {
    const balPre = await uniV2.tokenBalanceOf(tok, addr);
    await fun();
    const balPost = await uniV2.tokenBalanceOf(tok, addr);
    console.log(`Balance changed from ${balPre} to ${balPost}`);
}

export async function liqBalance(uniV2, tok, addr) {
    return uniV2.tokenBalanceOf(tok, addr);
}
