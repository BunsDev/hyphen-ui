import CustomTooltip from 'components/CustomTooltip';
import { useChains } from 'context/Chains';
import { useTransaction } from 'context/Transaction';
import useModal from 'hooks/useModal';
import { HiLockClosed, HiOutlineCheck } from 'react-icons/hi';
import styles from './Voucher.module.css';
import VoucherFormModal from './VoucherFormModal';

export interface IVoucher {
  chainExcluded?: string[];
  contractCall: boolean;
  freeTransactions: number;
  isActive: boolean;
  milestoneCode: number;
  milestoneDesc: string;
  milestoneTitle: string;
  thresholdLoyalityScore: number;
}

export interface IVoucherMetadata {
  availed: boolean;
  availedFreeTransactions?: number;
  assignedFreeTransactions?: number;
}

interface IVoucherProps {
  handleFreeTxRedeem: (voucher: IVoucher) => void;
  userLoyalityScore: number;
  voucher: IVoucher;
  voucherMetadata: IVoucherMetadata;
}

function Voucher({
  handleFreeTxRedeem,
  userLoyalityScore,
  voucher,
  voucherMetadata,
}: IVoucherProps) {
  const { toChain } = useChains()!;
  const { voucherToRedeem } = useTransaction()!;
  const {
    chainExcluded,
    contractCall,
    milestoneCode,
    milestoneDesc,
    milestoneTitle,
    thresholdLoyalityScore,
  } = voucher;
  const { availed, availedFreeTransactions, assignedFreeTransactions } =
    voucherMetadata ?? {};
  const isToChainExcluded = toChain
    ? chainExcluded?.includes(toChain.chainId.toString())
    : false;

  const {
    isVisible: isVoucherFormModalVisible,
    hideModal: hideVoucherFormModal,
    showModal: showVoucherFormModal,
  } = useModal();

  function handleRedeem() {
    if (contractCall) {
      handleFreeTxRedeem(voucher);
    } else {
      showVoucherFormModal();
    }
  }

  return (
    <>
      {isVoucherFormModalVisible ? (
        <VoucherFormModal
          isVisible={isVoucherFormModalVisible}
          onClose={hideVoucherFormModal}
          voucherCode={milestoneCode}
        />
      ) : null}
      <div className={styles.voucher}>
        <div className={styles.voucherLogoContainer}>
          <img
            src={`${process.env.PUBLIC_URL}/hyphen-logo-small.svg`}
            className={styles.voucherLogo}
            alt="Hyphen voucher"
          />
        </div>

        <div className={styles.voucherDescription}>
          <div className="flex flex-col items-center">
            <h3 className="mb-2 text-base font-semibold text-white">
              {milestoneTitle}
            </h3>
            <p className="mb-4 text-center text-xs text-white">
              {milestoneDesc}{' '}
              {assignedFreeTransactions && availedFreeTransactions
                ? `- (${
                    assignedFreeTransactions - availedFreeTransactions
                  } transactions remaining)`
                : ''}
            </p>
          </div>
          <button
            className={styles.voucherRedeemButton}
            onClick={handleRedeem}
            disabled={
              (contractCall && !toChain ? true : false) ||
              isToChainExcluded ||
              availed ||
              userLoyalityScore < thresholdLoyalityScore
            }
          >
            {voucherToRedeem === milestoneCode ? (
              'Cancel Redemption'
            ) : availed ? (
              <div className="flex items-center justify-center">
                <HiOutlineCheck className="mr-2" />
                Redeemed
              </div>
            ) : contractCall && !toChain ? (
              'Select destination chain'
            ) : isToChainExcluded ? (
              'Destination chain unsupported'
            ) : userLoyalityScore >= thresholdLoyalityScore ? (
              'Redeem'
            ) : (
              <div className="flex items-center justify-center">
                <HiLockClosed className="mr-2" />
                Unlocks at {thresholdLoyalityScore}
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default Voucher;
