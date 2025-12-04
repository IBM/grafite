'use client';
import { Button, InlineLoading } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import styles from './login.module.scss';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { APP_NAME, AUTH_PROVIDER } from '@utils/constants';

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    signIn(AUTH_PROVIDER);
  }, []);

  return (
    <section className={styles.wrapper}>
      <div className={styles.title}>Welcome to {APP_NAME}!</div>
      {isLoading ? (
        <InlineLoading
          className={styles.loading}
          status="active"
          iconDescription="Loading"
          description="Signing in..."
        />
      ) : (
        <div className={styles.btnWrapper}>
          <Button renderIcon={ArrowRight} onClick={() => signIn(AUTH_PROVIDER)}>
            Sign in
          </Button>
        </div>
      )}
    </section>
  );
}
