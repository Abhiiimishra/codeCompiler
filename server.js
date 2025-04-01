const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const tempDir = "temp_files";
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

app.post("/run", (req, res) => {
    const { code, language } = req.body;
    if (!code || !language) {
        return res.status(400).json({ output: "Missing code or language!" });
    }

    let fileName, command;
    const fileBase = path.join(tempDir, "temp");

    switch (language.toLowerCase()) {
        case "javascript":
            fileName = `${fileBase}.js`;
            command = `node ${fileName}`;
            break;
        case "python":
            fileName = `${fileBase}.py`;
            command = `python3 ${fileName}`;
            break;
        case "cpp":
            fileName = `${fileBase}.cpp`;
            command = `g++ ${fileName} -o ${fileBase}.out && ${fileBase}.out`;
            break;
        case "java":
            let match = code.match(/public\s+class\s+(\w+)/);
            let className = match ? match[1] : "Main";
            fileName = path.join(tempDir, `${className}.java`);
            
            if (!match) {
                code = `public class Main {\n    public static void main(String[] args) {\n        ${code.replace(/\n/g, '\n        ')}\n    }\n}`;
            }

            fs.writeFileSync(fileName, code);
            command = `javac ${fileName} && java -cp ${tempDir} ${className}`;
            break;
        case "c":
            fileName = `${fileBase}.c`;
            command = `gcc ${fileName} -o ${fileBase}.out && ${fileBase}.out`;
            break;
        case "php":
            fileName = `${fileBase}.php`;
            command = `php ${fileName}`;
            break;
        case "ruby":
            fileName = `${fileBase}.rb`;
            command = `ruby ${fileName}`;
            break;
        case "bash":
            fileName = `${fileBase}.sh`;
            command = `bash ${fileName}`;
            break;
        case "go":
            fileName = `${fileBase}.go`;
            command = `go run ${fileName}`;
            break;
        default:
            return res.status(400).json({ output: "Unsupported language!" });
    }

    fs.writeFileSync(fileName, code);

    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        fs.unlinkSync(fileName); // Clean up file after execution
        if (error) return res.json({ output: stderr || error.message });
        res.json({ output: stdout });
    });
});

// Use process.env.PORT for Railway deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
