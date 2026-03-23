import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Files,
  Image,
  Link2,
  LoaderCircle,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import './App.css';
import {
  buildQueuedFiles,
  formatFileSize,
  isSupportedBackendUrl,
  normalizeUploadResult,
  resolveInitialBackendUrl,
  summarizeUploads,
  type UploadResponsePayload,
  type UploadStatus,
  type UploadedFile,
} from './upload-utils.ts';

const STATUS_META: Record<
  UploadStatus,
  { label: string; Icon: LucideIcon }
> = {
  pending: {
    label: 'Chờ upload',
    Icon: Clock3,
  },
  uploading: {
    label: 'Đang upload',
    Icon: LoaderCircle,
  },
  success: {
    label: 'Thành công',
    Icon: CheckCircle2,
  },
  error: {
    label: 'Cần thử lại',
    Icon: AlertTriangle,
  },
};

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return resolveInitialBackendUrl({
      savedUrl: localStorage.getItem('mediafile_api_url'),
      envUrl: import.meta.env.VITE_MEDIAFILE_API_URL,
      hostname: window.location.hostname,
    });
  });
  const [apiUrlDraft, setApiUrlDraft] = useState(apiUrl);
  const [apiUrlError, setApiUrlError] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);

  const summary = useMemo(() => summarizeUploads(files), [files]);
  const readyToUpload = summary.pending + summary.error;
  const hasConfiguredApiUrl = apiUrl.trim().length > 0;

  const patchFile = (fileId: string, patch: Partial<UploadedFile>) => {
    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.id === fileId ? { ...file, ...patch } : file,
      ),
    );
  };

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((currentFiles) => [...currentFiles, ...buildQueuedFiles(acceptedFiles)]);
  };

  const handleToggleApiSettings = () => {
    setShowApiSettings((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue) {
        setApiUrlDraft(apiUrl);
        setApiUrlError('');
      }

      return nextValue;
    });
  };

  const handleSaveApiUrl = () => {
    const trimmedUrl = apiUrlDraft.trim();

    if (!trimmedUrl) {
      setApiUrlError('Vui lòng nhập URL backend upload.');
      return;
    }

    if (!isSupportedBackendUrl(trimmedUrl)) {
      setApiUrlError('URL không hợp lệ. Ví dụ: http://localhost:3001');
      return;
    }

    localStorage.setItem('mediafile_api_url', trimmedUrl);
    setApiUrl(trimmedUrl);
    setApiUrlDraft(trimmedUrl);
    setApiUrlError('');
    setShowApiSettings(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
  });

  const uploadFile = async (fileId: string) => {
    const selectedFile = files.find((file) => file.id === fileId);

    if (!selectedFile) {
      return;
    }

    if (!hasConfiguredApiUrl) {
      const missingUrlMessage =
        'Vui lòng cấu hình URL backend trước khi upload.';

      patchFile(fileId, {
        status: 'error',
        progress: 0,
        error: missingUrlMessage,
      });
      setApiUrlError(missingUrlMessage);
      setShowApiSettings(true);
      return;
    }

    patchFile(fileId, {
      status: 'uploading',
      progress: 0,
      error: undefined,
    });

    let attempts = 3;

    while (attempts > 0) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile.file);

        const response = await axios.post<UploadResponsePayload>(
          `${apiUrl}/files/upload`,
          formData,
          {
            headers: {
              accept: '*/*',
            },
            onUploadProgress: (progressEvent) => {
              const totalBytes = progressEvent.total || selectedFile.size || 1;
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / totalBytes,
              );

              patchFile(fileId, { progress: percentCompleted });
            },
          },
        );

        const result = normalizeUploadResult(response.data);

        patchFile(fileId, {
          status: 'success',
          progress: 100,
          result,
          error: undefined,
        });
        return;
      } catch (error) {
        attempts -= 1;
        console.error(
          `Upload failed for ${selectedFile.name}. ${attempts} retries left.`,
        );

        if (attempts > 0) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Unknown error';

        patchFile(fileId, {
          status: 'error',
          progress: 0,
          error: errorMessage,
        });
      }
    }
  };

  const handleUploadAll = async () => {
    const queue = files
      .filter((file) => file.status === 'pending' || file.status === 'error')
      .map((file) => file.id);

    if (queue.length === 0) {
      return;
    }

    setIsUploading(true);

    for (const fileId of queue) {
      await uploadFile(fileId);
    }

    setIsUploading(false);
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((currentFiles) => currentFiles.filter((file) => file.id !== fileId));
  };

  const handleDownloadJson = (file: UploadedFile) => {
    if (!file.result) {
      return;
    }

    const jsonName = `${file.name.replace(/\.[^/.]+$/, '')}.json`;
    const jsonBlob = new Blob([JSON.stringify(file.result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');

    link.href = url;
    link.download = jsonName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: 'Trong hàng đợi',
      value: summary.total,
      helper: `${formatFileSize(summary.totalSize)} tổng dung lượng`,
      Icon: Files,
      tone: 'primary',
    },
    {
      label: 'Cần upload',
      value: readyToUpload,
      helper:
        readyToUpload > 0
          ? 'Bao gồm file mới và file cần thử lại'
          : 'Không còn file chờ xử lý',
      Icon: Upload,
      tone: 'accent',
    },
    {
      label: 'Thành công',
      value: summary.success,
      helper:
        summary.success > 0
          ? 'Có thể tải JSON cho từng file'
          : 'Chưa có file hoàn tất',
      Icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Cần xem lại',
      value: summary.error,
      helper:
        summary.error > 0
          ? 'Retry trực tiếp trên từng thẻ file'
          : 'Hệ thống đang ổn định',
      Icon: AlertTriangle,
      tone: 'warning',
    },
  ] as const;

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div className="hero-copy">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Media pipeline dashboard</span>
          </div>

          <h1>Media File Uploader</h1>
          <p>
            Tối ưu luồng upload ảnh với giao diện rõ trạng thái, dễ theo dõi và
            đồng nhất màu sắc cho thao tác hàng loạt.
          </p>
        </div>

        <div className="hero-actions">
          <div className="endpoint-chip">
            <Link2 size={16} />
            <span>{apiUrl || 'Chưa cấu hình backend upload'}</span>
          </div>

          <button
            type="button"
            className={`ghost-button ${showApiSettings ? 'active' : ''}`}
            onClick={handleToggleApiSettings}
          >
            <Settings2 size={18} />
            API Settings
          </button>
        </div>
      </header>

      <section className="stats-grid" aria-label="Upload summary">
        {statCards.map(({ label, value, helper, Icon, tone }) => (
          <article key={label} className={`stat-card ${tone}`}>
            <div className="stat-icon">
              <Icon size={20} />
            </div>

            <div className="stat-copy">
              <span>{label}</span>
              <strong>{value}</strong>
              <p>{helper}</p>
            </div>
          </article>
        ))}
      </section>

      {showApiSettings && (
        <section className="settings-panel">
          <div className="section-copy">
            <h2>Kết nối API</h2>
            <p>
              Cập nhật URL backend uploader khi bạn cần đổi proxy, môi trường
              chạy, hoặc cấu hình site GitHub Pages trỏ đến backend riêng.
            </p>
          </div>

          <div className="settings-form">
            <label htmlFor="api-url">Uploader backend URL</label>
            <div className="settings-row">
              <input
                id="api-url"
                type="text"
                value={apiUrlDraft}
                onChange={(event) => {
                  setApiUrlDraft(event.target.value);
                  setApiUrlError('');
                }}
                placeholder="http://localhost:3001"
              />
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveApiUrl}
              >
                Lưu URL
              </button>
            </div>
            <p className={`settings-feedback ${apiUrlError ? 'error' : ''}`}>
              {apiUrlError ||
                'Ví dụ: http://localhost:3001 hoặc https://api.example.com. URL chỉ được lưu khi bạn nhấn "Lưu URL".'}
            </p>
          </div>
        </section>
      )}

      <section
        {...getRootProps()}
        className={`dropzone-card ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="dropzone-icon">
          <Upload size={30} />
        </div>

        <h2>{isDragActive ? 'Thả file để thêm vào hàng đợi' : 'Kéo thả ảnh vào đây'}</h2>
        <p>
          {isDragActive
            ? 'Thả file ngay để bắt đầu chuẩn bị upload.'
            : 'Hoặc click để chọn file PNG, JPG, JPEG, GIF, WEBP.'}
        </p>

        <div className="format-chips" aria-label="Supported formats">
          <span>PNG</span>
          <span>JPG</span>
          <span>JPEG</span>
          <span>GIF</span>
          <span>WEBP</span>
        </div>
      </section>

      <section className="queue-panel">
        <div className="queue-header">
          <div className="section-copy">
            <h2>Hàng đợi upload</h2>
            <p>
              {summary.total > 0
                ? `${summary.uploading} đang upload · ${readyToUpload} chờ xử lý · ${summary.success} thành công`
                : 'Chưa có file nào trong hàng đợi.'}
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={handleUploadAll}
            disabled={isUploading || readyToUpload === 0}
          >
            {isUploading ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <Upload size={18} />
            )}
            {isUploading ? 'Đang upload...' : 'Upload tất cả'}
          </button>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Image size={26} />
            </div>
            <h3>Sẵn sàng cho đợt upload tiếp theo</h3>
            <p>
              Thêm file vào dropzone để bắt đầu theo dõi tiến độ và tải JSON kết
              quả ở cùng một nơi.
            </p>
          </div>
        ) : (
          <div className="file-grid">
            {files.map((file) => {
              const { Icon, label } = STATUS_META[file.status];

              return (
                <article key={file.id} className={`file-card ${file.status}`}>
                  <div className="file-card-top">
                    <div className="file-avatar">
                      <Image size={20} />
                    </div>

                    <div className="file-copy">
                      <h3>{file.name}</h3>
                      <p>{formatFileSize(file.size)}</p>
                    </div>

                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleRemoveFile(file.id)}
                      disabled={file.status === 'uploading' || isUploading}
                      aria-label={`Xóa ${file.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="file-meta">
                    <span className={`status-badge ${file.status}`}>
                      <Icon
                        size={16}
                        className={file.status === 'uploading' ? 'spin' : undefined}
                      />
                      {label}
                    </span>

                    <span className="file-progress-label">
                      {file.status === 'uploading'
                        ? `${file.progress}%`
                        : file.status === 'success'
                          ? 'JSON sẵn sàng'
                          : file.status === 'error'
                            ? 'Cần retry'
                            : 'Đợi lệnh upload'}
                    </span>
                  </div>

                  {file.status === 'uploading' && (
                    <div className="progress-track" aria-label={`${file.progress}% uploaded`}>
                      <div
                        className="progress-fill"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {file.status === 'error' && file.error && (
                    <div className="file-error">
                      <AlertTriangle size={16} />
                      <span>{file.error}</span>
                    </div>
                  )}

                  <div className="file-card-actions">
                    {file.status === 'success' ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleDownloadJson(file)}
                      >
                        <Download size={18} />
                        Tải JSON
                      </button>
                    ) : (
                      <div className="file-hint">
                        <Files size={16} />
                        <span>
                          {file.status === 'error'
                            ? 'Có thể thử lại ngay trên thẻ này.'
                            : 'File sẽ được xử lý khi chạy upload hàng loạt.'}
                        </span>
                      </div>
                    )}

                    {file.status === 'error' && (
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => uploadFile(file.id)}
                        disabled={isUploading}
                      >
                        <RefreshCw size={18} />
                        Thử lại
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
