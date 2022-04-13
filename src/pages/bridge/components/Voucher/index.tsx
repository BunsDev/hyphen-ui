import { HiLockClosed, HiOutlineCheck } from 'react-icons/hi';
import styles from './Voucher.module.css';

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
  redeem: (voucher: IVoucher) => void;
  userLoyalityScore: number;
  voucher: IVoucher;
  voucherMetadata: IVoucherMetadata;
}

function Voucher({
  redeem,
  userLoyalityScore,
  voucher,
  voucherMetadata,
}: IVoucherProps) {
  const { milestoneDesc, milestoneTitle, thresholdLoyalityScore } = voucher;
  const { availed, availedFreeTransactions, assignedFreeTransactions } =
    voucherMetadata ?? {};

  return (
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
            {assignedFreeTransactions
              ? `- (${assignedFreeTransactions} transactions remaining)`
              : ''}
          </p>
        </div>
        <button
          className={styles.voucherRedeemButton}
          onClick={() => redeem(voucher)}
          disabled={availed || userLoyalityScore < thresholdLoyalityScore}
        >
          {availed ? (
            <div className="flex items-center justify-center">
              <HiOutlineCheck className="mr-2" />
              Redeemed
            </div>
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
  );
}

export default Voucher;
