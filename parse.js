const fs = require('fs');
const path = require('path');

const PROTOCOL = "https://";
const DOMAIN = "hoangnhatng.github.io";
const REPO_NAME = "svhub";

// Hàm tìm đuôi mở rộng của ảnh dựa vào ID
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

// Hàm xử lý bảng Markdown thành JSON
function convertMarkdownTableToJSON(txtFilePath, thumbSourceDir, outputJsonPath, urlSubPath) {
    try {
        if (!fs.existsSync(txtFilePath)) {
            console.log(`Bỏ qua: Không tìm thấy file ${txtFilePath}`);
            return;
        }

        const fileContent = fs.readFileSync(txtFilePath, 'utf-8');
        const lines = fileContent.split('\n');
        const result = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Bỏ qua dòng tiêu đề và dòng gạch ngang phân cách của bảng Markdown
            if (index === 0 && trimmed.toLowerCase().includes('id')) return;
            if (trimmed.includes('---') || trimmed.includes('-|-')) return;

            // Tách các cột dựa trên dấu gạch đứng '|'
            const columns = trimmed.split('|').map(col => col.trim());

            // Một dòng hợp lệ phải có đủ các cột dữ liệu
            if (columns.length >= 4 && columns[1]) {
                const idValue = parseInt(columns[1]);
                if (isNaN(idValue)) return; // Bỏ qua nếu cột id không phải là số

                // BUG FIX: Tự động loại bỏ tất cả các dấu gạch chéo ngược \ do Joplin tự sinh ra
                const titleValue = (columns[2] || "").replace(/\\/g, '');
                
                let urlValue = columns[3] || "";
                if (urlValue) {
                    urlValue = urlValue.startsWith('http') ? urlValue : PROTOCOL + urlValue;
                }

                const ext = findImageExtension(idValue, thumbSourceDir);
                const absoluteThumbUrl = PROTOCOL + DOMAIN + "/" + REPO_NAME + urlSubPath + idValue + "." + ext;

                result.push({
                    id: idValue,
                    title: titleValue,
                    url: urlValue,
                    thumbnailUrl: absoluteThumbUrl
                });
            }
        });

        const parsedOutputDir = path.dirname(outputJsonPath);
        if (!fs.existsSync(parsedOutputDir)) fs.mkdirSync(parsedOutputDir, { recursive: true });
        
        fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`Đã tạo thành công: ${outputJsonPath}`);

    } catch (error) {
        console.error(`Lỗi xử lý file ${txtFilePath}:`, error);
        process.exit(1);
    }
}

function syncThumbnailFolder(srcDir, destDir) {
    if (fs.existsSync(srcDir)) {
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const files = fs.readdirSync(srcDir);
        files.forEach(file => {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);
            if (fs.lstatSync(srcFile).isFile()) {
                fs.copyFileSync(srcFile, destFile);
            }
        });
        console.log(`Đã đồng bộ thư mục ảnh từ ${srcDir} sang ${destDir}`);
    }
}

// === CHẠY TIẾN TRÌNH ===
if (!fs.existsSync('public')) fs.mkdirSync('public');

// 1. Xử lý API 1: Tin tức (Gốc)
convertMarkdownTableToJSON(
    path.join(__dirname, 'data.txt'),
    path.join(__dirname, 'thumbnail'),
    path.join(__dirname, 'public', 'news.json'),
    '/thumbnail/'
);
syncThumbnailFolder(path.join(__dirname, 'thumbnail'), path.join(__dirname, 'public', 'thumbnail'));

// 2. Xử lý API 2: Thư viện (Trong thư mục lib)
convertMarkdownTableToJSON(
    path.join(__dirname, 'lib', 'data.txt'),
    path.join(__dirname, 'lib', 'thumbnail'),
    path.join(__dirname, 'public', 'lib', 'lib.json'),
    '/lib/thumbnail/'
);
syncThumbnailFolder(path.join(__dirname, 'lib', 'thumbnail'), path.join(__dirname, 'public', 'lib', 'thumbnail'));
