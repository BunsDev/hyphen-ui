import ProgressBar from 'components/ProgressBar';
import { chains } from 'config/chains';
import { NATIVE_ADDRESS } from 'config/constants';
import tokens from 'config/tokens';
import { useNotifications } from 'context/Notifications';
import { useWalletProvider } from 'context/WalletProvider';
import { BigNumber } from 'ethers';
import useLiquidityProviders from 'hooks/useLiquidityProviders';
import useLPToken from 'hooks/useLPToken';
import useWhitelistPeriodManager from 'hooks/useWhitelistPeriodManager';
import { useEffect, useState } from 'react';
import { HiArrowSmLeft } from 'react-icons/hi';
import { useMutation, useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import getTokenBalance from 'utils/getTokenBalance';
import { makeNumberCompact } from 'utils/makeNumberCompact';
import AssetOverview from '../AssetOverview';
import LiquidityInfo from '../LiquidityInfo';
import StepSlider from '../StepSlider';
import Skeleton from 'react-loading-skeleton';
import CustomTooltip from 'components/CustomTooltip';

function IncreaseLiquidity() {
  const navigate = useNavigate();
  const { chainId, positionId } = useParams();

  const { accounts } = useWalletProvider()!;
  const { addTxNotification } = useNotifications()!;

  const { getPositionMetadata } = useLPToken();
  const { getTotalLiquidity, increaseLiquidity, increaseNativeLiquidity } =
    useLiquidityProviders();
  const { getTokenTotalCap } = useWhitelistPeriodManager();

  const [walletBalance, setWalletBalance] = useState<string | undefined>();
  const [liquidityIncreaseAmount, setLiquidityIncreaseAmount] =
    useState<string>('');
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [poolShare, setPoolShare] = useState<number>();

  const { isLoading: isPositionMetadataLoading, data: positionMetadata } =
    useQuery(
      ['positionMetadata', positionId],
      () => getPositionMetadata(BigNumber.from(positionId)),
      {
        enabled: !!positionId,
      },
    );

  const {
    shares,
    suppliedLiquidity,
    token: tokenAddress,
  } = positionMetadata || {};

  const chain = chainId
    ? chains.find(chainObj => {
        return chainObj.chainId === Number.parseInt(chainId);
      })
    : null;

  const token =
    chainId && tokenAddress
      ? tokens.find(tokenObj => {
          return (
            tokenObj[Number.parseInt(chainId)].address.toLowerCase() ===
            tokenAddress.toLowerCase()
          );
        })
      : null;

  const tokenDecimals =
    chainId && token ? token[Number.parseInt(chainId)].decimal : null;

  const { data: totalLiquidity } = useQuery(
    ['totalLiquidity', tokenAddress],
    () => getTotalLiquidity(tokenAddress),
    {
      // Execute only when metadata is available.
      enabled: !!positionMetadata,
    },
  );

  const { data: tokenTotalCap } = useQuery(
    ['tokenTotalCap', tokenAddress],
    () => getTokenTotalCap(tokenAddress),
    {
      // Execute only when accounts are available.
      enabled: !!tokenAddress,
    },
  );

  const {
    isLoading: increaseLiquidityLoading,
    isSuccess: increaseLiquiditySuccess,
    mutate: increaseLiquidityMutation,
  } = useMutation(
    async ({
      positionId,
      amount,
    }: {
      positionId: BigNumber;
      amount: BigNumber;
    }) => {
      const increaseLiquidityTx = await increaseLiquidity(positionId, amount);
      addTxNotification(
        increaseLiquidityTx,
        'Increase liquidity',
        `${chain?.explorerUrl}/tx/${increaseLiquidityTx.hash}`,
      );
      return await increaseLiquidityTx.wait(1);
    },
  );

  const {
    isLoading: increaseNativeLiquidityLoading,
    isSuccess: increaseNativeLiquiditySuccess,
    mutate: increaseNativeLiquidityMutation,
  } = useMutation(async ({ positionId }: { positionId: BigNumber }) => {
    const increaseNativeLiquidityTx = await increaseNativeLiquidity(positionId);
    addTxNotification(
      increaseNativeLiquidityTx,
      'Increase native liquidity',
      `${chain?.explorerUrl}/tx/${increaseNativeLiquidityTx.hash}`,
    );
    return await increaseNativeLiquidityTx.wait(1);
  });

  const formattedTotalLiquidity =
    totalLiquidity && tokenDecimals
      ? totalLiquidity / 10 ** tokenDecimals
      : totalLiquidity;

  const formattedTokenTotalCap =
    tokenTotalCap && tokenDecimals
      ? tokenTotalCap / 10 ** tokenDecimals
      : tokenTotalCap;

  const formattedSuppliedLiquidity = tokenDecimals
    ? suppliedLiquidity / 10 ** tokenDecimals
    : suppliedLiquidity;

  const canUserInteract =
    !!walletBalance &&
    !increaseLiquidityLoading &&
    !increaseNativeLiquidityLoading;

  // TODO: Clean up hooks so that React doesn't throw state updates on unmount warning.
  useEffect(() => {
    async function getWalletBalance() {
      if (!accounts || !chain || !token) return;

      const { displayBalance } = await getTokenBalance(
        accounts[0],
        chain,
        token,
      );
      setWalletBalance(displayBalance);
    }

    getWalletBalance();
  }, [accounts, chain, token]);

  useEffect(() => {
    if (formattedSuppliedLiquidity && formattedTotalLiquidity) {
      const initialPoolShare =
        Math.round(
          (formattedSuppliedLiquidity / formattedTotalLiquidity) * 100 * 100,
        ) / 100;

      setPoolShare(initialPoolShare);
    }
  }, [formattedSuppliedLiquidity, formattedTotalLiquidity]);

  async function handleLiquidityAmountChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const regExp = /^((\d+)?(\.\d{0,3})?)$/;
    const newLiquidityIncreaseAmount = e.target.value;
    const isInputValid = regExp.test(newLiquidityIncreaseAmount);

    if (isInputValid) {
      const newLiquidityAmount =
        Number.parseFloat(newLiquidityIncreaseAmount) +
        formattedSuppliedLiquidity;
      setLiquidityIncreaseAmount(newLiquidityIncreaseAmount);
      updatePoolShare(newLiquidityAmount);
    }
  }

  function handleSliderChange(value: number) {
    setSliderValue(value);

    if (value === 0) {
      setLiquidityIncreaseAmount('');
      updatePoolShare('0');
    } else if (walletBalance) {
      const newLiquidityIncreaseAmount = (
        Math.trunc(Number.parseFloat(walletBalance) * (value / 100) * 1000) /
        1000
      ).toString();
      const newLiquidityAmount =
        Number.parseFloat(newLiquidityIncreaseAmount) +
        formattedSuppliedLiquidity;
      setLiquidityIncreaseAmount(newLiquidityIncreaseAmount);
      updatePoolShare(newLiquidityAmount);
    }
  }

  function handleMaxButtonClick() {
    if (walletBalance) {
      setSliderValue(100);
      setLiquidityIncreaseAmount(
        (Math.trunc(Number.parseFloat(walletBalance) * 1000) / 1000).toString(),
      );
    }
  }

  function updatePoolShare(newLiquidityAmount: string) {
    const liquidityAmountInFloat = Number.parseFloat(newLiquidityAmount);

    const newPoolShare =
      liquidityAmountInFloat > 0
        ? (liquidityAmountInFloat /
            (liquidityAmountInFloat + formattedTotalLiquidity)) *
          100
        : Math.round(
            (formattedSuppliedLiquidity / formattedTotalLiquidity) * 100 * 100,
          ) / 100;

    setPoolShare(Math.round(newPoolShare * 100) / 100);
  }

  function handleConfirmSupplyClick() {
    if (!token || !chain) {
      return;
    }

    if (token[chain.chainId].address === NATIVE_ADDRESS) {
      increaseNativeLiquidityMutation(
        {
          positionId: BigNumber.from(positionId),
        },
        {
          onSuccess: onIncreaseLiquiditySuccess,
        },
      );
    } else {
      increaseLiquidityMutation(
        {
          positionId: BigNumber.from(positionId),
          amount: BigNumber.from(liquidityIncreaseAmount),
        },
        {
          onSuccess: onIncreaseLiquiditySuccess,
        },
      );
    }
  }

  function onIncreaseLiquiditySuccess() {
    console.log('onIncreaseLiquiditySuccess');
  }

  return (
    <article className="my-24 rounded-10 bg-white p-12.5 pt-2.5">
      <header className="relative mt-6 mb-12 flex items-center justify-center border-b px-10 pb-6">
        <div className="absolute left-0">
          <button
            className="flex items-center rounded text-hyphen-gray-400"
            onClick={() => navigate(-1)}
          >
            <HiArrowSmLeft className="h-5 w-auto" />
          </button>
        </div>

        <h2 className="text-xl text-hyphen-purple">Increase Liquidity</h2>

        <div className="absolute right-0 flex">
          <button className="mr-4 text-xs text-hyphen-purple">Clear All</button>
        </div>
      </header>

      <AssetOverview positionId={BigNumber.from(positionId)} />

      <section className="mt-8 grid grid-cols-2">
        <div className="max-h-84 h-84 border-r pr-12.5 pt-9">
          <div className="mb-9">
            <ProgressBar
              currentProgress={formattedTotalLiquidity}
              totalProgress={formattedTokenTotalCap}
            />
            <div className="mt-1 flex justify-between text-xxs font-bold uppercase text-hyphen-gray-300">
              <span>Pool cap</span>
              <span>
                {makeNumberCompact(formattedTotalLiquidity) || '...'}{' '}
                {token?.symbol} /{' '}
                {makeNumberCompact(formattedTokenTotalCap) || '...'}{' '}
                {token?.symbol}
              </span>
            </div>
          </div>

          <label
            htmlFor="liquidityIncreaseAmount"
            className="flex justify-between px-5 text-xxs font-bold uppercase"
          >
            <span className="text-hyphen-gray-400">Input</span>
            <span className="flex items-center text-hyphen-gray-300">
              Balance:{' '}
              {walletBalance ? (
                walletBalance
              ) : (
                <Skeleton
                  baseColor="#615ccd20"
                  enableAnimation={!!walletBalance}
                  highlightColor="#615ccd05"
                  className="!mx-1 !w-11"
                />
              )}{' '}
              {token?.symbol}
              <button
                className="ml-2 flex h-4 items-center rounded-full bg-hyphen-purple px-1.5 text-xxs text-white"
                onClick={handleMaxButtonClick}
                disabled={!canUserInteract}
              >
                MAX
              </button>
            </span>
          </label>

          <input
            id="liquidityIncreaseAmount"
            placeholder="0.000"
            type="number"
            inputMode="decimal"
            className="mt-2 mb-6 h-15 w-full rounded-2.5 border bg-white px-4 py-2 font-mono text-2xl text-hyphen-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200"
            value={liquidityIncreaseAmount}
            onChange={handleLiquidityAmountChange}
            disabled={!canUserInteract}
          />

          <StepSlider
            disabled={!canUserInteract}
            dots
            onChange={handleSliderChange}
            step={25}
            value={sliderValue}
          />

          <button
            className="mt-9 mb-2.5 h-15 w-full rounded-2.5 bg-hyphen-purple font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-hyphen-gray-300"
            disabled={!canUserInteract}
            onClick={handleConfirmSupplyClick}
          >
            {!walletBalance
              ? 'Getting Your Balance'
              : increaseLiquidityLoading || increaseNativeLiquidityLoading
              ? 'Increasing Liquidity'
              : 'Confirm Supply'}
          </button>
        </div>
        <div className="max-h-84 flex h-84 flex-col justify-between pl-12.5 pt-3">
          <div className="grid grid-cols-2">
            <div className="flex flex-col">
              <span className="pl-5 text-xxs font-bold uppercase text-hyphen-gray-400">
                Updated pool share
              </span>
              <div className="mt-2 flex h-15 items-center rounded-2.5 bg-hyphen-purple bg-opacity-10 px-5 font-mono text-2xl text-hyphen-gray-400">
                {poolShare || '...'}%
              </div>
            </div>
          </div>
          <LiquidityInfo />
        </div>
      </section>
    </article>
  );
}

export default IncreaseLiquidity;
