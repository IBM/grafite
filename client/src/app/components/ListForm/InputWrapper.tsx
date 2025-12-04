import { ChangeEvent, useEffect, useId, useRef } from 'react';
import { TextInput, Layer } from '@carbon/react';

type InputWrapperProps = {
  label: string;
  defaultValue: string;
  placeholder?: string;
  updateValue: (newValue: string) => void;
};

const InputWrapper = ({ label, defaultValue, placeholder = '', updateValue }: InputWrapperProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const id = useId();

  useEffect(() => {
    if (!inputRef.current || !defaultValue) return;

    //conditional statement to filter out updates triggered by input events
    if (inputRef.current.value !== defaultValue) {
      inputRef.current.value = defaultValue;
    }
  }, [defaultValue]);

  return (
    <Layer>
      <TextInput
        ref={inputRef}
        labelText={label}
        placeholder={placeholder}
        id={id}
        size="sm"
        defaultValue={defaultValue}
        onChange={(e: ChangeEvent<HTMLInputElement>) => updateValue(e.target.value)}
        hideLabel
      />
    </Layer>
  );
};

export default InputWrapper;
