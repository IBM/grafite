import { ComboBox, DropdownSkeleton, OnChangeData, RadioButton, RadioButtonGroup, TextInput } from '@carbon/react';
import { useWxModelContext } from '@components/WxModelContext';
import { ChangeEvent } from 'react';

import styles from './ModelInformation.module.scss';
import { WarningFilled } from '@carbon/react/icons';

type ModelInformationFieldsProps = {
  service: 'watsonx' | 'ollama';
  modelId: string | null;
  setModelId: (value: string | null) => void;
  onServiceChange: (service: 'watsonx' | 'ollama') => void;
};

export const ModelInformation = ({ service, modelId, setModelId, onServiceChange }: ModelInformationFieldsProps) => {
  const { wxModels, loading } = useWxModelContext();

  return (
    <div className={styles.modelInformationFields}>
      <RadioButtonGroup
        valueSelected={service}
        legendText="Service"
        name="radio-button-service-group"
        onChange={(selection: string | number | undefined) => onServiceChange(selection as 'ollama' | 'watsonx')}
        className={styles.radioGroup}
      >
        <RadioButton id="ollama" labelText="Ollama" value="ollama" />
        <RadioButton id="watsonx" labelText="WatsonX" value="watsonx" />
      </RadioButtonGroup>
      {service === 'watsonx' ? (
        <>
          {loading ? (
            <DropdownSkeleton />
          ) : (
            <>
              <ComboBox
                items={wxModels?.current ?? []}
                id="test-running-model-id"
                titleText="Test Model ID"
                onChange={(data: OnChangeData<string | null | undefined>) => {
                  const { selectedItem } = data;
                  setModelId(selectedItem ?? null);
                }}
                selectedItem={modelId}
                autoAlign
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                shouldFilterItem={(menu: any) => {
                  return menu?.item?.toLowerCase().includes(menu?.inputValue?.toLowerCase());
                }}
                disabled={wxModels.current.length === 0}
              />
              {wxModels.current.length === 0 && (
                <div className={styles.missingWxWarning}>
                  <WarningFilled />
                  <span>To run tests using WatsonX, WX_API_KEY and WX_ENDPOINT environment variables are required</span>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <TextInput
            placeholder="granite4:small-h"
            id="ollama-model-id"
            labelText="Test Model ID"
            defaultValue={modelId ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setModelId(e.target.value);
            }}
          />
        </>
      )}
    </div>
  );
};
