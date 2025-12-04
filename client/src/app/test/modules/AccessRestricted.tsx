import { Button } from '@carbon/react';
import styles from '../new-test.module.scss';
import { useRouter } from 'next/navigation';

const AccessRestricted = () => {
  const router = useRouter();

  return (
    <div className={styles.access}>
      <div className={styles.icon}>!</div>
      <div className={styles.title}>Access Restricted</div>
      <div className={styles.body}>You&apos;re trying to edit the test created by another user.</div>
      <Button
        size="md"
        onClick={() => {
          router.replace('/');
        }}
      >
        Go back to home
      </Button>
    </div>
  );
};

export default AccessRestricted;
