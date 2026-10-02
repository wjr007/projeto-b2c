# server.ps1 - Servidor HTTP estatico nativo para Windows PowerShell

param(
    [int]$Port = 8080
)

# Se Node.js estiver instalado, utiliza o server.js para máxima performance assíncrona
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Iniciando via Node.js..." -ForegroundColor Cyan
    node "$PSScriptRoot\server.js"
    exit
}

$localIP = [System.Net.IPAddress]::Any
$listener = New-Object System.Net.Sockets.TcpListener($localIP, $Port)
$listener.Start()

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Servidor Web Ativo: http://localhost:$Port" -ForegroundColor Cyan
Write-Host " Pressione Ctrl+C para encerrar o servidor" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

$mimeMap = @{
    ".html" = "text/html; charset=utf-8";
    ".css"  = "text/css; charset=utf-8";
    ".js"   = "application/javascript; charset=utf-8";
    ".mjs"  = "application/javascript; charset=utf-8";
    ".json" = "application/json; charset=utf-8";
    ".png"  = "image/png";
    ".jpg"  = "image/jpeg";
    ".jpeg" = "image/jpeg";
    ".svg"  = "image/svg+xml";
    ".csv"  = "text/csv; charset=utf-8";
    ".zip"  = "application/zip";
    ".txt"  = "text/plain; charset=utf-8";
    ".glb"  = "model/gltf-binary";
    ".gltf" = "model/gltf+json";
    ".mp4"  = "video/mp4";
    ".webp" = "image/webp"
}

$root = $PSScriptRoot

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        # Consume remaining request headers to avoid TCP RST
        while ($line = $reader.ReadLine()) {
            if ([string]::IsNullOrWhiteSpace($line)) { break }
        }

        $tokens = $requestLine.Split(" ")
        if ($tokens.Length -lt 2) {
            $client.Close()
            continue
        }

        $urlPath = $tokens[1].Split("?")[0]
        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/index.html"
        }

        $decodedUrl = [System.Uri]::UnescapeDataString($urlPath).TrimStart('/')
        $safeRelative = $decodedUrl.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = [System.IO.Path]::Combine($root, $safeRelative)

        if ([System.IO.File]::Exists($filePath)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)

            $header = "HTTP/1.1 200 OK`r`n" +
                      "Content-Type: $mime`r`n" +
                      "Content-Length: $($bytes.Length)`r`n" +
                      "Access-Control-Allow-Origin: *`r`n" +
                      "Connection: close`r`n`r`n"
            
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $msg = "404 - Nao encontrado: $urlPath"
            $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
            $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($msgBytes.Length)`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($msgBytes, 0, $msgBytes.Length)
        }

        $stream.Flush()
        $client.Close()
    }
} finally {
    $listener.Stop()
}
