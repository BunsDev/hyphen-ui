import styles from './Voucher.module.css';

interface IVoucherProps {
  id: number;
  title: string;
  description: string;
  redeem: (id: number) => void;
}

function Voucher({ id, title, description, redeem }: IVoucherProps) {
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
          <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
          <p className="mb-4 text-center text-xs text-white">{description}</p>
        </div>
        <button
          className={styles.voucherRedeemButton}
          onClick={() => redeem(id)}
        >
          Redeem
        </button>
      </div>
    </div>
  );
}

export default Voucher;
