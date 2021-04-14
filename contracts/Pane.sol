pragma solidity 0.6.12;
import "./Others.sol";

// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/math/SafeMath.sol";
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
// import "@uniswap/v2-core/contracts/interfaces/IUniswapV2ERC20.sol";
// import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract PANE is ERC20, Ownable {

    using SafeMath for uint256;

    IUniswapV2Router02 public immutable uniswapV2Router;
    address public uniswapV2Pair;
    address public treasuryWallet;

    uint8 public feeDecimals;
    uint32 public feePercentage;
    uint128 private minTokensBeforeSwap;

    bool inSwapAndLiquify;
    bool swapAndLiquifyEnabled;
    mapping (address => bool) private whitelist;

    event FeeUpdated(uint8 feeDecimals, uint32 feePercentage);
    event MinTokensBeforeSwapUpdated(uint128 minTokensBeforeSwap);
    event SwapAndLiquifyEnabledUpdated(bool enabled);
    event SwapAndLiquify(
        uint256 tokensSwapped,
        uint256 ethReceived,
        uint256 tokensIntoLiqudity
    );

    modifier lockTheSwap {
        inSwapAndLiquify = true;
        _;
        inSwapAndLiquify = false;
    }

    constructor(
        IUniswapV2Router02 _uniswapV2Router,
        uint8 _feeDecimals,
        uint32 _feePercentage,
        uint128 _minTokensBeforeSwap,
        bool _swapAndLiquifyEnabled,
        address _treasuryWallet
    ) public ERC20("Propane", "Pane") {
        // mint tokens which will initially belong to deployer
        // deployer should go seed the pair with some initial liquidity
        _mint(msg.sender, 20000 * 10**18);

        // Create a uniswap pair for this new token
        uniswapV2Pair = IUniswapV2Factory(_uniswapV2Router.factory())
            .createPair(address(this), _uniswapV2Router.WETH());

        whitelist[address(owner())] = true;
        whitelist[uniswapV2Pair] = true;
        whitelist[address(uniswapV2Pair)] = true;
        whitelist[address(this)] = true;

        // set the rest of the contract variables
        uniswapV2Router = _uniswapV2Router;
        treasuryWallet = _treasuryWallet;

        updateFee(_feeDecimals, _feePercentage);
        updateMinTokensBeforeSwap(_minTokensBeforeSwap);
        updateSwapAndLiquifyEnabled(_swapAndLiquifyEnabled);
    }

    /*
        override the internal _transfer function so that we can
        take the fee, and conditionally do the swap + liquditiy
    */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // is the token balance of this contract address over the min number of
        // tokens that we need to initiate a swap + liquidity lock?
        // also, don't get caught in a circular liquidity event.
        // also, don't swap & liquify if sender is uniswap pair.
        uint256 contractTokenBalance = balanceOf(address(this));
        bool overMinTokenBalance = contractTokenBalance >= minTokensBeforeSwap;
        if (
            overMinTokenBalance &&
            !inSwapAndLiquify &&
            from != uniswapV2Pair &&
            swapAndLiquifyEnabled
        ) {
            swapAndLiquify(contractTokenBalance);
        }

        // calculate the number of tokens to take as a fee
        uint256 tokensToLock = calculateTokenFee(
            amount,
            feeDecimals,
            feePercentage
        );
        
        // 1% treasury tax
        uint256 treasuryVal = amount.div(100);

        if(whitelist[from] || whitelist[to]) {
            super._transfer(from, to, amount);
        } else {
            // take the fee and send those tokens to this contract address
            // and then send the remainder of tokens to original recipient
            uint256 tokensToTransfer = amount.sub(tokensToLock).sub(treasuryVal);

            super._transfer(from, address(this), tokensToLock);
            super._transfer(from, to, tokensToTransfer);
            super._transfer(from, treasuryWallet, treasuryVal);
        }
    }

    function swapAndLiquify(uint256 contractTokenBalance) private lockTheSwap {
        // split the contract balance into halves
        uint256 half = contractTokenBalance.div(2);
        uint256 otherHalf = contractTokenBalance.sub(half);

        // capture the contract's current ETH balance.
        // this is so that we can capture exactly the amount of ETH that the
        // swap creates, and not make the liquidity event include any ETH that
        // has been manually sent to the contract
        uint256 initialBalance = address(this).balance;

        // swap tokens for ETH
        swapTokensForEth(half); // <- this breaks the ETH -> PANE swap when swap+liquify is triggered

        // how much ETH did we just swap into?
        uint256 newBalance = address(this).balance.sub(initialBalance);

        // add liquidity to uniswap
        addLiquidity(otherHalf, newBalance);

        emit SwapAndLiquify(half, newBalance, otherHalf);
    }

    function swapTokensForEth(uint256 tokenAmount) private {
        // generate the uniswap pair path of token -> weth
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();

        _approve(address(this), address(uniswapV2Router), tokenAmount);

        // make the swap
        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0, // accept any amount of ETH
            path,
            address(this),
            block.timestamp
        );
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        // approve token transfer to cover all possible scenarios
        _approve(address(this), address(uniswapV2Router), tokenAmount);

        // add the liquidity
        uniswapV2Router.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0, // slippage is unavoidable
            0, // slippage is unavoidable
            address(this),
            block.timestamp
        );
    }

    /*
        calculates a percentage of tokens to hold as the fee
    */
    function calculateTokenFee(
        uint256 _amount,
        uint8 _feeDecimals,
        uint32 _feePercentage
    ) public pure returns (uint256 locked) {
        locked = _amount.mul(_feePercentage).div(
            10**(uint256(_feeDecimals) + 2)
        );
    }

    receive() external payable {}

    ///
    /// Ownership adjustments
    ///

    function updateFee(uint8 _feeDecimals, uint32 _feePercentage)
        public
        onlyOwner
    {
        feeDecimals = _feeDecimals;
        feePercentage = _feePercentage;
        emit FeeUpdated(_feeDecimals, _feePercentage);
    }

    function updateMinTokensBeforeSwap(uint128 _minTokensBeforeSwap)
        public
        onlyOwner
    {
        minTokensBeforeSwap = _minTokensBeforeSwap;
        emit MinTokensBeforeSwapUpdated(_minTokensBeforeSwap);
    }

    function updateSwapAndLiquifyEnabled(bool _enabled) public onlyOwner {
        swapAndLiquifyEnabled = _enabled;
        emit SwapAndLiquifyEnabledUpdated(_enabled);
    }

    function withdrawTokens(
        address _token,
        address _to,
        uint256 _amount
    ) public onlyOwner {
        IUniswapV2ERC20 token = IUniswapV2ERC20(_token);
        token.transfer(_to, _amount);
    }

    function withdrawEther(address payable _to, uint256 _amount)
        public
        onlyOwner
    {
        _to.transfer(_amount);
    }
}