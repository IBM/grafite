'use client';

import { Theme } from '@carbon/react';
import { useThemePreference } from '@components/ThemePreference';
import { Fragment, useCallback, useState } from 'react';

import AdditionalParameters from './AdditionalParameters';
import DefaultParameterControl from './DefaultParameterControl';
import styles from './Parameters.module.scss';
import { AdditionalParameter, DefaultParameters } from './utils';

interface Props {
  parameters: DefaultParameters;
  additionalParameters: AdditionalParameter[];
  setParameters: (value: { [key in keyof DefaultParameters]: number }) => void;
  setAdditionalParameters: (value: AdditionalParameter[]) => void;
  thinking: { enabled: boolean; on: boolean };
  setThinking: (value: { enabled: boolean; on: boolean }) => void;
  manageValidationError: (hasError: boolean, identifier: string) => void;
}

export const Parameters = ({
  parameters,
  additionalParameters,
  setParameters,
  setAdditionalParameters,
  thinking,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setThinking,
  manageValidationError,
}: Props) => {
  const { theme } = useThemePreference();
  const temporaryFieldTheme = theme === 'g100' ? 'g90' : 'g10';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [thinkingEnabled, setThinkingEnabled] = useState(!!thinking.enabled);

  const updateParameter = useCallback(
    (key: keyof DefaultParameters, value: number) => {
      setParameters({ [key]: value } as DefaultParameters);
    },
    [setParameters],
  );

  const fields: { label: string; valueKey: keyof DefaultParameters; max?: number; min?: number; step: number }[] = [
    {
      label: 'Temperature (0 - 2.00)',
      valueKey: 'temperature',
      max: 2,
      min: 0,
      step: 0.01,
    },
    {
      label: 'Top P - nucleus sampling (0.01 - 1.00)',
      valueKey: 'topP',
      max: 1,
      min: 0.01,
      step: 0.01,
    },
    {
      label: 'Frequency penalty (-2.00 - 2.00)',
      valueKey: 'frequencyPenalty',
      max: 2,
      min: -2,
      step: 0.01,
    },
    {
      label: 'Presence penalty (-2.00 - 2.00)',
      valueKey: 'presencePenalty',
      max: 2,
      min: -2,
      step: 0.01,
    },
    {
      label: 'Max tokens',
      valueKey: 'maxTokens',
      step: 1,
    },
  ];

  return (
    <div className={styles.root}>
      <h4 className={styles.parametersTitle}>Parameters</h4>
      <Theme theme={temporaryFieldTheme}>
        <div className={styles.defaultParameters}>
          {fields.map((field) => (
            <Fragment key={field.valueKey}>
              <DefaultParameterControl
                {...field}
                defaultValue={parameters[field.valueKey]}
                updateParameter={updateParameter}
                manageValidationError={manageValidationError}
              />
            </Fragment>
          ))}
        </div>
      </Theme>
      {/* <div className={styles.thinking}>
        <Toggle
          size="sm"
          id="enable-thinking"
          labelA="Use thinking"
          labelB="Use thinking"
          toggled={thinkingEnabled}
          onToggle={(value: boolean) => {
            setThinkingEnabled(value);
            setThinking({ enabled: value, on: false });
          }}
        />
        {thinkingEnabled && (
          <div className={styles.thinkingCheckbox}>
            <Checkbox
              labelText="thinking"
              id="thinking"
              onChange={(
                _e: ChangeEvent<HTMLInputElement>,
                data: {
                  checked: boolean;
                  id: string;
                },
              ) => {
                setThinking({ enabled: true, on: data.checked });
              }}
            />
            <span className={styles.warning}>
              <Warning /> Ignored if not supported by the model
            </span>
          </div>
        )}
      </div> */}
      <AdditionalParameters
        additionalParameters={additionalParameters}
        setAdditionalParameters={setAdditionalParameters}
        manageValidationError={manageValidationError}
      />
    </div>
  );
};
