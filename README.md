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

## Deploy GitHub Pages

Repository đã được cấu hình workflow tại `.github/workflows/deploy-pages.yml`
để build và deploy frontend Vite lên GitHub Pages.

### Yêu cầu trước khi publish

- Vào **Settings → Pages** và chọn **GitHub Actions** làm source.
- Nếu backend uploader chạy ở domain riêng, tạo repository variable
  `VITE_MEDIAFILE_API_URL` để inject URL backend vào bản build Pages.
- Nếu không đặt variable này, site vẫn deploy được nhưng bạn cần nhập backend
  URL thủ công trong phần **API Settings** sau khi mở trang.

Workflow sẽ:

- cài dependencies với `npm ci`
- chạy `npm run lint`
- chạy test hiện có bằng `npm test`
- build static site bằng `npm run build`
- deploy thư mục `dist/` lên GitHub Pages

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

1. Mở ứng dụng tại `http://localhost:5173` hoặc URL GitHub Pages sau khi deploy
2. Kéo thả hình ảnh vào vùng được chỉ định hoặc click để chọn file
3. Nếu đang dùng GitHub Pages, kiểm tra **API Settings** để chắc chắn backend
   URL đã được cấu hình đúng
4. Nhấn "Upload tất cả" để bắt đầu upload
5. Kết quả JSON sẽ tự động lưu vào thư mục `result/` khi upload qua backend local
6. Click "Tải JSON" để download kết quả cho từng file

## API Endpoints

### Backend (Express)

- `POST /files/upload` - Upload file lên MediaFile API
- `GET /health` - Health check endpoint

## Lưu ý

- File size giới hạn: 50MB
- Supported formats: PNG, JPG, JPEG, GIF, WEBP
- Retry mechanism: 3 lần, cách nhau 5 giây
