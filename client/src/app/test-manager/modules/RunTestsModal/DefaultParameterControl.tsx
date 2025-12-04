import { FluidNumberInput } from '@carbon/react';

import { DefaultParameters } from './utils';

interface Props {
  label: string;
  valueKey: keyof DefaultParameters;
  max?: number;
  min?: number;
  step: number;
  defaultValue: number;
  updateParameter: (key: keyof DefaultParameters, value: number) => void;
  manageValidationError: (hasError: boolean, identifier: string) => void;
}

const DefaultParameterControl = ({ valueKey, updateParameter, manageValidationError, ...props }: Props) => {
  const validate = (value: number) => {
    if (props.min !== undefined && props.max !== undefined) {
      if (value < props.min || value > props.max) manageValidationError(true, valueKey);
      else manageValidationError(false, valueKey);
    }
  };

  return (
    <FluidNumberInput
      id={valueKey}
      {...props}
      onChange={(
        _event:
          | React.MouseEvent<HTMLButtonElement>
          | React.FocusEvent<HTMLInputElement>
          | React.KeyboardEvent<HTMLInputElement>,
        state: { value: number | string; direction: string },
      ) => {
        updateParameter(valueKey, state.value as number);
        validate(state.value as number);
      }}
    />
  );
};

export default DefaultParameterControl;
