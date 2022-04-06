import ProgressBar from 'components/ProgressBar';
import { HiArrowSmLeft, HiOutlineXCircle } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import LiquidityPositionOverview from '../LiquidityPositionOverview';
import StepSlider from '../StepSlider';
import collectFeesIcon from '../../../../assets/images/collect-fees-icon.svg';
import LiquidityInfo from '../LiquidityInfo';
import { BigNumber, ethers } from 'ethers';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import useLPToken from 'hooks/contracts/useLPToken';
import useLiquidityProviders from 'hooks/contracts/useLiquidityProviders';
import tokens from 'config/tokens';
import useWhitelistPeriodManager from 'hooks/contracts/useWhitelistPeriodManager';
import { makeNumberCompact } from 'utils/makeNumberCompact';
import { chains } from 'config/chains';
import { useState } from 'react';
import { useNotifications } from 'context/Notifications';
import { useWalletProvider } from 'context/WalletProvider';
import Skeleton from 'react-loading-skeleton';
import switchNetwork from 'utils/switchNetwork';

function ManagePosition() {
  const navigate = useNavigate();
  const { chainId, positionId } = useParams();
  const queryClient = useQueryClient();

  const { connect, currentChainId, isLoggedIn, walletProvider } =
    useWalletProvider()!;
  const { addTxNotification } = useNotifications()!;

  const chain = chainId
    ? chains.find(chainObj => {
        return chainObj.chainId === Number.parseInt(chainId);
      })!
    : undefined;

  const { getPositionMetadata } = useLPToken(chain);
  const { claimFee, getTokenAmount, getTotalLiquidity, removeLiquidity } =
    useLiquidityProviders(chain);
  const { getTokenTotalCap } = useWhitelistPeriodManager(chain);

  const [liquidityRemovalAmount, setLiquidityRemovalAmount] =
    useState<string>('');
  const [sliderValue, setSliderValue] = useState<number>(0);

  const {
    data: positionMetadata,
    isError: positionMetadataError,
    isLoading: isPositionMetadataLoading,
  } = useQuery(
    ['positionMetadata', positionId],
    () => getPositionMetadata(BigNumber.from(positionId)),
    {
      // Execute only when positionid is available.
      enabled: !!positionId,
    },
  );

  const [tokenAddress, suppliedLiquidity, shares] = positionMetadata || [];

  const token =
    chainId && tokenAddress
      ? tokens.find(tokenObj => {
          return (
            tokenObj[Number.parseInt(chainId)]?.address.toLowerCase() ===
            tokenAddress.toLowerCase()
          );
        })
      : null;

  const tokenDecimals =
    chainId && token ? token[Number.parseInt(chainId)].decimal : null;

  const { data: totalLiquidity, isError: totalLiquidityError } = useQuery(
    ['totalLiquidity', tokenAddress],
    () => getTotalLiquidity(tokenAddress),
    {
      // Execute only when tokenAddress is available.
      enabled: !!tokenAddress,
    },
  );

  const { data: tokenAmount, isError: tokenAmountError } = useQuery(
    ['tokenAmount', { shares, tokenAddress }],
    () => getTokenAmount(shares, tokenAddress),
    {
      // Execute only when shares & tokenAddress is available.
      enabled: !!(shares && tokenAddress),
    },
  );

  const { data: tokenTotalCap, isError: tokenTotalCapError } = useQuery(
    ['tokenTotalCap', tokenAddress],
    () => getTokenTotalCap(tokenAddress),
    {
      // Execute only when tokenAddress is available.
      enabled: !!tokenAddress,
    },
  );

  const {
    isError: removeLiquidityError,
    isLoading: removeLiquidityLoading,
    mutate: removeLiquidityMutation,
  } = useMutation(
    async ({
      positionId,
      amount,
    }: {
      positionId: BigNumber;
      amount: BigNumber;
    }) => {
      const removeLiquidityTx = await removeLiquidity(positionId, amount);
      addTxNotification(
        removeLiquidityTx,
        'Remove liquidity',
        `${chain?.explorerUrl}/tx/${removeLiquidityTx.hash}`,
      );
      return await removeLiquidityTx.wait(1);
    },
  );

  const {
    isError: claimFeeError,
    isLoading: claimFeeLoading,
    mutate: claimFeeMutation,
  } = useMutation(async ({ positionId }: { positionId: BigNumber }) => {
    const claimFeeTx = await claimFee(positionId);
    addTxNotification(
      claimFeeTx,
      'Claim fee',
      `${chain?.explorerUrl}/tx/${claimFeeTx.hash}`,
    );
    return await claimFeeTx.wait(1);
  });

  const formattedSuppliedLiquidity =
    suppliedLiquidity && tokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(suppliedLiquidity, tokenDecimals),
        )
      : 0;

  const formattedTokenAmount =
    tokenAmount && tokenDecimals
      ? Number.parseFloat(ethers.utils.formatUnits(tokenAmount, tokenDecimals))
      : 0;

  const formattedTotalLiquidity =
    totalLiquidity && tokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(totalLiquidity, tokenDecimals),
        )
      : 0;

  const formattedTokenTotalCap =
    tokenTotalCap && tokenDecimals
      ? Number.parseFloat(
          ethers.utils.formatUnits(tokenTotalCap, tokenDecimals),
        )
      : 0;

  const unclaimedFees =
    formattedTokenAmount && formattedSuppliedLiquidity
      ? formattedTokenAmount - formattedSuppliedLiquidity
      : 0;

  // Check if there's an error in queries or mutations.
  const isError =
    positionMetadataError ||
    totalLiquidityError ||
    tokenAmountError ||
    tokenTotalCapError ||
    removeLiquidityError ||
    claimFeeError;

  const isDataLoading =
    !isLoggedIn ||
    isPositionMetadataLoading ||
    removeLiquidityLoading ||
    claimFeeLoading;

  if (isError) {
    return (
      <article className="mb-2.5 rounded-10 bg-white p-2.5">
        <section className="flex items-center justify-center px-[1.875rem] pt-16 pb-24">
          <HiOutlineXCircle className="mr-4 h-6 w-6 text-red-400" />
          <p className="text-hyphen-gray-400">
            {removeLiquidityError
              ? 'Something went wrong while removing liquidity, please try again later.'
              : claimFeeError
              ? 'Something went wrong while claiming fees, please try again later.'
              : 'We could not get the necessary information, please try again later.'}
          </p>
        </section>
      </article>
    );
  }

  const isRemovalAmountGtSuppliedLiquidity =
    Number.parseFloat(liquidityRemovalAmount) > formattedSuppliedLiquidity;

  function reset() {
    setLiquidityRemovalAmount('');
    setSliderValue(0);
  }

  function handleNetworkChange() {
    if (!walletProvider || !chain) return;
    switchNetwork(walletProvider, chain);
  }

  function handleIncreaseLiquidity() {
    navigate(`../increase-liquidity/${chainId}/${positionId}`);
  }

  function handleLiquidityAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const regExp = /^((\d+)?(\.\d{0,3})?)$/;
    const newLiquidityRemovalAmount = e.target.value;
    const isInputValid = regExp.test(newLiquidityRemovalAmount);

    if (isInputValid) {
      setLiquidityRemovalAmount(newLiquidityRemovalAmount);
    }
  }

  function handleSliderChange(value: number) {
    setSliderValue(value);

    if (value === 0) {
      setLiquidityRemovalAmount('');
    } else if (formattedSuppliedLiquidity) {
      const newLiquidityRemovalAmount = (
        Math.trunc(formattedSuppliedLiquidity * (value / 100) * 1000) / 1000
      ).toString();
      setLiquidityRemovalAmount(newLiquidityRemovalAmount);
    }
  }

  function handleMaxButtonClick() {
    if (formattedSuppliedLiquidity) {
      setSliderValue(100);
      setLiquidityRemovalAmount(
        (Math.trunc(formattedSuppliedLiquidity * 1000) / 1000).toString(),
      );
    }
  }

  function handleConfirmRemovalClick() {
    if (liquidityRemovalAmount && tokenDecimals) {
      removeLiquidityMutation(
        {
          positionId: BigNumber.from(positionId),
          amount: ethers.utils.parseUnits(
            liquidityRemovalAmount,
            tokenDecimals,
          ),
        },
        {
          onSuccess: onRemoveLiquiditySuccess,
        },
      );
    }
  }

  function handleClaimFeeClick() {
    if (unclaimedFees <= 0) return;

    claimFeeMutation(
      {
        positionId: BigNumber.from(positionId),
      },
      {
        onSuccess: onRemoveLiquiditySuccess,
      },
    );
  }

  function onRemoveLiquiditySuccess() {
    queryClient.invalidateQueries();
    reset();
  }

  return (
    <article className="my-12 rounded-10 bg-white p-0 py-2 xl:my-24 xl:p-12.5 xl:pt-2.5">
      <header className="mt-6 mb-8 grid grid-cols-[2.5rem_1fr_1fr] items-center border-b px-10 pb-6 xl:mb-12 xl:grid-cols-3 xl:p-0 xl:pb-6">
        <div>
          <button
            className="flex items-center rounded text-hyphen-gray-400"
            onClick={() => navigate('/pools')}
          >
            <HiArrowSmLeft className="h-5 w-auto" />
          </button>
        </div>

        <h2 className="justify-self-start text-sm text-hyphen-purple xl:justify-self-center xl:text-xl">
          Manage Position
        </h2>

        <div className="justify-self-end">
          <button className="text-xs text-hyphen-purple" onClick={reset}>
            Clear All
          </button>
        </div>
      </header>

      {chainId ? (
        <div className="px-2.5 xl:px-0">
          <LiquidityPositionOverview
            chainId={Number.parseInt(chainId)}
            positionId={BigNumber.from(positionId)}
          />
        </div>
      ) : null}

      <section className="mt-4 grid grid-cols-1 px-10 xl:mt-8 xl:grid-cols-2 xl:px-0">
        <div className="xl:max-h-100 mb-12 pt-9 xl:mb-0 xl:h-100 xl:border-r xl:pr-12.5">
          <div className="mb-8 hidden xl:block">
            <ProgressBar
              currentProgress={formattedTotalLiquidity}
              totalProgress={formattedTokenTotalCap}
            />
            <div className="mt-1 flex justify-between text-xxs font-bold uppercase text-hyphen-gray-300">
              <span>Pool cap</span>
              <span className="flex">
                <>
                  {makeNumberCompact(formattedTotalLiquidity)} {token?.symbol} /{' '}
                  {makeNumberCompact(formattedTokenTotalCap)} {token?.symbol}
                </>
              </span>
            </div>
          </div>

          <div className="relative mb-6">
            <label
              htmlFor="liquidityRemovalAmount"
              className="mb-2 flex justify-between px-5 text-xxxs font-bold uppercase xl:text-xxs"
            >
              <span className="text-hyphen-gray-400">Input</span>
              <span className="flex items-center text-hyphen-gray-300">
                Liquidity: {formattedSuppliedLiquidity} {token?.symbol}
              </span>
            </label>

            <input
              id="liquidityRemovalAmount"
              placeholder="0.000"
              type="number"
              inputMode="decimal"
              className="h-15 w-full rounded-2.5 border bg-white px-4 py-2 font-mono text-sm text-hyphen-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200 xl:text-2xl"
              value={liquidityRemovalAmount}
              onChange={handleLiquidityAmountChange}
              disabled={isDataLoading}
            />

            <button
              className="absolute right-[18px] top-[42px] flex h-4 items-center rounded-full bg-hyphen-purple px-1.5 text-xxs text-white xl:top-[45px]"
              onClick={handleMaxButtonClick}
              disabled={isDataLoading}
            >
              MAX
            </button>
          </div>

          <StepSlider
            dots
            onChange={handleSliderChange}
            step={25}
            value={sliderValue}
            disabled={isDataLoading}
          />

          {isLoggedIn ? (
            <>
              {currentChainId === chain?.chainId ? (
                <button
                  className="mt-11 mb-2.5 h-15 w-full rounded-2.5 bg-hyphen-purple font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-hyphen-gray-300"
                  disabled={
                    isDataLoading ||
                    liquidityRemovalAmount === '' ||
                    Number.parseFloat(liquidityRemovalAmount) === 0 ||
                    isRemovalAmountGtSuppliedLiquidity
                  }
                  onClick={handleConfirmRemovalClick}
                >
                  {isRemovalAmountGtSuppliedLiquidity
                    ? 'Amount more than supplied liquidity'
                    : liquidityRemovalAmount === '' ||
                      Number.parseFloat(liquidityRemovalAmount) === 0
                    ? 'Enter Amount'
                    : removeLiquidityLoading
                    ? 'Removing Liquidity'
                    : 'Confirm Removal'}
                </button>
              ) : (
                <button
                  className="mt-11 mb-2.5 h-15 w-full rounded-2.5 bg-hyphen-purple font-semibold text-white"
                  onClick={handleNetworkChange}
                >
                  Switch to {chain?.name}
                </button>
              )}
            </>
          ) : (
            <button
              className="mt-10 mb-2.5 h-15 w-full rounded-2.5 bg-hyphen-purple font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-hyphen-gray-300"
              onClick={connect}
            >
              Connect Your Wallet
            </button>
          )}
          <button
            className="h-15 w-full rounded-2.5 border-2 border-hyphen-purple font-semibold text-hyphen-purple hover:bg-hyphen-purple hover:text-white"
            onClick={handleIncreaseLiquidity}
            disabled={isDataLoading}
          >
            + Increase Liquidity
          </button>
        </div>
        <div className="xl:max-h-100 xl:h-100 xl:pt-1 xl:pl-12.5">
          <label
            htmlFor="unclaimedFees"
            className="pl-5 text-xxxs font-bold uppercase text-hyphen-gray-400 xl:text-xxs"
          >
            Unclaimed Fees
          </label>
          <div className="mt-2 mb-8 flex h-15 items-center rounded-2.5 bg-hyphen-purple bg-opacity-10 px-5 font-mono text-sm text-hyphen-gray-400 xl:text-2xl">
            {unclaimedFees > 0 ? unclaimedFees.toFixed(5) : 0} {token?.symbol}
          </div>

          {isLoggedIn ? (
            <>
              {currentChainId === chain?.chainId ? (
                <button
                  className="mb-[3.125rem] flex h-15 w-full items-center justify-center rounded-2.5 bg-hyphen-purple font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-hyphen-gray-300"
                  disabled={isDataLoading || unclaimedFees <= 0}
                  onClick={handleClaimFeeClick}
                >
                  {unclaimedFees <= 0 ? (
                    'No fees to claim'
                  ) : claimFeeLoading ? (
                    'Claiming Fees'
                  ) : (
                    <>
                      <img
                        src={collectFeesIcon}
                        alt="Collect fees"
                        className="mr-1"
                      />
                      Collect Fees
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="mb-[3.125rem] h-15 w-full rounded-2.5 bg-hyphen-purple font-semibold text-white"
                  onClick={handleNetworkChange}
                >
                  Switch to {chain?.name}
                </button>
              )}
            </>
          ) : (
            <button
              className="mt-10 mb-2.5 h-15 w-full rounded-2.5 bg-hyphen-purple font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-hyphen-gray-300"
              onClick={connect}
            >
              Connect Your Wallet
            </button>
          )}

          <LiquidityInfo />
        </div>
      </section>
    </article>
  );
}

export default ManagePosition;
