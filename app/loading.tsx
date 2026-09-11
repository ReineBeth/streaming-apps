import styles from "./state.module.css";

export default function Loading() {
  return (
    <main className={styles.page} aria-busy="true" aria-label="Chargement de la page">
      <div className={styles.skeleton}>
        <div className={styles.skeletonLine} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
        <div className={styles.skeletonGrid} aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => <div className={styles.skeletonCard} key={index} />)}
        </div>
      </div>
    </main>
  );
}
