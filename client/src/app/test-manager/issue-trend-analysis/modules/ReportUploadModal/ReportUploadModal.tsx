'use client';
import { FileUploaderDropContainer, FileUploaderItem, Modal } from '@carbon/react';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { useState } from 'react';

import styles from './ReportUploadModal.module.scss';
import { parsedToResults } from './utils/parsedToResults';
import { parseReportFile } from './utils/parseFile';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (reports: SelectedReport[]) => void;
  existingFilenames: string[];
}

type FileState = { file: File; status: 'edit' | 'uploading' | 'complete'; error?: string };

export default function ReportUploadModal({ open, onClose, onAdd, existingFilenames }: Props) {
  const [files, setFiles] = useState<FileState[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (newFiles: File[]) => {
    const deduped = newFiles.filter(
      (f) => !existingFilenames.includes(f.name) && !files.find((s) => s.file.name === f.name),
    );
    setFiles((prev) => [...prev, ...deduped.map((f) => ({ file: f, status: 'edit' as const }))]);
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.file.name !== name));

  const handleClose = () => {
    setFiles([]);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const results: SelectedReport[] = [];
    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'uploading' };
      setFiles([...updated]);
      try {
        const parsed = await parseReportFile(updated[i].file);
        const name = updated[i].file.name;
        results.push({
          report: {
            id: `upload:${name}`,
            runId: `upload:${name}`,
            modelId: name,
            creator: 'upload',
            databuilder: '',
            createdAt: '',
            status: 'uploaded',
          },
          results: parsedToResults(parsed),
          uploaded: true,
        });
        updated[i] = { ...updated[i], status: 'complete' };
      } catch (e) {
        updated[i] = { ...updated[i], status: 'edit', error: (e as Error).message };
      }
      setFiles([...updated]);
    }

    setSubmitting(false);
    if (results.length) {
      onAdd(results);
      setFiles([]);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      modalHeading="Upload report files"
      primaryButtonText="Add reports"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={files.length === 0 || submitting}
      onRequestSubmit={handleSubmit}
      onRequestClose={handleClose}
      onSecondarySubmit={handleClose}
    >
      <p className={styles.intro}>Upload JSON report files. Each file becomes one report.</p>
      <FileUploaderDropContainer
        accept={['.json']}
        multiple
        labelText="Drag and drop files here or click to upload"
        onAddFiles={(_e, { addedFiles }) => addFiles(addedFiles)}
      />
      <div className={styles.fileList}>
        {files.map((f) => (
          <div key={f.file.name}>
            <FileUploaderItem
              name={f.file.name}
              status={f.status}
              errorSubject={f.error}
              errorBody=""
              onDelete={() => removeFile(f.file.name)}
            />
          </div>
        ))}
        {existingFilenames.length > 0 && (
          <p className={styles.loaded}>Already loaded: {existingFilenames.join(', ')}</p>
        )}
      </div>
    </Modal>
  );
}
