import { chains } from 'config/chains';
import tokens from 'config/tokens';
import { BigNumber, ethers } from 'ethers';
import useLPToken from 'hooks/contracts/useLPToken';
import { useQuery } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import useLiquidityProviders from 'hooks/contracts/useLiquidityProviders';
import useLiquidityFarming from 'hooks/contracts/useLiquidityFarming';
import { makeNumberCompact } from 'utils/makeNumberCompact';

interface IStakingPositionOverview {
  chainId: number;
  positionId: BigNumber;
}

function StakingPositionOverview({
  chainId,
  positionId,
}: IStakingPositionOverview) {
  const location = useLocation();
  const navigate = useNavigate();

  const chain = chains.find(chainObj => {
    return chainObj.chainId === chainId;
  })!;

  const { getPositionMetadata } = useLPToken(chain);
  const { getBaseDivisor, getSuppliedLiquidityByToken } =
    useLiquidityProviders(chain);
  const {
    getPendingToken,
    getRewardRatePerSecond,
    getRewardTokenAddress,
    getTotalSharesStaked,
  } = useLiquidityFarming(chain);

  const { isLoading: isPositionMetadataLoading, data: positionMetadata } =
    useQuery(['positionMetadata', positionId], () =>
      getPositionMetadata(positionId),
    );

  const { data: baseDivisor } = useQuery('baseDivisor', () => getBaseDivisor());

  const [tokenAddress, suppliedLiquidity, shares] = positionMetadata || [];

  const token =
    chain && tokenAddress
      ? tokens.find(tokenObj => {
          return (
            tokenObj[chainId]?.address.toLowerCase() ===
            tokenAddress.toLowerCase()
          );
        })
      : null;

  const tokenDecimals = chain && token ? token[chain.chainId].decimal : null;

  const { data: suppliedLiquidityByToken } = useQuery(
    ['suppliedLiquidityByToken', tokenAddress],
    () => getSuppliedLiquidityByToken(tokenAddress),
    {
      // Execute only when address is available.
      enabled: !!tokenAddress,
    },
  );

  const { data: tokenPriceInUSD } = useQuery(
    ['tokenPriceInUSD', token?.coinGeckoId],
    () =>
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${token?.coinGeckoId}&vs_currencies=usd`,
      ).then(res => res.json()),
    {
      enabled: !!token,
    },
  );

  const { data: pendingToken } = useQuery(['pendingToken', positionId], () =>
    getPendingToken(positionId),
  );

  const { data: rewardsRatePerSecond } = useQuery(
    ['rewardsRatePerSecond', token],
    () => {
      if (!chain || !token) return;

      return getRewardRatePerSecond(token[chain.chainId].address);
    },
    {
      // Execute only when address is available.
      enabled: !!(chain && token),
    },
  );

  const { data: rewardTokenAddress } = useQuery(
    ['rewardTokenAddress', token],
    () => {
      if (!chain || !token) return;

      return getRewardTokenAddress(token[chain.chainId].address);
    },
    {
      // Execute only when address is available.
      enabled: !!(chain && token),
    },
  );

  const { data: totalSharesStaked } = useQuery(
    ['totalSharesStaked', token],
    () => {
      if (!chain || !token) return;

      return getTotalSharesStaked(token[chain.chainId].address);
    },
    {
      // Execute only when address is available.
      enabled: !!(chain && token),
    },
  );

  const rewardToken =
    rewardTokenAddress && chain
      ? tokens.find(tokenObj => {
          return tokenObj[chain.chainId]
            ? tokenObj[chain.chainId].address.toLowerCase() ===
                rewardTokenAddress.toLowerCase()
            : false;
        })
      : undefined;

  const rewardTokenDecimals =
    chain && rewardToken ? rewardToken[chain.chainId].decimal : null;

  const { data: rewardTokenPriceInUSD } = useQuery(
    ['rewardTokenPriceInUSD', rewardToken?.coinGeckoId],
    () => {
      if (!rewardToken) return;

      return fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${rewardToken.coinGeckoId}&vs_currencies=usd`,
      ).then(res => res.json());
    },
    {
      enabled: !!rewardToken,
    },
  );

  const isDataLoading = isPositionMetadataLoading;

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

  const isUserOnFarms = location.pathname === '/farms';

  const formattedSuppliedLiquidity =
    suppliedLiquidity && tokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(suppliedLiquidity, tokenDecimals),
        )
      : -1;

  const { name: chainName } = chain;
  const {
    image: tokenImage,
    symbol: tokenSymbol,
    [chain.chainId]: { chainColor },
  } = token;

  const rewardRatePerSecondInUSD =
    rewardsRatePerSecond &&
    rewardToken &&
    rewardTokenPriceInUSD &&
    rewardTokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(rewardsRatePerSecond, rewardTokenDecimals),
        ) * rewardTokenPriceInUSD[rewardToken.coinGeckoId as string].usd
      : -1;

  const totalValueLockedInUSD =
    suppliedLiquidityByToken && tokenPriceInUSD && tokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(suppliedLiquidityByToken, tokenDecimals),
        ) * tokenPriceInUSD[token?.coinGeckoId as string].usd
      : -1;

  const secondsInYear = 31536000;

  const rewardAPY =
    rewardRatePerSecondInUSD && totalValueLockedInUSD
      ? (Math.pow(
          1 + rewardRatePerSecondInUSD / totalValueLockedInUSD,
          secondsInYear,
        ) -
          1) *
        100
      : -1;

  const SECONDS_IN_24_HOURS = 86400;
  const rewardsPerDay =
    rewardsRatePerSecond && rewardToken && chain && rewardTokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(rewardsRatePerSecond, rewardTokenDecimals),
        ) * SECONDS_IN_24_HOURS
      : -1;

  const yourRewardRate =
    baseDivisor &&
    tokenDecimals &&
    shares &&
    totalSharesStaked &&
    rewardsPerDay >= 0
      ? Number.parseFloat(shares.div(baseDivisor).div(totalSharesStaked)) *
        rewardsPerDay
      : 0;

  const unclaimedRewardToken =
    pendingToken && rewardTokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(pendingToken, rewardTokenDecimals),
        )
      : 0;

  function handleStakingPositionClick() {
    if (isUserOnFarms) {
      navigate(`manage-staking-position/${chain?.chainId}/${positionId}`);
    }
  }

  return (
    <section
      className={`grid h-37.5 grid-cols-3 rounded-7.5 border px-10 py-6 text-hyphen-gray-400 ${
        isUserOnFarms ? 'cursor-pointer' : ''
      }`}
      onClick={handleStakingPositionClick}
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
        <span className="font-mono text-xs">TVL: $525,234</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="mb-2.5 text-xxs font-bold uppercase ">Reward APY</span>
        <div className="mb-5">
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <span className="font-mono text-2xl">
                {rewardAPY >= 0 ? (
                  `${makeNumberCompact(
                    Number.parseFloat(rewardAPY.toFixed(3)),
                    3,
                  )}%`
                ) : (
                  <Skeleton
                    baseColor="#615ccd20"
                    enableAnimation
                    highlightColor="#615ccd05"
                    className="!mx-1 !w-28"
                  />
                )}
              </span>
            </div>
            <span className="text-xxs font-bold uppercase text-hyphen-gray-300">
              Annualized
            </span>
          </div>
        </div>
        <span className="font-mono text-xs">
          Farm Rate:{' '}
          {rewardsPerDay >= 0 && rewardToken ? (
            `${makeNumberCompact(
              Number.parseFloat(rewardsPerDay.toFixed(3)),
              3,
            )} ${rewardToken.symbol} per day`
          ) : (
            <Skeleton
              baseColor="#615ccd20"
              enableAnimation
              highlightColor="#615ccd05"
              className="!mx-1 !w-28"
            />
          )}
        </span>
      </div>

      <div className="flex flex-col items-end">
        <span className="mb-2.5 text-xxs font-bold uppercase ">
          Your Reward Rate
        </span>
        <div className="mb-5">
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <span className="font-mono text-2xl">
                {' '}
                {yourRewardRate >= 0 && rewardToken ? (
                  <div className="flex items-center">
                    <img
                      src={rewardToken.image}
                      alt={rewardToken.symbol}
                      className="mr-2.5 h-5 w-5"
                    />
                    {makeNumberCompact(
                      Number.parseFloat(yourRewardRate.toFixed(3)),
                      3,
                    )}{' '}
                    {rewardToken.symbol}
                  </div>
                ) : (
                  <Skeleton
                    baseColor="#615ccd20"
                    enableAnimation
                    highlightColor="#615ccd05"
                    className="!mx-1 !w-28"
                  />
                )}
              </span>
            </div>
            <span className="text-xxs font-bold uppercase text-hyphen-gray-300">
              Per Day
            </span>
          </div>
        </div>
        <span className="font-mono text-xs">
          {rewardToken && unclaimedRewardToken >= 0 ? (
            `Unclaimed ${rewardToken.symbol}: ${
              unclaimedRewardToken > 0
                ? makeNumberCompact(
                    Number.parseFloat(unclaimedRewardToken.toFixed(5)),
                    5,
                  )
                : 0
            }`
          ) : (
            <Skeleton
              baseColor="#615ccd20"
              enableAnimation
              highlightColor="#615ccd05"
              className="!mx-1 !w-28"
            />
          )}
        </span>
      </div>
    </section>
  );
}

export default StakingPositionOverview;
