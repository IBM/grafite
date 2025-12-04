'use client';

import { type Dispatch, type SetStateAction } from 'react';
import { ContainedList, ContainedListItem, Button } from '@carbon/react';
import { Add, Close } from '@carbon/react/icons';

import InputWrapper from './InputWrapper';
import styles from './ListForm.module.scss';

type ListFormProps = {
  values: string[];
  setValues: Dispatch<SetStateAction<string[]>>;
  label: string;
  id: string;
  className?: string;
  placeholder?: string;
};

export const ListForm = ({ values, label, id, setValues, className, placeholder }: ListFormProps) => {
  const remove = (idx: number) => {
    setValues((prev) => [...prev.slice(0, idx), ...prev.slice(idx + 1)]);
  };

  const add = (value: string) => {
    setValues((prev) => [...prev, value]);
  };

  const update = (value: string, idx: number) => {
    if (!value) return;

    setValues((prev) => {
      const newValues = [...prev];

      newValues[idx] = value;

      return newValues;
    });
  };

  const AddAction = () => (
    <Button kind="ghost" onClick={() => add('')}>
      <Add />
    </Button>
  );

  const RemoveAction = (idx: number) => (
    <Button className={styles.removeAction} size="sm" kind="ghost" onClick={() => remove(idx)}>
      <Close />
    </Button>
  );

  return (
    <>
      <ContainedList kind="on-page" label={label} action={<AddAction />} className={`${styles.wrapper} ${className}`}>
        {values.map((value, idx) => {
          return (
            <ContainedListItem key={`${id}-list-${idx}`} action={RemoveAction(idx)}>
              <InputWrapper
                label={`${label} ${idx}`}
                defaultValue={value}
                updateValue={(newValue) => update(newValue, idx)}
                placeholder={placeholder}
              />
            </ContainedListItem>
          );
        })}
      </ContainedList>
    </>
  );
};
