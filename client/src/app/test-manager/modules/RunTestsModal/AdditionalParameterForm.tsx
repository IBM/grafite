'use client';

import { FluidDropdown, FluidTextInput, IconButton, OnChangeData } from '@carbon/react';
import { Close } from '@carbon/react/icons';
import { ChangeEvent, useCallback, useRef, useState } from 'react';

import styles from './AdditionalParameterForm.module.scss';
import { AdditionalParameter, AdditionalParameterValue } from './utils';

interface Props {
  id: string;
  getAdditionalParameter: (id: string) => (AdditionalParameter & { id: string }) | undefined;
  setAdditionalParameter: (id: string, value: AdditionalParameterValue) => void;
  removeAdditionalParameter: (id: string) => void;
  manageValidationError: (hasError: boolean, identifier: string) => void;
  isNameExist: (id: string, name: string) => boolean;
}

const AdditionalParameterForm = ({
  id,
  isNameExist,
  getAdditionalParameter,
  setAdditionalParameter,
  removeAdditionalParameter,
  manageValidationError,
}: Props) => {
  const additionalParamNames = [
    'max_completion_tokens',
    'top_k',
    'min_p',
    'length_penalty',
    'stop_token_ids',
    'include_stop_str_in_output',
    'ignore_eos',
    'min_tokens',
    'stop_sequences',
    'random_seed',
  ];
  const [valueError, setValueError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onNameChange = (e: OnChangeData<unknown>) => {
    const { selectedItem } = e;
    const error = validateName(selectedItem as string);
    manageValidationError(!!error, id);
    setAdditionalParameter(id, { name: selectedItem } as AdditionalParameterValue);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const value = e.target.value;
    debounceRef.current = setTimeout(() => {
      updateValue(value);
    }, 500);
  };

  const onTypeChange = ({ selectedItem }: { selectedItem: AdditionalParameter['valueType'] }) => {
    setAdditionalParameter(id, { valueType: selectedItem } as AdditionalParameterValue);
    const params = getAdditionalParameter(id);
    if (params) {
      const valueError = validateValue(params.value, selectedItem);
      validateForm(!!valueError);
    }
  };

  const validateName = useCallback(
    (name?: string) => {
      let valueError = null;
      const params = getAdditionalParameter(id);
      if (params) {
        const name_ = name ?? params?.name;
        if (!name_) valueError = 'Name cannot be empty';
        if (isNameExist(id, name_)) valueError = 'This value already exist';
        setNameError(valueError);
      }
      return valueError;
    },
    [id, getAdditionalParameter, isNameExist],
  );

  const validateValue = useCallback((value: unknown, valueType: AdditionalParameter['valueType']) => {
    let valueError = null;
    if (value === '' || value === undefined) valueError = 'Value cannot be empty';
    else {
      const valueTypeLowercase = valueType.toLowerCase();
      switch (valueTypeLowercase) {
        case 'number':
          if (typeof value === valueTypeLowercase) break;
          if (!(typeof value === 'string' && !isNaN(Number(value)))) {
            valueError = 'Wrong format';
            break;
          }
          break;
        case 'boolean':
          if (typeof value !== valueTypeLowercase && !['true', 'false'].includes((value as string)?.toLowerCase())) {
            valueError = 'Wrong format';
            break;
          }
          break;
        case 'list, object':
          try {
            const formatted = JSON.parse(value as string);
            if (typeof formatted !== 'object') {
              valueError = 'Wrong format';
              break;
            }
          } catch (e) {
            console.error(e);
            valueError = (e as Error).toString();
          }
        default:
          break;
      }
    }
    setValueError(valueError);
    return valueError;
  }, []);

  const validateForm = useCallback(
    (hasError?: boolean) => {
      const nameError = validateName();
      const valueError_ = hasError ?? valueError;
      const error = !!nameError || !!valueError_;
      manageValidationError(error, id);
    },
    [id, valueError, validateName, manageValidationError],
  );
  const updateValue = useCallback(
    (value: unknown) => {
      const params = getAdditionalParameter(id);
      if (params) {
        validateValue(value, params.valueType);
        validateForm();
        const formattedValue = params.valueType === 'Boolean' ? ['true', 'True'].includes(value as string) : value;
        setAdditionalParameter(id, { value: formattedValue } as AdditionalParameterValue);
      }
    },
    [id, getAdditionalParameter, setAdditionalParameter, validateForm, validateValue],
  );

  return (
    <div className={styles.additionalParameterItem}>
      <FluidDropdown
        className={styles.additionalParameterName}
        onChange={onNameChange}
        items={additionalParamNames}
        id={`custom-param-name-${id}`}
        label=" "
        titleText="Name"
        isCondensed
        autoAlign
        invalid={!!nameError}
        invalidText={nameError}
      />
      <FluidTextInput
        onChange={onInputChange}
        //@ts-expect-error onBlur not specified in type definition
        onBlur={(e) => {
          updateValue(e.target.value);
        }}
        id={`custom-param-value-${id}`}
        labelText="Value"
        invalid={!!valueError}
        invalidText={valueError}
      />
      <FluidDropdown
        label="Value type"
        items={['Number', 'String', 'Boolean', 'List, object']}
        id={`custom-param-valueType-${id}`}
        isCondensed
        titleText="Value type"
        initialSelectedItem="Number"
        autoAlign
        onChange={onTypeChange}
      />
      <div className={styles.deleteButton}>
        <IconButton kind="ghost" label="Remove" size="sm" autoAlign onClick={() => removeAdditionalParameter(id)}>
          <Close />
        </IconButton>
      </div>
    </div>
  );
};

export default AdditionalParameterForm;
