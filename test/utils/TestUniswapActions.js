// const token = artifacts.require("EvoToken");
// const dummyToken = artifacts.require("DummyTokenForTest");
// import * as utils from '../utils/Common';
// import {Big} from 'big.js';
// import {
//     Errors, context, deploy, removeLiqEth, removeLiq, addLiqEth, lockAddress,
//     expectError, withBalanceChange, liqBalance,
// } from './TestHelper';

// contract('EvoToken', accounts => {
// // contract('DummyTokenForTest', accounts => {
//     it('Open pool, add liq but dont remove', async function() {
//         let res = 0;
//         const ctx = context(web3, accounts);
//         const tok = await deploy(ctx);
//         await tok.allowPool(utils.WETH);
//         // Now add some liqliq
//         const poolAddr = ctx.uniV2.pairAddress(tok.address, utils.WETH);
//         console.log('Token is done, getting pool', poolAddr)

//         ctx.uniV2.registerToken('0xd2dda223b2617cb616c1580db421e4cfae6a8a85', 'BONDLY', 'Bondly Token');
//         ctx.uniV2.registerToken('0xdac17f958d2ee523a2206206994597c13d831ec7', 'USDT', 'USDT');
//         console.log('BONALI ETHO PAIRO',
//             '0xd2dda223b2617cb616c1580db421e4cfae6a8a85',
//             ctx.uniV2.pairAddress('0xd2dda223b2617cb616c1580db421e4cfae6a8a85', utils.WETH)
//             );
//         console.log('BONALI USDT PAIRO',
//             '0xd2dda223b2617cb616c1580db421e4cfae6a8a85',
//             ctx.uniV2.pairAddress('0xd2dda223b2617cb616c1580db421e4cfae6a8a85', '0xdac17f958d2ee523a2206206994597c13d831ec7')
//             );

//         // Add liquidity should fail at this point.
//         await expectError(Errors.TRANSFER_FROM_FAILED, async () => {
//             return await addLiqEth(ctx, tok.address, 10, 0.1);
//         });
//         console.log('Tried to transfer liq but failed');

//         console.log('Setting owner as master');
//         await lockAddress(ctx, ctx.owner, 8 /* Master */);

//         // Add liq should work this time. Owner can work on a locked pool
//         res = await addLiqEth(ctx, tok.address, 10, 0.1);
//         console.log('Added liquidity as owner on a locked pool');

//         // Buy some tokens
//         console.log('About to buy some tokens for the owner. Should succeed');
//         await withBalanceChange(ctx, tok.address, ctx.owner, async () => {
//             await ctx.uniV2.buy(tok.address, utils.WETH, '1', 5, ctx.owner);
//             console.log('Bought the tokens');
//         });

//         console.log('About to buy some tokens for account1. Should fail');
//         await expectError(Errors.TRANSFER_FAILED, async () => {
//             await ctx.uniV2.buy(tok.address, utils.WETH, '1', 50, accounts[1]);
//             console.log('Bought the tokens! How?');
//         });
//         console.log('Buying tokens as account1 failed es expected');

//         // Sell some tokens
//         console.log('About to sell some tokens from the owner. Should succeed');
//         await withBalanceChange(ctx, tok.address, ctx.owner, async () => {
//             await ctx.uniV2.sell(tok.address, utils.WETH, '1', 50, ctx.owner);
//             console.log('Sold the tokens');
//         });

//         console.log('About to sell some tokens for account1. Should fail');
//         await expectError(Errors.TRANSFER_FROM_FAILED, async () => {
//             await ctx.uniV2.sell(tok.address, utils.WETH, '1', 50, accounts[1]);
//             console.log('Sold the tokens! How?');
//         });
//         console.log('Selling tokens as account1 failed es expected');

//         await expectError(Errors.TRANSFER_FAILED, async () => {
//             // Remove half of liq. Owner can do it but not on the ETH pair. Try WETH pair
//             return await removeLiqEth(ctx, tok.address,
//                 new Big(await liqBalance(ctx, poolAddr, ctx.owner)).div(2).toFixed(6), ctx.owner);
//         });
//         console.log('Tried to remove ETH liquidity as owner on a locked pool. Didn\'t work');

//         const liqB = await liqBalance(ctx, poolAddr, ctx.owner);
//         console.log('LOQ BAL', liqB);
//         // Remove quarter of liq. Owner can do it.
//         res = await removeLiq(ctx, tok.address, utils.WETH,
//             new Big(liqB).div(4).toFixed(6), ctx.owner);
//         console.log('Removed WETH liquidity as owner on a locked pool. Did work this time');

//         /***************************************************************
//          *          O P E N I N G   U P   T H E   P O O L
//          ***************************************************************/
//         // Open up the pool to public
//         await lockAddress(ctx, poolAddr, 1 /* NoBurnPool */);
//         console.log('*************** Pool opened to public ****************');

//         // Owner can add liq
//         res = await addLiqEth(ctx, tok.address, 10, 0.1);
//         let addedLiq = res.liqBalance;
//         console.log('Added liquidity as owner to an open pool');

//         // Public can add liq
//         res = await addLiqEth(ctx, tok.address, 5, 0.05, accounts[1]);
//         console.log(`Added liquidity as ${accounts[1]} to an open pool`);

//         addedLiq = res.liqBalance;

//         // Public can trade
//         console.log('About to buy some tokens for account1. Should succeed');
//         await withBalanceChange(ctx, tok.address, accounts[1], async () => {
//             await ctx.uniV2.buy(tok.address, utils.WETH, '1', 5, accounts[1]);
//             console.log('Bought the tokens');
//         });

//         console.log('About to sell some tokens for account1. Should succeed');
//         await withBalanceChange(ctx, tok.address, accounts[1], async () => {
//             await ctx.uniV2.sell(tok.address, utils.WETH, '1', 5, accounts[1]);
//             console.log('Sold the tokens');
//         });

//         // Cannot remove liquidity
//         await expectError(Errors.TRANSFER_FAILED, async () => {
//             return await removeLiqEth(ctx, tok.address,
//                 new Big(addedLiq).div(2).toFixed(6), accounts[1]);
//         });
//         console.log('Tried to remove liquidity of ETH but failed');

//         // Cannot remove liquidity
//         await expectError(Errors.TRANSFER_FAILED, async () => {
//             return await removeLiq(ctx, tok.address, utils.WETH,
//                 new Big(addedLiq).div(2).toFixed(6), accounts[1]);
//         });
//         console.log('Tried to remove liquidity on WETH but failed again');

//         await removeLiq(ctx, tok.address, utils.WETH,
//             new Big(addedLiq).div(2).toFixed(6), ctx.owner);
//         console.log('Tried to remove liquidity as owner on WETH');
//     });
// })