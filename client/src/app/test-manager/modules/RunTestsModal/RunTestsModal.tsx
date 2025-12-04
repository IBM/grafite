'use client';

import { StartRunBody } from '@api/dashboard/test-runner/utils';
import {
  Button,
  ComposedModal,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ProgressIndicator,
  ProgressStep,
  ToastNotification,
} from '@carbon/react';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useWxModelContext } from '@components/WxModelContext';
import { APICallError } from '@types';
import { postRunTest } from '@utils/postFunctions/postRunTest';
import { useSession } from 'next-auth/react';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import JudgeType from './JudgeType';
import { ModelInformation } from './ModelInformation';
import { Parameters } from './Parameters';
import styles from './RunTestsModal.module.scss';
import {
  AdditionalParameter,
  DefaultParameters,
  getDefaultParameters,
  mapAdditionalParameterPayload,
  mapDefaultParameterPayload,
} from './utils';

type RunTestsModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  selectedTests: string[];
  selectableTestTotal: number;
};

export const RunTestsModal = ({
  isModalOpen,
  setIsModalOpen,
  selectedTests,
  selectableTestTotal,
}: RunTestsModalProps) => {
  const { addToastMsg } = useToastMessageContext();
  const { isWxModel } = useWxModelContext();

  const { data } = useSession();

  const [loading, setLoading] = useState(false);
  const [modelId, _setModelId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<'watsonx' | 'ollama'>('ollama');
  const [error, setError] = useState<string | null>(null);
  const [judgeType, _setJudgeType] = useState<'ensemble' | 'single'>('single');

  const parameters = useRef<DefaultParameters>(getDefaultParameters());
  const additionalParameters = useRef<AdditionalParameter[]>([]);
  const thinking = useRef<{ enabled: boolean; on: boolean }>({ enabled: false, on: false });
  const paramsWValidationError = useRef<string[]>([]);

  const manageValidationError = useCallback(
    (hasError: boolean, identifier: string) => {
      if (hasError && !paramsWValidationError.current.includes(identifier))
        paramsWValidationError.current.push(identifier);
      else if (!hasError)
        paramsWValidationError.current = paramsWValidationError.current.filter((d) => d !== identifier);
    },
    [paramsWValidationError],
  );

  const setThinking = useCallback(
    (value: { enabled: boolean; on: boolean }) => {
      thinking.current = value;
    },
    [thinking],
  );

  const setParameters = useCallback(
    (value: { [key in keyof DefaultParameters]: number }) => {
      parameters.current = { ...parameters.current, ...value };
    },
    [parameters],
  );

  const setAdditionalParameters = useCallback(
    (value: AdditionalParameter[]) => {
      additionalParameters.current = value;
    },
    [additionalParameters],
  );

  const setModelId = useCallback((value: string | null) => {
    _setModelId(value);
  }, []);

  const setJudgeType = useCallback((value: 'ensemble' | 'single') => {
    _setJudgeType(value);
  }, []);

  const onServiceChange = useCallback((service: 'watsonx' | 'ollama') => {
    setService(service);
    _setModelId(service === 'watsonx' ? null : '');
  }, []);

  const submit = () => {
    setError(null);
    if (!!paramsWValidationError.current.length) setError('Please resolve all form errors');
    if (!data?.user?.email) {
      setIsModalOpen(false);
      addToastMsg(400, 'Please refresh the page', 'Something went wrong');
      return;
    }

    setLoading(true);

    const { enabled: thinkingEnabled, on: thinkingOn } = thinking.current;

    if (!modelId) return setError('Missing model ID');

    const ensembleJudgeModels =
      process.env.NEXT_PUBLIC_ENSEMBLE_JUDGE_MODELS || 'llama3.3,mistral-small3.1,gpt-oss:120b';

    const singleJudgeModel = process.env.NEXT_PUBLIC_JUDGE_MODEL || 'llama3.3';

    const payload: StartRunBody = {
      user: data.user.email,
      model_id: modelId,
      source: service,
      parameters: {
        ...mapDefaultParameterPayload(parameters.current),
        ...(additionalParameters.current.length
          ? { additional_params: mapAdditionalParameterPayload(additionalParameters.current) }
          : {}),
      },
      ...(selectedTests.length && selectedTests.length !== selectableTestTotal ? { tests: selectedTests } : {}),
      ...(thinkingEnabled ? { thinking: thinkingOn } : {}),
      judges: judgeType === 'ensemble' ? ensembleJudgeModels.split(',') : [singleJudgeModel],
    };

    postRunTest(payload)
      .then(() => {
        setIsModalOpen(false);
        addToastMsg(200, 'Successfully started test run', 'Test run started');
      })
      .catch((error: APICallError) => {
        console.error(error);
        setError('Failed to start test run. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isModalOpen) {
      setStep(0);
      setService('ollama');
      _setModelId(null);
      _setJudgeType('single');
      setError(null);
      setIsModalOpen(false);
      parameters.current = getDefaultParameters();
      additionalParameters.current = [];
      paramsWValidationError.current = [];
      thinking.current = { enabled: false, on: false };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  useEffect(() => {
    setIsLoaded(true);
  }, [setIsLoaded]);

  const canProceed = useMemo(() => {
    if (!modelId) return false;

    switch (service) {
      case 'watsonx':
        return isWxModel(modelId);
      case 'ollama':
        return !!modelId;
    }
  }, [modelId, service, isWxModel]);

  const testLength = useMemo(() => {
    return selectedTests.length || selectableTestTotal;
  }, [selectedTests, selectableTestTotal]);

  return (
    isLoaded &&
    createPortal(
      <>
        <ComposedModal
          size="lg"
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
        >
          <ModalHeader title={`Run tests - ${testLength} test${testLength > 1 ? 's' : ''}`} />
          <ModalBody className={styles.root}>
            {error && (
              <ToastNotification
                title={error}
                role="alert"
                lowContrast
                className={styles.errorNotification}
                hideCloseButton
              />
            )}
            <div>
              <ProgressIndicator currentIndex={step} spaceEqually>
                <ProgressStep
                  complete={step === 1}
                  current={step === 0}
                  description="Step 1: Select model information"
                  label="Model information"
                  secondaryLabel={modelId ?? ''}
                />
                <ProgressStep current={step === 1} description="Step 2: Set run parameters" label="Parameters" />
                <ProgressStep
                  current={step === 2}
                  description="Step 3: Set judge type"
                  label="Judge type"
                  secondaryLabel={judgeType === 'ensemble' ? 'Ensemble of judges' : 'Single judge'}
                />
              </ProgressIndicator>
            </div>
            {step === 0 ? (
              <ModelInformation
                modelId={modelId}
                service={service}
                setModelId={setModelId}
                onServiceChange={onServiceChange}
              />
            ) : step === 1 ? (
              <Parameters
                parameters={parameters.current}
                additionalParameters={additionalParameters.current}
                setParameters={setParameters}
                setAdditionalParameters={setAdditionalParameters}
                thinking={thinking.current}
                setThinking={setThinking}
                manageValidationError={manageValidationError}
              />
            ) : (
              <JudgeType judgeType={judgeType} setJudgeType={setJudgeType} />
            )}
          </ModalBody>

          {step === 0 && (
            <ModalFooter>
              <Button disabled={!canProceed} onClick={() => setStep(1)}>
                Next
              </Button>
            </ModalFooter>
          )}
          {step === 1 && (
            <ModalFooter>
              <Button kind="secondary" onClick={() => setStep(0)}>
                Prev
              </Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </ModalFooter>
          )}
          {step === 2 && (
            <ModalFooter className={styles.footer}>
              <Button className={styles.prevBtn} kind="secondary" disabled={loading} onClick={() => setStep(1)}>
                Prev
              </Button>
              {loading ? (
                <InlineLoading className={styles.loading} description="Starting the test run..." />
              ) : (
                <Button onClick={submit}>Run</Button>
              )}
            </ModalFooter>
          )}
        </ComposedModal>
      </>,
      document.body,
    )
  );
};
