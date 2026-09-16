const fs = require('fs');

function parseTextToJSON() {
    try {
        const fileContent = fs.readFileSync('data.txt', 'utf-8');
        const itemsRaw = fileContent.split(/(?=- id:)/);
        const result = [];

        itemsRaw.forEach(itemStr => {
            if (!itemStr.trim()) return;

            const idMatch = itemStr.match(/- id:\s*(\d+)/);
            const titleMatch = itemStr.match(/-- title:\s*(.+)/);
            const urlMatch = itemStr.match(/-- url:\s*(.+)/);
            const thumbMatch = itemStr.match(/-- thumbnailUrl:\s*(.+)/);

            if (idMatch) {
                const url = urlMatch ? urlMatch[1].trim() : "";
                const thumbnailUrl = thumbMatch ? thumbMatch[1].trim() : "";

                result.push({
                    id: parseInt(idMatch[1]),
                    title: titleMatch ? titleMatch[1].trim() : "",
                    url: url.startsWith('http') ? url : `https://${url}`,
                    thumbnailUrl: thumbnailUrl.startsWith('http') ? thumbnailUrl : `https://${thumbnailUrl}`
                });
            }
        });

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync('public/news.json', JSON.stringify(result, null, 2), 'utf-8');
        console.log("Đã chuyển đổi thành công sang JSON!");
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

parseTextToJSON();
