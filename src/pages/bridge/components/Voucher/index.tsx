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
interface IVoucherProps {
  voucher: IVoucher;
  redeem: (voucher: IVoucher) => void;
  userLoyalityScore: number;
}

function Voucher({ voucher, redeem, userLoyalityScore }: IVoucherProps) {
  const { milestoneDesc, milestoneTitle, thresholdLoyalityScore } = voucher;

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
          <p className="mb-4 text-center text-xs text-white">{milestoneDesc}</p>
        </div>
        <button
          className={styles.voucherRedeemButton}
          onClick={() => redeem(voucher)}
          disabled={userLoyalityScore < thresholdLoyalityScore}
        >
          {userLoyalityScore >= thresholdLoyalityScore
            ? 'Redeem'
            : `Unlocks at ${thresholdLoyalityScore}`}
        </button>
      </div>
    </div>
  );
}

export default Voucher;
