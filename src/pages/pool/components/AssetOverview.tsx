import { BigNumber, ethers } from 'ethers';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import tokens from 'config/tokens';
import { useWalletProvider } from 'context/WalletProvider';
import { chains } from 'config/chains';
import useLPToken from 'hooks/contracts/useLPToken';
import useLiquidityProviders from 'hooks/contracts/useLiquidityProviders';
import Skeleton from 'react-loading-skeleton';
import { useChains } from 'context/Chains';

interface IAssetOverview {
  chainId?: string;
  positionId: BigNumber;
  hideClosedPositions?: boolean | false;
}

function AssetOverview({
  chainId,
  positionId,
  hideClosedPositions,
}: IAssetOverview) {
  const location = useLocation();
  const navigate = useNavigate();

  const { currentChainId, isLoggedIn } = useWalletProvider()!;
  const { selectedNetwork } = useChains()!;

  const chain = currentChainId
    ? chains.find(chainObj => {
        return chainObj.chainId === currentChainId;
      })
    : chainId
    ? chains.find(chainObj => {
        return chainObj.chainId === Number.parseInt(chainId);
      })
    : undefined;

  const { getPositionMetadata } = useLPToken(chain);
  const { getTokenAmount, getTotalLiquidity } = useLiquidityProviders(chain);

  const { isLoading: isPositionMetadataLoading, data: positionMetadata } =
    useQuery(
      ['positionMetadata', positionId],
      () => getPositionMetadata(positionId),
      {
        // Execute only when positionId is available.
        enabled: !!positionId,
      },
    );

  const [tokenAddress, suppliedLiquidity, shares] = positionMetadata || [];

  const { isLoading: isTotalLiquidityLoading, data: totalLiquidity } = useQuery(
    ['totalLiquidity', tokenAddress],
    () => getTotalLiquidity(tokenAddress),
    {
      // Execute only when tokenAddress is available.
      enabled: !!tokenAddress,
    },
  );

  const { isLoading: isTokenAmountLoading, data: tokenAmount } = useQuery(
    ['tokenAmount', { shares, tokenAddress }],
    () => getTokenAmount(shares, tokenAddress),
    {
      // Execute only when shares & tokenAddress is available.
      enabled: !!(shares && tokenAddress),
    },
  );

  const token =
    chain && tokenAddress
      ? tokens.find(tokenObj => {
          return (
            tokenObj[chain.chainId].address.toLowerCase() ===
            tokenAddress.toLowerCase()
          );
        })
      : null;

  const isDataLoading =
    isPositionMetadataLoading ||
    isTotalLiquidityLoading ||
    isTokenAmountLoading;

  if (isDataLoading || !token || !chain) {
    return (
      <Skeleton
        baseColor="#615ccd20"
        enableAnimation
        highlightColor="#615ccd05"
        className="!h-37.5 !rounded-7.5"
        containerClassName="block leading-none"
      />
    );
  }

  const isUserOnPool = location.pathname === '/pool';

  const tokenDecimals = chain && token ? token[chain.chainId].decimal : null;

  const formattedTotalLiquidity =
    totalLiquidity && tokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(totalLiquidity, tokenDecimals),
        )
      : totalLiquidity;

  const formattedSuppliedLiquidity =
    suppliedLiquidity && tokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(suppliedLiquidity, tokenDecimals),
        )
      : suppliedLiquidity;

  const formattedTokenAmount =
    tokenAmount && tokenDecimals
      ? Number.parseFloat(ethers.utils.formatUnits(tokenAmount, tokenDecimals))
      : tokenAmount;

  const { name: chainName } = chain;
  const {
    image: tokenImage,
    symbol: tokenSymbol,
    [chain.chainId]: { chainColor },
  } = token;
  const poolShare =
    suppliedLiquidity && totalLiquidity
      ? Math.round(
          (formattedSuppliedLiquidity / formattedTotalLiquidity) * 100 * 100,
        ) / 100
      : 0;

  const apy = 81.19;
  const unclaimedFees =
    suppliedLiquidity && tokenAmount
      ? formattedSuppliedLiquidity - formattedTokenAmount
      : 0;

  function handleAssetOverviewClick() {
    if (poolShare > 0 && isUserOnPool) {
      navigate(`manage-position/${chain?.chainId}/${positionId}`);
    }
  }

  if (hideClosedPositions && poolShare === 0 && isUserOnPool) return null;

  if (!hideClosedPositions && poolShare > 0 && isUserOnPool) return null;

  return (
    <section
      className={`flex h-37.5 items-center justify-between rounded-7.5 border px-10 py-6 text-hyphen-gray-400 ${
        poolShare > 0 && isUserOnPool ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
      onClick={handleAssetOverviewClick}
      style={{ backgroundColor: chainColor }}
    >
      <div className="flex flex-col">
        <span className="mb-2.5 text-xxs font-bold uppercase">
          Asset supplied
        </span>
        <div className="mb-5 flex items-center">
          <img src={tokenImage} alt={tokenSymbol} className="mr-2 h-8 w-8" />
          <div className="flex flex-col">
            <span className="font-mono text-2xl ">
              {formattedSuppliedLiquidity} {tokenSymbol}
            </span>
            <span className="text-xxs font-bold uppercase text-hyphen-gray-300">
              {chainName}
            </span>
          </div>
        </div>
        <span className="font-mono text-xs">Pool Share: {poolShare}%</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="mb-2.5 text-xxs font-bold uppercase ">APY</span>
        <div className="mb-5">
          <div className="flex flex-col">
            <span className="font-mono text-2xl">{apy}%</span>
            <span className="text-xxs font-bold uppercase text-hyphen-gray-300">
              Annualized
            </span>
          </div>
        </div>
        <span className="font-mono text-xs">
          Unclaimed Fees: ~ ${unclaimedFees}
        </span>
      </div>
    </section>
  );
}

export default AssetOverview;