const fs = require('fs');
const path = require('path');

const PROTOCOL = "https://";
const DOMAIN = "hoangnhatng.github.io";
const REPO_NAME = "svhub";

// Hàm tìm đuôi mở rộng của ảnh dựa vào ID và đường dẫn thư mục thumbnail cụ thể
function findImageExtension(id, thumbDir) {
    if (!fs.existsSync(thumbDir)) return 'jpg';
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of extensions) {
        if (fs.existsSync(path.join(thumbDir, `${id}.${ext}`))) {
            return ext;
        }
    }
    return 'jpg';
}

// Hàm tổng quát để chuyển đổi file text sang JSON
function convertTxtToExtJson(txtFilePath, thumbSourceDir, outputJsonPath, urlSubPath) {
    try {
        if (!fs.existsSync(txtFilePath)) {
            console.log(`Bỏ qua: Không tìm thấy file ${txtFilePath}`);
            return;
        }

        const fileContent = fs.readFileSync(txtFilePath, 'utf-8');
        const lines = fileContent.split('\n');
        const result = [];
        let currentItem = null;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('- id:')) {
                if (currentItem) result.push(currentItem);
                
                const idValue = parseInt(trimmed.replace('- id:', '').trim());
                const ext = findImageExtension(idValue, thumbSourceDir);

                // Tự động tạo link tuyệt đối dựa trên vị trí lưu ảnh (gốc hoặc trong thư mục lib)
                const absoluteThumbUrl = PROTOCOL + DOMAIN + "/" + REPO_NAME + urlSubPath + idValue + "." + ext;

                currentItem = {
                    id: idValue,
                    title: "",
                    url: "",
                    thumbnailUrl: absoluteThumbUrl
                };
            } else if (currentItem && trimmed.startsWith('-- title:')) {
                currentItem.title = trimmed.replace('-- title:', '').trim();
            } else if (currentItem && trimmed.startsWith('-- url:')) {
                let url = trimmed.replace('-- url:', '').trim();
                currentItem.url = url.startsWith('http') ? url : PROTOCOL + url;
            }
        });

        if (currentItem) result.push(currentItem);

        // Đảm bảo thư mục chứa file JSON đầu ra tồn tại
        const parsedOutputDir = path.dirname(outputJsonPath);
        if (!fs.existsSync(parsedOutputDir)) fs.mkdirSync(parsedOutputDir, { recursive: true });
        
        fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`Đã tạo thành công: ${outputJsonPath}`);

    } catch (error) {
        console.error(`Lỗi xử lý file ${txtFilePath}:`, error);
        process.exit(1);
    }
}

// Hàm đồng bộ (copy) thư mục ảnh dữ liệu
function syncThumbnailFolder(srcDir, destDir) {
    if (fs.existsSync(srcDir)) {
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const files = fs.readdirSync(srcDir);
        files.forEach(file => {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);
            // Chỉ copy file, bỏ qua nếu là thư mục con
            if (fs.lstatSync(srcFile).isFile()) {
                fs.copyFileSync(srcFile, destFile);
            }
        });
        console.log(`Đã đồng bộ thư mục ảnh từ ${srcDir} sang ${destDir}`);
    }
}

// === CHẠY TIẾN TRÌNH ===

// 1. Tạo thư mục public tổng nếu chưa có
if (!fs.existsSync('public')) fs.mkdirSync('public');

// 2. Xử lý API 1: Bản tin cũ (Nằm ở gốc)
convertTxtToExtJson(
    path.join(__dirname, 'data.txt'),
    path.join(__dirname, 'thumbnail'),
    path.join(__dirname, 'public', 'news.json'),
    '/thumbnail/' // sub-path của url ảnh
);
syncThumbnailFolder(path.join(__dirname, 'thumbnail'), path.join(__dirname, 'public', 'thumbnail'));

// 3. Xử lý API 2: Thư viện mới (Nằm trong thư mục lib)
convertTxtToExtJson(
    path.join(__dirname, 'lib', 'data.txt'),
    path.join(__dirname, 'lib', 'thumbnail'),
    path.join(__dirname, 'public', 'lib', 'lib.json'),
    '/lib/thumbnail/' // sub-path của url ảnh mới
);
syncThumbnailFolder(path.join(__dirname, 'lib', 'thumbnail'), path.join(__dirname, 'public', 'lib', 'thumbnail'));
