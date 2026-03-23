# MediaFile Uploader

Ứng dụng React với giao diện kéo thả để upload hình ảnh lên MediaFile API.

## Tính năng

- ✅ Drag & drop giao diện trực quan
- ✅ Preview danh sách file chờ upload
- ✅ Progress bar cho từng file
- ✅ Tự động retry (3 lần) khi upload thất bại
- ✅ Upload song song nhiều file
- ✅ Lưu kết quả JSON tự động
- ✅ Download lại kết quả JSON

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment

Sao chép `.env.example` thành `.env` và cấu hình:

```bash
cp .env.example .env
```

Sửa file `.env`:
```env
VITE_MEDIAFILE_API_URL=http://localhost:3001
MEDIAFILE_API_URL=<URL_API_MEDIAFILE_THỰC_TẾ>
PORT=3001
```

## Chạy ứng dụng

### Development mode (Frontend + Backend)

```bash
npm run dev
```

Lệnh này sẽ chạy đồng thời:
- Frontend React tại `http://localhost:5173`
- Backend Express server tại `http://localhost:3001`

### Chỉ chạy Frontend

```bash
npm run dev:client
```

### Chỉ chạy Backend

```bash
npm run server
```

## Build production

```bash
npm run build
npm run preview
```

## Cấu trúc thư mục

```
mediafile-uploader/
├── src/                    # Frontend React code
│   ├── App.tsx            # Main component với drag-drop UI
│   ├── App.css            # Styles
│   └── ...
├── server/                 # Backend Express server
│   └── index.ts           # API proxy & file handling
├── result/                 # Kết quả JSON sau khi upload
├── .env                   # Environment variables
├── .env.example           # Environment template
└── package.json
```

## Cách sử dụng

1. Mở ứng dụng tại `http://localhost:5173`
2. Kéo thả hình ảnh vào vùng được chỉ định hoặc click để chọn file
3. Nhấn "Upload tất cả" để bắt đầu upload
4. Kết quả JSON sẽ tự động lưu vào thư mục `result/`
5. Click "Tải JSON" để download kết quả cho từng file

## API Endpoints

### Backend (Express)

- `POST /files/upload` - Upload file lên MediaFile API
- `GET /health` - Health check endpoint

## Lưu ý

- File size giới hạn: 50MB
- Supported formats: PNG, JPG, JPEG, GIF, WEBP
- Retry mechanism: 3 lần, cách nhau 5 giây
