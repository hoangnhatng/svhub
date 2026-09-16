const fs = require('fs');
const path = require('path');

// Cấu hình thông tin URL tuyệt đối của bạn
const BASE_URL = "https://github.io";

// Hàm tự động tìm đuôi mở rộng của ảnh dựa vào ID
function findImageExtension(id) {
    const srcThumbDir = path.join(__dirname, 'thumbnail');
    
    // Nếu chưa có thư mục thumbnail, mặc định trả về jpg
    if (!fs.existsSync(srcThumbDir)) return 'jpg';

    // Các định dạng ảnh được hỗ trợ theo thứ tự ưu tiên
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const ext of extensions) {
        if (fs.existsSync(path.join(srcThumbDir, `${id}.${ext}`))) {
            return ext;
        }
    }
    
    // Nếu không tìm thấy ảnh nào khớp với ID, mặc định trả về jpg
    return 'jpg';
}

function parseTextToJSON() {
    try {
        const fileContent = fs.readFileSync('data.txt', 'utf-8');
        const lines = fileContent.split('\n');
        const result = [];
        let currentItem = null;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('- id:')) {
                if (currentItem) result.push(currentItem);
                
                const idValue = parseInt(trimmed.replace('- id:', '').trim());
                const ext = findImageExtension(idValue); // Tìm đuôi ảnh thực tế (png/webp/jpg)

                currentItem = {
                    id: idValue,
                    title: "",
                    url: "",
                    // Tự động tạo đường dẫn tuyệt đối với đuôi ảnh chính xác
                    thumbnailUrl: `${BASE_URL}/thumbnail/${idValue}.${ext}`
                };
            } else if (currentItem && trimmed.startsWith('-- title:')) {
                currentItem.title = trimmed.replace('-- title:', '').trim();
            } else if (currentItem && trimmed.startsWith('-- url:')) {
                let url = trimmed.replace('-- url:', '').trim();
                currentItem.url = url.startsWith('http') ? url : `https://${url}`;
            }
        });

        if (currentItem) result.push(currentItem);

        // Tạo thư mục public nếu chưa có
        if (!fs.existsSync('public')) fs.mkdirSync('public');
        
        // Ghi file JSON kết quả
        fs.writeFileSync('public/news.json', JSON.stringify(result, null, 2), 'utf-8');
        console.log("Đã chuyển đổi thành công sang JSON!");

        // TỰ ĐỘNG COPY THƯ MỤC THUMBNAIL VÀO PUBLIC ĐỂ GITHUB PAGES HIỂN THỊ ĐƯỢC ẢNH
        const srcThumbDir = path.join(__dirname, 'thumbnail');
        const destThumbDir = path.join(__dirname, 'public', 'thumbnail');

        if (fs.existsSync(srcThumbDir)) {
            if (!fs.existsSync(destThumbDir)) fs.mkdirSync(destThumbDir, { recursive: true });
            
            const files = fs.readdirSync(srcThumbDir);
            files.forEach(file => {
                const srcFile = path.join(srcThumbDir, file);
                const destFile = path.join(destThumbDir, file);
                fs.copyFileSync(srcFile, destFile);
            });
            console.log("Đã đồng bộ thư mục thumbnail thành công!");
        } else {
            console.log("Cảnh báo: Chưa tìm thấy thư mục 'thumbnail' trong kho lưu trữ.");
        }

    } catch (error) {
        console.error("Lỗi xử lý:", error);
        process.exit(1);
    }
}

parseTextToJSON();
