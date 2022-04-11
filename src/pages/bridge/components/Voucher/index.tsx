import styles from './Voucher.module.css';

function Voucher() {
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
        <h3 className="mb-2 text-base font-semibold text-white">Game Night</h3>
        <p className="mb-4 text-center text-xs text-white">
          Chill with the Biconomy team during one of their game nights. Chat,
          have fun and have a jolly good time!
        </p>
        <button className={styles.voucherRedeemButton}>Redeem</button>
      </div>
    </div>
  );
}

export default Voucher;
