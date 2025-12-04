'use client';

import { Button, Theme } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { useThemePreference } from '@components/ThemePreference';
import { Fragment, useCallback, useState } from 'react';
import { v4 as uuid } from 'uuid';

import AdditionalParameterForm from './AdditionalParameterForm';
import styles from './AdditionalParameters.module.scss';
import { AdditionalParameter, AdditionalParameterValue } from './utils';

interface Props {
  additionalParameters: AdditionalParameter[];
  setAdditionalParameters: (value: AdditionalParameter[]) => void;
  manageValidationError: (hasError: boolean, identifier: string) => void;
}

const AdditionalParameters = ({
  additionalParameters: defaultValue,
  setAdditionalParameters: updateAdditionalParameters,
  manageValidationError,
}: Props) => {
  const { theme } = useThemePreference();
  const temporaryFieldTheme = theme === 'g100' ? 'g90' : 'g10';

  const [additionalParameters, setAdditionalParameters] = useState<(AdditionalParameter & { id: string })[]>(
    defaultValue.map((d) => ({ ...d, id: uuid() })),
  );

  const addNewParam = useCallback(() => {
    const id = uuid();
    manageValidationError(true, id); // to avoid empty name
    setAdditionalParameters((prev) => [...prev, { id, name: '', value: '', valueType: 'Number' }]);
  }, [manageValidationError]);

  const getAdditionalParameter = useCallback(
    (id?: string) => {
      return additionalParameters?.find((d) => d.id === id);
    },
    [additionalParameters],
  );

  const setAdditionalParameter = useCallback(
    (id: string, value: AdditionalParameterValue) => {
      const key = Object.keys(value)[0] as keyof AdditionalParameterValue;
      const newValue = value[key as keyof AdditionalParameterValue];
      setAdditionalParameters((prev) => {
        const target = prev?.find((d) => d.id === id);
        if (target)
          target[key as keyof AdditionalParameterValue] = newValue as 'Number' | 'String' | 'Boolean' | 'List, object';

        updateAdditionalParameters([...prev]);
        return prev;
      });
    },
    [updateAdditionalParameters],
  );

  const removeAdditionalParameter = useCallback(
    (id: string) => {
      manageValidationError(false, id);
      setAdditionalParameters((prev) => {
        const updatedValues = prev.filter((d) => d.id !== id);
        updateAdditionalParameters([...updatedValues]);
        return updatedValues;
      });
    },
    [manageValidationError, updateAdditionalParameters],
  );

  const isNameExist = useCallback(
    (id: string, name: string) => {
      const selectedNames = additionalParameters.filter((d) => d.id !== id)?.map((d) => d.name);
      return selectedNames.includes(name);
    },
    [additionalParameters],
  );

  return (
    <>
      <div className={styles.additionalParametersHeader}>
        <h4>Custom Parameters</h4>
        <Button kind="ghost" renderIcon={Add} size="md" onClick={addNewParam}>
          Add parameter
        </Button>
      </div>
      <Theme theme={temporaryFieldTheme}>
        {additionalParameters.map(({ id }, i) => (
          <Fragment key={`custom-param-${i}`}>
            <AdditionalParameterForm
              id={id}
              getAdditionalParameter={getAdditionalParameter}
              setAdditionalParameter={setAdditionalParameter}
              removeAdditionalParameter={removeAdditionalParameter}
              manageValidationError={manageValidationError}
              isNameExist={isNameExist}
            />
          </Fragment>
        ))}
        {!additionalParameters?.length && <span className={styles.info}>Add other parameters not listed above</span>}
      </Theme>
    </>
  );
};

export default AdditionalParameters;
